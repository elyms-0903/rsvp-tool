/* 出欠確認ページ作成ツール（Netlify 版 Function）
   構成: 静的クライアント（public/index.html = src/client.html のコピー）＋
         この Function（/api/<action> を受け、netlify.toml のリライトで
         /.netlify/functions/api へ転送される）＋ Netlify Blobs ストレージ。
   デプロイ手順は netlify/DEPLOY.md を参照。 */

import { getStore } from "@netlify/blobs";

/* ===== 出欠確認ツール サーバーコア（元 Space の server/src/actions.ts を移植） =====
   ストレージは store インターフェース越しに扱う:
     nextSeq("event"|"response") -> number
     getEvent(id) / putEvent(ev) / removeEvent(id)
     listResponses(eventId) / putResponse(resp) / removeResponse(eventId, id)
   イベントは dates を内包した1レコードとして保存する。 */

var WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
var THEMES = ["orange", "red", "pink", "green", "blue", "teal", "purple", "white", "black"];
var MODES = ["single", "multi", "vote"];
var STATUSES = ["join", "absent", "late"];

/* datetime-local 値から「11/29（日） 15:00」形式のラベルを作る（暦日ベースで曜日を出す） */
function formatDateLabel(dateValue) {
  var m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(dateValue || ""));
  if (!m) {
    var d = new Date(dateValue);
    if (isNaN(d.getTime())) return String(dateValue);
    var hh = String(d.getHours()).padStart(2, "0");
    var mm = String(d.getMinutes()).padStart(2, "0");
    return (d.getMonth() + 1) + "/" + d.getDate() + "（" + WEEKDAYS[d.getDay()] + "） " + hh + ":" + mm;
  }
  var wd = WEEKDAYS[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()];
  return (+m[2]) + "/" + (+m[3]) + "（" + wd + "） " + m[4] + ":" + m[5];
}

/* 回答期限（日本時間）を過ぎているか。期限の「分」いっぱい（:59秒まで）は期限内 */
function isPastDeadline(deadline) {
  var v = String(deadline || "").trim();
  if (!v) return false;
  var withSeconds = v.length === 16 ? v + ":00" : v;
  var t = new Date(withSeconds + "+09:00").getTime();
  if (isNaN(t)) return false;
  return Date.now() > t + 59999;
}

/* パスコードは平文で保存せず、SHA-256ハッシュで保存・照合する（元実装と同じ方式） */
async function hashPasscode(passcode) {
  var data = new TextEncoder().encode("rsvp-pass:" + passcode);
  var digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
}
/* 既存ページ（パスコード未設定＝空文字）はロックなしとして扱う */
async function passcodeMatches(storedHash, passcode) {
  if (storedHash === "") return true;
  if (!passcode) return false;
  return (await hashPasscode(passcode)) === storedHash;
}

function str(v, max) {
  if (typeof v !== "string") return null;
  var t = v.trim();
  return t.length <= max ? t : null;
}
function isValidDateValue(v) {
  return !isNaN(new Date(v).getTime());
}

/* mode と日時リストを検証し、保存用に正規化する（single は1件のみ、最大7件） */
function normalizeDates(mode, dates) {
  if (!Array.isArray(dates)) return null;
  var list = (mode === "single" ? dates.slice(0, 1) : dates).filter(function(d) {
    return d && typeof d.dateValue === "string" && d.dateValue.trim().length > 0;
  });
  if (list.length === 0 || list.length > 7) return null;
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var v = list[i].dateValue.trim();
    if (!isValidDateValue(v)) return null;
    out.push({ dateValue: v, label: formatDateLabel(v) });
  }
  return out;
}

function toEventShape(ev) {
  return {
    id: ev.id,
    title: ev.title,
    eventTime: ev.eventTime,
    place: ev.place,
    description: ev.description,
    mode: ev.mode,
    deadline: ev.deadline,
    theme: ev.theme,
    dates: ev.dates.slice().sort(function(a, b) { return a.sortOrder - b.sortOrder; })
      .map(function(d) { return { id: d.id, dateValue: d.dateValue, label: d.label }; }),
    createdAt: ev.createdAt
  };
}

function badRequest(message) {
  var e = new Error(message);
  e.status = 400;
  return e;
}
function passcodeField(v) {
  return typeof v === "string" && /^\d{4}$/.test(v) ? v : null;
}

async function createEvent(store, args) {
  var title = str(args.title, 120);
  if (title === null || title.length === 0) throw badRequest("タイトルが正しくありません");
  var mode = MODES.indexOf(args.mode) >= 0 ? args.mode : "single";
  var theme = THEMES.indexOf(args.theme) >= 0 ? args.theme : "orange";
  var place = str(args.place == null ? "" : args.place, 200);
  var description = str(args.description == null ? "" : args.description, 2000);
  var deadline = str(args.deadline == null ? "" : args.deadline, 40);
  if (place === null || description === null || deadline === null) throw badRequest("入力が長すぎます");
  if (passcodeField(args.passcode) === null) throw badRequest("パスコードは4桁の数字です");
  var normalized = normalizeDates(mode, args.dates);
  if (!normalized || normalized.length === 0) throw badRequest("日時の指定が正しくありません");
  var id = await store.nextSeq("event");
  var ev = {
    id: id,
    title: title,
    eventTime: normalized[0].label,
    place: place,
    description: description,
    passcode: await hashPasscode(args.passcode),
    mode: mode,
    deadline: deadline,
    theme: theme,
    dates: normalized.map(function(d, i) { return { id: i + 1, dateValue: d.dateValue, label: d.label, sortOrder: i }; }),
    createdAt: new Date().toISOString()
  };
  await store.putEvent(ev);
  return { event: toEventShape(ev) };
}

async function verifyPasscode(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  return { ok: await passcodeMatches(ev.passcode, typeof args.passcode === "string" ? args.passcode.slice(0, 8) : undefined) };
}

async function updateEvent(store, args) {
  var ev = await store.getEvent(args.id);
  if (!ev) return { ok: false };
  var current = typeof args.currentPasscode === "string" ? args.currentPasscode.slice(0, 8) : "";
  if (!(await passcodeMatches(ev.passcode, current))) return { ok: false };
  var title = str(args.title, 120);
  if (title === null || title.length === 0) return { ok: false };
  var mode = MODES.indexOf(args.mode) >= 0 ? args.mode : "single";
  var theme = THEMES.indexOf(args.theme) >= 0 ? args.theme : "orange";
  var place = str(args.place == null ? "" : args.place, 200);
  var description = str(args.description == null ? "" : args.description, 2000);
  var deadline = str(args.deadline == null ? "" : args.deadline, 40);
  if (place === null || description === null || deadline === null) return { ok: false };
  if (passcodeField(args.passcode) === null) return { ok: false };
  if (!Array.isArray(args.dates)) return { ok: false };

  /* 送信された日時を正規化（カレンダー値があればラベルを再計算、なければ既存ラベルを保持） */
  var submitted = [];
  for (var i = 0; i < args.dates.length; i++) {
    var d = args.dates[i] || {};
    var v = typeof d.dateValue === "string" ? d.dateValue.trim() : "";
    var lb = typeof d.label === "string" ? d.label.trim() : "";
    if (v) {
      if (!isValidDateValue(v)) return { ok: false };
      submitted.push({ dateValue: v, label: formatDateLabel(v) });
    } else if (lb) {
      submitted.push({ dateValue: "", label: lb.slice(0, 120) });
    }
  }
  var finalDates = mode === "single" ? submitted.slice(0, 1) : submitted;
  if (finalDates.length === 0 || finalDates.length > 7) return { ok: false };

  /* (dateValue・label) が一致する既存日時はIDを引き継ぎ、回答を保持する */
  var existing = ev.dates.slice().sort(function(a, b) { return a.sortOrder - b.sortOrder; });
  var usedIds = {};
  var nextDateId = existing.reduce(function(mx, e) { return Math.max(mx, e.id); }, 0) + 1;
  var newDates = finalDates.map(function(d, idx) {
    var match = null;
    for (var j = 0; j < existing.length; j++) {
      var e = existing[j];
      if (!usedIds[e.id] && e.dateValue === d.dateValue && e.label === d.label) { match = e; break; }
    }
    if (match) {
      usedIds[match.id] = true;
      return { id: match.id, dateValue: match.dateValue, label: match.label, sortOrder: idx };
    }
    return { id: nextDateId++, dateValue: d.dateValue, label: d.label, sortOrder: idx };
  });
  var removedIds = existing.filter(function(e) { return !usedIds[e.id]; }).map(function(e) { return e.id; });

  /* 外れた日時への回答は取り除く */
  if (removedIds.length > 0) {
    var responses = await store.listResponses(ev.id);
    for (var k = 0; k < responses.length; k++) {
      var r = responses[k];
      var kept = r.answers.filter(function(a) { return removedIds.indexOf(a.dateId) < 0; });
      if (kept.length !== r.answers.length) {
        r.answers = kept;
        await store.putResponse(r);
      }
    }
  }

  ev.title = title;
  ev.eventTime = finalDates[0].label;
  ev.place = place;
  ev.description = description;
  ev.passcode = await hashPasscode(args.passcode);
  ev.mode = mode;
  ev.deadline = deadline;
  ev.theme = theme;
  ev.dates = newDates;
  await store.putEvent(ev);
  return { ok: true };
}

async function deleteEvent(store, args) {
  var ev = await store.getEvent(args.id);
  if (!ev) return { ok: false };
  var pc = typeof args.passcode === "string" ? args.passcode.slice(0, 8) : "";
  if (!(await passcodeMatches(ev.passcode, pc))) return { ok: false };
  var responses = await store.listResponses(args.id);
  for (var i = 0; i < responses.length; i++) await store.removeResponse(args.id, responses[i].id);
  await store.removeEvent(args.id);
  return { ok: true };
}

async function getEventDetail(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { event: null, hasPasscode: false };
  return { event: toEventShape(ev), hasPasscode: ev.passcode !== "" };
}

async function getSummary(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { authorized: false, event: null, responses: [] };
  var pc = typeof args.passcode === "string" ? args.passcode.slice(0, 8) : "";
  if (!(await passcodeMatches(ev.passcode, pc))) {
    return { authorized: false, event: toEventShape(ev), responses: [] };
  }
  var rows = await store.listResponses(args.eventId);
  var responses = rows.slice().sort(function(a, b) { return a.id - b.id; }).map(function(r) {
    return {
      id: r.id,
      eventId: r.eventId,
      name: r.name,
      status: r.status,
      lateTime: r.lateTime,
      expired: r.expired === 1,
      answers: r.answers.map(function(a) { return { dateId: a.dateId, status: a.status, lateTime: a.lateTime }; }),
      createdAt: r.createdAt
    };
  });
  return { authorized: true, event: toEventShape(ev), responses: responses };
}

async function submitResponse(store, args) {
  var name = str(args.name, 60);
  if (name === null || name.length === 0) throw badRequest("名前が正しくありません");
  if (!Array.isArray(args.answers) || args.answers.length < 1 || args.answers.length > 7) {
    throw badRequest("回答が正しくありません");
  }
  var ev = await store.getEvent(args.eventId);
  if (!ev) throw badRequest("ページが見つかりません");
  var expired = isPastDeadline(ev.deadline);
  var validIds = {};
  ev.dates.forEach(function(d) { validIds[d.id] = true; });
  var answers = args.answers.filter(function(a) {
    return a && validIds[a.dateId] && STATUSES.indexOf(a.status) >= 0;
  });
  if (answers.length === 0) throw badRequest("対象の日時がありません");
  var id = await store.nextSeq("response");
  var first = answers[0];
  var resp = {
    id: id,
    eventId: args.eventId,
    name: name,
    status: first.status,
    lateTime: first.status === "late" ? (typeof first.lateTime === "string" && first.lateTime ? first.lateTime.slice(0, 20) : "16:00") : null,
    expired: expired ? 1 : 0,
    answers: answers.map(function(a) {
      return {
        dateId: a.dateId,
        status: a.status,
        lateTime: a.status === "late" ? (typeof a.lateTime === "string" && a.lateTime ? a.lateTime.slice(0, 20) : "16:00") : null
      };
    }),
    createdAt: new Date().toISOString()
  };
  await store.putResponse(resp);
  return { id: id, expired: expired };
}

async function deleteResponse(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  var pc = typeof args.passcode === "string" ? args.passcode.slice(0, 8) : "";
  if (!(await passcodeMatches(ev.passcode, pc))) return { ok: false };
  await store.removeResponse(args.eventId, args.id);
  return { ok: true };
}

var ACTIONS = {
  createEvent: createEvent,
  verifyPasscode: verifyPasscode,
  updateEvent: updateEvent,
  deleteEvent: deleteEvent,
  getEventDetail: getEventDetail,
  getSummary: getSummary,
  submitResponse: submitResponse,
  deleteResponse: deleteResponse
};

/* POST /api/<action> のディスパッチ。戻り値: { status, body } */
async function handleApi(store, action, args) {
  var fn = ACTIONS[action];
  if (!fn) return { status: 404, body: { error: "unknown action" } };
  if (!args || typeof args !== "object") args = {};
  try {
    var result = await fn(store, args);
    return { status: 200, body: result };
  } catch (e) {
    return { status: e.status || 500, body: { error: e.message || "error" } };
  }
}
/* ===== サーバーコアここまで ===== */


/* ===== Netlify Blobs ストレージ（ストア名: rsvp） =====
   キー設計（Workers 版と同一）:
     seq:event / seq:response … 連番カウンタ（文字列）
     event:<id>               … イベント（日時を内包した JSON）
     response:<eventId>:<id>  … 回答（日時別回答を内包した JSON）
   注意: Blobs には原子カウンタがないため、nextSeq は get→put の単純加算
   （Workers 版と同じ割り切り。少人数利用では実用上問題なし）。
   読み取りは strong consistency を指定し、書き込み直後の読み直しで
   古い値が返らないようにする（store 既定値＋ get ごとの指定の両方）。 */

const BLOBS_STORE_NAME = "rsvp";

function makeStore(blobs) {
  return {
    async nextSeq(kind) {
      const key = "seq:" + kind;
      const cur = await blobs.get(key, { type: "text", consistency: "strong" });
      const next = (cur ? parseInt(cur, 10) || 0 : 0) + 1;
      await blobs.set(key, String(next));
      return next;
    },
    async getEvent(id) {
      return (await blobs.get("event:" + id, { type: "json", consistency: "strong" })) || null;
    },
    async putEvent(ev) {
      await blobs.setJSON("event:" + ev.id, ev);
    },
    async removeEvent(id) {
      await blobs.delete("event:" + id);
    },
    async listResponses(eventId) {
      const prefix = "response:" + eventId + ":";
      /* list はページネーションを内部で処理し、全件を1回で返す */
      const result = await blobs.list({ prefix: prefix });
      const out = [];
      for (const entry of result.blobs) {
        const v = await blobs.get(entry.key, { type: "json", consistency: "strong" });
        if (v) out.push(v);
      }
      return out;
    },
    async putResponse(resp) {
      await blobs.setJSON("response:" + resp.eventId + ":" + resp.id, resp);
    },
    async removeResponse(eventId, id) {
      await blobs.delete("response:" + eventId + ":" + id);
    },
  };
}

/* ===== HTTP ハンドラ（Netlify Functions v2 形式） =====
   リライト経由では、Function から見えるパスが "/api/<action>" の場合と
   "/.netlify/functions/api/<action>" の場合があるため、どちらの形式でも
   アクション名を取り出せるようにしている。 */

let cachedStore = null;
function rsvpStore() {
  if (!cachedStore) {
    cachedStore = makeStore(getStore({ name: BLOBS_STORE_NAME, consistency: "strong" }));
  }
  return cachedStore;
}

function actionFromPath(pathname) {
  const marker = "/api/";
  const i = pathname.lastIndexOf(marker);
  if (i < 0) return null;
  try {
    return decodeURIComponent(pathname.slice(i + marker.length));
  } catch (_e) {
    return null;
  }
}

function createHandler(store) {
  return async function handler(req) {
    const url = new URL(req.url);
    const action = req.method === "POST" ? actionFromPath(url.pathname) : null;
    if (action === null) {
      /* 画面（静的クライアント）は publish ディレクトリ側が配信する */
      return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    let args = {};
    try {
      const ct = req.headers.get("content-length");
      if (ct && Number(ct) > 1024 * 1024) {
        return Response.json({ error: "too large" }, { status: 413 });
      }
      args = await req.json();
    } catch (_e) {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    const out = await handleApi(store, action, args);
    return Response.json(out.body, { status: out.status });
  };
}

export default async function netlifyHandler(req, _context) {
  return createHandler(rsvpStore())(req);
}

export { createHandler, makeStore };

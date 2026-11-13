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
    settle: { enabled: settleSettings(ev).enabled, mode: settleSettings(ev).mode, locked: settleLocked(ev) },
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
  var settle = { enabled: false, mode: "anyone" };
  if (args.settle && typeof args.settle === "object") {
    settle.enabled = args.settle.enabled === true;
    if (SETTLE_MODES.indexOf(args.settle.mode) >= 0) settle.mode = args.settle.mode;
  }
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
    settle: settle,
    settleData: { groups: {} },
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

  /* 外れた日時の清算グループも取り除く（残った日時の清算は保持） */
  if (ev.settleData && ev.settleData.groups) {
    removedIds.forEach(function(rid) { delete ev.settleData.groups[rid]; });
  }

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

/* ===== 清算（割り勘） =====
   データはイベントレコード内に保持する:
     ev.settle     … { enabled: bool, mode: "anyone"|"admin" }
     ev.settleData … { groups: { <dateId>: {
       members:  [{ id, name, responseId|null, defaultWeight }],
       expenses: [{ id, payerId, payerName, title, amount,
                    shares: [{ memberId, name, weight }], createdAt }],
       paid:     { "<fromId>><toId>:<amount>": ISO日時 },
       nextMember: 連番, nextExpense: 連番 } } }
   store インターフェースを増やさず、全バリアントで同じ実装が動く。 */

var SETTLE_MODES = ["anyone", "admin"];

function settleSettings(ev) {
  var s = (ev && ev.settle) || {};
  return {
    enabled: s.enabled === true,
    mode: SETTLE_MODES.indexOf(s.mode) >= 0 ? s.mode : "anyone"
  };
}
function settleLocked(ev) {
  var data = ev && ev.settleData;
  if (!data || !data.groups) return false;
  return Object.keys(data.groups).some(function(k) {
    var g = data.groups[k];
    return g && Array.isArray(g.expenses) && g.expenses.length > 0;
  });
}
function emptySettleGroup() {
  return { members: [], expenses: [], paid: {}, nextMember: 1, nextExpense: 1 };
}
/* メンバーの既定の傾斜（未保存・不正値は 1 として読む） */
function memberDefaultWeight(m) {
  var w = m && m.defaultWeight;
  return (typeof w === "number" && isFinite(w) && w >= 0 && w <= 10000) ? w : 1;
}
function memberShape(m) {
  return { id: m.id, name: m.name, defaultWeight: memberDefaultWeight(m) };
}
/* 読み取り用（無ければ空グループを返す。保存はしない） */
function readSettleGroup(ev, dateId) {
  var data = ev && ev.settleData;
  var g = data && data.groups ? data.groups[dateId] : null;
  return g || emptySettleGroup();
}
/* 書き込み用（無ければ作ってイベントに載せる） */
function writeSettleGroup(ev, dateId) {
  if (!ev.settleData || typeof ev.settleData !== "object") ev.settleData = { groups: {} };
  if (!ev.settleData.groups) ev.settleData.groups = {};
  if (!ev.settleData.groups[dateId]) ev.settleData.groups[dateId] = emptySettleGroup();
  return ev.settleData.groups[dateId];
}
function validSettleDateId(ev, dateId) {
  return ev.dates.some(function(d) { return d.id === dateId; });
}
async function settleAdminOk(ev, passcode) {
  var pc = typeof passcode === "string" ? passcode.slice(0, 8) : "";
  return passcodeMatches(ev.passcode, pc);
}

/* 負担額: ceil(金額 × 傾斜 ÷ 傾斜合計)。浮動小数の誤差で 500.0000001 が
   501 にならないよう、ごく小さな epsilon を引いてから切り上げる。 */
function computeShares(amount, shares) {
  var totalW = shares.reduce(function(sum, s) { return sum + s.weight; }, 0);
  return shares.map(function(s) {
    return {
      memberId: s.memberId, name: s.name, weight: s.weight,
      share: Math.ceil((amount * s.weight) / totalW - 1e-9)
    };
  });
}

/* グループ全体の収支と送金一覧を計算する。
   切り上げで出た余り（負担合計 − 金額）は立替えた人の負担から差し引く
   （立替えた人が損をしない方式）。収支の合計は必ず 0 になる。 */
function computeSettlement(group) {
  var order = [];
  var byId = {};
  var currentNames = {};
  group.members.forEach(function(m) { currentNames[m.id] = m.name; });
  function ensure(id, name) {
    if (!byId[id]) { byId[id] = { memberId: id, name: currentNames[id] || name, paid: 0, burden: 0 }; order.push(id); }
    return byId[id];
  }
  group.members.forEach(function(m) { ensure(m.id, m.name); });
  var expenseViews = group.expenses.map(function(ex) {
    var shares = computeShares(ex.amount, ex.shares);
    var shareSum = shares.reduce(function(sum, s) { return sum + s.share; }, 0);
    var surplus = shareSum - ex.amount;
    ensure(ex.payerId, ex.payerName).paid += ex.amount;
    shares.forEach(function(s) { ensure(s.memberId, s.name).burden += s.share; });
    if (surplus !== 0) byId[ex.payerId].burden -= surplus;
    return {
      id: ex.id, payerId: ex.payerId, payerName: ex.payerName,
      title: ex.title, amount: ex.amount, shares: shares, createdAt: ex.createdAt
    };
  });
  var rows = order.map(function(id) {
    var r = byId[id];
    return { memberId: r.memberId, name: r.name, paid: r.paid, burden: r.burden, net: r.paid - r.burden };
  });
  var debtors = rows.filter(function(r) { return r.net < 0; })
    .sort(function(a, b) { return a.net - b.net; });
  var creditors = rows.filter(function(r) { return r.net > 0; })
    .sort(function(a, b) { return b.net - a.net; });
  var transfers = [];
  var di = 0, ci = 0;
  var dLeft = debtors.map(function(r) { return -r.net; });
  var cLeft = creditors.map(function(r) { return r.net; });
  while (di < debtors.length && ci < creditors.length) {
    var amt = Math.min(dLeft[di], cLeft[ci]);
    if (amt > 0) {
      transfers.push({
        fromId: debtors[di].memberId, fromName: debtors[di].name,
        toId: creditors[ci].memberId, toName: creditors[ci].name,
        amount: amt
      });
    }
    dLeft[di] -= amt; cLeft[ci] -= amt;
    if (dLeft[di] <= 0) di++;
    if (cLeft[ci] <= 0) ci++;
  }
  return { rows: rows, transfers: transfers, expenseViews: expenseViews };
}
function transferKey(t) { return t.fromId + ">" + t.toId + ":" + t.amount; }

async function getSettle(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { event: null };
  var settings = settleSettings(ev);
  var dateId = validSettleDateId(ev, args.dateId) ? args.dateId
    : (ev.dates.length > 0 ? ev.dates[0].id : null);
  var group = readSettleGroup(ev, dateId);
  var calc = computeSettlement(group);
  var transfers = calc.transfers.map(function(t) {
    return {
      fromId: t.fromId, fromName: t.fromName, toId: t.toId, toName: t.toName,
      amount: t.amount, paidAt: group.paid[transferKey(t)] || null
    };
  });
  /* 明細の内訳用: 送金済みの行からメンバーごとの「送金済み分」を集計する。
     清算合計 = 送金済み分 + 自分の負担分のうち立替と相殺される分 min(立替合計, 負担合計)。
     これで立替えた人（受け取る側）は 立替合計 = 清算合計 + 未清算合計 が常に成り立つ
     （立替0の人は相殺分が0なので従来通りの集計になる）。
     未清算合計は「収支の絶対額 − 送金済み分」（0未満にはしない）。 */
  var transferSettledById = {};
  transfers.forEach(function(t) {
    if (!t.paidAt) return;
    transferSettledById[t.fromId] = (transferSettledById[t.fromId] || 0) + t.amount;
    transferSettledById[t.toId] = (transferSettledById[t.toId] || 0) + t.amount;
  });
  var rows = calc.rows.map(function(r) {
    var transferSettled = transferSettledById[r.memberId] || 0;
    var settled = transferSettled + Math.min(r.paid, r.burden);
    return {
      memberId: r.memberId, name: r.name, paid: r.paid, burden: r.burden, net: r.net,
      settled: settled, unsettled: Math.max(0, Math.abs(r.net) - transferSettled)
    };
  });
  return {
    event: toEventShape(ev),
    enabled: settings.enabled,
    mode: settings.mode,
    locked: settleLocked(ev),
    dateId: dateId,
    members: group.members.map(memberShape),
    expenses: calc.expenseViews,
    rows: rows,
    transfers: transfers
  };
}

async function updateSettleSettings(store, args) {
  var ev = await store.getEvent(args.id);
  if (!ev) return { ok: false };
  if (!(await settleAdminOk(ev, args.passcode))) return { ok: false };
  var enabled = args.enabled === true;
  var mode = SETTLE_MODES.indexOf(args.mode) >= 0 ? args.mode : settleSettings(ev).mode;
  var cur = settleSettings(ev);
  if (settleLocked(ev) && (enabled !== cur.enabled || (enabled && mode !== cur.mode))) {
    return { ok: false, locked: true };
  }
  ev.settle = { enabled: enabled, mode: mode };
  await store.putEvent(ev);
  return { ok: true };
}

/* 回答からメンバーを取り込む（管理者のみ）。
   対象は期限内の「参加」「遅れていきます」。取り込み直しでは、
   回答にひも付くメンバーのうち対象でなくなった人を外す
   （手で追加したメンバーと、回答者の名前変更には触れない）。 */
async function importMembers(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  if (!(await settleAdminOk(ev, args.passcode))) return { ok: false };
  if (!settleSettings(ev).enabled) return { ok: false, disabled: true };
  if (!validSettleDateId(ev, args.dateId)) return { ok: false };
  var group = writeSettleGroup(ev, args.dateId);
  var responses = await store.listResponses(ev.id);
  var qualifying = responses.filter(function(r) { return r.expired !== 1; })
    .sort(function(a, b) { return a.id - b.id; })
    .filter(function(r) {
      var a = r.answers.find(function(x) { return x.dateId === args.dateId; });
      return a && (a.status === "join" || a.status === "late");
    });
  var qualIds = {};
  qualifying.forEach(function(r) { qualIds[r.id] = true; });
  var added = 0, removed = 0;
  group.members = group.members.filter(function(m) {
    if (m.responseId != null && !qualIds[m.responseId]) { removed++; return false; }
    return true;
  });
  qualifying.forEach(function(r) {
    var exists = group.members.some(function(m) { return m.responseId === r.id; });
    if (!exists) {
      group.members.push({ id: group.nextMember++, name: r.name, responseId: r.id, defaultWeight: 1 });
      added++;
    }
  });
  await store.putEvent(ev);
  return { ok: true, added: added, removed: removed, members: group.members.map(memberShape) };
}

function memberNameField(v) {
  var n = str(v, 60);
  return n !== null && n.length > 0 ? n : null;
}

async function addMember(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  if (!(await settleAdminOk(ev, args.passcode))) return { ok: false };
  if (!validSettleDateId(ev, args.dateId)) return { ok: false };
  var name = memberNameField(args.name);
  if (name === null) return { ok: false };
  var group = writeSettleGroup(ev, args.dateId);
  if (group.members.length >= 200) return { ok: false };
  var m = { id: group.nextMember++, name: name, responseId: null, defaultWeight: 1 };
  group.members.push(m);
  await store.putEvent(ev);
  return { ok: true, member: memberShape(m) };
}

/* メンバーの既定の傾斜を設定する（管理者のみ。0・小数可）。
   立替追加フォームの初期値として使われ、立替ごとに変更できる。 */
async function setMemberDefaultWeight(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  if (!(await settleAdminOk(ev, args.passcode))) return { ok: false };
  if (!validSettleDateId(ev, args.dateId)) return { ok: false };
  var w = args.weight;
  if (typeof w !== "number" || !isFinite(w) || w < 0 || w > 10000) return { ok: false };
  var group = writeSettleGroup(ev, args.dateId);
  var m = group.members.find(function(x) { return x.id === args.memberId; });
  if (!m) return { ok: false };
  m.defaultWeight = w;
  await store.putEvent(ev);
  return { ok: true, defaultWeight: w };
}

async function renameMember(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  if (!(await settleAdminOk(ev, args.passcode))) return { ok: false };
  if (!validSettleDateId(ev, args.dateId)) return { ok: false };
  var name = memberNameField(args.name);
  if (name === null) return { ok: false };
  var group = writeSettleGroup(ev, args.dateId);
  var m = group.members.find(function(x) { return x.id === args.memberId; });
  if (!m) return { ok: false };
  m.name = name;
  await store.putEvent(ev);
  return { ok: true };
}

async function removeMember(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  if (!(await settleAdminOk(ev, args.passcode))) return { ok: false };
  if (!validSettleDateId(ev, args.dateId)) return { ok: false };
  var group = writeSettleGroup(ev, args.dateId);
  var before = group.members.length;
  group.members = group.members.filter(function(x) { return x.id !== args.memberId; });
  if (group.members.length === before) return { ok: false };
  /* 立替は名前の控えを持っているので、メンバーを外しても表示は壊れない */
  await store.putEvent(ev);
  return { ok: true };
}

/* 立替の入力を検証して保存形にする（対象は現メンバー、傾斜>0 の人だけを残す） */
function sanitizeExpense(group, input) {
  if (!input || typeof input !== "object") return null;
  var payer = group.members.find(function(m) { return m.id === input.payerId; });
  if (!payer) return null;
  var title = str(input.title, 100);
  if (title === null || title.length === 0) return null;
  var amount = input.amount;
  if (typeof amount !== "number" || !isFinite(amount) || Math.floor(amount) !== amount || amount < 1 || amount > 99999999) return null;
  if (!input.weights || typeof input.weights !== "object") return null;
  var shares = [];
  var totalW = 0;
  for (var key in input.weights) {
    var member = group.members.find(function(m) { return m.id === Number(key); });
    if (!member) continue;
    var w = Number(input.weights[key]);
    if (!isFinite(w) || w < 0 || w > 10000) return null;
    if (w > 0) { shares.push({ memberId: member.id, name: member.name, weight: w }); totalW += w; }
  }
  if (shares.length === 0 || totalW <= 0) return null;
  shares.sort(function(a, b) {
    return group.members.findIndex(function(m) { return m.id === a.memberId; })
      - group.members.findIndex(function(m) { return m.id === b.memberId; });
  });
  return { payerId: payer.id, payerName: payer.name, title: title, amount: amount, shares: shares };
}
async function settleWriteGate(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { error: { ok: false } };
  var settings = settleSettings(ev);
  if (!settings.enabled) return { error: { ok: false, disabled: true } };
  if (!validSettleDateId(ev, args.dateId)) return { error: { ok: false } };
  if (settings.mode === "admin" && !(await settleAdminOk(ev, args.passcode))) {
    return { error: { ok: false, needPasscode: true } };
  }
  return { ev: ev };
}

async function addExpense(store, args) {
  var gate = await settleWriteGate(store, args);
  if (gate.error) return gate.error;
  var group = writeSettleGroup(gate.ev, args.dateId);
  if (group.expenses.length >= 500) return { ok: false };
  var clean = sanitizeExpense(group, args.expense);
  if (!clean) throw badRequest("立替の内容が正しくありません");
  clean.id = group.nextExpense++;
  clean.createdAt = new Date().toISOString();
  group.expenses.push(clean);
  await store.putEvent(gate.ev);
  return { ok: true, id: clean.id };
}

async function updateExpense(store, args) {
  var gate = await settleWriteGate(store, args);
  if (gate.error) return gate.error;
  var group = writeSettleGroup(gate.ev, args.dateId);
  var idx = group.expenses.findIndex(function(x) { return x.id === args.expenseId; });
  if (idx < 0) return { ok: false };
  var clean = sanitizeExpense(group, args.expense);
  if (!clean) throw badRequest("立替の内容が正しくありません");
  clean.id = group.expenses[idx].id;
  clean.createdAt = group.expenses[idx].createdAt;
  group.expenses[idx] = clean;
  await store.putEvent(gate.ev);
  return { ok: true };
}

async function deleteExpense(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  /* 削除は権限モードによらず常に管理者だけ */
  if (!(await settleAdminOk(ev, args.passcode))) return { ok: false };
  if (!validSettleDateId(ev, args.dateId)) return { ok: false };
  var group = writeSettleGroup(ev, args.dateId);
  var before = group.expenses.length;
  group.expenses = group.expenses.filter(function(x) { return x.id !== args.expenseId; });
  if (group.expenses.length === before) return { ok: false };
  await store.putEvent(ev);
  return { ok: true };
}

/* 送金済みチェック（誰でも切替可。押した日時だけを記録する） */
async function setTransferPaid(store, args) {
  var ev = await store.getEvent(args.eventId);
  if (!ev) return { ok: false };
  if (!settleSettings(ev).enabled) return { ok: false, disabled: true };
  if (!validSettleDateId(ev, args.dateId)) return { ok: false };
  var amount = args.amount;
  if (typeof amount !== "number" || !isFinite(amount) || Math.floor(amount) !== amount || amount < 1) return { ok: false };
  if (typeof args.fromId !== "number" || typeof args.toId !== "number" || args.fromId === args.toId) return { ok: false };
  var group = writeSettleGroup(ev, args.dateId);
  var key = args.fromId + ">" + args.toId + ":" + amount;
  var paidAt = null;
  if (args.paid === true) {
    paidAt = new Date().toISOString();
    group.paid[key] = paidAt;
  } else {
    delete group.paid[key];
  }
  await store.putEvent(ev);
  return { ok: true, paidAt: paidAt };
}

var ACTIONS = {
  createEvent: createEvent,
  verifyPasscode: verifyPasscode,
  updateEvent: updateEvent,
  deleteEvent: deleteEvent,
  getEventDetail: getEventDetail,
  getSummary: getSummary,
  submitResponse: submitResponse,
  deleteResponse: deleteResponse,
  getSettle: getSettle,
  updateSettleSettings: updateSettleSettings,
  importMembers: importMembers,
  addMember: addMember,
  renameMember: renameMember,
  setMemberDefaultWeight: setMemberDefaultWeight,
  removeMember: removeMember,
  addExpense: addExpense,
  updateExpense: updateExpense,
  deleteExpense: deleteExpense,
  setTransferPaid: setTransferPaid
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

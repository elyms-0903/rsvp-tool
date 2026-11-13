"use strict";
/* 出欠確認ページ作成ツール（ローカル Node 版）
   単一ファイル構成: 画面(HTML/CSS/JS) + API + JSONファイル保存。
   起動: `node server.js`（ポートは環境変数 PORT、既定 8787）
   データ: 環境変数 RSVP_DATA で指定したパス、既定は server.js と同じフォルダの data.json */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const CLIENT_HTML = "<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>出欠確認ページ作成ツール</title>\n<style>\n:root {\n  color-scheme: light dark;\n  --bg: #fdf7ef; --surface: #ffffff; --surface-alt: #f8ead6;\n  --text: #3a352f; --dim: #8d857a; --border: #eae1d3;\n  --accent: #ad6f43; --accent-text: #ffffff;\n  --green: #648a68; --green-bg: #e7f1e5;\n  --amber: #9a7d4a; --amber-bg: #f8f0dc; --gray-bg: #f5f2ec;\n}\n@media (prefers-color-scheme: dark) {\n  :root {\n    --bg: #28231f; --surface: #332e29; --surface-alt: #40342a;\n    --text: #f3efe8; --dim: #b3aa9d; --border: #4d463d;\n    --accent: #d9a678; --accent-text: #2b2119;\n    --green: #a3c6a7; --green-bg: #354636;\n    --amber: #e0c48a; --amber-bg: #4c4028; --gray-bg: #332e29;\n  }\n}\n.theme-orange { --bg: #fdf7ef; --surface-alt: #f8ead6; --accent: #ad6f43; --accent-text: #ffffff; }\n.theme-red    { --bg: #fdf4f4; --surface-alt: #f8e2e2; --accent: #a86a6a; --accent-text: #ffffff; }\n.theme-pink   { --bg: #fdf4f8; --surface-alt: #f8e1ed; --accent: #a86a8c; --accent-text: #ffffff; }\n.theme-green  { --bg: #f4f9f4; --surface-alt: #e2eedd; --accent: #648a68; --accent-text: #ffffff; }\n.theme-blue   { --bg: #f3f7fd; --surface-alt: #e0eaf8; --accent: #6480a8; --accent-text: #ffffff; }\n.theme-teal   { --bg: #f2f9f7; --surface-alt: #ddf0ea; --accent: #5f8f88; --accent-text: #ffffff; }\n.theme-purple { --bg: #f8f5fd; --surface-alt: #eae3f8; --accent: #8468a8; --accent-text: #ffffff; }\n.theme-white {\n  --bg: #fefefd; --surface: #ffffff; --surface-alt: #f4f3f0;\n  --text: #3d3a36; --dim: #8d857a; --border: #e8e5e0;\n  --accent: #5d594f; --accent-text: #ffffff;\n  --green: #648a68; --green-bg: #e7f1e5;\n  --amber: #9a7d4a; --amber-bg: #f8f0dc; --gray-bg: #f4f3f0;\n}\n.theme-black {\n  --bg: #242220; --surface: #2e2c2a; --surface-alt: #3b3835;\n  --text: #f3f0ea; --dim: #b3aa9d; --border: #4d4942;\n  --accent: #e8dfcf; --accent-text: #33302b;\n  --green: #a3c6a7; --green-bg: #354636;\n  --amber: #e0c48a; --amber-bg: #4c4028; --gray-bg: #2e2c2a;\n}\n@media (prefers-color-scheme: dark) {\n  .theme-orange { --bg: #28231f; --surface-alt: #40342a; --accent: #d9a678; --accent-text: #2b2119; }\n  .theme-red    { --bg: #2a2222; --surface-alt: #453333; --accent: #d99f9f; --accent-text: #2d2020; }\n  .theme-pink   { --bg: #2c2328; --surface-alt: #47333f; --accent: #dda3bf; --accent-text: #2d2028; }\n  .theme-green  { --bg: #232a23; --surface-alt: #364536; --accent: #a3c6a7; --accent-text: #20301f; }\n  .theme-blue   { --bg: #232932; --surface-alt: #344253; --accent: #a3bede; --accent-text: #1f2a38; }\n  .theme-teal   { --bg: #222c2a; --surface-alt: #304743; --accent: #9ccabe; --accent-text: #1d2f2a; }\n  .theme-purple { --bg: #292531; --surface-alt: #403751; --accent: #c0aede; --accent-text: #2a2138; }\n  .theme-white {\n    --bg: #fefefd; --surface: #ffffff; --surface-alt: #f4f3f0;\n    --text: #3d3a36; --dim: #8d857a; --border: #e8e5e0;\n    --accent: #5d594f; --accent-text: #ffffff;\n    --green: #648a68; --green-bg: #e7f1e5;\n    --amber: #9a7d4a; --amber-bg: #f8f0dc; --gray-bg: #f4f3f0;\n  }\n  .theme-black {\n    --bg: #242220; --surface: #2e2c2a; --surface-alt: #3b3835;\n    --text: #f3f0ea; --dim: #b3aa9d; --border: #4d4942;\n    --accent: #e8dfcf; --accent-text: #33302b;\n    --green: #a3c6a7; --green-bg: #354636;\n    --amber: #e0c48a; --amber-bg: #4c4028; --gray-bg: #2e2c2a;\n  }\n}\n* { box-sizing: border-box; }\nbody {\n  margin: 0; background: var(--bg); color: var(--text);\n  font-family: system-ui, -apple-system, \"Hiragino Maru Gothic ProN\", \"Hiragino Sans\", \"Noto Sans JP\", sans-serif;\n}\nbutton, select, summary, input:not([type=\"checkbox\"], [type=\"radio\"]) { min-height: 2.75rem; }\nmain { max-width: 36rem; margin: 0 auto; padding: 1.25rem 1rem 2rem; }\nh2 { font-size: 1.5rem; line-height: 1.4; margin: 0; }\nh3 { font-size: 1.25rem; margin: 0; }\nh4, h5 { margin: 0; }\np { margin: 0; }\n.dim { color: var(--dim); }\n.small { font-size: .875rem; }\n.xsmall { font-size: .75rem; }\n.mt1 { margin-top: .25rem; } .mt2 { margin-top: .5rem; } .mt3 { margin-top: .75rem; }\n.mt4 { margin-top: 1rem; } .mt5 { margin-top: 1.25rem; } .mt6 { margin-top: 1.5rem; } .mt8 { margin-top: 2rem; } .mt10 { margin-top: 2.5rem; }\n.card { border: 1px solid var(--border); background: var(--surface); border-radius: 1rem; padding: 1rem; box-shadow: 0 1px 2px rgba(0,0,0,.05); }\n.card-alt { background: var(--surface-alt); border-radius: .75rem; padding: .75rem; }\nlabel.flabel, .flabel { display: block; font-size: 1rem; font-weight: 700; }\ninput[type=\"text\"], input[type=\"datetime-local\"], textarea, select {\n  width: 100%; border: 1px solid var(--border); background: var(--surface); color: var(--text);\n  border-radius: .75rem; padding: .5rem .75rem; font-size: 1rem; line-height: 1.5; margin-top: .25rem;\n  font-family: inherit;\n}\ntextarea { line-height: 1.6; }\n.passinput { letter-spacing: .5em; }\n.btn {\n  display: block; width: 100%; border: none; cursor: pointer; border-radius: .75rem;\n  padding: .75rem; font-size: 1.125rem; font-weight: 700; font-family: inherit;\n  background: var(--accent); color: var(--accent-text);\n}\n.btn:disabled { opacity: .4; cursor: default; }\n.btn-sub { font-size: 1rem; padding: .5rem; }\n.btn-outline { background: var(--surface); border: 2px solid var(--accent); color: var(--accent); }\n.btn-plain { background: var(--surface); border: 1px solid var(--border); color: var(--text); font-weight: 400; }\n.btn-danger { background: #dc2626; color: #fff; }\n.linklike { background: none; border: none; color: var(--dim); text-decoration: underline; cursor: pointer; font-size: .875rem; padding: .25rem .5rem; font-family: inherit; min-height: 0; }\n.err { color: #dc2626; font-size: .875rem; }\n.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }\n.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .5rem; }\n.opt-card {\n  display: flex; align-items: flex-start; gap: .75rem; cursor: pointer;\n  border: 2px solid var(--border); background: var(--surface);\n  border-radius: .75rem; padding: .5rem .75rem;\n}\n.opt-card.checked { border-color: var(--accent); background: var(--surface-alt); }\n.opt-card input[type=\"radio\"] { width: 1.25rem; height: 1.25rem; margin-top: .25rem; accent-color: var(--accent); flex-shrink: 0; }\n.stack2 > * + * { margin-top: .5rem; }\n.stack3 > * + * { margin-top: .75rem; }\n.stack4 > * + * { margin-top: 1rem; }\n.chip { display: inline-block; border-radius: 9999px; background: var(--surface-alt); padding: .125rem .5rem; font-size: .75rem; font-weight: 700; color: var(--accent); }\n.swatch { display: inline-block; width: 1.5rem; height: 1.5rem; border-radius: 9999px; border: 1px solid var(--border); flex-shrink: 0; }\n.theme-opt {\n  display: inline-flex; align-items: center; gap: .5rem; cursor: pointer;\n  border: 2px solid var(--border); background: var(--surface);\n  border-radius: 9999px; padding: .375rem .75rem .375rem .5rem; font-size: .875rem; font-weight: 700;\n}\n.theme-opt.checked { border-color: var(--text); background: var(--surface-alt); }\n.att-opt {\n  display: flex; align-items: center; gap: .75rem; cursor: pointer;\n  border: 2px solid var(--border); background: var(--surface);\n  border-radius: .75rem; padding: .75rem 1rem;\n}\n.att-box {\n  position: relative; width: 2rem; height: 2rem; flex-shrink: 0;\n  border: 2px solid var(--dim); border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;\n  font-size: 1.125rem; font-weight: 700; color: #fff;\n}\n.headline-box { border-radius: 1rem; background: var(--accent); color: var(--accent-text); padding: 1rem; text-align: center; }\n.stat-box { border: 1px solid var(--border); background: var(--surface); border-radius: .75rem; padding: .75rem; text-align: center; }\n.divide > * + * { border-top: 1px solid var(--border); }\n.row-between { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }\n.banner { border: 2px solid var(--accent); background: var(--surface-alt); border-radius: 1rem; padding: 1rem; }\n.sent-box { border: 2px solid var(--green); background: var(--surface); border-radius: 1rem; padding: 1.25rem; text-align: center; }\n.pool { border: 2px dashed var(--amber); border-radius: 1rem; background: var(--surface); padding: 1rem; }\n.rank-top { border: 2px solid var(--accent) !important; }\nfieldset { border: none; padding: 0; margin: 0; }\nlegend { font-size: 1rem; font-weight: 700; padding: 0; }\ndl.info { border: 1px solid var(--border); background: var(--surface); border-radius: 1rem; padding: 1rem; }\ndl.info .row { display: flex; gap: .75rem; }\ndl.info .row + .row { margin-top: .5rem; }\ndl.info dt { width: 2.5rem; flex-shrink: 0; font-weight: 700; color: var(--accent); }\ndl.info dd { margin: 0; }\n.prewrap { white-space: pre-wrap; }\n.dt-display {\n  width: 100%; border: 1px solid var(--border); background: var(--surface); color: var(--text);\n  border-radius: .75rem; padding: .5rem .75rem; font-size: 1rem; line-height: 1.5; margin-top: .25rem;\n  font-family: inherit; text-align: center; cursor: pointer;\n}\n.dt-panel { border: 1px solid var(--border); border-radius: .75rem; padding: .75rem; margin-top: .5rem; background: var(--surface-alt); }\n.dt-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: .5rem; }\n.dt-title { font-weight: 700; }\n.dt-nav { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 9999px; width: 2.5rem; cursor: pointer; font-size: 1.25rem; font-family: inherit; }\n.dt-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: .25rem; }\n.dt-week { text-align: center; font-size: .75rem; color: var(--dim); margin-bottom: .25rem; }\n.dt-day { border: none; background: transparent; color: var(--text); border-radius: 9999px; font-size: .9375rem; cursor: pointer; font-family: inherit; padding: 0; }\n.dt-day.today { box-shadow: inset 0 0 0 2px var(--accent); }\n.dt-day.sel { background: var(--accent); color: var(--accent-text); font-weight: 700; }\n.dt-time { display: flex; align-items: center; gap: .5rem; margin-top: .75rem; }\n.dt-time select { flex: 1; width: auto; margin-top: 0; }\n.dt-foot { display: flex; gap: .5rem; margin-top: .75rem; }\n.dt-foot .btn { flex: 1; }\n.tab-row { display: flex; gap: .5rem; flex-wrap: wrap; }\n.tab-btn {\n  border: 2px solid var(--border); background: var(--surface); color: var(--text);\n  border-radius: 9999px; padding: .375rem .875rem; font-size: .9375rem; font-weight: 700;\n  cursor: pointer; font-family: inherit;\n}\n.tab-btn.checked { border-color: var(--accent); background: var(--surface-alt); color: var(--accent); }\n.winput {\n  width: 5.5rem; border: 1px solid var(--border); background: var(--surface); color: var(--text);\n  border-radius: .5rem; padding: .375rem .5rem; font-size: 1rem; font-family: inherit; text-align: right;\n}\ninput[type=\"number\"].amtinput {\n  width: 100%; border: 1px solid var(--border); background: var(--surface); color: var(--text);\n  border-radius: .75rem; padding: .5rem .75rem; font-size: 1rem; line-height: 1.5; margin-top: .25rem;\n  font-family: inherit;\n}\n.paid-check { width: 1.5rem; height: 1.5rem; accent-color: var(--green); flex-shrink: 0; cursor: pointer; }\nselect.psel {\n  width: 100%; border: 1px solid var(--border); background: var(--surface); color: var(--text);\n  border-radius: .75rem; padding: .5rem .75rem; font-size: 1rem; line-height: 1.5; margin-top: .25rem; font-family: inherit;\n}\n.center { text-align: center; }\n.flex { display: flex; gap: .5rem; }\n.flex > .grow { flex: 1; min-width: 0; }\n.shrink0 { flex-shrink: 0; }\n</style>\n</head>\n<body>\n<div id=\"approot\" class=\"theme-orange\">\n<main id=\"app\"><p class=\"center dim\" style=\"padding:2.5rem 0\">読み込み中…</p></main>\n</div>\n<script>\n\"use strict\";\n/* ===== 共通ユーティリティ（元アプリ App.tsx / actions.ts と同じ規則） ===== */\nvar WEEKDAYS = [\"日\",\"月\",\"火\",\"水\",\"木\",\"金\",\"土\"];\nvar LATE_TIMES = [\"16:00\",\"16:30\",\"17:00\",\"17:30\",\"18:00\",\"18:30\",\"19:00\",\"19:30\",\"20:00\"];\nvar PASSCODE_RE = /^\\d{4}$/;\nvar MAX_DATES = 7;\nvar MODE_LABEL = { single: \"1日だけ\", multi: \"複数日開催\", vote: \"候補日から決める\" };\nvar THEME_OPTIONS = [\n  { value: \"orange\", label: \"オレンジ\", swatch: \"#e0aa76\" },\n  { value: \"red\",    label: \"あか\",     swatch: \"#dda3a3\" },\n  { value: \"pink\",   label: \"さくら\",   swatch: \"#dda3bf\" },\n  { value: \"green\",  label: \"みどり\",   swatch: \"#a3c6a7\" },\n  { value: \"blue\",   label: \"あお\",     swatch: \"#a3bede\" },\n  { value: \"teal\",   label: \"みずいろ\", swatch: \"#9ccabe\" },\n  { value: \"purple\", label: \"むらさき\", swatch: \"#c0aede\" },\n  { value: \"white\",  label: \"しろ\",     swatch: \"#ffffff\" },\n  { value: \"black\",  label: \"くろ\",     swatch: \"#3b3835\" }\n];\nfunction themeSwatch(t) { var o = THEME_OPTIONS.find(function(x){ return x.value === t; }); return o ? o.swatch : \"#e0aa76\"; }\nfunction themeLabel(t) { var o = THEME_OPTIONS.find(function(x){ return x.value === t; }); return o ? o.label : \"オレンジ\"; }\nfunction esc(s) {\n  return String(s == null ? \"\" : s).replace(/[&<>\"']/g, function(c) {\n    return { \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\" }[c];\n  });\n}\n/* datetime-local 値 \"YYYY-MM-DDTHH:mm\" を「11/29（日） 15:00」に整える（暦日ベースで曜日計算） */\nfunction formatDateLabel(dateValue) {\n  var m = /^(\\d{4})-(\\d{2})-(\\d{2})[T ](\\d{2}):(\\d{2})/.exec(dateValue || \"\");\n  if (!m) return dateValue;\n  var wd = WEEKDAYS[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()];\n  return (+m[2]) + \"/\" + (+m[3]) + \"（\" + wd + \"） \" + m[4] + \":\" + m[5];\n}\nfunction isPastDeadline(deadline) {\n  var v = (deadline || \"\").trim();\n  if (!v) return false;\n  var withSeconds = v.length === 16 ? v + \":00\" : v;\n  var t = new Date(withSeconds + \"+09:00\").getTime();\n  if (isNaN(t)) return false;\n  return Date.now() > t + 59999;\n}\nfunction todayAt(time) {\n  var now = new Date();\n  var m = String(now.getMonth() + 1).padStart(2, \"0\");\n  var d = String(now.getDate()).padStart(2, \"0\");\n  return now.getFullYear() + \"-\" + m + \"-\" + d + \"T\" + time;\n}\n/* n日後（当日基準）の日時 \"YYYY-MM-DDTHH:mm\"。初期値は固定日ではなく相対指定にする。 */\nfunction daysFromNowAt(days, time) {\n  var d = new Date();\n  d.setDate(d.getDate() + days);\n  var m = String(d.getMonth() + 1).padStart(2, \"0\");\n  var dd = String(d.getDate()).padStart(2, \"0\");\n  return d.getFullYear() + \"-\" + m + \"-\" + dd + \"T\" + time;\n}\nvar DEFAULT_TITLE = \"\";\nvar DEFAULT_DATE_VALUE = daysFromNowAt(7, \"12:00\");\nvar DEFAULT_DEADLINE = daysFromNowAt(5, \"23:59\");\nvar DEFAULT_DESC = \"\";\n\n/* ===== API ===== */\nfunction api(action, args) {\n  return fetch(\"api/\" + action, {\n    method: \"POST\",\n    headers: { \"Content-Type\": \"application/json\" },\n    body: JSON.stringify(args || {})\n  }).then(function(r) {\n    return r.json().then(function(j) {\n      if (!r.ok) throw new Error(j && j.error ? j.error : \"request failed\");\n      return j;\n    });\n  });\n}\n\n/* ===== 端末ローカルのページ記録 ===== */\nvar MY_EVENTS_KEY = \"rsvp-my-event-ids\";\nfunction loadMyEventIds() {\n  try {\n    var raw = localStorage.getItem(MY_EVENTS_KEY);\n    var parsed = raw ? JSON.parse(raw) : [];\n    return Array.isArray(parsed) ? parsed.filter(function(x){ return typeof x === \"number\"; }) : [];\n  } catch (e) { return []; }\n}\nfunction rememberEventId(id) {\n  try {\n    var ids = loadMyEventIds();\n    if (!ids.includes(id)) localStorage.setItem(MY_EVENTS_KEY, JSON.stringify([id].concat(ids)));\n  } catch (e) {}\n}\nfunction forgetEventId(id) {\n  try {\n    localStorage.setItem(MY_EVENTS_KEY, JSON.stringify(loadMyEventIds().filter(function(x){ return x !== id; })));\n  } catch (e) {}\n}\n\n/* ===== ルーティング ===== */\nvar view = { kind: \"home\" };\nvar summaryPasscodes = {}; /* eventId -> passcode（画面遷移内のみ保持） */\nfunction parseHashView() {\n  var m = window.location.hash.match(/^#\\/(survey|summary|settle)\\/(\\d+)$/);\n  if (m) return { kind: m[1], eventId: Number(m[2]) };\n  return { kind: \"home\" };\n}\nfunction hashForView(v) { return v.kind === \"home\" ? \"#/\" : \"#/\" + v.kind + \"/\" + v.eventId; }\nfunction go(v) {\n  view = v;\n  var target = hashForView(v);\n  if (window.location.hash !== target) window.location.hash = target;\n  render();\n}\nwindow.addEventListener(\"hashchange\", function() {\n  var parsed = parseHashView();\n  if (parsed.kind === \"home\" && view.kind === \"home\") return;\n  if (parsed.kind !== \"home\" && view.kind === parsed.kind && view.eventId === parsed.eventId) return;\n  view = parsed;\n  render();\n});\nfunction setTheme(t) { document.getElementById(\"approot\").className = \"theme-\" + t; }\nfunction appEl() { return document.getElementById(\"app\"); }\nfunction loadingHtml() { return '<p class=\"center dim\" style=\"padding:2.5rem 0\">読み込み中…</p>'; }\nfunction notFoundHtml(backView) {\n  return '<div class=\"center\" style=\"padding:2.5rem 0\"><p>ページが見つかりませんでした。</p>' +\n    '<button type=\"button\" class=\"btn btn-plain btn-sub\" style=\"margin-top:1rem;width:auto;padding:.5rem 1rem\" data-act=\"go-home\">トップに戻る</button></div>';\n}\ndocument.addEventListener(\"click\", function(e) {\n  var t = e.target.closest(\"[data-act='go-home']\");\n  if (t) go({ kind: \"home\" });\n});\n/* ===== ホーム（作成・編集・端末内一覧） ===== */\nvar homeState = null;\nfunction freshHomeState() {\n  return {\n    editingId: null, title: DEFAULT_TITLE, mode: \"single\", theme: \"orange\",\n    dates: [{ dateValue: DEFAULT_DATE_VALUE, label: \"\" }],\n    deadline: DEFAULT_DEADLINE, place: \"\", description: DEFAULT_DESC,\n    settleEnabled: null, settleMode: null, settleLocked: false, settleOrig: null,\n    passcode: \"\", currentPasscode: \"\", authError: null, createError: false, formError: null, submitting: false,\n    myIds: loadMyEventIds(), myEvents: [], myLoaded: false,\n    unlockTarget: null, unlockPasscode: \"\", unlockError: false,\n    deleteTarget: null, deletePasscode: \"\", deleteError: false,\n    openId: \"\", openPasscode: \"\", openError: null\n  };\n}\nfunction renderHome() {\n  if (!homeState) homeState = freshHomeState();\n  var s = homeState;\n  setTheme(s.theme);\n  if (!s.myLoaded) {\n    s.myLoaded = true;\n    appEl().innerHTML = homeHtml();\n    bindHome();\n    s.myIds.forEach(function(id) {\n      api(\"getEventDetail\", { eventId: id }).then(function(res) {\n        if (!res.event) {\n          forgetEventId(id);\n          s.myIds = s.myIds.filter(function(x){ return x !== id; });\n        } else {\n          s.myEvents.push(Object.assign({}, res.event, { hasPasscode: res.hasPasscode }));\n        }\n        if (view.kind === \"home\") { appEl().innerHTML = homeHtml(); bindHome(); }\n      }).catch(function() {});\n    });\n    return;\n  }\n  appEl().innerHTML = homeHtml();\n  bindHome();\n}\nfunction homeHtml() {\n  var s = homeState;\n  var modeOptions = [\n    { value: \"single\", label: \"1日だけ開催\", note: \"日時を1つ決めて出欠を取る\" },\n    { value: \"multi\", label: \"複数日開催\", note: \"全部の日程で開催する。各日ごとに出欠を取る\" },\n    { value: \"vote\", label: \"候補日から開催日を決める\", note: \"候補日を複数出し、来れる人数が多い日を集計で決める\" }\n  ];\n  var h = \"\";\n  h += '<section aria-label=\"出欠ページを作る\"><h2>' + (s.editingId ? \"ページを編集する\" : \"出欠確認ページを作る\") + \"</h2>\" +\n    '<p class=\"mt1 small dim\">タイトル・時・所・内容と管理用パスコードを入れるだけで、下のような回答ページと集計ページができます。</p>';\n  h += '<div class=\"card mt5 stack4\">';\n  /* タイトル */\n  h += '<div><label class=\"flabel\" for=\"f-title\">タイトル</label>' +\n    '<input type=\"text\" id=\"f-title\" value=\"' + esc(s.title) + '\" placeholder=\"例：○○祝い たこ焼きパーティー\"></div>';\n  /* 開催パターン */\n  h += '<fieldset><legend>開催パターン</legend><div class=\"mt1 stack2\" role=\"radiogroup\" aria-label=\"開催パターン\">';\n  modeOptions.forEach(function(opt) {\n    h += '<label class=\"opt-card' + (s.mode === opt.value ? \" checked\" : \"\") + '\">' +\n      '<input type=\"radio\" name=\"mode\" value=\"' + opt.value + '\"' + (s.mode === opt.value ? \" checked\" : \"\") + '>' +\n      '<span><span style=\"display:block;font-weight:700\">' + opt.label + '</span>' +\n      '<span class=\"small dim\" style=\"display:block\">' + opt.note + \"</span></span></label>\";\n  });\n  h += \"</div></fieldset>\";\n  /* 色 */\n  h += '<fieldset><legend>ページの色</legend><div class=\"mt2 flex\" style=\"flex-wrap:wrap\" role=\"radiogroup\" aria-label=\"ページの色\">';\n  THEME_OPTIONS.forEach(function(opt) {\n    h += '<label class=\"theme-opt' + (s.theme === opt.value ? \" checked\" : \"\") + '\">' +\n      '<input type=\"radio\" name=\"theme\" value=\"' + opt.value + '\"' + (s.theme === opt.value ? \" checked\" : \"\") + ' style=\"position:absolute;opacity:0\">' +\n      '<span class=\"swatch\" style=\"background-color:' + opt.swatch + '\"></span>' + opt.label + \"</label>\";\n  });\n  h += '</div><p class=\"mt1 small dim\">選ぶと画面全体がその色でプレビューされます。回答ページ・集計ページに適用されます。</p></fieldset>';\n  /* 日時 */\n  h += '<div><span class=\"flabel\">' + (s.mode === \"vote\" ? \"候補日時\" : \"時\") + '</span><div class=\"mt1 stack3\">';\n  s.dates.forEach(function(d, i) {\n    h += '<div style=\"border:1px solid var(--border);border-radius:.75rem;padding:.75rem\">' +\n      '<div class=\"row-between\"><label class=\"small\" style=\"font-weight:700\" for=\"f-date-' + i + '\">' +\n      (s.mode === \"single\" ? \"日時\" : \"日時 \" + (i + 1)) + \"</label>\" +\n      (i > 0 ? '<button type=\"button\" class=\"linklike\" data-act=\"del-date\" data-i=\"' + i + '\">削除</button>' : \"\") + \"</div>\" +\n      (d.dateValue === \"\" && d.label !== \"\" ? '<p class=\"mt1 small dim\">現在：' + esc(d.label) + \"（カレンダーで選び直すと置き換わります）</p>\" : \"\") +\n      '<button type=\"button\" class=\"dt-display\" id=\"f-date-' + i + '\">' + fmtDtDisplay(d.dateValue) + \"</button>\" +\n      '<p class=\"mt1 small\" style=\"font-weight:700;color:var(--accent)\" id=\"f-date-label-' + i + '\">' + (d.dateValue ? formatDateLabel(d.dateValue) : \"\") + \"</p>\" +\n      '<div class=\"dt-panel\" id=\"dt-panel-date-' + i + '\" hidden></div>' +\n      \"</div>\";\n  });\n  h += \"</div>\";\n  var firstPicked = ((s.dates[0] && s.dates[0].dateValue) || (s.dates[0] && s.dates[0].label) || \"\") !== \"\";\n  if (s.mode !== \"single\" && firstPicked && s.dates.length < MAX_DATES) {\n    h += '<button type=\"button\" class=\"btn btn-plain mt3\" style=\"border:2px dashed var(--accent);color:var(--accent);font-weight:700\" data-act=\"add-date\">＋ 日時を追加（あと' + (MAX_DATES - s.dates.length) + \"件まで）</button>\";\n  }\n  if (s.mode !== \"single\" && s.dates.length >= MAX_DATES) h += '<p class=\"mt2 small dim\">日時は最大' + MAX_DATES + \"件までです。</p>\";\n  if (s.mode !== \"single\" && !firstPicked) h += '<p class=\"mt2 small dim\">まず日時 1 をカレンダーで選ぶと、ここに「日時を追加」が出ます。</p>';\n  h += \"</div>\";\n  /* 回答期限 */\n  h += '<div><span class=\"flabel\">回答期限</span>' +\n    '<button type=\"button\" class=\"dt-display\" id=\"f-deadline\">' + fmtDtDisplay(s.deadline) + \"</button>\" +\n    '<p class=\"mt1 small\" style=\"font-weight:700;color:var(--accent)\" id=\"f-deadline-label\">' + (s.deadline ? formatDateLabel(s.deadline) + \" まで\" : \"\") + \"</p>\" +\n    '<div class=\"dt-panel\" id=\"dt-panel-deadline\" hidden></div>' +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">初期値は23:59で入っています。必要な場合は日付・時刻を変更してください。期限を過ぎて届いた回答は、通常の集計には入らず「期限切れプール」に分けて受け付けます。回答ページにも期限が表示されます。</p></div>';\n  /* 所・内容 */\n  h += '<div><label class=\"flabel\" for=\"f-place\">所</label>' +\n    '<input type=\"text\" id=\"f-place\" value=\"' + esc(s.place) + '\" placeholder=\"未定のままでもOK（ページでは「未定」と出ます）\"></div>';\n  h += '<div><label class=\"flabel\" for=\"f-desc\">内容</label>' +\n    '<textarea id=\"f-desc\" rows=\"5\" placeholder=\"当日の案内や持ち物などを自由に\">' + esc(s.description) + \"</textarea></div>\";\n  /* パスコード */\n  h += '<div><label class=\"flabel\" for=\"f-pass\">管理用パスコード（4桁の数字）</label>' +\n    '<input type=\"text\" id=\"f-pass\" class=\"passinput\" value=\"' + esc(s.passcode) + '\" placeholder=\"' +\n    (s.editingId ? \"新しいパスコード（変えない場合も今のものを入力）\" : \"例：1234\") + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\">' +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">集計ページを見たり、このページを編集・削除するときに必要です。回答する人には不要なので、配るときはパスコードを伝えないでください。</p>' +\n    (s.passcode.length > 0 && !PASSCODE_RE.test(s.passcode) ? '<p class=\"mt1 err\">パスコードは4桁の数字で入力してください。</p>' : \"\") +\n    \"</div>\";\n  /* 清算機能（オン/オフは必ず選ぶ。オンなら記録できる人も選ぶ） */\n  h += '<fieldset' + (s.settleLocked ? \" disabled\" : \"\") + '><legend>清算機能（割り勘）</legend>' +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">当日にかかった費用を、参加メンバーで割り勘・清算する機能です。</p>' +\n    '<div class=\"mt2 grid2\" role=\"radiogroup\" aria-label=\"清算機能のオン・オフ\">' +\n    '<label class=\"opt-card' + (s.settleEnabled === true ? \" checked\" : \"\") + '\">' +\n    '<input type=\"radio\" name=\"settle-onoff\" value=\"on\"' + (s.settleEnabled === true ? \" checked\" : \"\") + \">\" +\n    '<span><span style=\"display:block;font-weight:700\">オン（清算あり）</span>' +\n    '<span class=\"small dim\" style=\"display:block\">費用の清算ページが付きます</span></span></label>' +\n    '<label class=\"opt-card' + (s.settleEnabled === false ? \" checked\" : \"\") + '\">' +\n    '<input type=\"radio\" name=\"settle-onoff\" value=\"off\"' + (s.settleEnabled === false ? \" checked\" : \"\") + \">\" +\n    '<span><span style=\"display:block;font-weight:700\">オフ（清算なし）</span>' +\n    '<span class=\"small dim\" style=\"display:block\">出欠確認だけのページになります</span></span></label>' +\n    \"</div>\";\n  if (s.settleEnabled === true) {\n    h += '<div class=\"mt3\"><span class=\"small\" style=\"font-weight:700\">立替を記録できる人</span>' +\n      '<div class=\"mt1 stack2\" role=\"radiogroup\" aria-label=\"立替を記録できる人\">' +\n      '<label class=\"opt-card' + (s.settleMode === \"anyone\" ? \" checked\" : \"\") + '\">' +\n      '<input type=\"radio\" name=\"settle-mode\" value=\"anyone\"' + (s.settleMode === \"anyone\" ? \" checked\" : \"\") + \">\" +\n      '<span><span style=\"display:block;font-weight:700\">参加者なら誰でも</span>' +\n      '<span class=\"small dim\" style=\"display:block\">立替えた本人がその場で記録できます</span></span></label>' +\n      '<label class=\"opt-card' + (s.settleMode === \"admin\" ? \" checked\" : \"\") + '\">' +\n      '<input type=\"radio\" name=\"settle-mode\" value=\"admin\"' + (s.settleMode === \"admin\" ? \" checked\" : \"\") + \">\" +\n      '<span><span style=\"display:block;font-weight:700\">管理者だけ</span>' +\n      '<span class=\"small dim\" style=\"display:block\">記録にはパスコードが必要です</span></span></label>' +\n      \"</div></div>\";\n  }\n  if (s.settleLocked) {\n    h += '<p class=\"mt2 small\" style=\"font-weight:700;color:var(--amber)\">立替記録が入っているため、清算のオン／オフと記録できる人の設定は変更できません。</p>';\n  } else {\n    h += '<p class=\"mt2 small dim\">立替登録が入るまでは、あとから変更できます。</p>';\n  }\n  h += \"</fieldset>\";\n  if (s.authError) h += '<p class=\"err\" role=\"alert\">' + esc(s.authError) + \"</p>\";\n  if (s.formError) h += '<p class=\"err\" role=\"alert\">' + esc(s.formError) + \"</p>\";\n  if (s.createError) h += '<p class=\"err\" role=\"alert\">作成に失敗しました。もう一度お試しください。</p>';\n  h += '<button type=\"button\" class=\"btn\" data-act=\"submit-form\"' + (s.submitting ? \" disabled\" : \"\") + \">\" +\n    (s.submitting ? \"作成中…\" : s.editingId ? \"変更を保存してページを見る\" : \"出欠ページを作成する\") + \"</button>\";\n  if (s.editingId) h += '<button type=\"button\" class=\"btn btn-plain btn-sub\" data-act=\"cancel-edit\">編集をやめる</button>';\n  h += \"</div></section>\";\n  /* 端末内一覧 */\n  h += '<section aria-label=\"この端末で作ったページ\" class=\"mt10\"><h3>この端末で作ったページ</h3>' +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">公開用の一覧は表示されません。ここには、この端末で作ったページと、パスコードで開いたページだけが出ます。</p>';\n  if (s.myIds.length === 0) {\n    h += '<p class=\"mt3 small dim\" style=\"border:1px dashed var(--border);background:var(--surface);border-radius:.75rem;padding:1rem;line-height:1.6\">この端末で作ったページはまだありません。上のフォームから作ると、ここに表示されます。別の端末で作ったページは、下の「ページ番号で開く」から追加できます。</p>';\n  }\n  h += '<div class=\"mt3 stack3\">';\n  s.myEvents.forEach(function(ev) { h += myEventCardHtml(ev); });\n  h += \"</div>\";\n  /* ページ番号で開く（「開く」ボタンは常に押せるようにし、判定はクリック時に画面の値で行う。\n     disabled を入力イベント依存の状態で切り替えると、自動入力・フォーム復元で画面と状態が\n     ずれたときに、入力済みでもボタンが無言で死ぬため） */\n  h += '<div class=\"card mt4\"><h4 style=\"font-size:1rem\">ページ番号で開く</h4>' +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">別の端末で作ったページは、ページ番号とパスコードでこの端末のリストに追加できます。ページ番号は集計ページのタイトル下に表示されています。</p>' +\n    '<div class=\"mt3 flex\">' +\n    '<div style=\"width:6rem\" class=\"shrink0\"><input type=\"text\" id=\"open-id\" value=\"' + esc(s.openId) + '\" inputmode=\"numeric\" autocomplete=\"off\" placeholder=\"番号\" style=\"margin-top:0\"></div>' +\n    '<div class=\"grow\"><input type=\"text\" id=\"open-pass\" class=\"passinput\" value=\"' + esc(s.openPasscode) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"パスコード（4桁）\" style=\"margin-top:0\"></div>' +\n    '<button type=\"button\" class=\"btn shrink0\" style=\"width:auto;padding:.5rem 1rem;font-size:1rem\" data-act=\"open-by-num\">開く</button>' +\n    \"</div>\" +\n    (s.openError ? '<p class=\"mt2 err\" role=\"alert\">' + esc(s.openError) + \"</p>\" : \"\") +\n    \"</div></section>\";\n  return h;\n}\nfunction myEventCardHtml(ev) {\n  var s = homeState;\n  var h = '<article class=\"card\"><h4 style=\"font-size:1.125rem;line-height:1.4\">' + esc(ev.title) + \"</h4>\" +\n    '<p class=\"mt1 small dim\"><span style=\"margin-right:.5rem\" class=\"xsmall\"><b>ページ番号 #' + ev.id + '</b></span>' +\n    '<span class=\"chip\" style=\"margin-right:.5rem\">' + MODE_LABEL[ev.mode] + \"</span>\" +\n    '<span class=\"swatch\" style=\"width:.875rem;height:.875rem;vertical-align:middle;background-color:' + themeSwatch(ev.theme) + '\"></span> ' + themeLabel(ev.theme) + \"　\" +\n    (ev.dates.length > 0 ? ev.dates.map(function(d){ return d.label; }).join(\"、\") : (ev.eventTime || \"日時未定\")) +\n    (ev.place ? \"　／　\" + esc(ev.place) : \"　／　場所未定\") +\n    (ev.deadline ? \"　／　回答期限 \" + formatDateLabel(ev.deadline) + \"まで\" : \"\") + \"</p>\" +\n    '<div class=\"grid2 mt3\">' +\n    '<button type=\"button\" class=\"btn btn-sub\" data-act=\"card-survey\" data-id=\"' + ev.id + '\">回答ページ</button>' +\n    '<button type=\"button\" class=\"btn btn-outline btn-sub\" data-act=\"card-summary\" data-id=\"' + ev.id + '\">集計を見る' + (ev.hasPasscode ? \" 🔒\" : \"\") + \"</button>\" +\n    '<button type=\"button\" class=\"btn btn-plain btn-sub\" style=\"font-size:.875rem\" data-act=\"card-edit\" data-id=\"' + ev.id + '\">編集' + (ev.hasPasscode ? \" 🔒\" : \"\") + \"</button>\" +\n    '<button type=\"button\" class=\"btn btn-plain btn-sub\" style=\"font-size:.875rem;color:var(--dim)\" data-act=\"card-delete\" data-id=\"' + ev.id + '\">削除' + (ev.hasPasscode ? \" 🔒\" : \"\") + \"</button>\" +\n    \"</div>\";\n  if (ev.settle && ev.settle.enabled) {\n    h += '<button type=\"button\" class=\"btn btn-outline btn-sub mt2\" data-act=\"card-settle\" data-id=\"' + ev.id + '\">清算ページ（割り勘）</button>';\n  }\n  if (s.unlockTarget === ev.id) {\n    h += '<div class=\"card-alt mt3\"><label class=\"small\" style=\"font-weight:700\" for=\"unlock-' + ev.id + '\">編集するにはパスコード（4桁）を入力してください</label>' +\n      '<div class=\"mt2 flex\"><input type=\"text\" id=\"unlock-' + ev.id + '\" class=\"passinput\" value=\"' + esc(s.unlockPasscode) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"1234\" style=\"margin-top:0\">' +\n      '<button type=\"button\" class=\"btn shrink0\" style=\"width:auto;padding:.5rem 1rem;font-size:1rem\" data-act=\"unlock-go\" data-id=\"' + ev.id + '\"' + (PASSCODE_RE.test(s.unlockPasscode) ? \"\" : \" disabled\") + \">開く</button>\" +\n      '<button type=\"button\" class=\"btn btn-plain btn-sub shrink0\" style=\"width:auto\" data-act=\"unlock-cancel\">やめる</button></div>' +\n      (s.unlockError ? '<p class=\"mt2 err\" role=\"alert\">パスコードが違います。</p>' : \"\") + \"</div>\";\n  }\n  if (s.deleteTarget === ev.id) {\n    h += '<div class=\"card-alt mt3\"><p class=\"small\" style=\"font-weight:700\">このページと回答をすべて削除します。元に戻せません。</p>';\n    if (ev.hasPasscode) {\n      h += '<div class=\"mt2\"><label class=\"small\" style=\"font-weight:700\" for=\"del-' + ev.id + '\">パスコード（4桁）</label>' +\n        '<input type=\"text\" id=\"del-' + ev.id + '\" class=\"passinput\" value=\"' + esc(s.deletePasscode) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"1234\"></div>';\n    }\n    if (s.deleteError) h += '<p class=\"mt2 err\" role=\"alert\">パスコードが違います。削除できませんでした。</p>';\n    h += '<div class=\"mt2 flex\">' +\n      '<button type=\"button\" class=\"btn btn-danger btn-sub shrink0\" style=\"width:auto;padding:.5rem 1rem;font-size:.875rem\" data-act=\"delete-go\" data-id=\"' + ev.id + '\"' + ((ev.hasPasscode && !PASSCODE_RE.test(s.deletePasscode)) ? \" disabled\" : \"\") + \">本当に削除する</button>\" +\n      '<button type=\"button\" class=\"btn btn-plain btn-sub shrink0\" style=\"width:auto\" data-act=\"delete-cancel\">やめる</button></div></div>';\n  }\n  h += \"</article>\";\n  return h;\n}\n/* ===== 日時ピッカー（ページ内製カレンダー）\n   iOS 標準の datetime-local ピッカーは、ページ側の再構築と干渉して選択が飛ぶ・値が空になる\n   事象が実機で繰り返し起きたため、自前のカレンダーパネルに置き換えた。\n   画面と内部状態はこのパネルの「決定」でのみ同期するので、ズレようがない。 */\nvar dtEdit = null; /* { key, y, mo, day: \"YYYY-MM-DD\"|\"\", h, mi } 編集中のパネル状態 */\nfunction parseDtValue(v) {\n  var m = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2})/.exec(v || \"\");\n  if (!m) return null;\n  return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] };\n}\nfunction composeDtValue(y, mo, d, h, mi) {\n  function p(n) { return String(n).padStart(2, \"0\"); }\n  return y + \"-\" + p(mo) + \"-\" + p(d) + \"T\" + p(h) + \":\" + p(mi);\n}\nfunction calendarInfo(y, mo) {\n  return {\n    first: new Date(Date.UTC(y, mo - 1, 1)).getUTCDay(),\n    days: new Date(Date.UTC(y, mo, 0)).getUTCDate()\n  };\n}\nfunction fmtDtDisplay(v) { return v ? v.replace(\"T\", \" \").replace(/-/g, \"/\") : \"タップして選ぶ\"; }\nfunction dtOptions(n, sel) {\n  var h = \"\";\n  for (var i = 0; i < n; i++) h += '<option value=\"' + i + '\"' + (i === sel ? \" selected\" : \"\") + \">\" + String(i).padStart(2, \"0\") + \"</option>\";\n  return h;\n}\nfunction dtPanelHtml() {\n  var e = dtEdit;\n  var info = calendarInfo(e.y, e.mo);\n  var todayStr = todayAt(\"00:00\").slice(0, 10);\n  var h = '<div class=\"dt-head\"><button type=\"button\" class=\"dt-nav\" data-dt-nav=\"-1\" aria-label=\"前の月\">‹</button>' +\n    '<span class=\"dt-title\">' + e.y + \"年\" + e.mo + \"月</span>\" +\n    '<button type=\"button\" class=\"dt-nav\" data-dt-nav=\"1\" aria-label=\"次の月\">›</button></div>';\n  h += '<div class=\"dt-grid dt-week\"><span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span></div><div class=\"dt-grid\">';\n  for (var b = 0; b < info.first; b++) h += \"<span></span>\";\n  for (var d = 1; d <= info.days; d++) {\n    var val = composeDtValue(e.y, e.mo, d, 0, 0).slice(0, 10);\n    h += '<button type=\"button\" class=\"dt-day' + (e.day === val ? \" sel\" : \"\") + (todayStr === val ? \" today\" : \"\") + '\" data-dt-day=\"' + val + '\">' + d + \"</button>\";\n  }\n  h += \"</div>\";\n  h += '<div class=\"dt-time\"><span class=\"small\" style=\"font-weight:700\">時刻</span>' +\n    '<select data-dt-hour aria-label=\"時\">' + dtOptions(24, e.h) + \"</select>\" +\n    '<span aria-hidden=\"true\">:</span>' +\n    '<select data-dt-min aria-label=\"分\">' + dtOptions(60, e.mi) + \"</select></div>\";\n  h += '<div class=\"dt-foot\"><button type=\"button\" class=\"btn btn-plain btn-sub\" data-dt-cancel>キャンセル</button>' +\n    '<button type=\"button\" class=\"btn btn-sub\" data-dt-ok>決定</button></div>';\n  return h;\n}\nfunction closeAllDtPanels() {\n  document.querySelectorAll(\".dt-panel\").forEach(function(p) { p.hidden = true; p.innerHTML = \"\"; });\n  dtEdit = null;\n}\nfunction openDtPanel(key, currentValue) {\n  closeAllDtPanels();\n  var panel = document.getElementById(\"dt-panel-\" + key);\n  if (!panel) return;\n  var p = parseDtValue(currentValue);\n  var base = p || parseDtValue(todayAt(\"12:00\"));\n  dtEdit = {\n    key: key, y: base.y, mo: base.mo,\n    day: p ? currentValue.slice(0, 10) : \"\",\n    h: p ? p.h : (key === \"deadline\" ? 23 : 12),\n    mi: p ? p.mi : (key === \"deadline\" ? 59 : 0)\n  };\n  panel.innerHTML = dtPanelHtml();\n  panel.hidden = false;\n  bindDtPanel(panel);\n}\nfunction bindDtPanel(panel) {\n  panel.querySelectorAll(\"[data-dt-nav]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() {\n      var mo = dtEdit.mo + Number(b.getAttribute(\"data-dt-nav\")), y = dtEdit.y;\n      if (mo < 1) { mo = 12; y--; }\n      if (mo > 12) { mo = 1; y++; }\n      dtEdit.mo = mo; dtEdit.y = y;\n      panel.innerHTML = dtPanelHtml(); bindDtPanel(panel);\n    });\n  });\n  panel.querySelectorAll(\"[data-dt-day]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() {\n      dtEdit.day = b.getAttribute(\"data-dt-day\");\n      panel.innerHTML = dtPanelHtml(); bindDtPanel(panel);\n    });\n  });\n  var hs = panel.querySelector(\"[data-dt-hour]\");\n  if (hs) hs.addEventListener(\"change\", function() { dtEdit.h = Number(hs.value); });\n  var ms = panel.querySelector(\"[data-dt-min]\");\n  if (ms) ms.addEventListener(\"change\", function() { dtEdit.mi = Number(ms.value); });\n  var ok = panel.querySelector(\"[data-dt-ok]\");\n  if (ok) ok.addEventListener(\"click\", function() { applyDtEdit(); });\n  var cancel = panel.querySelector(\"[data-dt-cancel]\");\n  if (cancel) cancel.addEventListener(\"click\", function() { closeAllDtPanels(); });\n}\nfunction applyDtEdit() {\n  if (!dtEdit) return;\n  var s = homeState;\n  var day = dtEdit.day || composeDtValue(dtEdit.y, dtEdit.mo, 1, 0, 0).slice(0, 10);\n  var dp = parseDtValue(day + \"T00:00\");\n  var v = composeDtValue(dp.y, dp.mo, dp.d, dtEdit.h, dtEdit.mi);\n  if (dtEdit.key === \"deadline\") { s.deadline = v; }\n  else { s.dates[Number(dtEdit.key.slice(5))] = { dateValue: v, label: \"\" }; }\n  closeAllDtPanels();\n  refreshHome();\n}\nvar homeHarvestSkip = false;\nfunction refreshHome() {\n  if (view.kind !== \"home\") return;\n  /* 再構築で画面の値が消える事故を防ぐため、作り直す前に画面の値を状態へ拾っておく\n     （ブラウザのフォーム復元や貼り付けなど、input イベントを伴わない入力の救済）。\n     状態を丸ごと差し替えた直後（編集開始など）は homeHarvestSkip で拾わない。 */\n  if (!homeHarvestSkip) harvestHomeFromDom();\n  homeHarvestSkip = false;\n  appEl().innerHTML = homeHtml(); bindHome();\n}\nfunction bindHome() {\n  var s = homeState;\n  var el;\n  dtEdit = null;\n  el = document.getElementById(\"f-title\");\n  if (el) el.addEventListener(\"input\", function() { s.title = el.value; refreshSubmitBtn(); });\n  document.querySelectorAll(\"input[name='mode']\").forEach(function(r) {\n    r.addEventListener(\"change\", function() {\n      s.mode = r.value;\n      if (s.mode === \"single\") s.dates = s.dates.slice(0, 1);\n      refreshHome();\n    });\n  });\n  document.querySelectorAll(\"input[name='theme']\").forEach(function(r) {\n    r.addEventListener(\"change\", function() { s.theme = r.value; setTheme(s.theme); refreshHome(); });\n  });\n  document.querySelectorAll(\"input[name='settle-onoff']\").forEach(function(r) {\n    r.addEventListener(\"change\", function() { s.settleEnabled = r.value === \"on\"; refreshHome(); });\n  });\n  document.querySelectorAll(\"input[name='settle-mode']\").forEach(function(r) {\n    r.addEventListener(\"change\", function() { s.settleMode = r.value; refreshHome(); });\n  });\n  s.dates.forEach(function(d, i) {\n    var disp = document.getElementById(\"f-date-\" + i);\n    if (!disp) return;\n    disp.addEventListener(\"click\", function() {\n      var panel = document.getElementById(\"dt-panel-date-\" + i);\n      if (panel && !panel.hidden) { closeAllDtPanels(); return; }\n      openDtPanel(\"date-\" + i, s.dates[i].dateValue);\n    });\n  });\n  el = document.getElementById(\"f-deadline\");\n  if (el) {\n    el.addEventListener(\"click\", function() {\n      var panel = document.getElementById(\"dt-panel-deadline\");\n      if (panel && !panel.hidden) { closeAllDtPanels(); return; }\n      openDtPanel(\"deadline\", s.deadline);\n    });\n  }\n  el = document.getElementById(\"f-place\");\n  if (el) el.addEventListener(\"input\", function() { s.place = el.value; });\n  el = document.getElementById(\"f-desc\");\n  if (el) el.addEventListener(\"input\", function() { s.description = el.value; });\n  el = document.getElementById(\"f-pass\");\n  if (el) el.addEventListener(\"input\", function() {\n    s.passcode = el.value.replace(/\\D/g, \"\").slice(0, 4);\n    if (el.value !== s.passcode) el.value = s.passcode;\n    refreshHomeSoft();\n  });\n  el = document.getElementById(\"open-id\");\n  if (el) el.addEventListener(\"input\", function() { s.openId = el.value.replace(/\\D/g, \"\").slice(0, 9); if (el.value !== s.openId) el.value = s.openId; refreshHomeSoft(); });\n  el = document.getElementById(\"open-pass\");\n  if (el) el.addEventListener(\"input\", function() { s.openPasscode = el.value.replace(/\\D/g, \"\").slice(0, 4); if (el.value !== s.openPasscode) el.value = s.openPasscode; });\n  document.querySelectorAll(\"[data-act]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() { homeAction(b.getAttribute(\"data-act\"), b); });\n  });\n  var unlockInp = s.unlockTarget ? document.getElementById(\"unlock-\" + s.unlockTarget) : null;\n  if (unlockInp) unlockInp.addEventListener(\"input\", function() {\n    s.unlockPasscode = unlockInp.value.replace(/\\D/g, \"\").slice(0, 4);\n    if (unlockInp.value !== s.unlockPasscode) unlockInp.value = s.unlockPasscode;\n    refreshHomeSoft();\n  });\n  var delInp = s.deleteTarget ? document.getElementById(\"del-\" + s.deleteTarget) : null;\n  if (delInp) delInp.addEventListener(\"input\", function() {\n    s.deletePasscode = delInp.value.replace(/\\D/g, \"\").slice(0, 4);\n    if (delInp.value !== s.deletePasscode) delInp.value = s.deletePasscode;\n    refreshHomeSoft();\n  });\n}\n/* 作成ボタンは常に押せるようにしておき、不足項目は送信時に sync＋検証して案内する。\n   （ブラウザのフォーム復元で画面の値と内部状態がずれるケースでも、ボタンが無言で死なないように） */\nfunction refreshSubmitBtn() { /* 作成ボタンは無効化しない */ }\nfunction refreshHomeSoft() { refreshSubmitBtn();\n  var s = homeState;\n  /* 「開く」（open-by-num）ボタンは常時有効。ここでは切り替えない */\n  var ub = document.querySelector(\"[data-act='unlock-go']\");\n  if (ub) ub.disabled = !PASSCODE_RE.test(s.unlockPasscode);\n  var db = document.querySelector(\"[data-act='delete-go']\");\n  if (db) { var ev = s.myEvents.find(function(x){ return x.id === s.deleteTarget; }); if (ev) db.disabled = ev.hasPasscode && !PASSCODE_RE.test(s.deletePasscode); }\n}\nfunction homeAction(act, b) {\n  var s = homeState;\n  var id = b.getAttribute(\"data-id\") ? Number(b.getAttribute(\"data-id\")) : null;\n  if (act === \"add-date\") { s.dates.push({ dateValue: todayAt(\"12:00\"), label: \"\" }); refreshHome(); }\n  else if (act === \"del-date\") { s.dates.splice(Number(b.getAttribute(\"data-i\")), 1); refreshHome(); }\n  else if (act === \"submit-form\") { submitHomeForm(); }\n  else if (act === \"cancel-edit\") { var keep = { myIds: s.myIds, myEvents: s.myEvents, myLoaded: true }; homeState = freshHomeState(); homeState.myIds = keep.myIds; homeState.myEvents = keep.myEvents; homeState.myLoaded = true; homeHarvestSkip = true; refreshHome(); }\n  else if (act === \"card-survey\") { go({ kind: \"survey\", eventId: id }); }\n  else if (act === \"card-summary\") { go({ kind: \"summary\", eventId: id }); }\n  else if (act === \"card-settle\") { go({ kind: \"settle\", eventId: id }); }\n  else if (act === \"card-edit\") {\n    s.deleteTarget = null;\n    var ev = s.myEvents.find(function(x){ return x.id === id; });\n    if (!ev) return;\n    if (!ev.hasPasscode) beginEdit(ev, \"\");\n    else { s.unlockTarget = id; s.unlockPasscode = \"\"; s.unlockError = false; refreshHome(); }\n  }\n  else if (act === \"unlock-cancel\") { s.unlockTarget = null; refreshHome(); }\n  else if (act === \"unlock-go\") {\n    api(\"verifyPasscode\", { eventId: id, passcode: s.unlockPasscode }).then(function(res) {\n      if (!res.ok) { s.unlockError = true; refreshHome(); return; }\n      var ev = s.myEvents.find(function(x){ return x.id === id; });\n      var pc = s.unlockPasscode;\n      rememberEventId(id);\n      s.unlockTarget = null; s.unlockPasscode = \"\"; s.unlockError = false;\n      if (ev) beginEdit(ev, pc);\n    }).catch(function() { s.unlockError = true; refreshHome(); });\n  }\n  else if (act === \"card-delete\") { s.unlockTarget = null; s.deleteTarget = id; s.deletePasscode = \"\"; s.deleteError = false; refreshHome(); }\n  else if (act === \"delete-cancel\") { s.deleteTarget = null; refreshHome(); }\n  else if (act === \"delete-go\") {\n    api(\"deleteEvent\", { id: id, passcode: s.deletePasscode }).then(function(res) {\n      if (!res.ok) { s.deleteError = true; refreshHome(); return; }\n      s.deleteTarget = null; s.deletePasscode = \"\"; s.deleteError = false;\n      forgetEventId(id);\n      s.myIds = s.myIds.filter(function(x){ return x !== id; });\n      s.myEvents = s.myEvents.filter(function(x){ return x.id !== id; });\n      refreshHome();\n    }).catch(function() { s.deleteError = true; refreshHome(); });\n  }\n  else if (act === \"open-by-num\") {\n    /* 押した時点で画面（DOM）の値を直接取り込んで判定する\n       （自動入力・フォーム復元など input イベントを伴わない入力でも、見えている内容で開ける） */\n    var oidEl = document.getElementById(\"open-id\");\n    var opsEl = document.getElementById(\"open-pass\");\n    if (oidEl) s.openId = oidEl.value.replace(/\\D/g, \"\").slice(0, 9);\n    if (opsEl) s.openPasscode = opsEl.value.replace(/\\D/g, \"\").slice(0, 4);\n    if (s.openId === \"\" || Number(s.openId) <= 0) { s.openError = \"ページ番号を入力してください。\"; refreshHome(); return; }\n    if (!PASSCODE_RE.test(s.openPasscode)) { s.openError = \"パスコード（4桁の数字）を入力してください。\"; refreshHome(); return; }\n    var numId = Number(s.openId);\n    Promise.all([\n      api(\"getEventDetail\", { eventId: numId }),\n      api(\"verifyPasscode\", { eventId: numId, passcode: s.openPasscode })\n    ]).then(function(rs) {\n      var detail = rs[0], verify = rs[1];\n      if (!detail.event) { s.openError = \"そのページ番号のページは見つかりませんでした。\"; refreshHome(); return; }\n      if (!verify.ok) { s.openError = \"パスコードが違います。\"; refreshHome(); return; }\n      s.openError = null; s.openId = \"\"; s.openPasscode = \"\";\n      homeHarvestSkip = true; /* クリアした欄を harvest が画面の旧値で復活させないため */\n      rememberEventId(numId);\n      if (!s.myIds.includes(numId)) s.myIds = [numId].concat(s.myIds);\n      if (!s.myEvents.some(function(x){ return x.id === numId; }))\n        s.myEvents = [Object.assign({}, detail.event, { hasPasscode: detail.hasPasscode })].concat(s.myEvents);\n      refreshHome();\n    }).catch(function() { s.openError = \"開けませんでした。もう一度お試しください。\"; refreshHome(); });\n  }\n}\nfunction beginEdit(ev, pc) {\n  var s = homeState;\n  s.editingId = ev.id;\n  s.currentPasscode = pc;\n  s.title = ev.title; s.mode = ev.mode; s.theme = ev.theme;\n  s.dates = ev.dates.length > 0\n    ? ev.dates.map(function(d){ return { dateValue: d.dateValue, label: d.label }; })\n    : [{ dateValue: \"\", label: ev.eventTime }];\n  s.deadline = ev.deadline || \"\";\n  s.place = ev.place; s.description = ev.description;\n  s.settleEnabled = ev.settle ? ev.settle.enabled === true : false;\n  s.settleMode = ev.settle && ev.settle.enabled ? ev.settle.mode : null;\n  s.settleLocked = ev.settle ? ev.settle.locked === true : false;\n  s.settleOrig = { enabled: s.settleEnabled, mode: s.settleMode || \"anyone\" };\n  s.passcode = \"\"; s.authError = null;\n  setTheme(ev.theme);\n  homeHarvestSkip = true;\n  refreshHome();\n  window.scrollTo({ top: 0, behavior: \"smooth\" });\n}\n/* 送信前に、画面（DOM）に表示されている値を内部状態へ取り込む。\n   ブラウザのフォーム復元などで画面と状態がずれていても、見えている内容で送信できるようにする。 */\nfunction syncHomeFromDom() {\n  var s = homeState; if (!s) return;\n  var el;\n  el = document.getElementById(\"f-title\"); if (el) s.title = el.value;\n  el = document.getElementById(\"f-place\"); if (el) s.place = el.value;\n  el = document.getElementById(\"f-desc\"); if (el) s.description = el.value;\n  el = document.getElementById(\"f-pass\"); if (el) s.passcode = el.value.replace(/\\D/g, \"\").slice(0, 4);\n  /* 日時・期限は自前カレンダーの「決定」で状態へ書くので、ここでは拾わない */\n}\n/* 再構築の前に、input イベントを伴わず画面に入った値（フォーム復元・貼り付け等）を状態へ拾う。\n   空欄の欄は状態側を正として触らない（わざと消した入力を復活させないため）。 */\nfunction harvestHomeFromDom() {\n  var s = homeState; if (!s) return;\n  var el;\n  el = document.getElementById(\"f-title\"); if (el && el.value !== \"\") s.title = el.value;\n  el = document.getElementById(\"f-place\"); if (el && el.value !== \"\") s.place = el.value;\n  el = document.getElementById(\"f-desc\"); if (el && el.value !== \"\") s.description = el.value;\n  el = document.getElementById(\"f-pass\"); if (el && el.value !== \"\") s.passcode = el.value.replace(/\\D/g, \"\").slice(0, 4);\n  el = document.getElementById(\"open-id\"); if (el && el.value !== \"\") s.openId = el.value.replace(/\\D/g, \"\").slice(0, 9);\n  el = document.getElementById(\"open-pass\"); if (el && el.value !== \"\") s.openPasscode = el.value.replace(/\\D/g, \"\").slice(0, 4);\n}\nfunction submitHomeForm() {\n  var s = homeState;\n  syncHomeFromDom();\n  s.formError = null;\n  if (s.title.trim().length === 0) { s.formError = \"タイトルを入力してください。\"; refreshHome(); return; }\n  if (!PASSCODE_RE.test(s.passcode)) { s.formError = \"管理用パスコード（4桁の数字）を入力してください。\"; refreshHome(); return; }\n  if (s.deadline.trim().length === 0) { s.formError = \"回答期限を選んでください。\"; refreshHome(); return; }\n  var anyUnpicked = s.dates.some(function(d){ return d.dateValue === \"\" && d.label === \"\"; });\n  if (s.dates.length === 0 || anyUnpicked) { s.formError = \"日時を選んでください。\"; refreshHome(); return; }\n  if (s.settleEnabled === null) { s.formError = \"清算機能のオン／オフを選んでください。\"; refreshHome(); return; }\n  if (s.settleEnabled === true && !s.settleMode) { s.formError = \"立替を記録できる人を選んでください。\"; refreshHome(); return; }\n  if (s.submitting) return;\n  s.submitting = true; s.createError = false; refreshHome();\n  var done = function() { s.submitting = false; };\n  if (s.editingId) {\n    var editId = s.editingId;\n    api(\"updateEvent\", {\n      id: editId, currentPasscode: s.currentPasscode,\n      title: s.title, mode: s.mode, theme: s.theme,\n      dates: s.dates.map(function(d){ return { dateValue: d.dateValue, label: d.label }; }),\n      place: s.place, description: s.description, deadline: s.deadline, passcode: s.passcode\n    }).then(function(res) {\n      done();\n      if (!res.ok) { s.authError = \"パスコードが違います。編集は開けていても、保存には今のパスコードの認証が必要です。\"; refreshHome(); return; }\n      var pc = s.passcode;\n      summaryPasscodes[editId] = pc;\n      /* 清算設定が変わっていれば（ロック中は変えられない）続けて保存する */\n      var settleChanged = !s.settleLocked && s.settleOrig &&\n        (s.settleOrig.enabled !== s.settleEnabled || (s.settleEnabled && s.settleOrig.mode !== s.settleMode));\n      var chain = settleChanged\n        ? api(\"updateSettleSettings\", { id: editId, passcode: pc, enabled: s.settleEnabled, mode: s.settleMode || \"anyone\" })\n            .then(function(sres) { if (!sres.ok) s.authError = \"清算の設定を保存できませんでした（ページ自体の変更は保存済みです）。\"; })\n            .catch(function() { s.authError = \"清算の設定を保存できませんでした（ページ自体の変更は保存済みです）。\"; })\n        : Promise.resolve();\n      chain.then(function() {\n        api(\"getEventDetail\", { eventId: editId }).then(function(d) {\n          if (d.event) {\n            s.myEvents = s.myEvents.map(function(x){ return x.id === editId ? Object.assign({}, d.event, { hasPasscode: d.hasPasscode }) : x; });\n          }\n          if (s.authError) { refreshHome(); return; }\n          go({ kind: \"summary\", eventId: editId });\n        }).catch(function() { go({ kind: \"summary\", eventId: editId }); });\n      });\n    }).catch(function() { done(); s.createError = true; refreshHome(); });\n  } else {\n    api(\"createEvent\", {\n      title: s.title, mode: s.mode, theme: s.theme,\n      dates: s.dates.filter(function(d){ return d.dateValue; }).map(function(d){ return { dateValue: d.dateValue }; }),\n      place: s.place, description: s.description, deadline: s.deadline, passcode: s.passcode,\n      settle: { enabled: s.settleEnabled === true, mode: s.settleMode || \"anyone\" }\n    }).then(function(res) {\n      done();\n      rememberEventId(res.event.id);\n      if (!s.myIds.includes(res.event.id)) s.myIds = [res.event.id].concat(s.myIds);\n      s.myEvents = [Object.assign({}, res.event, { hasPasscode: true })].concat(s.myEvents);\n      s.passcode = \"\";\n      go({ kind: \"survey\", eventId: res.event.id, created: true });\n    }).catch(function() { done(); s.createError = true; refreshHome(); });\n  }\n}\n/* ===== 回答ページ ===== */\nvar surveyState = null;\nfunction renderSurvey(eventId, created) {\n  appEl().innerHTML = loadingHtml();\n  api(\"getEventDetail\", { eventId: eventId }).then(function(res) {\n    if (view.kind !== \"survey\" || view.eventId !== eventId) return;\n    if (!res.event) { appEl().innerHTML = notFoundHtml(); return; }\n    surveyState = { ev: res.event, name: \"\", answers: {}, sentName: null, sentExpired: false, error: false, sending: false, created: !!created };\n    setTheme(res.event.theme);\n    drawSurvey();\n  }).catch(function() {\n    if (view.kind === \"survey\") appEl().innerHTML = notFoundHtml();\n  });\n}\nfunction surveyLabels(ev) {\n  return ev.mode === \"vote\"\n    ? { join: \"参加できます\", absent: \"参加できません\", late: \"遅れて参加できます\" }\n    : { join: \"参加\", absent: \"不参加\", late: \"遅れていきます\" };\n}\nfunction drawSurvey() {\n  var st = surveyState, ev = st.ev;\n  var isVote = ev.mode === \"vote\";\n  var labels = surveyLabels(ev);\n  var deadlinePassed = ev.deadline ? isPastDeadline(ev.deadline) : false;\n  var h = '<div style=\"padding-bottom:2.5rem;position:relative\">';\n  h += '<button type=\"button\" class=\"linklike\" data-sact=\"top\">← トップ</button>';\n  if (st.created) {\n    h += '<div class=\"banner mt3\" role=\"status\"><p style=\"font-weight:700\">ページを作成しました！</p>' +\n      '<p class=\"mt1 small\" style=\"line-height:1.6\">このページが、あなたの出欠確認ページ専用のリンクです。一覧には表示されないので、<b>このページをブックマークしてください。</b></p>' +\n      '<p class=\"mt2 small\" style=\"background:var(--surface);border-radius:.75rem;padding:.5rem .75rem;font-weight:700;word-break:break-all\">専用リンク：#/survey/' + ev.id + \"</p>\" +\n      '<p class=\"mt1 xsmall dim\" style=\"line-height:1.6\">アドレスの末尾がこの形になっていれば、そのページ専用のリンクです。回答を集めるときは、このページのアドレスをそのまま参加者に送ってください。</p>' +\n      '<p class=\"mt1 small dim\" style=\"line-height:1.6\">集計を見るときは、このページ右下の「集計を見る」から、作成時に決めたパスコードで開けます。</p></div>';\n  }\n  h += '<header class=\"mt3\"><h2 style=\"font-size:1.75rem\">' + esc(ev.title) + '</h2><dl class=\"info mt4\">';\n  h += '<div class=\"row\"><dt>時</dt><dd>';\n  if (ev.dates.length > 0) {\n    h += \"<ul style='margin:0;padding:0;list-style:none'>\";\n    ev.dates.forEach(function(d) { h += \"<li>\" + esc(d.label) + \"</li>\"; });\n    h += \"</ul>\";\n  } else h += esc(ev.eventTime || \"未定\");\n  if (ev.mode === \"multi\") h += '<span class=\"small dim\" style=\"display:block;margin-top:.25rem\">全部の日程で開催します。各日ごとに出欠を教えてください。</span>';\n  if (isVote) h += '<span class=\"small dim\" style=\"display:block;margin-top:.25rem\">候補日です。来れる人数が多い日に開催します。各日ごとに都合を教えてください。</span>';\n  h += \"</dd></div>\";\n  h += '<div class=\"row\"><dt>所</dt><dd>' + esc(ev.place || \"未定\") + \"</dd></div>\";\n  if (ev.deadline) {\n    h += '<div class=\"row\"><dt>期限</dt><dd>回答期限：' + formatDateLabel(ev.deadline) + \"まで\" +\n      (deadlinePassed ? '<span class=\"small\" style=\"display:block;margin-top:.25rem;font-weight:700;color:var(--amber)\">期限を過ぎています。今から送信すると「期限切れ」として別枠で受け付けます。</span>' : \"\") +\n      \"</dd></div>\";\n  }\n  if (ev.description) h += '<dd class=\"prewrap\" style=\"padding-top:.25rem;line-height:1.6\">' + esc(ev.description) + \"</dd>\";\n  h += \"</dl></header>\";\n  if (st.sentName) {\n    h += '<div class=\"sent-box mt6\" role=\"status\"><p style=\"font-size:2.25rem\">🎉</p>' +\n      '<p class=\"mt2\" style=\"font-size:1.25rem;font-weight:700\">送信しました！</p>' +\n      '<p class=\"mt1 dim\">' + esc(st.sentName) + \" さん、回答ありがとうございます。</p>\" +\n      (st.sentExpired ? '<p class=\"mt2 small\" style=\"background:var(--amber-bg);border-radius:.75rem;padding:.5rem .75rem;font-weight:700;color:var(--amber)\">回答期限を過ぎていたため、「期限切れ」として別枠で受け付けました。通常の集計には入りません。</p>' : \"\") +\n      '<button type=\"button\" class=\"btn btn-plain mt4\" data-sact=\"again\">もう1人分を回答する</button></div>';\n  } else {\n    h += '<form class=\"mt6\" id=\"survey-form\"><div><label class=\"flabel\" for=\"r-name\" style=\"font-size:1.125rem\">名前</label>' +\n      '<input type=\"text\" id=\"r-name\" value=\"' + esc(st.name) + '\" placeholder=\"お名前を入力してください\" autocomplete=\"name\" style=\"padding:.75rem;font-size:1.125rem\"></div>';\n    ev.dates.forEach(function(d, i) {\n      var a = st.answers[d.id] || { status: null, lateTime: \"16:00\" };\n      h += '<fieldset class=\"mt6\"><legend style=\"font-size:1.125rem\">' +\n        (ev.mode === \"single\" ? \"出欠\" : esc(d.label) + \" の\" + (isVote ? \"都合\" : \"出欠\")) +\n        (ev.mode !== \"single\" ? '<span class=\"small dim\" style=\"margin-left:.5rem;font-weight:400\">' + (i + 1) + \"件目</span>\" : \"\") +\n        \"</legend><div class='mt2 stack2' role='radiogroup' aria-label='出欠'>\";\n      var opts = [\n        { value: \"join\", color: \"#648a68\", bg: \"var(--green-bg)\" },\n        { value: \"absent\", color: \"#8d857a\", bg: \"var(--gray-bg)\" },\n        { value: \"late\", color: \"#9a7d4a\", bg: \"var(--amber-bg)\" }\n      ];\n      opts.forEach(function(opt) {\n        var checked = a.status === opt.value;\n        h += '<label class=\"att-opt\" data-date=\"' + d.id + '\" data-status=\"' + opt.value + '\" style=\"border-color:' + (checked ? opt.color : \"var(--border)\") + \";background:\" + (checked ? opt.bg : \"var(--surface)\") + '\">' +\n          '<span class=\"att-box\" style=\"border-color:' + (checked ? opt.color : \"var(--dim)\") + \";background:\" + (checked ? opt.color : \"transparent\") + '\">' + (checked ? \"✓\" : \"\") + \"</span>\" +\n          '<span style=\"font-size:1.125rem;font-weight:700\">' + labels[opt.value] + \"</span></label>\";\n      });\n      h += \"</div>\";\n      if (a.status === \"late\") {\n        h += '<div class=\"mt3\" style=\"background:var(--amber-bg);border-radius:.75rem;padding:1rem\">' +\n          '<label class=\"flabel\" for=\"r-late-' + d.id + '\">何時頃に着きますか？</label>' +\n          '<select id=\"r-late-' + d.id + '\" data-date=\"' + d.id + '\" style=\"padding:.75rem;font-size:1.125rem\">' +\n          LATE_TIMES.map(function(t) { return '<option value=\"' + t + '\"' + (a.lateTime === t ? \" selected\" : \"\") + \">\" + t + \"頃</option>\"; }).join(\"\") +\n          \"</select></div>\";\n      }\n      h += \"</fieldset>\";\n    });\n    if (st.error) h += '<p class=\"err mt3\" role=\"alert\">送信に失敗しました。もう一度お試しください。</p>';\n    var allAnswered = ev.dates.length > 0 && ev.dates.every(function(d){ return st.answers[d.id] && st.answers[d.id].status != null; });\n    var canSubmit = st.name.trim().length > 0 && allAnswered && !st.sending;\n    h += '<button type=\"submit\" class=\"btn mt6\" style=\"padding:1rem;font-size:1.25rem\"' + (canSubmit ? \"\" : \" disabled\") + \">\" +\n      (st.sending ? \"送信中…\" : deadlinePassed ? \"期限切れとして送信する\" : \"送信する\") + \"</button>\";\n    if (!canSubmit && !st.sending) {\n      h += '<p class=\"mt2 small dim center\">' + (ev.mode === \"single\" ? \"名前と出欠を選ぶと送信できます\" : \"名前と、すべての日時の回答を選ぶと送信できます\") + \"</p>\";\n    }\n    h += \"</form>\";\n  }\n  if (ev.settle && ev.settle.enabled) {\n    h += '<button type=\"button\" class=\"btn btn-outline mt8\" data-sact=\"settle\">清算ページ（割り勘）を見る</button>';\n  }\n  h += '<div class=\"mt10\" style=\"text-align:right\"><button type=\"button\" class=\"linklike\" style=\"font-size:.75rem\" data-sact=\"summary\">集計を見る</button></div>';\n  h += \"</div>\";\n  appEl().innerHTML = h;\n  bindSurvey();\n}\nfunction bindSurvey() {\n  var st = surveyState;\n  document.querySelectorAll(\"[data-sact]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() {\n      var act = b.getAttribute(\"data-sact\");\n      if (act === \"top\") go({ kind: \"home\" });\n      else if (act === \"summary\") go({ kind: \"summary\", eventId: st.ev.id });\n      else if (act === \"settle\") go({ kind: \"settle\", eventId: st.ev.id });\n      else if (act === \"again\") { st.sentName = null; st.sentExpired = false; st.name = \"\"; st.answers = {}; drawSurvey(); }\n    });\n  });\n  var nameInp = document.getElementById(\"r-name\");\n  if (nameInp) nameInp.addEventListener(\"input\", function() { st.name = nameInp.value; drawSurveySoft(); });\n  document.querySelectorAll(\".att-opt\").forEach(function(l) {\n    l.addEventListener(\"click\", function() {\n      var dateId = Number(l.getAttribute(\"data-date\"));\n      var cur = st.answers[dateId] || { status: null, lateTime: \"16:00\" };\n      st.answers[dateId] = { status: l.getAttribute(\"data-status\"), lateTime: cur.lateTime };\n      drawSurvey();\n    });\n  });\n  document.querySelectorAll(\"select[data-date]\").forEach(function(sel) {\n    sel.addEventListener(\"change\", function() {\n      var dateId = Number(sel.getAttribute(\"data-date\"));\n      var cur = st.answers[dateId] || { status: null, lateTime: \"16:00\" };\n      st.answers[dateId] = { status: cur.status, lateTime: sel.value };\n    });\n  });\n  var form = document.getElementById(\"survey-form\");\n  if (form) form.addEventListener(\"submit\", function(e) {\n    e.preventDefault();\n    var ev = st.ev;\n    var allAnswered = ev.dates.every(function(d){ return st.answers[d.id] && st.answers[d.id].status != null; });\n    if (!(st.name.trim().length > 0 && allAnswered) || st.sending) return;\n    st.sending = true; st.error = false; drawSurvey();\n    api(\"submitResponse\", {\n      eventId: ev.id, name: st.name.trim(),\n      answers: ev.dates.map(function(d) {\n        var a = st.answers[d.id];\n        return { dateId: d.id, status: a.status, lateTime: a.status === \"late\" ? a.lateTime : null };\n      })\n    }).then(function(res) {\n      st.sending = false; st.sentName = st.name.trim(); st.sentExpired = res.expired;\n      drawSurvey();\n    }).catch(function() { st.sending = false; st.error = true; drawSurvey(); });\n  });\n}\nfunction drawSurveySoft() {\n  var st = surveyState; if (!st || st.sentName) return;\n  var ev = st.ev;\n  var allAnswered = ev.dates.length > 0 && ev.dates.every(function(d){ return st.answers[d.id] && st.answers[d.id].status != null; });\n  var btn = document.querySelector(\"#survey-form button[type='submit']\");\n  if (btn) btn.disabled = !(st.name.trim().length > 0 && allAnswered && !st.sending);\n}\n/* ===== 集計ページ ===== */\nvar summaryState = null;\nfunction renderSummary(eventId) {\n  var passcode = summaryPasscodes[eventId] != null ? summaryPasscodes[eventId] : null;\n  summaryState = { eventId: eventId, ev: null, responses: [], authorized: false, passcode: passcode, input: \"\", wrongPass: false, confirmId: null, loaded: false };\n  appEl().innerHTML = loadingHtml();\n  api(\"getEventDetail\", { eventId: eventId }).then(function(res) {\n    if (view.kind !== \"summary\" || view.eventId !== eventId) return;\n    if (!res.event) { appEl().innerHTML = notFoundHtml(); summaryState.loaded = true; return; }\n    summaryState.ev = res.event;\n    setTheme(res.event.theme);\n    if (passcode !== null) {\n      loadSummary();\n    } else {\n      summaryState.loaded = true;\n      drawSummary();\n    }\n  }).catch(function() { if (view.kind === \"summary\") appEl().innerHTML = notFoundHtml(); });\n}\nfunction loadSummary() {\n  var st = summaryState;\n  api(\"getSummary\", { eventId: st.eventId, passcode: st.passcode || \"\" }).then(function(res) {\n    if (view.kind !== \"summary\" || view.eventId !== st.eventId) return;\n    st.loaded = true;\n    st.authorized = res.authorized === true;\n    if (res.event) st.ev = res.event;\n    st.responses = res.responses || [];\n    if (st.authorized) rememberEventId(st.eventId);\n    else if (st.passcode !== null) st.wrongPass = true;\n    drawSummary();\n  }).catch(function() { st.loaded = true; drawSummary(); });\n}\nfunction sumLabels(ev) {\n  return ev.mode === \"vote\"\n    ? { join: \"参加できる\", late: \"遅れて参加できる\", absent: \"参加できない\" }\n    : { join: \"参加\", late: \"遅れてくる\", absent: \"不参加\" };\n}\nfunction byDate(st, dateId) {\n  var pick = function(status) {\n    var out = [];\n    st.responses.filter(function(r){ return !r.expired; }).forEach(function(r) {\n      var a = r.answers.find(function(x){ return x.dateId === dateId; });\n      if (a && a.status === status) out.push({ r: r, a: a });\n    });\n    return out;\n  };\n  return { join: pick(\"join\"), late: pick(\"late\"), absent: pick(\"absent\") };\n}\nfunction drawSummary() {\n  var st = summaryState, ev = st.ev;\n  if (!ev) { appEl().innerHTML = notFoundHtml(); return; }\n  if (!st.authorized) {\n    appEl().innerHTML =\n      '<div style=\"padding-bottom:2rem\"><button type=\"button\" class=\"linklike\" data-mact=\"survey\">← 回答ページ</button>' +\n      '<h2 class=\"mt3\">' + esc(ev.title) + '</h2><p class=\"mt1 xsmall dim\">集計ページ　ページ番号 #' + ev.id + \"</p>\" +\n      '<section class=\"card mt5 center\" aria-label=\"パスコード入力\" style=\"padding:1.25rem\"><p style=\"font-size:2.25rem\">🔒</p>' +\n      '<p class=\"mt2\" style=\"font-size:1.125rem;font-weight:700\">集計はパスコードで保護されています</p>' +\n      '<p class=\"mt1 small dim\" style=\"line-height:1.6\">ページを作ったときに決めた4桁の数字を入力してください。</p>' +\n      '<form id=\"pass-form\" class=\"mt4\"><label class=\"dim\" for=\"s-pass\" style=\"position:absolute;left:-9999px\">管理用パスコード</label>' +\n      '<input type=\"text\" id=\"s-pass\" class=\"passinput\" value=\"' + esc(st.input) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"1234\" style=\"text-align:center;font-size:1.5rem;padding:.75rem;margin-top:0\">' +\n      (st.wrongPass ? '<p class=\"mt2 err\" role=\"alert\">パスコードが違います。</p>' : \"\") +\n      '<button type=\"submit\" class=\"btn mt3\" data-mact=\"pass-submit\"' + (st.input.length !== 4 ? \" disabled\" : \"\") + \">集計を開く</button></form></section>\" +\n      '<button type=\"button\" class=\"linklike mt8\" data-mact=\"top\">← トップに戻る</button></div>';\n    bindSummary();\n    return;\n  }\n  var labels = sumLabels(ev);\n  var isVote = ev.mode === \"vote\";\n  var active = st.responses.filter(function(r){ return !r.expired; });\n  var expired = st.responses.filter(function(r){ return r.expired; });\n  var h = '<div style=\"padding-bottom:2rem\"><div class=\"row-between\">' +\n    '<button type=\"button\" class=\"linklike\" data-mact=\"survey\">← 回答ページ</button>' +\n    '<button type=\"button\" class=\"btn btn-plain btn-sub shrink0\" style=\"width:auto;padding:.25rem .75rem;font-size:.875rem;min-height:0\" data-mact=\"reload\">更新</button></div>';\n  h += '<h2 class=\"mt3\">' + esc(ev.title) + '</h2>' +\n    '<p class=\"mt1 small dim\">' + (ev.dates.length > 0 ? ev.dates.map(function(d){ return d.label; }).join(\"、\") : esc(ev.eventTime || \"日時未定\")) + (ev.place ? \"　／　\" + esc(ev.place) : \"\") + \"</p>\" +\n    '<p class=\"mt1 xsmall dim\">ページ番号 #' + ev.id + \"　集計ページ（\" + MODE_LABEL[ev.mode] + \"）　回答した人 \" + active.length + \"人\" +\n    (expired.length > 0 ? \"（期限切れ \" + expired.length + \"人）\" : \"\") + \"</p>\" +\n    (ev.deadline ? '<p class=\"mt1 xsmall dim\">回答期限：' + formatDateLabel(ev.deadline) + \"まで</p>\" : \"\");\n  if (active.length === 0 && expired.length === 0) {\n    h += '<p class=\"mt5 center small dim\" style=\"border:1px dashed var(--border);background:var(--surface);border-radius:.75rem;padding:1.25rem;line-height:1.6\">まだ回答がありません。<br>回答ページから送信されると、ここに名前と人数が表示されます。</p>';\n  } else if (ev.mode === \"single\") {\n    if (ev.dates[0]) h += '<div class=\"mt5\">' + dateBlockHtml(st, ev.dates[0], labels) + \"</div>\";\n  } else {\n    if (isVote) h += voteRankingHtml(st, labels);\n    h += '<div class=\"mt6\" style=\"display:flex;flex-direction:column;gap:2rem\">';\n    ev.dates.forEach(function(d) {\n      h += '<div><h3 style=\"font-size:1.125rem\">' + esc(d.label) + ' の内訳</h3><div class=\"mt2\">' + dateBlockHtml(st, d, labels) + \"</div></div>\";\n    });\n    h += \"</div>\";\n  }\n  if (expired.length > 0) h += expiredPoolHtml(st, expired, labels);\n  if (ev.settle && ev.settle.enabled) {\n    h += '<section class=\"card mt8\" aria-label=\"清算\"><h3 style=\"font-size:1.125rem\">清算（割り勘）</h3>' +\n      '<p class=\"mt1 small dim\" style=\"line-height:1.6\">参加メンバーで費用を割り勘する清算ページです。メンバーの取り込みは清算ページの管理者メニューからできます。</p>' +\n      '<button type=\"button\" class=\"btn btn-outline btn-sub mt3\" data-mact=\"settle\">清算ページを開く</button></section>';\n  }\n  h += '<button type=\"button\" class=\"linklike mt8\" data-mact=\"top\">← トップに戻る</button></div>';\n  appEl().innerHTML = h;\n  bindSummary();\n}\nfunction nameSectionHtml(st, label, list, color, showTime) {\n  var h = '<section class=\"card mt3\" aria-label=\"' + esc(label) + '\" style=\"padding:1rem\"><h5 style=\"font-size:1rem;color:' + color + '\">' +\n    esc(label) + ' <span style=\"color:var(--text)\">' + list.length + \"人</span></h5>\";\n  if (list.length === 0) h += '<p class=\"mt2 small dim\">まだいません</p>';\n  else {\n    h += '<ul class=\"divide\" style=\"margin:.25rem 0 0;padding:0;list-style:none\">';\n    list.forEach(function(x) { h += respRowHtml(st, x.r, x.a, showTime); });\n    h += \"</ul>\";\n  }\n  return h + \"</section>\";\n}\nfunction respRowHtml(st, r, a, showTime) {\n  var h = '<li class=\"row-between\" style=\"padding:.5rem 0\"><span>' + esc(r.name) +\n    (showTime && a.lateTime ? '<span style=\"margin-left:.25rem;font-weight:700;color:var(--amber)\">（' + esc(a.lateTime) + \"頃）</span>\" : \"\") + \"</span>\";\n  if (st.confirmId === r.id) {\n    h += '<span class=\"flex shrink0\" style=\"align-items:center\"><span class=\"xsmall dim\">全日程分を削除</span>' +\n      '<button type=\"button\" class=\"btn btn-danger shrink0\" style=\"width:auto;padding:.25rem .5rem;font-size:.75rem;min-height:0\" data-mact=\"del-resp\" data-id=\"' + r.id + '\">削除する</button></span>';\n  } else {\n    h += '<button type=\"button\" class=\"linklike shrink0\" style=\"font-size:.75rem\" data-mact=\"confirm-resp\" data-id=\"' + r.id + '\">削除</button>';\n  }\n  return h + \"</li>\";\n}\nfunction dateBlockHtml(st, d, labels) {\n  var ev = st.ev;\n  var g = byDate(st, d.id);\n  var coming = g.join.length + g.late.length;\n  var h = '<div><div class=\"headline-box\"><p style=\"font-weight:700\">' + esc(d.label) + \"</p>\" +\n    '<p class=\"mt1 small\" style=\"font-weight:700;opacity:.9\">' + (ev.mode === \"vote\" ? \"来れる人\" : \"来る人 合計\") + \"</p>\" +\n    '<p style=\"margin-top:.25rem;font-size:2.25rem;font-weight:700;line-height:1\">' + coming + '<span style=\"font-size:1.25rem;margin-left:.25rem\">人</span></p>' +\n    '<p class=\"mt2 small\" style=\"opacity:.9\">' + labels.join + \" \" + g.join.length + \"人 ＋ \" + labels.late + \" \" + g.late.length + \"人</p></div>\";\n  h += '<div class=\"grid3 mt3\">' +\n    '<div class=\"stat-box\"><p style=\"font-size:1.5rem;font-weight:700;color:var(--green)\">' + g.join.length + '</p><p class=\"xsmall dim\">' + labels.join + \"</p></div>\" +\n    '<div class=\"stat-box\"><p style=\"font-size:1.5rem;font-weight:700;color:var(--amber)\">' + g.late.length + '</p><p class=\"xsmall dim\">' + labels.late + \"</p></div>\" +\n    '<div class=\"stat-box\"><p style=\"font-size:1.5rem;font-weight:700\">' + g.absent.length + '</p><p class=\"xsmall dim\">' + labels.absent + \"</p></div></div>\";\n  h += nameSectionHtml(st, labels.join, g.join, \"var(--green)\", false);\n  h += nameSectionHtml(st, labels.late, g.late, \"var(--amber)\", true);\n  h += nameSectionHtml(st, labels.absent, g.absent, \"var(--dim)\", false);\n  return h + \"</div>\";\n}\nfunction voteRankingHtml(st, labels) {\n  var ev = st.ev;\n  var ranked = ev.dates.map(function(d) {\n    var g = byDate(st, d.id);\n    return { d: d, coming: g.join.length + g.late.length, join: g.join.length, late: g.late.length, absent: g.absent.length };\n  }).sort(function(a, b){ return b.coming - a.coming; });\n  var top = ranked.length > 0 ? ranked[0].coming : 0;\n  var h = '<section class=\"mt5\" aria-label=\"候補日のランキング\"><h3 style=\"font-size:1.125rem\">来れる人数が多い順</h3><ol style=\"margin:.5rem 0 0;padding:0;list-style:none\" class=\"stack2\">';\n  ranked.forEach(function(x, i) {\n    var isTop = x.coming === top && top > 0;\n    h += '<li class=\"card row-between' + (isTop ? \" rank-top\" : \"\") + '\" style=\"padding:1rem\">' +\n      '<span style=\"width:2rem;text-align:center;font-size:1.5rem;font-weight:700;color:var(--accent)\" class=\"shrink0\">' + (i + 1) + \"</span>\" +\n      '<span class=\"grow\" style=\"min-width:0\"><span style=\"display:block;font-weight:700\">' + esc(x.d.label) + \"</span>\" +\n      '<span class=\"small dim\" style=\"display:block\">' + labels.join + \" \" + x.join + \"人 ／ \" + labels.late + \" \" + x.late + \"人 ／ \" + labels.absent + \" \" + x.absent + \"人</span></span>\" +\n      '<span class=\"shrink0\" style=\"text-align:right\"><span style=\"display:block;font-size:1.875rem;font-weight:700;line-height:1\">' + x.coming + '<span style=\"font-size:1rem;margin-left:.125rem\">人</span></span>' +\n      (isTop ? '<span class=\"xsmall\" style=\"display:block;margin-top:.25rem;font-weight:700;color:var(--accent)\">いちばん多い</span>' : \"\") + \"</span></li>\";\n  });\n  h += \"</ol>\";\n  if (top > 0) h += '<p class=\"mt2 small dim\" style=\"line-height:1.6\">いちばん多い日を開催日にするのがおすすめです。各日の名前の内訳は下にあります。</p>';\n  return h + \"</section>\";\n}\nfunction expiredPoolHtml(st, expired, labels) {\n  var ev = st.ev;\n  var h = '<section class=\"pool mt8\" aria-label=\"期限切れプール\"><h3 style=\"font-size:1.125rem;color:var(--amber)\">期限切れプール <span style=\"color:var(--text);font-size:1rem\">' + expired.length + \"人</span></h3>\" +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">回答期限を過ぎてから届いた回答です。上の集計（人数・ランキング）には含まれていません。</p>' +\n    '<ul class=\"divide\" style=\"margin:.5rem 0 0;padding:0;list-style:none\">';\n  expired.forEach(function(r) {\n    h += '<li style=\"padding:.5rem 0\"><div class=\"row-between\"><span style=\"font-weight:700\">' + esc(r.name) + \"</span>\";\n    if (st.confirmId === r.id) {\n      h += '<span class=\"flex shrink0\" style=\"align-items:center\"><span class=\"xsmall dim\">全日程分を削除</span>' +\n        '<button type=\"button\" class=\"btn btn-danger shrink0\" style=\"width:auto;padding:.25rem .5rem;font-size:.75rem;min-height:0\" data-mact=\"del-resp\" data-id=\"' + r.id + '\">削除する</button></span>';\n    } else {\n      h += '<button type=\"button\" class=\"linklike shrink0\" style=\"font-size:.75rem\" data-mact=\"confirm-resp\" data-id=\"' + r.id + '\">削除</button>';\n    }\n    h += '</div><ul style=\"margin:.25rem 0 0;padding:0;list-style:none\">';\n    r.answers.forEach(function(a) {\n      var d = ev.dates.find(function(x){ return x.id === a.dateId; });\n      var stLabel = a.status === \"join\" ? labels.join : a.status === \"late\" ? labels.late : labels.absent;\n      h += '<li class=\"small dim\">' + (ev.mode !== \"single\" && d ? esc(d.label) + \"：\" : \"\") + stLabel +\n        (a.status === \"late\" && a.lateTime ? '<span style=\"margin-left:.25rem;font-weight:700;color:var(--amber)\">（' + esc(a.lateTime) + \"頃）</span>\" : \"\") + \"</li>\";\n    });\n    h += \"</ul></li>\";\n  });\n  return h + \"</ul></section>\";\n}\nfunction bindSummary() {\n  var st = summaryState;\n  document.querySelectorAll(\"[data-mact]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() {\n      var act = b.getAttribute(\"data-mact\");\n      if (act === \"top\") go({ kind: \"home\" });\n      else if (act === \"survey\") go({ kind: \"survey\", eventId: st.eventId });\n      else if (act === \"settle\") go({ kind: \"settle\", eventId: st.eventId });\n      else if (act === \"reload\") loadSummary();\n      else if (act === \"confirm-resp\") { st.confirmId = Number(b.getAttribute(\"data-id\")); drawSummary(); }\n      else if (act === \"del-resp\") {\n        var id = Number(b.getAttribute(\"data-id\"));\n        api(\"deleteResponse\", { id: id, eventId: st.eventId, passcode: st.passcode || \"\" }).then(function(res) {\n          st.confirmId = null;\n          if (res.ok) loadSummary();\n          else { summaryPasscodes[st.eventId] = null; st.passcode = null; st.authorized = false; st.wrongPass = true; drawSummary(); }\n        }).catch(function() { st.confirmId = null; drawSummary(); });\n      }\n    });\n  });\n  var form = document.getElementById(\"pass-form\");\n  if (form) {\n    var inp = document.getElementById(\"s-pass\");\n    inp.addEventListener(\"input\", function() {\n      st.input = inp.value.replace(/\\D/g, \"\").slice(0, 4);\n      if (inp.value !== st.input) inp.value = st.input;\n      var btn = form.querySelector(\"[data-mact='pass-submit']\");\n      if (btn) btn.disabled = st.input.length !== 4;\n    });\n    form.addEventListener(\"submit\", function(e) {\n      e.preventDefault();\n      if (st.input.length !== 4) return;\n      st.wrongPass = false;\n      st.passcode = st.input;\n      summaryPasscodes[st.eventId] = st.input;\n      loadSummary();\n    });\n  }\n}\n\n/* ===== 清算ページ ===== */\nvar settleState = null;\nfunction fmtYen(n) { return Number(n).toLocaleString(\"ja-JP\") + \"円\"; }\n/* ISO日時を「11/29 16:20」形式に（端末のローカル時刻） */\nfunction fmtStamp(iso) {\n  var d = new Date(iso);\n  if (isNaN(d.getTime())) return \"\";\n  return (d.getMonth() + 1) + \"/\" + d.getDate() + \" \" +\n    String(d.getHours()).padStart(2, \"0\") + \":\" + String(d.getMinutes()).padStart(2, \"0\");\n}\nfunction renderSettle(eventId) {\n  settleState = {\n    eventId: eventId, ev: null, dateId: null, data: null, loaded: false,\n    passcode: null, adminInput: \"\", wrongPass: false,\n    showForm: false, editingId: null,\n    form: { payerId: null, title: \"\", amount: \"\", weights: {} },\n    formError: null, memberEdit: false, newMemberName: \"\",\n    confirmDelExpense: null, confirmDelMember: null, notice: null\n  };\n  appEl().innerHTML = loadingHtml();\n  api(\"getEventDetail\", { eventId: eventId }).then(function(res) {\n    if (view.kind !== \"settle\" || view.eventId !== eventId) return;\n    if (!res.event) { appEl().innerHTML = notFoundHtml(); return; }\n    settleState.ev = res.event;\n    setTheme(res.event.theme);\n    settleState.dateId = res.event.dates.length > 0 ? res.event.dates[0].id : null;\n    var preset = summaryPasscodes[eventId];\n    if (preset) {\n      api(\"verifyPasscode\", { eventId: eventId, passcode: preset }).then(function(v) {\n        if (v.ok) settleState.passcode = preset;\n        loadSettleData(false);\n      }).catch(function() { loadSettleData(false); });\n    } else {\n      loadSettleData(false);\n    }\n  }).catch(function() { if (view.kind === \"settle\") appEl().innerHTML = notFoundHtml(); });\n}\nfunction loadSettleData(keepScroll) {\n  var st = settleState;\n  var y = keepScroll ? window.scrollY : 0;\n  api(\"getSettle\", { eventId: st.eventId, dateId: st.dateId }).then(function(res) {\n    if (view.kind !== \"settle\" || view.eventId !== st.eventId) return;\n    st.loaded = true;\n    if (!res.event) { appEl().innerHTML = notFoundHtml(); return; }\n    st.data = res;\n    st.ev = res.event;\n    st.dateId = res.dateId;\n    drawSettle();\n    if (keepScroll) window.scrollTo(0, y);\n  }).catch(function() { st.loaded = true; drawSettle(); });\n}\nfunction settleCanRecord() {\n  var st = settleState;\n  return st.data && (st.data.mode === \"anyone\" || st.passcode);\n}\nfunction drawSettle() {\n  var st = settleState, ev = st.ev, data = st.data;\n  if (!ev || !data) { appEl().innerHTML = notFoundHtml(); return; }\n  var h = '<div style=\"padding-bottom:2rem\"><div class=\"row-between\">' +\n    '<button type=\"button\" class=\"linklike\" data-tact=\"survey\">← 回答ページ</button>' +\n    '<button type=\"button\" class=\"linklike\" data-tact=\"summary\">集計を見る →</button></div>';\n  h += '<h2 class=\"mt3\">' + esc(ev.title) + '</h2>' +\n    '<p class=\"mt1 xsmall dim\">清算ページ（割り勘）　ページ番号 #' + ev.id + \"</p>\";\n  if (!data.enabled) {\n    h += '<p class=\"mt5 center small dim\" style=\"border:1px dashed var(--border);background:var(--surface);border-radius:.75rem;padding:1.25rem;line-height:1.6\">このページでは清算機能は使われていません。<br>使う場合は、トップの「編集」から清算をオンにしてください。</p>';\n    h += '<button type=\"button\" class=\"linklike mt8\" data-tact=\"top\">← トップに戻る</button></div>';\n    appEl().innerHTML = h;\n    bindSettle();\n    return;\n  }\n  /* 日ごとの切替（複数日・候補日） */\n  if (ev.dates.length > 1) {\n    h += '<div class=\"tab-row mt4\" role=\"tablist\" aria-label=\"日ごとの清算\">';\n    ev.dates.forEach(function(d) {\n      h += '<button type=\"button\" class=\"tab-btn' + (st.dateId === d.id ? \" checked\" : \"\") + '\" data-tact=\"tab\" data-id=\"' + d.id + '\">' + esc(d.label) + \"</button>\";\n    });\n    h += \"</div>\";\n    if (ev.mode === \"vote\") h += '<p class=\"mt2 small dim\" style=\"line-height:1.6\">候補日モードでは、開催が決まった日のタブで清算してください。</p>';\n    else h += '<p class=\"mt2 small dim\" style=\"line-height:1.6\">日ごとに別々に清算します。</p>';\n  }\n  var members = data.members;\n  /* メンバー */\n  h += '<section class=\"mt5\" aria-label=\"メンバー\"><h3 style=\"font-size:1.125rem\">メンバー <span class=\"small dim\">' + members.length + \"人</span></h3>\";\n  if (members.length === 0) {\n    h += '<p class=\"mt2 small dim\" style=\"line-height:1.6\">まだメンバーがいません。下の管理者メニューから「回答から取り込む」か、手で追加すると清算を始められます。</p>';\n  } else {\n    h += '<p class=\"mt2\">' + members.map(function(m) { return '<span class=\"chip\" style=\"margin:0 .25rem .25rem 0;font-size:.875rem;padding:.25rem .625rem\">' + esc(m.name) + \"</span>\"; }).join(\"\") + \"</p>\";\n  }\n  if (st.memberEdit && st.passcode) h += memberEditHtml(st);\n  h += \"</section>\";\n  if (st.notice) h += '<p class=\"mt3 small\" role=\"status\" style=\"background:var(--green-bg);border-radius:.75rem;padding:.5rem .75rem;font-weight:700;color:var(--green)\">' + esc(st.notice) + \"</p>\";\n  /* 精算 */\n  h += '<section class=\"mt6\" aria-label=\"清算\"><h3 style=\"font-size:1.125rem\">清算</h3>';\n  if (data.expenses.length === 0) {\n    h += '<p class=\"mt2 small dim\" style=\"border:1px dashed var(--border);background:var(--surface);border-radius:.75rem;padding:1rem;line-height:1.6\">立替記録がありません。下のボタンから記録すると、誰が誰にいくら払うかが自動で計算されます。</p>';\n  } else if (data.transfers.length === 0) {\n    h += '<p class=\"mt2 small\" style=\"background:var(--green-bg);border-radius:.75rem;padding:.75rem;font-weight:700;color:var(--green)\">全員の収支が合っています。送金の必要はありません。</p>';\n  } else {\n    h += '<div class=\"card mt2 divide\" style=\"padding:.25rem 1rem\">';\n    data.transfers.forEach(function(t, i) {\n      h += '<div class=\"row-between\" style=\"padding:.625rem 0\">' +\n        '<span><b>' + esc(t.fromName) + '</b> → <b>' + esc(t.toName) + '</b>' +\n        '<span style=\"display:block;font-weight:700;font-size:1.125rem\">' + fmtYen(t.amount) + \"</span>\" +\n        (t.paidAt ? '<span class=\"xsmall\" style=\"color:var(--green);font-weight:700\">済 ' + fmtStamp(t.paidAt) + \"</span>\" : \"\") +\n        \"</span>\" +\n        '<label style=\"display:flex;align-items:center;gap:.375rem;cursor:pointer\" class=\"shrink0\">' +\n        '<input type=\"checkbox\" class=\"paid-check\" data-tact-paid=\"' + i + '\"' + (t.paidAt ? \" checked\" : \"\") + '><span class=\"small\">送金済み</span></label></div>';\n    });\n    h += '</div><p class=\"mt2 xsmall dim\">端数は切り上げで計算しています。送金済みは誰でも付け外しできます（付けた日時が表示されます）。</p>';\n  }\n  h += \"</section>\";\n  /* 立替一覧 */\n  h += '<section class=\"mt6\" aria-label=\"立替一覧\"><h3 style=\"font-size:1.125rem\">立替一覧</h3>';\n  if (data.expenses.length === 0) {\n    h += '<p class=\"mt2 small dim\">まだ記録がありません。</p>';\n  } else {\n    h += '<div class=\"mt2 stack3\">';\n    data.expenses.forEach(function(ex) { h += expenseCardHtml(st, ex); });\n    h += \"</div>\";\n  }\n  h += '<p class=\"mt3 small dim\" style=\"line-height:1.6\">金額などの間違いは編集できます。削除や重複登録の間違いは、管理者に連絡してください。</p>';\n  /* 立替フォーム */\n  if (settleCanRecord()) {\n    if (st.showForm) h += expenseFormHtml(st);\n    else h += '<button type=\"button\" class=\"btn mt4\" data-tact=\"exp-open\">立替記録を追加</button>';\n  } else {\n    h += '<p class=\"mt4 small dim\" style=\"border:1px dashed var(--border);background:var(--surface);border-radius:.75rem;padding:1rem;line-height:1.6\">立替の記録は管理者だけができます。下の管理者メニューでパスコードを入れると記録できるようになります。</p>';\n  }\n  h += \"</section>\";\n  /* 明細 */\n  if (data.expenses.length > 0) {\n    h += '<section class=\"mt6\" aria-label=\"明細\"><h3 style=\"font-size:1.125rem\">明細</h3><div class=\"card mt2 divide\" style=\"padding:.25rem 1rem\">';\n    data.rows.forEach(function(r) {\n      /* 右の大きな数字は「未清算分」。払う側は残額がある間だけ「－」の赤字、\n         払い終わったら 0円 を穏やかな色で。受け取る側は通常の文字色（黒系）で、受け取り終わったら 0円。 */\n      var un = r.unsettled || 0;\n      var headColor = un > 0 ? (r.net < 0 ? \"#dc2626\" : \"var(--text)\") : \"var(--dim)\";\n      var headText = (r.net < 0 && un > 0 ? \"－\" : \"\") + fmtYen(un);\n      h += '<div style=\"padding:.625rem 0\"><div class=\"row-between\"><span style=\"font-weight:700\">' + esc(r.name) + '</span>' +\n        '<span style=\"font-weight:700;color:' + headColor + '\">' + headText + \"</span></div>\" +\n        '<p class=\"xsmall dim\">立替合計 ' + fmtYen(r.paid) + \"　／　清算合計 \" + fmtYen(r.settled || 0) + \"　／　未清算合計 \" + fmtYen(r.unsettled || 0) + \"</p></div>\";\n    });\n    h += '</div><p class=\"mt2 xsmall dim\" style=\"line-height:1.6\">右の金額は未清算分です。立替合計は立て替えた金額、未清算合計はまだ残っている分です。清算合計は、送金済みになった分と自分の負担分（立替と相殺された分）を合わせた額で、立替えた人は立替合計 ＝ 清算合計 ＋ 未清算合計 になります。<br>受け取る分は黒、－の赤は払う分です。0円は清算が終わった人です。</p></section>';\n  }\n  /* 管理者メニュー */\n  h += '<section class=\"card mt8\" aria-label=\"管理者メニュー\"><h3 style=\"font-size:1.125rem\">管理者メニュー</h3>';\n  if (!st.passcode) {\n    h += '<p class=\"mt1 small dim\" style=\"line-height:1.6\">メンバーの取り込み・編集と、立替の削除は管理者だけができます。パスコード（4桁）を入れてください。</p>' +\n      '<div class=\"mt3 flex\"><input type=\"text\" id=\"a-pass\" class=\"passinput\" value=\"' + esc(st.adminInput) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"1234\" style=\"margin-top:0\">' +\n      '<button type=\"button\" class=\"btn shrink0\" style=\"width:auto;padding:.5rem 1rem;font-size:1rem\" data-tact=\"admin-open\"' + (st.adminInput.length !== 4 ? \" disabled\" : \"\") + \">開く</button></div>\" +\n      (st.wrongPass ? '<p class=\"mt2 err\" role=\"alert\">パスコードが違います。</p>' : \"\");\n  } else {\n    h += '<div class=\"mt3 stack2\">' +\n      '<button type=\"button\" class=\"btn btn-outline btn-sub\" data-tact=\"import\">回答から取り込む（参加＋遅れていきます）</button>' +\n      '<button type=\"button\" class=\"btn btn-plain btn-sub\" data-tact=\"medit-toggle\">' + (st.memberEdit ? \"メンバー編集を閉じる\" : \"メンバーを編集（追加・名前変更・削除）\") + \"</button>\" +\n      '<p class=\"xsmall dim\" style=\"line-height:1.6\">取り込むと、その時点の回答に合わせてメンバーが追加・除外されます。立替の削除は、各記録の「削除」からできます。</p></div>';\n  }\n  h += \"</section>\";\n  h += '<button type=\"button\" class=\"linklike mt8\" data-tact=\"top\">← トップに戻る</button></div>';\n  appEl().innerHTML = h;\n  bindSettle();\n}\nfunction expenseCardHtml(st, ex) {\n  var hasWeights = ex.shares.some(function(s) { return s.weight !== 1; });\n  var h = '<article class=\"card\" style=\"padding:1rem\"><div class=\"row-between\"><span style=\"font-weight:700;font-size:1.125rem\">' + esc(ex.title) + '</span>' +\n    '<span style=\"font-weight:700;font-size:1.125rem\">' + fmtYen(ex.amount) + \"</span></div>\" +\n    '<p class=\"mt1 small dim\">' + esc(ex.payerName) + \" が立替え\" +\n    (hasWeights ? '　<span class=\"chip\">傾斜</span>' : \"\") +\n    '　<span class=\"xsmall\">' + fmtStamp(ex.createdAt) + \" 登録</span></p>\" +\n    '<p class=\"mt2\">' + ex.shares.map(function(s) {\n      return '<span class=\"chip\" style=\"margin:0 .25rem .25rem 0\">' + esc(s.name) + (s.weight !== 1 ? \" ×\" + s.weight : \"\") + \"</span>\";\n    }).join(\"\") + '<span class=\"small dim\">が清算</span></p>';\n  h += '<div class=\"mt2 flex\">';\n  if (settleCanRecord()) h += '<button type=\"button\" class=\"btn btn-plain btn-sub shrink0\" style=\"width:auto;padding:.25rem .75rem;font-size:.875rem;min-height:0\" data-tact=\"exp-edit\" data-id=\"' + ex.id + '\">編集</button>';\n  if (st.passcode) {\n    if (st.confirmDelExpense === ex.id) {\n      h += '<span class=\"flex shrink0\" style=\"align-items:center\"><span class=\"xsmall dim\">この記録を削除します</span>' +\n        '<button type=\"button\" class=\"btn btn-danger shrink0\" style=\"width:auto;padding:.25rem .5rem;font-size:.75rem;min-height:0\" data-tact=\"exp-del-go\" data-id=\"' + ex.id + '\">削除する</button></span>';\n    } else {\n      h += '<button type=\"button\" class=\"linklike shrink0\" style=\"font-size:.75rem\" data-tact=\"exp-del\" data-id=\"' + ex.id + '\">削除</button>';\n    }\n  }\n  return h + \"</div></article>\";\n}\nfunction expenseFormHtml(st) {\n  var members = st.data.members;\n  var f = st.form;\n  var h = '<form id=\"exp-form\" class=\"card mt4 stack3\"><h4 style=\"font-size:1rem\">' + (st.editingId ? \"立替を編集\" : \"立替記録を追加\") + \"</h4>\";\n  if (members.length === 0) {\n    h += '<p class=\"small dim\" style=\"line-height:1.6\">メンバーがいないため記録できません。先に管理者メニューからメンバーを取り込むか追加してください。</p>';\n  } else {\n    h += '<div><label class=\"flabel\" for=\"x-payer\">払った人</label><select id=\"x-payer\" class=\"psel\">' +\n      members.map(function(m) { return '<option value=\"' + m.id + '\"' + (f.payerId === m.id ? \" selected\" : \"\") + \">\" + esc(m.name) + \"</option>\"; }).join(\"\") + \"</select></div>\";\n    h += '<div><label class=\"flabel\" for=\"x-title\">内容</label>' +\n      '<input type=\"text\" id=\"x-title\" value=\"' + esc(f.title) + '\" placeholder=\"例：材料費\" style=\"margin-top:.25rem\"></div>';\n    h += '<div><label class=\"flabel\" for=\"x-amount\">金額（円）</label>' +\n      '<input type=\"number\" id=\"x-amount\" class=\"amtinput\" value=\"' + esc(f.amount) + '\" inputmode=\"numeric\" min=\"1\" placeholder=\"3500\"></div>';\n    h += '<fieldset><legend>負担する人と傾斜</legend>' +\n      '<p class=\"mt1 small dim\" style=\"line-height:1.6\">傾斜は負担の倍率です（1＝普通、2＝2倍、0.5＝半分、0＝負担しない）。</p><div class=\"mt2 stack2\">';\n    members.forEach(function(m) {\n      h += '<div class=\"row-between\"><span>' + esc(m.name) + '</span>' +\n        '<span style=\"display:flex;align-items:center;gap:.25rem\"><span class=\"small dim\">×</span>' +\n        '<input type=\"text\" class=\"winput\" data-wmid=\"' + m.id + '\" value=\"' + esc(f.weights[m.id] != null ? f.weights[m.id] : \"1\") + '\" inputmode=\"decimal\" aria-label=\"' + esc(m.name) + 'の傾斜\"></span></div>';\n    });\n    h += \"</div></fieldset>\";\n    if (st.formError) h += '<p class=\"err\" role=\"alert\">' + esc(st.formError) + \"</p>\";\n    h += '<div class=\"flex\"><button type=\"button\" class=\"btn btn-plain btn-sub grow\" data-tact=\"exp-cancel\">やめる</button>' +\n      '<button type=\"submit\" class=\"btn btn-sub grow\">' + (st.editingId ? \"変更を保存\" : \"記録する\") + \"</button></div>\";\n  }\n  return h + \"</form>\";\n}\nfunction memberEditHtml(st) {\n  var h = '<div class=\"card-alt mt3 stack3\"><p class=\"small\" style=\"font-weight:700\">メンバー編集</p>' +\n    '<p class=\"xsmall dim\" style=\"line-height:1.6\">「既定の傾斜」は、新しい立替を追加するときの初期値です。立替ごとに変更もできます。名前・傾斜を変えたら「保存」を押してください。</p>';\n  st.data.members.forEach(function(m) {\n    h += '<div class=\"stack2\"><div class=\"flex\" style=\"align-items:center\"><input type=\"text\" data-mname=\"' + m.id + '\" value=\"' + esc(m.name) + '\" style=\"margin-top:0\" aria-label=\"名前\">' +\n      '<button type=\"button\" class=\"btn btn-plain btn-sub shrink0\" style=\"width:auto;padding:.25rem .75rem;font-size:.875rem\" data-tact=\"m-save\" data-id=\"' + m.id + '\">保存</button>';\n    if (st.confirmDelMember === m.id) {\n      h += '<button type=\"button\" class=\"btn btn-danger shrink0\" style=\"width:auto;padding:.25rem .5rem;font-size:.75rem;min-height:0\" data-tact=\"m-del-go\" data-id=\"' + m.id + '\">本当に削除</button>';\n    } else {\n      h += '<button type=\"button\" class=\"linklike shrink0\" style=\"font-size:.75rem\" data-tact=\"m-del\" data-id=\"' + m.id + '\">削除</button>';\n    }\n    h += '</div>' +\n      '<div style=\"display:flex;align-items:center;gap:.375rem\"><span class=\"small dim shrink0\">既定の傾斜</span>' +\n      '<span class=\"small dim\">×</span>' +\n      '<input type=\"text\" class=\"winput\" data-mweight=\"' + m.id + '\" value=\"' + esc(String(typeof m.defaultWeight === \"number\" ? m.defaultWeight : 1)) + '\" inputmode=\"decimal\" style=\"margin-top:0\" aria-label=\"' + esc(m.name) + 'の既定の傾斜\"></div></div>';\n  });\n  h += '<div class=\"flex\"><input type=\"text\" id=\"m-new\" value=\"' + esc(st.newMemberName) + '\" placeholder=\"追加するメンバーの名前\" style=\"margin-top:0\">' +\n    '<button type=\"button\" class=\"btn btn-sub shrink0\" style=\"width:auto;padding:.5rem 1rem;font-size:1rem\" data-tact=\"m-add\">追加</button></div></div>';\n  return h;\n}\nfunction openExpenseForm(st, ex) {\n  var weights = {};\n  if (ex) {\n    /* 編集では保存済みの傾斜を表示する（既定の傾斜では上書きしない） */\n    st.data.members.forEach(function(m) { weights[m.id] = \"0\"; });\n    ex.shares.forEach(function(s) { weights[s.memberId] = String(s.weight); });\n    st.form = { payerId: ex.payerId, title: ex.title, amount: String(ex.amount), weights: weights };\n    st.editingId = ex.id;\n  } else {\n    /* 新規では各メンバーの既定の傾斜を初期値にする（立替ごとに直せる） */\n    st.data.members.forEach(function(m) {\n      weights[m.id] = String(typeof m.defaultWeight === \"number\" ? m.defaultWeight : 1);\n    });\n    st.form = { payerId: st.data.members.length > 0 ? st.data.members[0].id : null, title: \"\", amount: \"\", weights: weights };\n    st.editingId = null;\n  }\n  st.formError = null;\n  st.showForm = true;\n  drawSettle();\n  var el = document.getElementById(\"exp-form\");\n  if (el) el.scrollIntoView({ behavior: \"smooth\", block: \"start\" });\n}\nfunction submitExpenseForm() {\n  var st = settleState, f = st.form;\n  var title = f.title.trim();\n  if (!title) { st.formError = \"内容を入力してください。\"; drawSettle(); return; }\n  var amount = Number(f.amount);\n  if (!isFinite(amount) || Math.floor(amount) !== amount || amount < 1) { st.formError = \"金額は1円以上の整数で入力してください。\"; drawSettle(); return; }\n  var weights = {}, any = false;\n  for (var k in f.weights) {\n    var w = Number(f.weights[k]);\n    if (!isFinite(w) || w < 0) { st.formError = \"傾斜は0以上の数字で入力してください。\"; drawSettle(); return; }\n    weights[k] = w;\n    if (w > 0) any = true;\n  }\n  if (!any) { st.formError = \"負担する人を1人以上選んでください（傾斜が全員0になっています）。\"; drawSettle(); return; }\n  if (!f.payerId) { st.formError = \"払った人を選んでください。\"; drawSettle(); return; }\n  var payload = {\n    eventId: st.eventId, dateId: st.dateId, passcode: st.passcode || undefined,\n    expense: { payerId: f.payerId, title: title, amount: amount, weights: weights }\n  };\n  var call = st.editingId\n    ? api(\"updateExpense\", Object.assign(payload, { expenseId: st.editingId }))\n    : api(\"addExpense\", payload);\n  call.then(function(res) {\n    if (!res.ok) {\n      st.formError = res.needPasscode ? \"記録にはパスコードが必要です。管理者メニューで開いてください。\" : \"保存できませんでした。\";\n      drawSettle();\n      return;\n    }\n    var wasEdit = st.editingId != null;\n    st.showForm = false; st.editingId = null;\n    st.notice = wasEdit ? \"立替を変更しました。\" : \"立替を記録しました。\";\n    loadSettleData(true);\n  }).catch(function(e) {\n    st.formError = e && e.message ? e.message : \"保存に失敗しました。\";\n    drawSettle();\n  });\n}\nfunction bindSettle() {\n  var st = settleState;\n  document.querySelectorAll(\"[data-tact]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() {\n      var act = b.getAttribute(\"data-tact\");\n      var id = b.getAttribute(\"data-id\") ? Number(b.getAttribute(\"data-id\")) : null;\n      if (act === \"top\") go({ kind: \"home\" });\n      else if (act === \"survey\") go({ kind: \"survey\", eventId: st.eventId });\n      else if (act === \"summary\") go({ kind: \"summary\", eventId: st.eventId });\n      else if (act === \"tab\") { st.dateId = id; st.showForm = false; st.memberEdit = false; st.notice = null; loadSettleData(false); }\n      else if (act === \"exp-open\") openExpenseForm(st, null);\n      else if (act === \"exp-cancel\") { st.showForm = false; st.editingId = null; drawSettle(); }\n      else if (act === \"exp-edit\") {\n        var ex = st.data.expenses.find(function(x) { return x.id === id; });\n        if (ex) openExpenseForm(st, ex);\n      }\n      else if (act === \"exp-del\") { st.confirmDelExpense = id; drawSettle(); }\n      else if (act === \"exp-del-go\") {\n        api(\"deleteExpense\", { eventId: st.eventId, dateId: st.dateId, expenseId: id, passcode: st.passcode || \"\" }).then(function(res) {\n          st.confirmDelExpense = null;\n          if (res.ok) { st.notice = \"立替を削除しました。\"; }\n          loadSettleData(true);\n        }).catch(function() { st.confirmDelExpense = null; drawSettle(); });\n      }\n      else if (act === \"admin-open\") {\n        if (st.adminInput.length !== 4) return;\n        api(\"verifyPasscode\", { eventId: st.eventId, passcode: st.adminInput }).then(function(res) {\n          if (res.ok) {\n            st.passcode = st.adminInput;\n            summaryPasscodes[st.eventId] = st.adminInput;\n            st.wrongPass = false; st.adminInput = \"\";\n          } else st.wrongPass = true;\n          drawSettle();\n        }).catch(function() { st.wrongPass = true; drawSettle(); });\n      }\n      else if (act === \"import\") {\n        api(\"importMembers\", { eventId: st.eventId, dateId: st.dateId, passcode: st.passcode || \"\" }).then(function(res) {\n          if (res.ok) st.notice = \"回答から取り込みました（追加 \" + res.added + \"人・除外 \" + res.removed + \"人）。\";\n          else st.notice = \"取り込めませんでした。\";\n          loadSettleData(true);\n        }).catch(function() { drawSettle(); });\n      }\n      else if (act === \"medit-toggle\") { st.memberEdit = !st.memberEdit; st.confirmDelMember = null; drawSettle(); }\n      else if (act === \"m-add\") {\n        var name = st.newMemberName.trim();\n        if (!name) return;\n        api(\"addMember\", { eventId: st.eventId, dateId: st.dateId, passcode: st.passcode || \"\", name: name }).then(function(res) {\n          if (res.ok) { st.newMemberName = \"\"; st.notice = \"メンバーを追加しました。\"; }\n          loadSettleData(true);\n        }).catch(function() { drawSettle(); });\n      }\n      else if (act === \"m-save\") {\n        var inp = document.querySelector('[data-mname=\"' + id + '\"]');\n        var nm = inp ? inp.value.trim() : \"\";\n        if (!nm) return;\n        var wInp = document.querySelector('[data-mweight=\"' + id + '\"]');\n        var w = wInp ? Number(wInp.value) : 1;\n        if (!isFinite(w) || w < 0) { st.notice = \"既定の傾斜は0以上の数字で入力してください。\"; drawSettle(); return; }\n        api(\"renameMember\", { eventId: st.eventId, dateId: st.dateId, passcode: st.passcode || \"\", memberId: id, name: nm }).then(function(res) {\n          if (!res.ok) return null;\n          return api(\"setMemberDefaultWeight\", { eventId: st.eventId, dateId: st.dateId, passcode: st.passcode || \"\", memberId: id, weight: w });\n        }).then(function(res2) {\n          if (res2 && res2.ok) st.notice = \"メンバーを保存しました。\";\n          loadSettleData(true);\n        }).catch(function() { drawSettle(); });\n      }\n      else if (act === \"m-del\") { st.confirmDelMember = id; drawSettle(); }\n      else if (act === \"m-del-go\") {\n        api(\"removeMember\", { eventId: st.eventId, dateId: st.dateId, passcode: st.passcode || \"\", memberId: id }).then(function(res) {\n          st.confirmDelMember = null;\n          if (res.ok) st.notice = \"メンバーを削除しました。\";\n          loadSettleData(true);\n        }).catch(function() { st.confirmDelMember = null; drawSettle(); });\n      }\n    });\n  });\n  document.querySelectorAll(\"[data-tact-paid]\").forEach(function(cb) {\n    cb.addEventListener(\"change\", function() {\n      var t = st.data.transfers[Number(cb.getAttribute(\"data-tact-paid\"))];\n      if (!t) return;\n      api(\"setTransferPaid\", {\n        eventId: st.eventId, dateId: st.dateId,\n        fromId: t.fromId, toId: t.toId, amount: t.amount, paid: cb.checked\n      }).then(function() { loadSettleData(true); }).catch(function() { drawSettle(); });\n    });\n  });\n  var passInp = document.getElementById(\"a-pass\");\n  if (passInp) passInp.addEventListener(\"input\", function() {\n    st.adminInput = passInp.value.replace(/\\D/g, \"\").slice(0, 4);\n    if (passInp.value !== st.adminInput) passInp.value = st.adminInput;\n    var btn = document.querySelector(\"[data-tact='admin-open']\");\n    if (btn) btn.disabled = st.adminInput.length !== 4;\n  });\n  var newInp = document.getElementById(\"m-new\");\n  if (newInp) newInp.addEventListener(\"input\", function() { st.newMemberName = newInp.value; });\n  var payerSel = document.getElementById(\"x-payer\");\n  if (payerSel) payerSel.addEventListener(\"change\", function() { st.form.payerId = Number(payerSel.value); });\n  var titleInp = document.getElementById(\"x-title\");\n  if (titleInp) titleInp.addEventListener(\"input\", function() { st.form.title = titleInp.value; });\n  var amtInp = document.getElementById(\"x-amount\");\n  if (amtInp) amtInp.addEventListener(\"input\", function() { st.form.amount = amtInp.value; });\n  document.querySelectorAll(\"[data-wmid]\").forEach(function(inp) {\n    inp.addEventListener(\"input\", function() { st.form.weights[inp.getAttribute(\"data-wmid\")] = inp.value; });\n  });\n  var form = document.getElementById(\"exp-form\");\n  if (form) form.addEventListener(\"submit\", function(e) { e.preventDefault(); submitExpenseForm(); });\n}\n\n/* ===== ルーター ===== */\nfunction render() {\n  if (view.kind === \"home\") renderHome();\n  else if (view.kind === \"survey\") renderSurvey(view.eventId, view.created);\n  else if (view.kind === \"summary\") renderSummary(view.eventId);\n  else if (view.kind === \"settle\") renderSettle(view.eventId);\n}\nview = parseHashView();\nrender();\n</script>\n</body>\n</html>\n";

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


/* ===== JSONファイル ストレージ ===== */
const DATA_PATH = process.env.RSVP_DATA || path.join(__dirname, "data.json");
let db = { seq: { event: 0, response: 0 }, events: {}, responses: {} };
try {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed && typeof parsed === "object") db = parsed;
} catch (_e) {
  /* ファイルが無ければ新規 */
}
function persist() {
  const tmp = DATA_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DATA_PATH);
}
function respKey(eventId, id) { return eventId + ":" + id; }

const store = {
  async nextSeq(kind) {
    db.seq[kind] = (db.seq[kind] || 0) + 1;
    persist();
    return db.seq[kind];
  },
  async getEvent(id) {
    return db.events[id] || null;
  },
  async putEvent(ev) {
    db.events[ev.id] = ev;
    persist();
  },
  async removeEvent(id) {
    delete db.events[id];
    persist();
  },
  async listResponses(eventId) {
    return Object.values(db.responses).filter((r) => r.eventId === eventId);
  },
  async putResponse(resp) {
    db.responses[respKey(resp.eventId, resp.id)] = resp;
    persist();
  },
  async removeResponse(eventId, id) {
    delete db.responses[respKey(eventId, id)];
    persist();
  },
};

/* ===== HTTP サーバー ===== */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(CLIENT_HTML);
    return;
  }
  if (req.method === "POST" && url.pathname.startsWith("/api/")) {
    const action = decodeURIComponent(url.pathname.slice("/api/".length));
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 1024 * 1024) { req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", async () => {
      let args = {};
      try {
        args = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      } catch (_e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "invalid json" }));
        return;
      }
      const out = await handleApi(store, action, args);
      res.writeHead(out.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(out.body));
    });
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not Found");
});

const PORT = Number(process.env.PORT || 8787);
server.listen(PORT, () => {
  console.log("出欠確認ツール: http://localhost:" + PORT + "/  (data: " + DATA_PATH + ")");
});

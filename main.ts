// @ts-nocheck
/* 出欠確認ページ作成ツール（Deno Deploy 版）
   単一ファイル構成: 画面(HTML/CSS/JS) + API + Deno KV ストレージ。
   デプロイ: 同フォルダで `deno deploy` または `deployctl deploy main.ts`
   ローカル: `deno run --unstable-kv --allow-net main.ts` */

const CLIENT_HTML = "<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n<title>出欠確認ページ作成ツール</title>\n<style>\n:root {\n  color-scheme: light dark;\n  --bg: #fdf7ef; --surface: #ffffff; --surface-alt: #f8ead6;\n  --text: #3a352f; --dim: #8d857a; --border: #eae1d3;\n  --accent: #ad6f43; --accent-text: #ffffff;\n  --green: #648a68; --green-bg: #e7f1e5;\n  --amber: #9a7d4a; --amber-bg: #f8f0dc; --gray-bg: #f5f2ec;\n}\n@media (prefers-color-scheme: dark) {\n  :root {\n    --bg: #28231f; --surface: #332e29; --surface-alt: #40342a;\n    --text: #f3efe8; --dim: #b3aa9d; --border: #4d463d;\n    --accent: #d9a678; --accent-text: #2b2119;\n    --green: #a3c6a7; --green-bg: #354636;\n    --amber: #e0c48a; --amber-bg: #4c4028; --gray-bg: #332e29;\n  }\n}\n.theme-orange { --bg: #fdf7ef; --surface-alt: #f8ead6; --accent: #ad6f43; --accent-text: #ffffff; }\n.theme-red    { --bg: #fdf4f4; --surface-alt: #f8e2e2; --accent: #a86a6a; --accent-text: #ffffff; }\n.theme-pink   { --bg: #fdf4f8; --surface-alt: #f8e1ed; --accent: #a86a8c; --accent-text: #ffffff; }\n.theme-green  { --bg: #f4f9f4; --surface-alt: #e2eedd; --accent: #648a68; --accent-text: #ffffff; }\n.theme-blue   { --bg: #f3f7fd; --surface-alt: #e0eaf8; --accent: #6480a8; --accent-text: #ffffff; }\n.theme-teal   { --bg: #f2f9f7; --surface-alt: #ddf0ea; --accent: #5f8f88; --accent-text: #ffffff; }\n.theme-purple { --bg: #f8f5fd; --surface-alt: #eae3f8; --accent: #8468a8; --accent-text: #ffffff; }\n.theme-white {\n  --bg: #fefefd; --surface: #ffffff; --surface-alt: #f4f3f0;\n  --text: #3d3a36; --dim: #8d857a; --border: #e8e5e0;\n  --accent: #5d594f; --accent-text: #ffffff;\n  --green: #648a68; --green-bg: #e7f1e5;\n  --amber: #9a7d4a; --amber-bg: #f8f0dc; --gray-bg: #f4f3f0;\n}\n.theme-black {\n  --bg: #242220; --surface: #2e2c2a; --surface-alt: #3b3835;\n  --text: #f3f0ea; --dim: #b3aa9d; --border: #4d4942;\n  --accent: #e8dfcf; --accent-text: #33302b;\n  --green: #a3c6a7; --green-bg: #354636;\n  --amber: #e0c48a; --amber-bg: #4c4028; --gray-bg: #2e2c2a;\n}\n@media (prefers-color-scheme: dark) {\n  .theme-orange { --bg: #28231f; --surface-alt: #40342a; --accent: #d9a678; --accent-text: #2b2119; }\n  .theme-red    { --bg: #2a2222; --surface-alt: #453333; --accent: #d99f9f; --accent-text: #2d2020; }\n  .theme-pink   { --bg: #2c2328; --surface-alt: #47333f; --accent: #dda3bf; --accent-text: #2d2028; }\n  .theme-green  { --bg: #232a23; --surface-alt: #364536; --accent: #a3c6a7; --accent-text: #20301f; }\n  .theme-blue   { --bg: #232932; --surface-alt: #344253; --accent: #a3bede; --accent-text: #1f2a38; }\n  .theme-teal   { --bg: #222c2a; --surface-alt: #304743; --accent: #9ccabe; --accent-text: #1d2f2a; }\n  .theme-purple { --bg: #292531; --surface-alt: #403751; --accent: #c0aede; --accent-text: #2a2138; }\n  .theme-white {\n    --bg: #fefefd; --surface: #ffffff; --surface-alt: #f4f3f0;\n    --text: #3d3a36; --dim: #8d857a; --border: #e8e5e0;\n    --accent: #5d594f; --accent-text: #ffffff;\n    --green: #648a68; --green-bg: #e7f1e5;\n    --amber: #9a7d4a; --amber-bg: #f8f0dc; --gray-bg: #f4f3f0;\n  }\n  .theme-black {\n    --bg: #242220; --surface: #2e2c2a; --surface-alt: #3b3835;\n    --text: #f3f0ea; --dim: #b3aa9d; --border: #4d4942;\n    --accent: #e8dfcf; --accent-text: #33302b;\n    --green: #a3c6a7; --green-bg: #354636;\n    --amber: #e0c48a; --amber-bg: #4c4028; --gray-bg: #2e2c2a;\n  }\n}\n* { box-sizing: border-box; }\nbody {\n  margin: 0; background: var(--bg); color: var(--text);\n  font-family: system-ui, -apple-system, \"Hiragino Maru Gothic ProN\", \"Hiragino Sans\", \"Noto Sans JP\", sans-serif;\n}\nbutton, select, summary, input:not([type=\"checkbox\"], [type=\"radio\"]) { min-height: 2.75rem; }\nmain { max-width: 36rem; margin: 0 auto; padding: 1.25rem 1rem 2rem; }\nh2 { font-size: 1.5rem; line-height: 1.4; margin: 0; }\nh3 { font-size: 1.25rem; margin: 0; }\nh4, h5 { margin: 0; }\np { margin: 0; }\n.dim { color: var(--dim); }\n.small { font-size: .875rem; }\n.xsmall { font-size: .75rem; }\n.mt1 { margin-top: .25rem; } .mt2 { margin-top: .5rem; } .mt3 { margin-top: .75rem; }\n.mt4 { margin-top: 1rem; } .mt5 { margin-top: 1.25rem; } .mt6 { margin-top: 1.5rem; } .mt8 { margin-top: 2rem; } .mt10 { margin-top: 2.5rem; }\n.card { border: 1px solid var(--border); background: var(--surface); border-radius: 1rem; padding: 1rem; box-shadow: 0 1px 2px rgba(0,0,0,.05); }\n.card-alt { background: var(--surface-alt); border-radius: .75rem; padding: .75rem; }\nlabel.flabel, .flabel { display: block; font-size: 1rem; font-weight: 700; }\ninput[type=\"text\"], input[type=\"datetime-local\"], textarea, select {\n  width: 100%; border: 1px solid var(--border); background: var(--surface); color: var(--text);\n  border-radius: .75rem; padding: .5rem .75rem; font-size: 1rem; line-height: 1.5; margin-top: .25rem;\n  font-family: inherit;\n}\ntextarea { line-height: 1.6; }\n.passinput { letter-spacing: .5em; }\n.btn {\n  display: block; width: 100%; border: none; cursor: pointer; border-radius: .75rem;\n  padding: .75rem; font-size: 1.125rem; font-weight: 700; font-family: inherit;\n  background: var(--accent); color: var(--accent-text);\n}\n.btn:disabled { opacity: .4; cursor: default; }\n.btn-sub { font-size: 1rem; padding: .5rem; }\n.btn-outline { background: var(--surface); border: 2px solid var(--accent); color: var(--accent); }\n.btn-plain { background: var(--surface); border: 1px solid var(--border); color: var(--text); font-weight: 400; }\n.btn-danger { background: #dc2626; color: #fff; }\n.linklike { background: none; border: none; color: var(--dim); text-decoration: underline; cursor: pointer; font-size: .875rem; padding: .25rem .5rem; font-family: inherit; min-height: 0; }\n.err { color: #dc2626; font-size: .875rem; }\n.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }\n.grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: .5rem; }\n.opt-card {\n  display: flex; align-items: flex-start; gap: .75rem; cursor: pointer;\n  border: 2px solid var(--border); background: var(--surface);\n  border-radius: .75rem; padding: .5rem .75rem;\n}\n.opt-card.checked { border-color: var(--accent); background: var(--surface-alt); }\n.opt-card input[type=\"radio\"] { width: 1.25rem; height: 1.25rem; margin-top: .25rem; accent-color: var(--accent); flex-shrink: 0; }\n.stack2 > * + * { margin-top: .5rem; }\n.stack3 > * + * { margin-top: .75rem; }\n.stack4 > * + * { margin-top: 1rem; }\n.chip { display: inline-block; border-radius: 9999px; background: var(--surface-alt); padding: .125rem .5rem; font-size: .75rem; font-weight: 700; color: var(--accent); }\n.swatch { display: inline-block; width: 1.5rem; height: 1.5rem; border-radius: 9999px; border: 1px solid var(--border); flex-shrink: 0; }\n.theme-opt {\n  display: inline-flex; align-items: center; gap: .5rem; cursor: pointer;\n  border: 2px solid var(--border); background: var(--surface);\n  border-radius: 9999px; padding: .375rem .75rem .375rem .5rem; font-size: .875rem; font-weight: 700;\n}\n.theme-opt.checked { border-color: var(--text); background: var(--surface-alt); }\n.att-opt {\n  display: flex; align-items: center; gap: .75rem; cursor: pointer;\n  border: 2px solid var(--border); background: var(--surface);\n  border-radius: .75rem; padding: .75rem 1rem;\n}\n.att-box {\n  position: relative; width: 2rem; height: 2rem; flex-shrink: 0;\n  border: 2px solid var(--dim); border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;\n  font-size: 1.125rem; font-weight: 700; color: #fff;\n}\n.headline-box { border-radius: 1rem; background: var(--accent); color: var(--accent-text); padding: 1rem; text-align: center; }\n.stat-box { border: 1px solid var(--border); background: var(--surface); border-radius: .75rem; padding: .75rem; text-align: center; }\n.divide > * + * { border-top: 1px solid var(--border); }\n.row-between { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }\n.banner { border: 2px solid var(--accent); background: var(--surface-alt); border-radius: 1rem; padding: 1rem; }\n.sent-box { border: 2px solid var(--green); background: var(--surface); border-radius: 1rem; padding: 1.25rem; text-align: center; }\n.pool { border: 2px dashed var(--amber); border-radius: 1rem; background: var(--surface); padding: 1rem; }\n.rank-top { border: 2px solid var(--accent) !important; }\nfieldset { border: none; padding: 0; margin: 0; }\nlegend { font-size: 1rem; font-weight: 700; padding: 0; }\ndl.info { border: 1px solid var(--border); background: var(--surface); border-radius: 1rem; padding: 1rem; }\ndl.info .row { display: flex; gap: .75rem; }\ndl.info .row + .row { margin-top: .5rem; }\ndl.info dt { width: 2.5rem; flex-shrink: 0; font-weight: 700; color: var(--accent); }\ndl.info dd { margin: 0; }\n.prewrap { white-space: pre-wrap; }\n.center { text-align: center; }\n.flex { display: flex; gap: .5rem; }\n.flex > .grow { flex: 1; min-width: 0; }\n.shrink0 { flex-shrink: 0; }\n</style>\n</head>\n<body>\n<div id=\"approot\" class=\"theme-orange\">\n<main id=\"app\"><p class=\"center dim\" style=\"padding:2.5rem 0\">読み込み中…</p></main>\n</div>\n<script>\n\"use strict\";\n/* ===== 共通ユーティリティ（元アプリ App.tsx / actions.ts と同じ規則） ===== */\nvar WEEKDAYS = [\"日\",\"月\",\"火\",\"水\",\"木\",\"金\",\"土\"];\nvar LATE_TIMES = [\"16:00\",\"16:30\",\"17:00\",\"17:30\",\"18:00\",\"18:30\",\"19:00\",\"19:30\",\"20:00\"];\nvar PASSCODE_RE = /^\\d{4}$/;\nvar MAX_DATES = 7;\nvar MODE_LABEL = { single: \"1日だけ\", multi: \"複数日開催\", vote: \"候補日から決める\" };\nvar THEME_OPTIONS = [\n  { value: \"orange\", label: \"オレンジ\", swatch: \"#e0aa76\" },\n  { value: \"red\",    label: \"あか\",     swatch: \"#dda3a3\" },\n  { value: \"pink\",   label: \"さくら\",   swatch: \"#dda3bf\" },\n  { value: \"green\",  label: \"みどり\",   swatch: \"#a3c6a7\" },\n  { value: \"blue\",   label: \"あお\",     swatch: \"#a3bede\" },\n  { value: \"teal\",   label: \"みずいろ\", swatch: \"#9ccabe\" },\n  { value: \"purple\", label: \"むらさき\", swatch: \"#c0aede\" },\n  { value: \"white\",  label: \"しろ\",     swatch: \"#ffffff\" },\n  { value: \"black\",  label: \"くろ\",     swatch: \"#3b3835\" }\n];\nfunction themeSwatch(t) { var o = THEME_OPTIONS.find(function(x){ return x.value === t; }); return o ? o.swatch : \"#e0aa76\"; }\nfunction themeLabel(t) { var o = THEME_OPTIONS.find(function(x){ return x.value === t; }); return o ? o.label : \"オレンジ\"; }\nfunction esc(s) {\n  return String(s == null ? \"\" : s).replace(/[&<>\"']/g, function(c) {\n    return { \"&\": \"&amp;\", \"<\": \"&lt;\", \">\": \"&gt;\", '\"': \"&quot;\", \"'\": \"&#39;\" }[c];\n  });\n}\n/* datetime-local 値 \"YYYY-MM-DDTHH:mm\" を「11/29（日） 15:00」に整える（暦日ベースで曜日計算） */\nfunction formatDateLabel(dateValue) {\n  var m = /^(\\d{4})-(\\d{2})-(\\d{2})[T ](\\d{2}):(\\d{2})/.exec(dateValue || \"\");\n  if (!m) return dateValue;\n  var wd = WEEKDAYS[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()];\n  return (+m[2]) + \"/\" + (+m[3]) + \"（\" + wd + \"） \" + m[4] + \":\" + m[5];\n}\nfunction isPastDeadline(deadline) {\n  var v = (deadline || \"\").trim();\n  if (!v) return false;\n  var withSeconds = v.length === 16 ? v + \":00\" : v;\n  var t = new Date(withSeconds + \"+09:00\").getTime();\n  if (isNaN(t)) return false;\n  return Date.now() > t + 59999;\n}\nfunction todayAt(time) {\n  var now = new Date();\n  var m = String(now.getMonth() + 1).padStart(2, \"0\");\n  var d = String(now.getDate()).padStart(2, \"0\");\n  return now.getFullYear() + \"-\" + m + \"-\" + d + \"T\" + time;\n}\nvar DEFAULT_TITLE = \"赤松課長新居祝い　たこ焼きパーティー\";\nvar DEFAULT_DATE_VALUE = \"2026-11-29T15:00\";\nvar DEFAULT_DEADLINE = \"2026-11-27T23:59\";\nvar DEFAULT_DESC = \"赤松課長が社寮から新居に移ったので、\\nそのお祝いにかこつけてパーティーしましょう\\n\\n出欠確認させてください\";\n\n/* ===== API ===== */\nfunction api(action, args) {\n  return fetch(\"api/\" + action, {\n    method: \"POST\",\n    headers: { \"Content-Type\": \"application/json\" },\n    body: JSON.stringify(args || {})\n  }).then(function(r) {\n    return r.json().then(function(j) {\n      if (!r.ok) throw new Error(j && j.error ? j.error : \"request failed\");\n      return j;\n    });\n  });\n}\n\n/* ===== 端末ローカルのページ記録 ===== */\nvar MY_EVENTS_KEY = \"rsvp-my-event-ids\";\nfunction loadMyEventIds() {\n  try {\n    var raw = localStorage.getItem(MY_EVENTS_KEY);\n    var parsed = raw ? JSON.parse(raw) : [];\n    return Array.isArray(parsed) ? parsed.filter(function(x){ return typeof x === \"number\"; }) : [];\n  } catch (e) { return []; }\n}\nfunction rememberEventId(id) {\n  try {\n    var ids = loadMyEventIds();\n    if (!ids.includes(id)) localStorage.setItem(MY_EVENTS_KEY, JSON.stringify([id].concat(ids)));\n  } catch (e) {}\n}\nfunction forgetEventId(id) {\n  try {\n    localStorage.setItem(MY_EVENTS_KEY, JSON.stringify(loadMyEventIds().filter(function(x){ return x !== id; })));\n  } catch (e) {}\n}\n\n/* ===== ルーティング ===== */\nvar view = { kind: \"home\" };\nvar summaryPasscodes = {}; /* eventId -> passcode（画面遷移内のみ保持） */\nfunction parseHashView() {\n  var m = window.location.hash.match(/^#\\/(survey|summary)\\/(\\d+)$/);\n  if (m) return { kind: m[1], eventId: Number(m[2]) };\n  return { kind: \"home\" };\n}\nfunction hashForView(v) { return v.kind === \"home\" ? \"#/\" : \"#/\" + v.kind + \"/\" + v.eventId; }\nfunction go(v) {\n  view = v;\n  var target = hashForView(v);\n  if (window.location.hash !== target) window.location.hash = target;\n  render();\n}\nwindow.addEventListener(\"hashchange\", function() {\n  var parsed = parseHashView();\n  if (parsed.kind === \"home\" && view.kind === \"home\") return;\n  if (parsed.kind !== \"home\" && view.kind === parsed.kind && view.eventId === parsed.eventId) return;\n  view = parsed;\n  render();\n});\nfunction setTheme(t) { document.getElementById(\"approot\").className = \"theme-\" + t; }\nfunction appEl() { return document.getElementById(\"app\"); }\nfunction loadingHtml() { return '<p class=\"center dim\" style=\"padding:2.5rem 0\">読み込み中…</p>'; }\nfunction notFoundHtml(backView) {\n  return '<div class=\"center\" style=\"padding:2.5rem 0\"><p>ページが見つかりませんでした。</p>' +\n    '<button type=\"button\" class=\"btn btn-plain btn-sub\" style=\"margin-top:1rem;width:auto;padding:.5rem 1rem\" data-act=\"go-home\">トップに戻る</button></div>';\n}\ndocument.addEventListener(\"click\", function(e) {\n  var t = e.target.closest(\"[data-act='go-home']\");\n  if (t) go({ kind: \"home\" });\n});\n/* ===== ホーム（作成・編集・端末内一覧） ===== */\nvar homeState = null;\nfunction freshHomeState() {\n  return {\n    editingId: null, title: DEFAULT_TITLE, mode: \"single\", theme: \"orange\",\n    dates: [{ dateValue: DEFAULT_DATE_VALUE, label: \"\" }],\n    deadline: DEFAULT_DEADLINE, place: \"\", description: DEFAULT_DESC,\n    passcode: \"\", currentPasscode: \"\", authError: null, createError: false, submitting: false,\n    myIds: loadMyEventIds(), myEvents: [], myLoaded: false,\n    unlockTarget: null, unlockPasscode: \"\", unlockError: false,\n    deleteTarget: null, deletePasscode: \"\", deleteError: false,\n    openId: \"\", openPasscode: \"\", openError: null\n  };\n}\nfunction renderHome() {\n  if (!homeState) homeState = freshHomeState();\n  var s = homeState;\n  setTheme(s.theme);\n  if (!s.myLoaded) {\n    s.myLoaded = true;\n    appEl().innerHTML = homeHtml();\n    bindHome();\n    s.myIds.forEach(function(id) {\n      api(\"getEventDetail\", { eventId: id }).then(function(res) {\n        if (!res.event) {\n          forgetEventId(id);\n          s.myIds = s.myIds.filter(function(x){ return x !== id; });\n        } else {\n          s.myEvents.push(Object.assign({}, res.event, { hasPasscode: res.hasPasscode }));\n        }\n        if (view.kind === \"home\") { appEl().innerHTML = homeHtml(); bindHome(); }\n      }).catch(function() {});\n    });\n    return;\n  }\n  appEl().innerHTML = homeHtml();\n  bindHome();\n}\nfunction homeCanSubmit(s) {\n  var firstPicked = ((s.dates[0] && s.dates[0].dateValue) || (s.dates[0] && s.dates[0].label) || \"\") !== \"\";\n  var allPicked = s.dates.every(function(d){ return d.dateValue !== \"\" || d.label !== \"\"; });\n  return s.title.trim().length > 0 && PASSCODE_RE.test(s.passcode) && s.deadline.trim().length > 0 &&\n    firstPicked && allPicked && !s.submitting;\n}\nfunction homeHtml() {\n  var s = homeState;\n  var modeOptions = [\n    { value: \"single\", label: \"1日だけ開催\", note: \"日時を1つ決めて出欠を取る\" },\n    { value: \"multi\", label: \"複数日開催\", note: \"全部の日程で開催する。各日ごとに出欠を取る\" },\n    { value: \"vote\", label: \"候補日から開催日を決める\", note: \"候補日を複数出し、来れる人数が多い日を集計で決める\" }\n  ];\n  var h = \"\";\n  h += '<section aria-label=\"出欠ページを作る\"><h2>' + (s.editingId ? \"ページを編集する\" : \"出欠確認ページを作る\") + \"</h2>\" +\n    '<p class=\"mt1 small dim\">タイトル・時・所・内容と管理用パスコードを入れるだけで、下のような回答ページと集計ページができます。</p>';\n  h += '<div class=\"card mt5 stack4\">';\n  /* タイトル */\n  h += '<div><label class=\"flabel\" for=\"f-title\">タイトル</label>' +\n    '<input type=\"text\" id=\"f-title\" value=\"' + esc(s.title) + '\" placeholder=\"例：○○祝い たこ焼きパーティー\"></div>';\n  /* 開催パターン */\n  h += '<fieldset><legend>開催パターン</legend><div class=\"mt1 stack2\" role=\"radiogroup\" aria-label=\"開催パターン\">';\n  modeOptions.forEach(function(opt) {\n    h += '<label class=\"opt-card' + (s.mode === opt.value ? \" checked\" : \"\") + '\">' +\n      '<input type=\"radio\" name=\"mode\" value=\"' + opt.value + '\"' + (s.mode === opt.value ? \" checked\" : \"\") + '>' +\n      '<span><span style=\"display:block;font-weight:700\">' + opt.label + '</span>' +\n      '<span class=\"small dim\" style=\"display:block\">' + opt.note + \"</span></span></label>\";\n  });\n  h += \"</div></fieldset>\";\n  /* 色 */\n  h += '<fieldset><legend>ページの色</legend><div class=\"mt2 flex\" style=\"flex-wrap:wrap\" role=\"radiogroup\" aria-label=\"ページの色\">';\n  THEME_OPTIONS.forEach(function(opt) {\n    h += '<label class=\"theme-opt' + (s.theme === opt.value ? \" checked\" : \"\") + '\">' +\n      '<input type=\"radio\" name=\"theme\" value=\"' + opt.value + '\"' + (s.theme === opt.value ? \" checked\" : \"\") + ' style=\"position:absolute;opacity:0\">' +\n      '<span class=\"swatch\" style=\"background-color:' + opt.swatch + '\"></span>' + opt.label + \"</label>\";\n  });\n  h += '</div><p class=\"mt1 small dim\">選ぶと画面全体がその色でプレビューされます。回答ページ・集計ページに適用されます。</p></fieldset>';\n  /* 日時 */\n  h += '<div><span class=\"flabel\">' + (s.mode === \"vote\" ? \"候補日時\" : \"時\") + '</span><div class=\"mt1 stack3\">';\n  s.dates.forEach(function(d, i) {\n    h += '<div style=\"border:1px solid var(--border);border-radius:.75rem;padding:.75rem\">' +\n      '<div class=\"row-between\"><label class=\"small\" style=\"font-weight:700\" for=\"f-date-' + i + '\">' +\n      (s.mode === \"single\" ? \"日時\" : \"日時 \" + (i + 1)) + \"</label>\" +\n      (i > 0 ? '<button type=\"button\" class=\"linklike\" data-act=\"del-date\" data-i=\"' + i + '\">削除</button>' : \"\") + \"</div>\" +\n      (d.dateValue === \"\" && d.label !== \"\" ? '<p class=\"mt1 small dim\">現在：' + esc(d.label) + \"（カレンダーで選び直すと置き換わります）</p>\" : \"\") +\n      '<input type=\"datetime-local\" id=\"f-date-' + i + '\" data-i=\"' + i + '\" value=\"' + esc(d.dateValue) + '\">' +\n      (d.dateValue ? '<p class=\"mt1 small\" style=\"font-weight:700;color:var(--accent)\" id=\"f-date-label-' + i + '\">' + formatDateLabel(d.dateValue) + \"</p>\" : \"\") +\n      \"</div>\";\n  });\n  h += \"</div>\";\n  var firstPicked = ((s.dates[0] && s.dates[0].dateValue) || (s.dates[0] && s.dates[0].label) || \"\") !== \"\";\n  if (s.mode !== \"single\" && firstPicked && s.dates.length < MAX_DATES) {\n    h += '<button type=\"button\" class=\"btn btn-plain mt3\" style=\"border:2px dashed var(--accent);color:var(--accent);font-weight:700\" data-act=\"add-date\">＋ 日時を追加（あと' + (MAX_DATES - s.dates.length) + \"件まで）</button>\";\n  }\n  if (s.mode !== \"single\" && s.dates.length >= MAX_DATES) h += '<p class=\"mt2 small dim\">日時は最大' + MAX_DATES + \"件までです。</p>\";\n  if (s.mode !== \"single\" && !firstPicked) h += '<p class=\"mt2 small dim\">まず日時 1 をカレンダーで選ぶと、ここに「日時を追加」が出ます。</p>';\n  h += \"</div>\";\n  /* 回答期限 */\n  h += '<div><label class=\"flabel\" for=\"f-deadline\">回答期限</label>' +\n    '<input type=\"datetime-local\" id=\"f-deadline\" value=\"' + esc(s.deadline) + '\">' +\n    (s.deadline ? '<p class=\"mt1 small\" style=\"font-weight:700;color:var(--accent)\" id=\"f-deadline-label\">' + formatDateLabel(s.deadline) + \" まで</p>\" : \"\") +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">日付を選ぶと、その日の23:59が期限になります。期限を過ぎて届いた回答は、通常の集計には入らず「期限切れプール」に分けて受け付けます。回答ページにも期限が表示されます。</p></div>';\n  /* 所・内容 */\n  h += '<div><label class=\"flabel\" for=\"f-place\">所</label>' +\n    '<input type=\"text\" id=\"f-place\" value=\"' + esc(s.place) + '\" placeholder=\"未定のままでもOK（ページでは「未定」と出ます）\"></div>';\n  h += '<div><label class=\"flabel\" for=\"f-desc\">内容</label>' +\n    '<textarea id=\"f-desc\" rows=\"5\" placeholder=\"当日の案内や持ち物などを自由に\">' + esc(s.description) + \"</textarea></div>\";\n  /* パスコード */\n  h += '<div><label class=\"flabel\" for=\"f-pass\">管理用パスコード（4桁の数字）</label>' +\n    '<input type=\"text\" id=\"f-pass\" class=\"passinput\" value=\"' + esc(s.passcode) + '\" placeholder=\"' +\n    (s.editingId ? \"新しいパスコード（変えない場合も今のものを入力）\" : \"例：1234\") + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\">' +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">集計ページを見たり、このページを編集・削除するときに必要です。回答する人には不要なので、配るときはパスコードを伝えないでください。</p>' +\n    (s.passcode.length > 0 && !PASSCODE_RE.test(s.passcode) ? '<p class=\"mt1 err\">パスコードは4桁の数字で入力してください。</p>' : \"\") +\n    \"</div>\";\n  if (s.authError) h += '<p class=\"err\" role=\"alert\">' + esc(s.authError) + \"</p>\";\n  if (s.createError) h += '<p class=\"err\" role=\"alert\">作成に失敗しました。もう一度お試しください。</p>';\n  h += '<button type=\"button\" class=\"btn\" data-act=\"submit-form\"' + (homeCanSubmit(s) ? \"\" : \" disabled\") + \">\" +\n    (s.submitting ? \"作成中…\" : s.editingId ? \"変更を保存してページを見る\" : \"出欠ページを作成する\") + \"</button>\";\n  if (s.editingId) h += '<button type=\"button\" class=\"btn btn-plain btn-sub\" data-act=\"cancel-edit\">編集をやめる</button>';\n  h += \"</div></section>\";\n  /* 端末内一覧 */\n  h += '<section aria-label=\"この端末で作ったページ\" class=\"mt10\"><h3>この端末で作ったページ</h3>' +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">公開用の一覧は表示されません。ここには、この端末で作ったページと、パスコードで開いたページだけが出ます。</p>';\n  if (s.myIds.length === 0) {\n    h += '<p class=\"mt3 small dim\" style=\"border:1px dashed var(--border);background:var(--surface);border-radius:.75rem;padding:1rem;line-height:1.6\">この端末で作ったページはまだありません。上のフォームから作ると、ここに表示されます。別の端末で作ったページは、下の「ページ番号で開く」から追加できます。</p>';\n  }\n  h += '<div class=\"mt3 stack3\">';\n  s.myEvents.forEach(function(ev) { h += myEventCardHtml(ev); });\n  h += \"</div>\";\n  /* ページ番号で開く */\n  h += '<div class=\"card mt4\"><h4 style=\"font-size:1rem\">ページ番号で開く</h4>' +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">別の端末で作ったページは、ページ番号とパスコードでこの端末のリストに追加できます。ページ番号は集計ページのタイトル下に表示されています。</p>' +\n    '<div class=\"mt3 flex\">' +\n    '<div style=\"width:6rem\" class=\"shrink0\"><input type=\"text\" id=\"open-id\" value=\"' + esc(s.openId) + '\" inputmode=\"numeric\" autocomplete=\"off\" placeholder=\"番号\" style=\"margin-top:0\"></div>' +\n    '<div class=\"grow\"><input type=\"text\" id=\"open-pass\" class=\"passinput\" value=\"' + esc(s.openPasscode) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"パスコード（4桁）\" style=\"margin-top:0\"></div>' +\n    '<button type=\"button\" class=\"btn shrink0\" style=\"width:auto;padding:.5rem 1rem;font-size:1rem\" data-act=\"open-by-num\"' + (s.openId.trim() === \"\" ? \" disabled\" : \"\") + \">開く</button>\" +\n    \"</div>\" +\n    (s.openError ? '<p class=\"mt2 err\" role=\"alert\">' + esc(s.openError) + \"</p>\" : \"\") +\n    \"</div></section>\";\n  return h;\n}\nfunction myEventCardHtml(ev) {\n  var s = homeState;\n  var h = '<article class=\"card\"><h4 style=\"font-size:1.125rem;line-height:1.4\">' + esc(ev.title) + \"</h4>\" +\n    '<p class=\"mt1 small dim\"><span style=\"margin-right:.5rem\" class=\"xsmall\"><b>ページ番号 #' + ev.id + '</b></span>' +\n    '<span class=\"chip\" style=\"margin-right:.5rem\">' + MODE_LABEL[ev.mode] + \"</span>\" +\n    '<span class=\"swatch\" style=\"width:.875rem;height:.875rem;vertical-align:middle;background-color:' + themeSwatch(ev.theme) + '\"></span> ' + themeLabel(ev.theme) + \"　\" +\n    (ev.dates.length > 0 ? ev.dates.map(function(d){ return d.label; }).join(\"、\") : (ev.eventTime || \"日時未定\")) +\n    (ev.place ? \"　／　\" + esc(ev.place) : \"　／　場所未定\") +\n    (ev.deadline ? \"　／　回答期限 \" + formatDateLabel(ev.deadline) + \"まで\" : \"\") + \"</p>\" +\n    '<div class=\"grid2 mt3\">' +\n    '<button type=\"button\" class=\"btn btn-sub\" data-act=\"card-survey\" data-id=\"' + ev.id + '\">回答ページ</button>' +\n    '<button type=\"button\" class=\"btn btn-outline btn-sub\" data-act=\"card-summary\" data-id=\"' + ev.id + '\">集計を見る' + (ev.hasPasscode ? \" 🔒\" : \"\") + \"</button>\" +\n    '<button type=\"button\" class=\"btn btn-plain btn-sub\" style=\"font-size:.875rem\" data-act=\"card-edit\" data-id=\"' + ev.id + '\">編集' + (ev.hasPasscode ? \" 🔒\" : \"\") + \"</button>\" +\n    '<button type=\"button\" class=\"btn btn-plain btn-sub\" style=\"font-size:.875rem;color:var(--dim)\" data-act=\"card-delete\" data-id=\"' + ev.id + '\">削除' + (ev.hasPasscode ? \" 🔒\" : \"\") + \"</button>\" +\n    \"</div>\";\n  if (s.unlockTarget === ev.id) {\n    h += '<div class=\"card-alt mt3\"><label class=\"small\" style=\"font-weight:700\" for=\"unlock-' + ev.id + '\">編集するにはパスコード（4桁）を入力してください</label>' +\n      '<div class=\"mt2 flex\"><input type=\"text\" id=\"unlock-' + ev.id + '\" class=\"passinput\" value=\"' + esc(s.unlockPasscode) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"1234\" style=\"margin-top:0\">' +\n      '<button type=\"button\" class=\"btn shrink0\" style=\"width:auto;padding:.5rem 1rem;font-size:1rem\" data-act=\"unlock-go\" data-id=\"' + ev.id + '\"' + (PASSCODE_RE.test(s.unlockPasscode) ? \"\" : \" disabled\") + \">開く</button>\" +\n      '<button type=\"button\" class=\"btn btn-plain btn-sub shrink0\" style=\"width:auto\" data-act=\"unlock-cancel\">やめる</button></div>' +\n      (s.unlockError ? '<p class=\"mt2 err\" role=\"alert\">パスコードが違います。</p>' : \"\") + \"</div>\";\n  }\n  if (s.deleteTarget === ev.id) {\n    h += '<div class=\"card-alt mt3\"><p class=\"small\" style=\"font-weight:700\">このページと回答をすべて削除します。元に戻せません。</p>';\n    if (ev.hasPasscode) {\n      h += '<div class=\"mt2\"><label class=\"small\" style=\"font-weight:700\" for=\"del-' + ev.id + '\">パスコード（4桁）</label>' +\n        '<input type=\"text\" id=\"del-' + ev.id + '\" class=\"passinput\" value=\"' + esc(s.deletePasscode) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"1234\"></div>';\n    }\n    if (s.deleteError) h += '<p class=\"mt2 err\" role=\"alert\">パスコードが違います。削除できませんでした。</p>';\n    h += '<div class=\"mt2 flex\">' +\n      '<button type=\"button\" class=\"btn btn-danger btn-sub shrink0\" style=\"width:auto;padding:.5rem 1rem;font-size:.875rem\" data-act=\"delete-go\" data-id=\"' + ev.id + '\"' + ((ev.hasPasscode && !PASSCODE_RE.test(s.deletePasscode)) ? \" disabled\" : \"\") + \">本当に削除する</button>\" +\n      '<button type=\"button\" class=\"btn btn-plain btn-sub shrink0\" style=\"width:auto\" data-act=\"delete-cancel\">やめる</button></div></div>';\n  }\n  h += \"</article>\";\n  return h;\n}\nfunction refreshHome() { if (view.kind === \"home\") { appEl().innerHTML = homeHtml(); bindHome(); } }\nfunction bindHome() {\n  var s = homeState;\n  var el;\n  el = document.getElementById(\"f-title\");\n  if (el) el.addEventListener(\"input\", function() { s.title = el.value; refreshSubmitBtn(); });\n  document.querySelectorAll(\"input[name='mode']\").forEach(function(r) {\n    r.addEventListener(\"change\", function() {\n      s.mode = r.value;\n      if (s.mode === \"single\") s.dates = s.dates.slice(0, 1);\n      refreshHome();\n    });\n  });\n  document.querySelectorAll(\"input[name='theme']\").forEach(function(r) {\n    r.addEventListener(\"change\", function() { s.theme = r.value; setTheme(s.theme); refreshHome(); });\n  });\n  s.dates.forEach(function(d, i) {\n    var inp = document.getElementById(\"f-date-\" + i);\n    if (!inp) return;\n    inp.addEventListener(\"focus\", function() {\n      if (!inp.value && !d.label) { inp.value = todayAt(\"12:00\"); s.dates[i] = { dateValue: inp.value, label: \"\" }; refreshHome(); refocusDate(i); }\n    });\n    inp.addEventListener(\"change\", function() {\n      s.dates[i] = { dateValue: inp.value, label: \"\" };\n      refreshHome();\n    });\n  });\n  el = document.getElementById(\"f-deadline\");\n  if (el) {\n    el.addEventListener(\"focus\", function() { if (!el.value) { el.value = todayAt(\"23:59\"); s.deadline = el.value; refreshHome(); } });\n    el.addEventListener(\"change\", function() {\n      var v = el.value;\n      if (v.length >= 10 && v.slice(0, 10) !== s.deadline.slice(0, 10)) s.deadline = v.slice(0, 10) + \"T23:59\";\n      else s.deadline = v;\n      refreshHome();\n    });\n  }\n  el = document.getElementById(\"f-place\");\n  if (el) el.addEventListener(\"input\", function() { s.place = el.value; });\n  el = document.getElementById(\"f-desc\");\n  if (el) el.addEventListener(\"input\", function() { s.description = el.value; });\n  el = document.getElementById(\"f-pass\");\n  if (el) el.addEventListener(\"input\", function() {\n    s.passcode = el.value.replace(/\\D/g, \"\").slice(0, 4);\n    if (el.value !== s.passcode) el.value = s.passcode;\n    refreshHomeSoft();\n  });\n  el = document.getElementById(\"open-id\");\n  if (el) el.addEventListener(\"input\", function() { s.openId = el.value.replace(/\\D/g, \"\").slice(0, 9); if (el.value !== s.openId) el.value = s.openId; refreshHomeSoft(); });\n  el = document.getElementById(\"open-pass\");\n  if (el) el.addEventListener(\"input\", function() { s.openPasscode = el.value.replace(/\\D/g, \"\").slice(0, 4); if (el.value !== s.openPasscode) el.value = s.openPasscode; });\n  document.querySelectorAll(\"[data-act]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() { homeAction(b.getAttribute(\"data-act\"), b); });\n  });\n  var unlockInp = s.unlockTarget ? document.getElementById(\"unlock-\" + s.unlockTarget) : null;\n  if (unlockInp) unlockInp.addEventListener(\"input\", function() {\n    s.unlockPasscode = unlockInp.value.replace(/\\D/g, \"\").slice(0, 4);\n    if (unlockInp.value !== s.unlockPasscode) unlockInp.value = s.unlockPasscode;\n    refreshHomeSoft();\n  });\n  var delInp = s.deleteTarget ? document.getElementById(\"del-\" + s.deleteTarget) : null;\n  if (delInp) delInp.addEventListener(\"input\", function() {\n    s.deletePasscode = delInp.value.replace(/\\D/g, \"\").slice(0, 4);\n    if (delInp.value !== s.deletePasscode) delInp.value = s.deletePasscode;\n    refreshHomeSoft();\n  });\n}\nfunction refocusDate(i) { var n = document.getElementById(\"f-date-\" + i); if (n) { n.focus(); try { n.showPicker(); } catch (e) {} } }\n/* フォーカスを奪わず、ボタンの有効/無効だけ更新する */\nfunction refreshSubmitBtn() {\n  var s = homeState; if (!s) return;\n  var btn = document.querySelector(\"[data-act='submit-form']\");\n  if (btn) btn.disabled = !homeCanSubmit(s);\n}\nfunction refreshHomeSoft() { refreshSubmitBtn();\n  var s = homeState;\n  var ob = document.querySelector(\"[data-act='open-by-num']\");\n  if (ob) ob.disabled = s.openId.trim() === \"\";\n  var ub = document.querySelector(\"[data-act='unlock-go']\");\n  if (ub) ub.disabled = !PASSCODE_RE.test(s.unlockPasscode);\n  var db = document.querySelector(\"[data-act='delete-go']\");\n  if (db) { var ev = s.myEvents.find(function(x){ return x.id === s.deleteTarget; }); if (ev) db.disabled = ev.hasPasscode && !PASSCODE_RE.test(s.deletePasscode); }\n}\nfunction homeAction(act, b) {\n  var s = homeState;\n  var id = b.getAttribute(\"data-id\") ? Number(b.getAttribute(\"data-id\")) : null;\n  if (act === \"add-date\") { s.dates.push({ dateValue: todayAt(\"12:00\"), label: \"\" }); refreshHome(); }\n  else if (act === \"del-date\") { s.dates.splice(Number(b.getAttribute(\"data-i\")), 1); refreshHome(); }\n  else if (act === \"submit-form\") { submitHomeForm(); }\n  else if (act === \"cancel-edit\") { var keep = { myIds: s.myIds, myEvents: s.myEvents, myLoaded: true }; homeState = freshHomeState(); homeState.myIds = keep.myIds; homeState.myEvents = keep.myEvents; homeState.myLoaded = true; refreshHome(); }\n  else if (act === \"card-survey\") { go({ kind: \"survey\", eventId: id }); }\n  else if (act === \"card-summary\") { go({ kind: \"summary\", eventId: id }); }\n  else if (act === \"card-edit\") {\n    s.deleteTarget = null;\n    var ev = s.myEvents.find(function(x){ return x.id === id; });\n    if (!ev) return;\n    if (!ev.hasPasscode) beginEdit(ev, \"\");\n    else { s.unlockTarget = id; s.unlockPasscode = \"\"; s.unlockError = false; refreshHome(); }\n  }\n  else if (act === \"unlock-cancel\") { s.unlockTarget = null; refreshHome(); }\n  else if (act === \"unlock-go\") {\n    api(\"verifyPasscode\", { eventId: id, passcode: s.unlockPasscode }).then(function(res) {\n      if (!res.ok) { s.unlockError = true; refreshHome(); return; }\n      var ev = s.myEvents.find(function(x){ return x.id === id; });\n      var pc = s.unlockPasscode;\n      rememberEventId(id);\n      s.unlockTarget = null; s.unlockPasscode = \"\"; s.unlockError = false;\n      if (ev) beginEdit(ev, pc);\n    }).catch(function() { s.unlockError = true; refreshHome(); });\n  }\n  else if (act === \"card-delete\") { s.unlockTarget = null; s.deleteTarget = id; s.deletePasscode = \"\"; s.deleteError = false; refreshHome(); }\n  else if (act === \"delete-cancel\") { s.deleteTarget = null; refreshHome(); }\n  else if (act === \"delete-go\") {\n    api(\"deleteEvent\", { id: id, passcode: s.deletePasscode }).then(function(res) {\n      if (!res.ok) { s.deleteError = true; refreshHome(); return; }\n      s.deleteTarget = null; s.deletePasscode = \"\"; s.deleteError = false;\n      forgetEventId(id);\n      s.myIds = s.myIds.filter(function(x){ return x !== id; });\n      s.myEvents = s.myEvents.filter(function(x){ return x.id !== id; });\n      refreshHome();\n    }).catch(function() { s.deleteError = true; refreshHome(); });\n  }\n  else if (act === \"open-by-num\") {\n    var numId = Number(s.openId);\n    Promise.all([\n      api(\"getEventDetail\", { eventId: numId }),\n      api(\"verifyPasscode\", { eventId: numId, passcode: s.openPasscode })\n    ]).then(function(rs) {\n      var detail = rs[0], verify = rs[1];\n      if (!detail.event) { s.openError = \"そのページ番号のページは見つかりませんでした。\"; refreshHome(); return; }\n      if (!verify.ok) { s.openError = \"パスコードが違います。\"; refreshHome(); return; }\n      s.openError = null; s.openId = \"\"; s.openPasscode = \"\";\n      rememberEventId(numId);\n      if (!s.myIds.includes(numId)) s.myIds = [numId].concat(s.myIds);\n      if (!s.myEvents.some(function(x){ return x.id === numId; }))\n        s.myEvents = [Object.assign({}, detail.event, { hasPasscode: detail.hasPasscode })].concat(s.myEvents);\n      refreshHome();\n    }).catch(function() { s.openError = \"開けませんでした。もう一度お試しください。\"; refreshHome(); });\n  }\n}\nfunction beginEdit(ev, pc) {\n  var s = homeState;\n  s.editingId = ev.id;\n  s.currentPasscode = pc;\n  s.title = ev.title; s.mode = ev.mode; s.theme = ev.theme;\n  s.dates = ev.dates.length > 0\n    ? ev.dates.map(function(d){ return { dateValue: d.dateValue, label: d.label }; })\n    : [{ dateValue: \"\", label: ev.eventTime }];\n  s.deadline = ev.deadline || \"\";\n  s.place = ev.place; s.description = ev.description;\n  s.passcode = \"\"; s.authError = null;\n  setTheme(ev.theme);\n  refreshHome();\n  window.scrollTo({ top: 0, behavior: \"smooth\" });\n}\nfunction submitHomeForm() {\n  var s = homeState;\n  if (!homeCanSubmit(s)) return;\n  s.submitting = true; s.createError = false; refreshHome();\n  var done = function() { s.submitting = false; };\n  if (s.editingId) {\n    api(\"updateEvent\", {\n      id: s.editingId, currentPasscode: s.currentPasscode,\n      title: s.title, mode: s.mode, theme: s.theme,\n      dates: s.dates.map(function(d){ return { dateValue: d.dateValue, label: d.label }; }),\n      place: s.place, description: s.description, deadline: s.deadline, passcode: s.passcode\n    }).then(function(res) {\n      done();\n      if (!res.ok) { s.authError = \"パスコードが違います。編集は開けていても、保存には今のパスコードの認証が必要です。\"; refreshHome(); return; }\n      var id = s.editingId, pc = s.passcode;\n      summaryPasscodes[id] = pc;\n      /* 一覧の表示も更新する */\n      api(\"getEventDetail\", { eventId: id }).then(function(d) {\n        if (d.event) {\n          s.myEvents = s.myEvents.map(function(x){ return x.id === id ? Object.assign({}, d.event, { hasPasscode: d.hasPasscode }) : x; });\n        }\n        go({ kind: \"summary\", eventId: id });\n      }).catch(function() { go({ kind: \"summary\", eventId: id }); });\n    }).catch(function() { done(); s.createError = true; refreshHome(); });\n  } else {\n    api(\"createEvent\", {\n      title: s.title, mode: s.mode, theme: s.theme,\n      dates: s.dates.filter(function(d){ return d.dateValue; }).map(function(d){ return { dateValue: d.dateValue }; }),\n      place: s.place, description: s.description, deadline: s.deadline, passcode: s.passcode\n    }).then(function(res) {\n      done();\n      rememberEventId(res.event.id);\n      if (!s.myIds.includes(res.event.id)) s.myIds = [res.event.id].concat(s.myIds);\n      s.myEvents = [Object.assign({}, res.event, { hasPasscode: true })].concat(s.myEvents);\n      s.passcode = \"\";\n      go({ kind: \"survey\", eventId: res.event.id, created: true });\n    }).catch(function() { done(); s.createError = true; refreshHome(); });\n  }\n}\n/* ===== 回答ページ ===== */\nvar surveyState = null;\nfunction renderSurvey(eventId, created) {\n  appEl().innerHTML = loadingHtml();\n  api(\"getEventDetail\", { eventId: eventId }).then(function(res) {\n    if (view.kind !== \"survey\" || view.eventId !== eventId) return;\n    if (!res.event) { appEl().innerHTML = notFoundHtml(); return; }\n    surveyState = { ev: res.event, name: \"\", answers: {}, sentName: null, sentExpired: false, error: false, sending: false, created: !!created };\n    setTheme(res.event.theme);\n    drawSurvey();\n  }).catch(function() {\n    if (view.kind === \"survey\") appEl().innerHTML = notFoundHtml();\n  });\n}\nfunction surveyLabels(ev) {\n  return ev.mode === \"vote\"\n    ? { join: \"参加できます\", absent: \"参加できません\", late: \"遅れて参加できます\" }\n    : { join: \"参加\", absent: \"不参加\", late: \"遅れていきます\" };\n}\nfunction drawSurvey() {\n  var st = surveyState, ev = st.ev;\n  var isVote = ev.mode === \"vote\";\n  var labels = surveyLabels(ev);\n  var deadlinePassed = ev.deadline ? isPastDeadline(ev.deadline) : false;\n  var h = '<div style=\"padding-bottom:2.5rem;position:relative\">';\n  h += '<button type=\"button\" class=\"linklike\" data-sact=\"top\">← トップ</button>';\n  if (st.created) {\n    h += '<div class=\"banner mt3\" role=\"status\"><p style=\"font-weight:700\">ページを作成しました！</p>' +\n      '<p class=\"mt1 small\" style=\"line-height:1.6\">このページが、あなたの出欠確認ページ専用のリンクです。一覧には表示されないので、<b>このページをブックマークしてください。</b></p>' +\n      '<p class=\"mt2 small\" style=\"background:var(--surface);border-radius:.75rem;padding:.5rem .75rem;font-weight:700;word-break:break-all\">専用リンク：#/survey/' + ev.id + \"</p>\" +\n      '<p class=\"mt1 xsmall dim\" style=\"line-height:1.6\">アドレスの末尾がこの形になっていれば、そのページ専用のリンクです。回答を集めるときは、このページのアドレスをそのまま参加者に送ってください。</p>' +\n      '<p class=\"mt1 small dim\" style=\"line-height:1.6\">集計を見るときは、このページ右下の「集計を見る」から、作成時に決めたパスコードで開けます。</p></div>';\n  }\n  h += '<header class=\"mt3\"><h2 style=\"font-size:1.75rem\">' + esc(ev.title) + '</h2><dl class=\"info mt4\">';\n  h += '<div class=\"row\"><dt>時</dt><dd>';\n  if (ev.dates.length > 0) {\n    h += \"<ul style='margin:0;padding:0;list-style:none'>\";\n    ev.dates.forEach(function(d) { h += \"<li>\" + esc(d.label) + \"</li>\"; });\n    h += \"</ul>\";\n  } else h += esc(ev.eventTime || \"未定\");\n  if (ev.mode === \"multi\") h += '<span class=\"small dim\" style=\"display:block;margin-top:.25rem\">全部の日程で開催します。各日ごとに出欠を教えてください。</span>';\n  if (isVote) h += '<span class=\"small dim\" style=\"display:block;margin-top:.25rem\">候補日です。来れる人数が多い日に開催します。各日ごとに都合を教えてください。</span>';\n  h += \"</dd></div>\";\n  h += '<div class=\"row\"><dt>所</dt><dd>' + esc(ev.place || \"未定\") + \"</dd></div>\";\n  if (ev.deadline) {\n    h += '<div class=\"row\"><dt>期限</dt><dd>回答期限：' + formatDateLabel(ev.deadline) + \"まで\" +\n      (deadlinePassed ? '<span class=\"small\" style=\"display:block;margin-top:.25rem;font-weight:700;color:var(--amber)\">期限を過ぎています。今から送信すると「期限切れ」として別枠で受け付けます。</span>' : \"\") +\n      \"</dd></div>\";\n  }\n  if (ev.description) h += '<dd class=\"prewrap\" style=\"padding-top:.25rem;line-height:1.6\">' + esc(ev.description) + \"</dd>\";\n  h += \"</dl></header>\";\n  if (st.sentName) {\n    h += '<div class=\"sent-box mt6\" role=\"status\"><p style=\"font-size:2.25rem\">🎉</p>' +\n      '<p class=\"mt2\" style=\"font-size:1.25rem;font-weight:700\">送信しました！</p>' +\n      '<p class=\"mt1 dim\">' + esc(st.sentName) + \" さん、回答ありがとうございます。</p>\" +\n      (st.sentExpired ? '<p class=\"mt2 small\" style=\"background:var(--amber-bg);border-radius:.75rem;padding:.5rem .75rem;font-weight:700;color:var(--amber)\">回答期限を過ぎていたため、「期限切れ」として別枠で受け付けました。通常の集計には入りません。</p>' : \"\") +\n      '<button type=\"button\" class=\"btn btn-plain mt4\" data-sact=\"again\">もう1人分を回答する</button></div>';\n  } else {\n    h += '<form class=\"mt6\" id=\"survey-form\"><div><label class=\"flabel\" for=\"r-name\" style=\"font-size:1.125rem\">名前</label>' +\n      '<input type=\"text\" id=\"r-name\" value=\"' + esc(st.name) + '\" placeholder=\"お名前を入力してください\" autocomplete=\"name\" style=\"padding:.75rem;font-size:1.125rem\"></div>';\n    ev.dates.forEach(function(d, i) {\n      var a = st.answers[d.id] || { status: null, lateTime: \"16:00\" };\n      h += '<fieldset class=\"mt6\"><legend style=\"font-size:1.125rem\">' +\n        (ev.mode === \"single\" ? \"出欠\" : esc(d.label) + \" の\" + (isVote ? \"都合\" : \"出欠\")) +\n        (ev.mode !== \"single\" ? '<span class=\"small dim\" style=\"margin-left:.5rem;font-weight:400\">' + (i + 1) + \"件目</span>\" : \"\") +\n        \"</legend><div class='mt2 stack2' role='radiogroup' aria-label='出欠'>\";\n      var opts = [\n        { value: \"join\", color: \"#648a68\", bg: \"var(--green-bg)\" },\n        { value: \"absent\", color: \"#8d857a\", bg: \"var(--gray-bg)\" },\n        { value: \"late\", color: \"#9a7d4a\", bg: \"var(--amber-bg)\" }\n      ];\n      opts.forEach(function(opt) {\n        var checked = a.status === opt.value;\n        h += '<label class=\"att-opt\" data-date=\"' + d.id + '\" data-status=\"' + opt.value + '\" style=\"border-color:' + (checked ? opt.color : \"var(--border)\") + \";background:\" + (checked ? opt.bg : \"var(--surface)\") + '\">' +\n          '<span class=\"att-box\" style=\"border-color:' + (checked ? opt.color : \"var(--dim)\") + \";background:\" + (checked ? opt.color : \"transparent\") + '\">' + (checked ? \"✓\" : \"\") + \"</span>\" +\n          '<span style=\"font-size:1.125rem;font-weight:700\">' + labels[opt.value] + \"</span></label>\";\n      });\n      h += \"</div>\";\n      if (a.status === \"late\") {\n        h += '<div class=\"mt3\" style=\"background:var(--amber-bg);border-radius:.75rem;padding:1rem\">' +\n          '<label class=\"flabel\" for=\"r-late-' + d.id + '\">何時頃に着きますか？</label>' +\n          '<select id=\"r-late-' + d.id + '\" data-date=\"' + d.id + '\" style=\"padding:.75rem;font-size:1.125rem\">' +\n          LATE_TIMES.map(function(t) { return '<option value=\"' + t + '\"' + (a.lateTime === t ? \" selected\" : \"\") + \">\" + t + \"頃</option>\"; }).join(\"\") +\n          \"</select></div>\";\n      }\n      h += \"</fieldset>\";\n    });\n    if (st.error) h += '<p class=\"err mt3\" role=\"alert\">送信に失敗しました。もう一度お試しください。</p>';\n    var allAnswered = ev.dates.length > 0 && ev.dates.every(function(d){ return st.answers[d.id] && st.answers[d.id].status != null; });\n    var canSubmit = st.name.trim().length > 0 && allAnswered && !st.sending;\n    h += '<button type=\"submit\" class=\"btn mt6\" style=\"padding:1rem;font-size:1.25rem\"' + (canSubmit ? \"\" : \" disabled\") + \">\" +\n      (st.sending ? \"送信中…\" : deadlinePassed ? \"期限切れとして送信する\" : \"送信する\") + \"</button>\";\n    if (!canSubmit && !st.sending) {\n      h += '<p class=\"mt2 small dim center\">' + (ev.mode === \"single\" ? \"名前と出欠を選ぶと送信できます\" : \"名前と、すべての日時の回答を選ぶと送信できます\") + \"</p>\";\n    }\n    h += \"</form>\";\n  }\n  h += '<div class=\"mt10\" style=\"text-align:right\"><button type=\"button\" class=\"linklike\" style=\"font-size:.75rem\" data-sact=\"summary\">集計を見る</button></div>';\n  h += \"</div>\";\n  appEl().innerHTML = h;\n  bindSurvey();\n}\nfunction bindSurvey() {\n  var st = surveyState;\n  document.querySelectorAll(\"[data-sact]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() {\n      var act = b.getAttribute(\"data-sact\");\n      if (act === \"top\") go({ kind: \"home\" });\n      else if (act === \"summary\") go({ kind: \"summary\", eventId: st.ev.id });\n      else if (act === \"again\") { st.sentName = null; st.sentExpired = false; st.name = \"\"; st.answers = {}; drawSurvey(); }\n    });\n  });\n  var nameInp = document.getElementById(\"r-name\");\n  if (nameInp) nameInp.addEventListener(\"input\", function() { st.name = nameInp.value; drawSurveySoft(); });\n  document.querySelectorAll(\".att-opt\").forEach(function(l) {\n    l.addEventListener(\"click\", function() {\n      var dateId = Number(l.getAttribute(\"data-date\"));\n      var cur = st.answers[dateId] || { status: null, lateTime: \"16:00\" };\n      st.answers[dateId] = { status: l.getAttribute(\"data-status\"), lateTime: cur.lateTime };\n      drawSurvey();\n    });\n  });\n  document.querySelectorAll(\"select[data-date]\").forEach(function(sel) {\n    sel.addEventListener(\"change\", function() {\n      var dateId = Number(sel.getAttribute(\"data-date\"));\n      var cur = st.answers[dateId] || { status: null, lateTime: \"16:00\" };\n      st.answers[dateId] = { status: cur.status, lateTime: sel.value };\n    });\n  });\n  var form = document.getElementById(\"survey-form\");\n  if (form) form.addEventListener(\"submit\", function(e) {\n    e.preventDefault();\n    var ev = st.ev;\n    var allAnswered = ev.dates.every(function(d){ return st.answers[d.id] && st.answers[d.id].status != null; });\n    if (!(st.name.trim().length > 0 && allAnswered) || st.sending) return;\n    st.sending = true; st.error = false; drawSurvey();\n    api(\"submitResponse\", {\n      eventId: ev.id, name: st.name.trim(),\n      answers: ev.dates.map(function(d) {\n        var a = st.answers[d.id];\n        return { dateId: d.id, status: a.status, lateTime: a.status === \"late\" ? a.lateTime : null };\n      })\n    }).then(function(res) {\n      st.sending = false; st.sentName = st.name.trim(); st.sentExpired = res.expired;\n      drawSurvey();\n    }).catch(function() { st.sending = false; st.error = true; drawSurvey(); });\n  });\n}\nfunction drawSurveySoft() {\n  var st = surveyState; if (!st || st.sentName) return;\n  var ev = st.ev;\n  var allAnswered = ev.dates.length > 0 && ev.dates.every(function(d){ return st.answers[d.id] && st.answers[d.id].status != null; });\n  var btn = document.querySelector(\"#survey-form button[type='submit']\");\n  if (btn) btn.disabled = !(st.name.trim().length > 0 && allAnswered && !st.sending);\n}\n/* ===== 集計ページ ===== */\nvar summaryState = null;\nfunction renderSummary(eventId) {\n  var passcode = summaryPasscodes[eventId] != null ? summaryPasscodes[eventId] : null;\n  summaryState = { eventId: eventId, ev: null, responses: [], authorized: false, passcode: passcode, input: \"\", wrongPass: false, confirmId: null, loaded: false };\n  appEl().innerHTML = loadingHtml();\n  api(\"getEventDetail\", { eventId: eventId }).then(function(res) {\n    if (view.kind !== \"summary\" || view.eventId !== eventId) return;\n    if (!res.event) { appEl().innerHTML = notFoundHtml(); summaryState.loaded = true; return; }\n    summaryState.ev = res.event;\n    setTheme(res.event.theme);\n    if (passcode !== null) {\n      loadSummary();\n    } else {\n      summaryState.loaded = true;\n      drawSummary();\n    }\n  }).catch(function() { if (view.kind === \"summary\") appEl().innerHTML = notFoundHtml(); });\n}\nfunction loadSummary() {\n  var st = summaryState;\n  api(\"getSummary\", { eventId: st.eventId, passcode: st.passcode || \"\" }).then(function(res) {\n    if (view.kind !== \"summary\" || view.eventId !== st.eventId) return;\n    st.loaded = true;\n    st.authorized = res.authorized === true;\n    if (res.event) st.ev = res.event;\n    st.responses = res.responses || [];\n    if (st.authorized) rememberEventId(st.eventId);\n    else if (st.passcode !== null) st.wrongPass = true;\n    drawSummary();\n  }).catch(function() { st.loaded = true; drawSummary(); });\n}\nfunction sumLabels(ev) {\n  return ev.mode === \"vote\"\n    ? { join: \"参加できる\", late: \"遅れて参加できる\", absent: \"参加できない\" }\n    : { join: \"参加\", late: \"遅れてくる\", absent: \"不参加\" };\n}\nfunction byDate(st, dateId) {\n  var pick = function(status) {\n    var out = [];\n    st.responses.filter(function(r){ return !r.expired; }).forEach(function(r) {\n      var a = r.answers.find(function(x){ return x.dateId === dateId; });\n      if (a && a.status === status) out.push({ r: r, a: a });\n    });\n    return out;\n  };\n  return { join: pick(\"join\"), late: pick(\"late\"), absent: pick(\"absent\") };\n}\nfunction drawSummary() {\n  var st = summaryState, ev = st.ev;\n  if (!ev) { appEl().innerHTML = notFoundHtml(); return; }\n  if (!st.authorized) {\n    appEl().innerHTML =\n      '<div style=\"padding-bottom:2rem\"><button type=\"button\" class=\"linklike\" data-mact=\"survey\">← 回答ページ</button>' +\n      '<h2 class=\"mt3\">' + esc(ev.title) + '</h2><p class=\"mt1 xsmall dim\">集計ページ　ページ番号 #' + ev.id + \"</p>\" +\n      '<section class=\"card mt5 center\" aria-label=\"パスコード入力\" style=\"padding:1.25rem\"><p style=\"font-size:2.25rem\">🔒</p>' +\n      '<p class=\"mt2\" style=\"font-size:1.125rem;font-weight:700\">集計はパスコードで保護されています</p>' +\n      '<p class=\"mt1 small dim\" style=\"line-height:1.6\">ページを作ったときに決めた4桁の数字を入力してください。</p>' +\n      '<form id=\"pass-form\" class=\"mt4\"><label class=\"dim\" for=\"s-pass\" style=\"position:absolute;left:-9999px\">管理用パスコード</label>' +\n      '<input type=\"text\" id=\"s-pass\" class=\"passinput\" value=\"' + esc(st.input) + '\" inputmode=\"numeric\" autocomplete=\"off\" maxlength=\"4\" placeholder=\"1234\" style=\"text-align:center;font-size:1.5rem;padding:.75rem;margin-top:0\">' +\n      (st.wrongPass ? '<p class=\"mt2 err\" role=\"alert\">パスコードが違います。</p>' : \"\") +\n      '<button type=\"submit\" class=\"btn mt3\" data-mact=\"pass-submit\"' + (st.input.length !== 4 ? \" disabled\" : \"\") + \">集計を開く</button></form></section>\" +\n      '<button type=\"button\" class=\"linklike mt8\" data-mact=\"top\">← トップに戻る</button></div>';\n    bindSummary();\n    return;\n  }\n  var labels = sumLabels(ev);\n  var isVote = ev.mode === \"vote\";\n  var active = st.responses.filter(function(r){ return !r.expired; });\n  var expired = st.responses.filter(function(r){ return r.expired; });\n  var h = '<div style=\"padding-bottom:2rem\"><div class=\"row-between\">' +\n    '<button type=\"button\" class=\"linklike\" data-mact=\"survey\">← 回答ページ</button>' +\n    '<button type=\"button\" class=\"btn btn-plain btn-sub shrink0\" style=\"width:auto;padding:.25rem .75rem;font-size:.875rem;min-height:0\" data-mact=\"reload\">更新</button></div>';\n  h += '<h2 class=\"mt3\">' + esc(ev.title) + '</h2>' +\n    '<p class=\"mt1 small dim\">' + (ev.dates.length > 0 ? ev.dates.map(function(d){ return d.label; }).join(\"、\") : esc(ev.eventTime || \"日時未定\")) + (ev.place ? \"　／　\" + esc(ev.place) : \"\") + \"</p>\" +\n    '<p class=\"mt1 xsmall dim\">ページ番号 #' + ev.id + \"　集計ページ（\" + MODE_LABEL[ev.mode] + \"）　回答した人 \" + active.length + \"人\" +\n    (expired.length > 0 ? \"（期限切れ \" + expired.length + \"人）\" : \"\") + \"</p>\" +\n    (ev.deadline ? '<p class=\"mt1 xsmall dim\">回答期限：' + formatDateLabel(ev.deadline) + \"まで</p>\" : \"\");\n  if (active.length === 0 && expired.length === 0) {\n    h += '<p class=\"mt5 center small dim\" style=\"border:1px dashed var(--border);background:var(--surface);border-radius:.75rem;padding:1.25rem;line-height:1.6\">まだ回答がありません。<br>回答ページから送信されると、ここに名前と人数が表示されます。</p>';\n  } else if (ev.mode === \"single\") {\n    if (ev.dates[0]) h += '<div class=\"mt5\">' + dateBlockHtml(st, ev.dates[0], labels) + \"</div>\";\n  } else {\n    if (isVote) h += voteRankingHtml(st, labels);\n    h += '<div class=\"mt6\" style=\"display:flex;flex-direction:column;gap:2rem\">';\n    ev.dates.forEach(function(d) {\n      h += '<div><h3 style=\"font-size:1.125rem\">' + esc(d.label) + ' の内訳</h3><div class=\"mt2\">' + dateBlockHtml(st, d, labels) + \"</div></div>\";\n    });\n    h += \"</div>\";\n  }\n  if (expired.length > 0) h += expiredPoolHtml(st, expired, labels);\n  h += '<button type=\"button\" class=\"linklike mt8\" data-mact=\"top\">← トップに戻る</button></div>';\n  appEl().innerHTML = h;\n  bindSummary();\n}\nfunction nameSectionHtml(st, label, list, color, showTime) {\n  var h = '<section class=\"card mt3\" aria-label=\"' + esc(label) + '\" style=\"padding:1rem\"><h5 style=\"font-size:1rem;color:' + color + '\">' +\n    esc(label) + ' <span style=\"color:var(--text)\">' + list.length + \"人</span></h5>\";\n  if (list.length === 0) h += '<p class=\"mt2 small dim\">まだいません</p>';\n  else {\n    h += '<ul class=\"divide\" style=\"margin:.25rem 0 0;padding:0;list-style:none\">';\n    list.forEach(function(x) { h += respRowHtml(st, x.r, x.a, showTime); });\n    h += \"</ul>\";\n  }\n  return h + \"</section>\";\n}\nfunction respRowHtml(st, r, a, showTime) {\n  var h = '<li class=\"row-between\" style=\"padding:.5rem 0\"><span>' + esc(r.name) +\n    (showTime && a.lateTime ? '<span style=\"margin-left:.25rem;font-weight:700;color:var(--amber)\">（' + esc(a.lateTime) + \"頃）</span>\" : \"\") + \"</span>\";\n  if (st.confirmId === r.id) {\n    h += '<span class=\"flex shrink0\" style=\"align-items:center\"><span class=\"xsmall dim\">全日程分を削除</span>' +\n      '<button type=\"button\" class=\"btn btn-danger shrink0\" style=\"width:auto;padding:.25rem .5rem;font-size:.75rem;min-height:0\" data-mact=\"del-resp\" data-id=\"' + r.id + '\">削除する</button></span>';\n  } else {\n    h += '<button type=\"button\" class=\"linklike shrink0\" style=\"font-size:.75rem\" data-mact=\"confirm-resp\" data-id=\"' + r.id + '\">削除</button>';\n  }\n  return h + \"</li>\";\n}\nfunction dateBlockHtml(st, d, labels) {\n  var ev = st.ev;\n  var g = byDate(st, d.id);\n  var coming = g.join.length + g.late.length;\n  var h = '<div><div class=\"headline-box\"><p style=\"font-weight:700\">' + esc(d.label) + \"</p>\" +\n    '<p class=\"mt1 small\" style=\"font-weight:700;opacity:.9\">' + (ev.mode === \"vote\" ? \"来れる人\" : \"来る人 合計\") + \"</p>\" +\n    '<p style=\"margin-top:.25rem;font-size:2.25rem;font-weight:700;line-height:1\">' + coming + '<span style=\"font-size:1.25rem;margin-left:.25rem\">人</span></p>' +\n    '<p class=\"mt2 small\" style=\"opacity:.9\">' + labels.join + \" \" + g.join.length + \"人 ＋ \" + labels.late + \" \" + g.late.length + \"人</p></div>\";\n  h += '<div class=\"grid3 mt3\">' +\n    '<div class=\"stat-box\"><p style=\"font-size:1.5rem;font-weight:700;color:var(--green)\">' + g.join.length + '</p><p class=\"xsmall dim\">' + labels.join + \"</p></div>\" +\n    '<div class=\"stat-box\"><p style=\"font-size:1.5rem;font-weight:700;color:var(--amber)\">' + g.late.length + '</p><p class=\"xsmall dim\">' + labels.late + \"</p></div>\" +\n    '<div class=\"stat-box\"><p style=\"font-size:1.5rem;font-weight:700\">' + g.absent.length + '</p><p class=\"xsmall dim\">' + labels.absent + \"</p></div></div>\";\n  h += nameSectionHtml(st, labels.join, g.join, \"var(--green)\", false);\n  h += nameSectionHtml(st, labels.late, g.late, \"var(--amber)\", true);\n  h += nameSectionHtml(st, labels.absent, g.absent, \"var(--dim)\", false);\n  return h + \"</div>\";\n}\nfunction voteRankingHtml(st, labels) {\n  var ev = st.ev;\n  var ranked = ev.dates.map(function(d) {\n    var g = byDate(st, d.id);\n    return { d: d, coming: g.join.length + g.late.length, join: g.join.length, late: g.late.length, absent: g.absent.length };\n  }).sort(function(a, b){ return b.coming - a.coming; });\n  var top = ranked.length > 0 ? ranked[0].coming : 0;\n  var h = '<section class=\"mt5\" aria-label=\"候補日のランキング\"><h3 style=\"font-size:1.125rem\">来れる人数が多い順</h3><ol style=\"margin:.5rem 0 0;padding:0;list-style:none\" class=\"stack2\">';\n  ranked.forEach(function(x, i) {\n    var isTop = x.coming === top && top > 0;\n    h += '<li class=\"card row-between' + (isTop ? \" rank-top\" : \"\") + '\" style=\"padding:1rem\">' +\n      '<span style=\"width:2rem;text-align:center;font-size:1.5rem;font-weight:700;color:var(--accent)\" class=\"shrink0\">' + (i + 1) + \"</span>\" +\n      '<span class=\"grow\" style=\"min-width:0\"><span style=\"display:block;font-weight:700\">' + esc(x.d.label) + \"</span>\" +\n      '<span class=\"small dim\" style=\"display:block\">' + labels.join + \" \" + x.join + \"人 ／ \" + labels.late + \" \" + x.late + \"人 ／ \" + labels.absent + \" \" + x.absent + \"人</span></span>\" +\n      '<span class=\"shrink0\" style=\"text-align:right\"><span style=\"display:block;font-size:1.875rem;font-weight:700;line-height:1\">' + x.coming + '<span style=\"font-size:1rem;margin-left:.125rem\">人</span></span>' +\n      (isTop ? '<span class=\"xsmall\" style=\"display:block;margin-top:.25rem;font-weight:700;color:var(--accent)\">いちばん多い</span>' : \"\") + \"</span></li>\";\n  });\n  h += \"</ol>\";\n  if (top > 0) h += '<p class=\"mt2 small dim\" style=\"line-height:1.6\">いちばん多い日を開催日にするのがおすすめです。各日の名前の内訳は下にあります。</p>';\n  return h + \"</section>\";\n}\nfunction expiredPoolHtml(st, expired, labels) {\n  var ev = st.ev;\n  var h = '<section class=\"pool mt8\" aria-label=\"期限切れプール\"><h3 style=\"font-size:1.125rem;color:var(--amber)\">期限切れプール <span style=\"color:var(--text);font-size:1rem\">' + expired.length + \"人</span></h3>\" +\n    '<p class=\"mt1 small dim\" style=\"line-height:1.6\">回答期限を過ぎてから届いた回答です。上の集計（人数・ランキング）には含まれていません。</p>' +\n    '<ul class=\"divide\" style=\"margin:.5rem 0 0;padding:0;list-style:none\">';\n  expired.forEach(function(r) {\n    h += '<li style=\"padding:.5rem 0\"><div class=\"row-between\"><span style=\"font-weight:700\">' + esc(r.name) + \"</span>\";\n    if (st.confirmId === r.id) {\n      h += '<span class=\"flex shrink0\" style=\"align-items:center\"><span class=\"xsmall dim\">全日程分を削除</span>' +\n        '<button type=\"button\" class=\"btn btn-danger shrink0\" style=\"width:auto;padding:.25rem .5rem;font-size:.75rem;min-height:0\" data-mact=\"del-resp\" data-id=\"' + r.id + '\">削除する</button></span>';\n    } else {\n      h += '<button type=\"button\" class=\"linklike shrink0\" style=\"font-size:.75rem\" data-mact=\"confirm-resp\" data-id=\"' + r.id + '\">削除</button>';\n    }\n    h += '</div><ul style=\"margin:.25rem 0 0;padding:0;list-style:none\">';\n    r.answers.forEach(function(a) {\n      var d = ev.dates.find(function(x){ return x.id === a.dateId; });\n      var stLabel = a.status === \"join\" ? labels.join : a.status === \"late\" ? labels.late : labels.absent;\n      h += '<li class=\"small dim\">' + (ev.mode !== \"single\" && d ? esc(d.label) + \"：\" : \"\") + stLabel +\n        (a.status === \"late\" && a.lateTime ? '<span style=\"margin-left:.25rem;font-weight:700;color:var(--amber)\">（' + esc(a.lateTime) + \"頃）</span>\" : \"\") + \"</li>\";\n    });\n    h += \"</ul></li>\";\n  });\n  return h + \"</ul></section>\";\n}\nfunction bindSummary() {\n  var st = summaryState;\n  document.querySelectorAll(\"[data-mact]\").forEach(function(b) {\n    b.addEventListener(\"click\", function() {\n      var act = b.getAttribute(\"data-mact\");\n      if (act === \"top\") go({ kind: \"home\" });\n      else if (act === \"survey\") go({ kind: \"survey\", eventId: st.eventId });\n      else if (act === \"reload\") loadSummary();\n      else if (act === \"confirm-resp\") { st.confirmId = Number(b.getAttribute(\"data-id\")); drawSummary(); }\n      else if (act === \"del-resp\") {\n        var id = Number(b.getAttribute(\"data-id\"));\n        api(\"deleteResponse\", { id: id, eventId: st.eventId, passcode: st.passcode || \"\" }).then(function(res) {\n          st.confirmId = null;\n          if (res.ok) loadSummary();\n          else { summaryPasscodes[st.eventId] = null; st.passcode = null; st.authorized = false; st.wrongPass = true; drawSummary(); }\n        }).catch(function() { st.confirmId = null; drawSummary(); });\n      }\n    });\n  });\n  var form = document.getElementById(\"pass-form\");\n  if (form) {\n    var inp = document.getElementById(\"s-pass\");\n    inp.addEventListener(\"input\", function() {\n      st.input = inp.value.replace(/\\D/g, \"\").slice(0, 4);\n      if (inp.value !== st.input) inp.value = st.input;\n      var btn = form.querySelector(\"[data-mact='pass-submit']\");\n      if (btn) btn.disabled = st.input.length !== 4;\n    });\n    form.addEventListener(\"submit\", function(e) {\n      e.preventDefault();\n      if (st.input.length !== 4) return;\n      st.wrongPass = false;\n      st.passcode = st.input;\n      summaryPasscodes[st.eventId] = st.input;\n      loadSummary();\n    });\n  }\n}\n\n/* ===== ルーター ===== */\nfunction render() {\n  if (view.kind === \"home\") renderHome();\n  else if (view.kind === \"survey\") renderSurvey(view.eventId, view.created);\n  else if (view.kind === \"summary\") renderSummary(view.eventId);\n}\nview = parseHashView();\nrender();\n</script>\n</body>\n</html>\n";

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


/* ===== Deno KV ストレージ ===== */
const kv = await Deno.openKv();

const store = {
  async nextSeq(kind) {
    const key = ["seq", kind];
    for (;;) {
      const cur = await kv.get(key);
      const next = (typeof cur.value === "number" ? cur.value : 0) + 1;
      const res = await kv.atomic().check(cur).set(key, next).commit();
      if (res.ok) return next;
    }
  },
  async getEvent(id) {
    const r = await kv.get(["event", id]);
    return r.value || null;
  },
  async putEvent(ev) {
    await kv.set(["event", ev.id], ev);
  },
  async removeEvent(id) {
    await kv.delete(["event", id]);
  },
  async listResponses(eventId) {
    const out = [];
    for await (const entry of kv.list({ prefix: ["response", eventId] })) {
      out.push(entry.value);
    }
    return out;
  },
  async putResponse(resp) {
    await kv.set(["response", resp.eventId, resp.id], resp);
  },
  async removeResponse(eventId, id) {
    await kv.delete(["response", eventId, id]);
  },
};

/* ===== HTTP サーバー ===== */
Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    return new Response(CLIENT_HTML, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (req.method === "POST" && url.pathname.startsWith("/api/")) {
    const action = decodeURIComponent(url.pathname.slice("/api/".length));
    let args = {};
    try {
      args = await req.json();
    } catch (_e) {
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    const { status, body } = await handleApi(store, action, args);
    return Response.json(body, { status });
  }
  return new Response("Not Found", { status: 404 });
});

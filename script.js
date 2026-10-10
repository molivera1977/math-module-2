/* ═══════════════════════════════════════════════════════
   MATH MODULE 2 REVIEW AND TEST · script.js
   One site for the review AND the test (Marcos 10/9: "combine the
   Reviews and Tests on the same site … separate them just like the
   practice and quiz sites"). Engine = copy of the Rounding Review and
   Quiz - Numberline Edition (math-rounding-quiz-2): steps on one start
   screen, a part banner on every question, one open/closed flag per part.
   Two copies of each (Marcos 10/9):
   - REVIEW A (with hints) and REVIEW B (no hints) — the answer, why,
     and the worked picture after every question; each can be taken
     two times (a third needs the Teacher PIN)
   - TEST A = the official test — one attempt, right/wrong only, then
     locked. TEST B = the retake copy (new numbers), Teacher PIN only.
     In the code Test A is form T (ids T01–T17) and Test B is form U
     (ids U01–U17), so their ids never collide with Review A / B.
   - 17 questions on each review and test (the "is the estimate reasonable?"
     question was removed 10/10 — Marcos: "estimating is fine but the
     reasonableness questions I don't care about"); Practice has 18.
   - Same kind of question in the same slot on all four forms, so the
     dashboard compares review → test skill by skill
   Help for students who are stuck (Marcos 10/10), none of it on the tests:
   - PRACTICE (form P) — an easy Step 1: in order, the problem already in
     columns, a hint on every question, as many tries as they like
   - a wrong answer NAMES THE MISTAKE (each wrong choice carries the slip it
     stands for: data `slips`)
   - TRY ONE LIKE IT — after a miss in Review A / B the student gets one more
     question of the same kind (twin_x.js / twin_y.js); it never changes the score
   - WORD HELP — a button under the question for each math word in it (data/words.js)
   Game keys mod2-practice / mod2a-review / mod2b-review / mod2t-test /
   mod2u-test, storage prefix mm2_. Pictures live in visuals.js.
   PIN: 9377 (Teacher override)
═══════════════════════════════════════════════════════ */

/* ── CONFIG ─────────────────────────────────────────── */
// Each part opens on its own. false = students locked out of that part;
// Teacher Access still works. Set true to open.
const PRACTICE_OPEN = false;   // Practice — the easy start (Step 1)
const REVIEW_OPEN   = false;   // Review A (hints) and Review B (no hints)
const TEST_OPEN     = false;   // Test A — official (Test B = retake, Teacher PIN)
// Marcos 10/10: "the test must wait for at least one review. For a test to be
// taken without a review being completed, it should need a teacher pin entry."
// false = Test A opens after ONE finished review (A or B) on this device; the
// Teacher PIN lets one student skip that. true = no waiting (any order).
const ANY_ORDER     = false;
const gate = ready => ANY_ORDER || ready;
const INSTRUCT_SECS = 20;
const READ_SECS     = 12;
const NEXT_SECS     = 8;
const STORAGE_KEY   = 'mm2_session_v1';
const SCORES_KEY    = 'mm2_scores_v1';
const RNDQ_SESSION_ID_KEY = 'mm2_session_id_v1';
const SESSION_ID = (() => {
  let id = localStorage.getItem(RNDQ_SESSION_ID_KEY);
  if (!id) { id = 'M2-' + Math.random().toString(36).slice(2, 9).toUpperCase(); localStorage.setItem(RNDQ_SESSION_ID_KEY, id); }
  return id;
})();

const FORMS = ['P', 'A', 'B', 'T', 'U'];
const isPractice = form => form === 'P';
const isReview = form => form === 'A' || form === 'B';
const isTest   = form => form === 'T' || form === 'U';
// Practice and the reviews teach (answer + why + the worked picture + the mistake named); the tests do not
const teaches = form => isReview(form) || isPractice(form);
// "Try one like it": after a miss in a review, one more question of the same kind from this bank
const TWINS = { A: 'X', B: 'Y' };
const FORM_NAMES = { P: 'Practice', A: 'Review A', B: 'Review B', T: 'Test A', U: 'Test B (Retake)' };
function formOpen(form) { return isPractice(form) ? PRACTICE_OPEN : isReview(form) ? REVIEW_OPEN : TEST_OPEN; }
/* Sheet / dashboard game key — one per form */
function gameKey(form) {
  return { P: 'mod2-practice', A: 'mod2a-review', B: 'mod2b-review', T: 'mod2t-test', U: 'mod2u-test' }[form];
}

/* ── SHEET SUBMISSION ───────────────────────────────── */
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzv8CWv1yyi8NeH04now9UxVL4IZm5yMqqsEGMcgGdrcAOWVB-aSp5siTvSSJXIUpzFMA/exec';

let tabSwitchCount = 0;

/* One saved miss: "[ID] (Skill) question (picked: answer)" — the standard every
   review uses. Skill comes from data/skills.js by question id, so misses restored
   from an older saved attempt still get tagged. " | " separates entries, so it is
   swapped out of the pick just in case. */
function missEntry(m) {
  const skill  = m.skill || (window.SKILLS || {})[m.id] || 'Unsorted';
  const picked = m.yourAnswer == null || m.yourAnswer === '' ? '' :
    ` (picked: ${String(m.yourAnswer).replace(/\s*\|\s*/g, ' / ').replace(/\s+/g, ' ').trim()})`;
  return `[${m.id}] (${skill}) ${m.q}${picked}`;
}

/* What the sheet's "form" column says: Practice · Review A · Review B · Test A · Test B — Retake */
function formLabel(attempt) {
  if (isPractice(app.currentForm)) return 'Practice';
  if (isReview(app.currentForm)) return `Review ${app.currentForm}`;
  return app.currentForm === 'U' ? 'Test B — Retake' : 'Test A';
}
/* The attempt this session will be once it finishes (finished ones on this device + 1). */
function upcomingAttempt() {
  return (getFormAttempts(app.studentName)[app.currentForm] || 0) + 1;
}

function submitScorePartial() {
  const pct = app.currentBank.length
    ? Math.round((app.score / app.currentBank.length) * 100) : 0;
  fetch(SHEET_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:    'submit',
      game:      gameKey(app.currentForm),
      sessionId: SESSION_ID + '-' + (app.currentForm || 'x'),
      name:      app.studentName || 'Unknown',
      form:      formLabel(upcomingAttempt()),
      score:     app.score,
      total:     app.currentBank.length,
      percent:   pct,
      status:    `In Progress (Q${app.currentIndex + 1}/${app.currentBank.length})`,
      done:           false,
      elapsed:        app.timerSeconds,
      tabSwitches:    tabSwitchCount,
      wrongQuestions: (app.missedQuestions||[]).map(missEntry).join(' | '),
      startedAt:      app.startedAt || '',
      finishedAt:     app.finishedAt || '',
      events:         JSON.stringify(app.events || []),
      timestamp:      new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    })
  }).catch(() => {});
}

function submitScoreFinal() {
  const pct = app.currentBank.length
    ? Math.round((app.score / app.currentBank.length) * 100) : 0;
  fetch(SHEET_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action:    'submit',
      game:      gameKey(app.currentForm),
      sessionId: SESSION_ID + '-' + (app.currentForm || 'x') + '-A' + (app.currentAttemptNum || 1),
      name:      app.studentName || 'Unknown',
      form:      formLabel(app.currentAttemptNum),
      attempt:   app.currentAttemptNum || 1,
      score:     app.score,
      total:     app.currentBank.length,
      percent:   pct,
      status:    'Complete',
      done:           true,
      elapsed:        app.timerSeconds,
      tabSwitches:    tabSwitchCount,
      wrongQuestions: (app.missedQuestions||[]).map(missEntry).join(' | '),
      startedAt:      app.startedAt || '',
      finishedAt:     app.finishedAt || '',
      events:         JSON.stringify(app.events || []),
      timestamp:      new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
    })
  }).catch(() => {});
}

/* ── ROSTER ─────────────────────────────────────────── */
const ROSTER = [
  { name: "Mr. O (Teacher)",           id: "9377" },
  { name: "Avery, Jo'Von",             id: "10053632" },
  { name: "Belasquez Bonilla, Eduin",  id: "10058674" },
  { name: "Castaneda, Kelvin",         id: "10053248" },
  { name: "Chicas-Santos, Allison",    id: "10066737" },
  { name: "Collado, Roniel",           id: "10060249" },
  { name: "Dejesus, Michael",          id: "10049434" },
  { name: "Dock, Fakeem",              id: "10059720" },
  { name: "Douglas, Iyana",            id: "10070980" },
  { name: "Dumphrey, Christopher",     id: "10060696" },
  { name: "Flores, Kiara",             id: "10052834" },
  { name: "Johnson, Destiny",          id: "10052926" },
  { name: "Jones, Tahji",              id: "10060315" },
  { name: "Lawrence, Eric",            id: "10057451" },
  { name: "Madero, Jovany",            id: "10076374" },
  { name: "Pettway, Lanaura",          id: "10060616" },
  { name: "Polanco Soriano, Thiara",   id: "10060503" },
  { name: "Roberts, Robyn",            id: "10060925" },
  { name: "Rojas, Alanie",             id: "10076388" },
  { name: "Sanchez Rodriguez, Johanelyz", id: "10076767" },
  { name: "Vega, Taishmara",           id: "10054043" },
  { name: "Watts, Autumn",             id: "10039032" },
  { name: "Zelaya-Osorto, Nazareth",   id: "10053626" }
];

const GUEST_SLOTS = {
  '937701': 'Guest 1', '937702': 'Guest 2', '937703': 'Guest 3',
  '937704': 'Guest 4', '937705': 'Guest 5', '937706': 'Guest 6',
  '937707': 'Guest 7', '937708': 'Guest 8', '937709': 'Guest 9',
  '937710': 'Guest 10'
};

/* ── BUILD DROPDOWN ─────────────────────────────────── */
(function buildRoster() {
  const sel = document.getElementById('name-select');
  ROSTER.forEach(s => {
    const o = document.createElement('option');
    o.value = s.name; o.textContent = s.name;
    sel.appendChild(o);
  });
  const div = document.createElement('option');
  div.disabled = true; div.textContent = '── Guest Slots ──';
  sel.appendChild(div);
  Object.entries(GUEST_SLOTS).forEach(([code, label]) => {
    const o = document.createElement('option');
    o.value = `GUEST:${code}`; o.textContent = `🙋 ${label}`;
    sel.appendChild(o);
  });
})();

/* ── STATE ──────────────────────────────────────────── */
let loggedInName    = '';
let unlockedForms   = new Set();
let retakeUnlocked  = false;   // set by the Teacher PIN; cleared on Home
let pinModalCallback = null;
let activeSpeakBtn  = null;
let reviewMode      = false;
let reviewAutoRun   = false;

/* ── MATH HELPERS ───────────────────────────────────── */
function frac(n, d) {
  return `<span class="fraction"><span class="frac-top">${n}</span><span class="frac-bottom">${d}</span></span>`;
}
function mixed(w, n, d) {
  return `<span class="mixed-num">${w}<span class="fraction"><span class="frac-top">${n}</span><span class="frac-bottom">${d}</span></span></span>`;
}
function formatMathText(raw) {
  if (!raw) return '';
  let s = raw;
  s = s.replace(/(\d+)\s+(\d+)\/(\d+)/g, (_, w, n, d) => mixed(w, n, d));
  s = s.replace(/(\d+)\/(\d+)/g, (_, n, d) => frac(n, d));
  s = s.replace(/\bx\b/g, '×');
  return s;
}

const ORDINALS = {
  '2':'halves','3':'thirds','4':'fourths','5':'fifths','6':'sixths',
  '7':'sevenths','8':'eighths','9':'ninths','10':'tenths',
  '12':'twelfths','16':'sixteenths','100':'hundredths'
};
const SINGULAR_DENOM = {
  'halves':'half','thirds':'third','fourths':'fourth','fifths':'fifth',
  'sixths':'sixth','sevenths':'seventh','eighths':'eighth','ninths':'ninth',
  'tenths':'tenth','twelfths':'twelfth','sixteenths':'sixteenth','hundredths':'hundredth'
};
function denomToWord(d) { return ORDINALS[d] || `over ${d}`; }
function numToWord(n) {
  const w = ['zero','one','two','three','four','five','six','seven','eight','nine',
             'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen',
             'seventeen','eighteen','nineteen','twenty'];
  return w[parseInt(n)] !== undefined ? w[parseInt(n)] : n;
}
function convertToSpokenText(raw) {
  return raw
    .replace(/\u00a0{2,}/g, ', ')
    .replace(/(\d+)\s+(\d+)\/(\d+)/g, (_, w, n, d) => {
      const dWord = denomToWord(d), nNum = parseInt(n);
      const dFinal = nNum === 1 ? (SINGULAR_DENOM[dWord] || dWord) : dWord;
      return `${w} and ${numToWord(n)} ${dFinal}`;
    })
    .replace(/(\d+)\/(\d+)/g, (_, n, d) => {
      const dWord = denomToWord(d), nNum = parseInt(n);
      const dFinal = nNum === 1 ? (SINGULAR_DENOM[dWord] || dWord) : dWord;
      return `${numToWord(n)} ${dFinal}`;
    })
    .replace(/×/g, ' times ')
    .replace(/(^|\s)\+(?=\s|$)/g, '$1plus')
    .replace(/(^|\s)=(?=\s|$)/g, '$1equals')
    .replace(/\bx\b/g, ' times ')
    .replace(/\s\+\s/g, ' plus ')
    .replace(/\s−\s/g, ' minus ');
}

/* ── LETTER GRADE ───────────────────────────────────── */
function letterGrade(pct) {
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

/* ── HELPERS ────────────────────────────────────────── */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function getFirstName(name) {
  if (!name) return 'Student';
  if (name.includes(' - ')) return name.split(' - ').pop().trim();
  const parts = name.split(',');
  return parts.length > 1 ? parts[1].trim().split(' ')[0] : name.split(' ')[0];
}

let hlTimer = null;
function stopActiveSpeech() {
  clearTimeout(hlTimer);
  window.speechSynthesis.cancel();
  document.querySelectorAll('.wrd.hl').forEach(e => e.classList.remove('hl'));
  if (activeSpeakBtn) { activeSpeakBtn.textContent = '🔊'; activeSpeakBtn = null; }
}

/* ── HINT BOX (Marcos 10/7) ──
   "The hints should not play automatically. They should be there if
   needed." Until the student taps 💡 Need a hint?, only that button shows
   and nothing is read. Once opened, the hint has its own 🔊 on the LEFT,
   same toggle as every other speaker (tap to play, tap to stop, tap again
   to restart); every word (including "Hint:") is a span for the highlight.
   The question's 🔊 reads the question only. */
function hintBoxHTML(hint, shown) {
  if (!shown) {
    return `<div class="hint-wrap"><button type="button" class="hint-reveal-btn" ` +
      `aria-label="Show a hint" onclick="event.stopPropagation(); app.showHint()">` +
      `💡 Need a hint?</button></div>`;
  }
  const words = ('Hint: ' + hint).split(/\s+/)
    .map(w => `<span class="wrd">${formatMathText(w)}</span>`).join(' ');
  return `<div class="hint-box"><button type="button" class="speak-btn hint-speak-btn" ` +
    `title="Read the hint aloud" aria-label="Read the hint aloud" ` +
    `onclick="event.stopPropagation(); speakHint(this)">🔊</button>` +
    `<span class="hint-text"><span aria-hidden="true">💡</span> ${words}</span></div>`;
}

function speakHint(btn) {
  if (activeSpeakBtn === btn) { stopActiveSpeech(); return; }
  stopActiveSpeech();
  const q = app.currentQ();
  if (!q || !q.hint) return;
  const spans = Array.from(btn.parentElement.querySelectorAll('.wrd'));
  activeSpeakBtn = btn;
  btn.textContent = '⏹';
  const u = new SpeechSynthesisUtterance(convertToSpokenText('Hint: ' + q.hint));
  u.lang = 'en-US'; u.rate = 0.92;
  let hlIdx = 0;
  u.onboundary = e => {
    if (e.name !== 'word') return;
    spans.forEach(el => el.classList.remove('hl'));
    if (spans[hlIdx]) spans[hlIdx].classList.add('hl');
    hlIdx++;
  };
  u.onend = () => {
    spans.forEach(el => el.classList.remove('hl'));
    if (activeSpeakBtn === btn) { btn.textContent = '🔊'; activeSpeakBtn = null; }
  };
  addHighlightFallback(u, spans);
  window.speechSynthesis.speak(u);
}

/* ── WORD HELP (Marcos 10/10) ──
   Each math word in the question gets a button under it. Tapping one opens a
   card: what the word means, an example, sometimes a picture, and its own 🔊.
   Nothing opens or speaks on its own. Practice and the reviews only — the
   tests measure whether the student knows these words. Every open is logged
   (event "word") so the dashboard can show who needed which word. */
const WORD_MAX = 4;
function wordsIn(q) {
  const text = ' ' + String(q.q).toLowerCase() + ' ';
  const found = [];
  (window.WORDS || []).forEach(w => {
    let at = -1;
    w.find.forEach(ph => {
      const m = new RegExp('[^a-z]' + ph.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^a-z]').exec(text);
      if (m && (at < 0 || m.index < at)) at = m.index;
    });
    if (at >= 0) found.push({ w, at });
  });
  return found.sort((a, b) => a.at - b.at).slice(0, WORD_MAX).map(x => x.w);
}
function wordChipsHTML(q, openKey) {
  const list = wordsIn(q);
  if (!list.length) return '';
  const chips = list.map(w =>
    `<button type="button" class="word-chip${w.key === openKey ? ' open' : ''}" aria-expanded="${w.key === openKey}" ` +
    `onclick="app.showWord('${w.key}')">${w.word}</button>`).join('');
  const w = list.find(x => x.key === openKey);
  const card = !w ? '' :
    `<div class="word-card" role="note"><button type="button" class="speak-btn word-speak-btn" title="Read this aloud" ` +
    `aria-label="Read the meaning of ${w.word} aloud" onclick="speakWordCard(this)">🔊</button>` +
    `<div class="word-card-text"><div class="word-card-means">${wrapWords('<strong>' + w.word + '</strong> — ' + formatMathText(w.means))}</div>` +
    `<div class="word-card-ex">${wrapWords('<em>Example:</em> ' + formatMathText(w.ex))}</div>` +
    `${w.pic ? M2V.picHTML(w.pic) : ''}</div>` +
    `<button type="button" class="word-close" aria-label="Close" onclick="app.showWord('${w.key}')">✕</button></div>`;
  return `<div class="word-row"><span class="word-label" aria-hidden="true">📖 Word help:</span>${chips}</div>${card}`;
}
function speakWordCard(btn) {
  if (activeSpeakBtn === btn) { stopActiveSpeech(); return; }
  stopActiveSpeech();
  const spans = Array.from(btn.parentElement.querySelectorAll('.word-card-text .wrd')).filter(s => /[A-Za-z0-9+=×−]/.test(s.textContent));
  if (!spans.length) return;
  activeSpeakBtn = btn;
  btn.textContent = '⏹';
  const u = new SpeechSynthesisUtterance(convertToSpokenText(spans.map(s => s.textContent).join(' ')));
  u.lang = 'en-US'; u.rate = 0.92;
  let hlIdx = 0;
  u.onboundary = e => {
    if (e.name !== 'word') return;
    spans.forEach(el => el.classList.remove('hl'));
    if (spans[hlIdx]) spans[hlIdx].classList.add('hl');
    hlIdx++;
  };
  u.onend = () => {
    spans.forEach(el => el.classList.remove('hl'));
    if (activeSpeakBtn === btn) { btn.textContent = '🔊'; activeSpeakBtn = null; }
  };
  addHighlightFallback(u, spans);
  window.speechSynthesis.speak(u);
}

/* ── PART BANNER (Marcos 10/8: "I want to be able to know which part the
   students are on") — a big colored label on top of every question:
   the step number and the part's name, one color per part. ── */
const PART_BANNER = { P: ['🌱', 'Step 1 · Practice', 'pb-practice'], A: ['📘', 'Step 2 · Review A', 'pb-review'], B: ['📗', 'Step 2 · Review B', 'pb-review-b'], T: ['📝', 'Step 3 · Test A', 'pb-quiz'], U: ['📝', 'Step 3 · Test B', 'pb-quiz'] };
function setPartBanner(form) {
  const el = document.getElementById('part-banner');
  const p = PART_BANNER[form];
  if (!el || !p) return;
  const retake = form === 'U';
  el.className = 'part-banner ' + p[2];
  el.innerHTML = `<span aria-hidden="true">${p[0]}</span> ${p[1]}${retake ? ' — Retake' : ''}` +
    (reviewMode ? ' <span class="pb-teacher">(teacher view)</span>' : '');
}

/* ── HIGHLIGHT FALLBACK ─────────────────────────────
   Some voices (and some browsers) never fire word-boundary
   events, so the highlight would never move. If no boundary
   arrives shortly after speaking starts, step through the
   words on a timer paced by word length and speech rate. */
function addHighlightFallback(u, spans) {
  let fired = false, i = 0;
  const prevB = u.onboundary, prevE = u.onend;
  u.onboundary = e => { if (e.name === 'word' && !fired) { fired = true; clearTimeout(hlTimer); } if (prevB) prevB(e); };
  u.onend = e => { clearTimeout(hlTimer); spans.forEach(s => s.classList.remove('hl')); if (prevE) prevE(e); };
  const step = () => {
    if (fired) return;
    spans.forEach(s => s.classList.remove('hl'));
    if (i >= spans.length) return;
    const w = spans[i++];
    w.classList.add('hl');
    const len = (w.textContent || '').replace(/[^A-Za-z0-9]/g, '').length;
    hlTimer = setTimeout(step, Math.max(280, len * 70 + 120) / (u.rate || 1));
  };
  clearTimeout(hlTimer);
  hlTimer = setTimeout(step, 500);
}

/* ── ATTEMPT TRACKING ───────────────────────────────── */
function getFormAttempts(name) {
  const scores = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
  const counts = { P: 0, A: 0, B: 0, T: 0, U: 0 };
  scores.filter(s => s.name === name && s.done).forEach(s => {
    if (counts[s.form] !== undefined) counts[s.form]++;
  });
  return counts;
}

/* Test A is one attempt. Once it is finished on this device the student sees
   "Test Already Completed"; a retake (Test B) needs the Teacher PIN every
   time. Each review can be taken two times; after that only a Teacher PIN
   unlocks another try (same as the MM1 Review). */
function testCompleted(name) {
  const a = getFormAttempts(name);
  return a.T > 0 || a.U > 0;
}

/* The test waits until Review A or Review B has been FINISHED once on this
   device. An unfinished review does not count. */
function reviewFinished(name) {
  const a = getFormAttempts(name);
  return a.A > 0 || a.B > 0;
}

/* A form that is not open yet shows a gray "Not open yet" button. */
function setFormButton(form, label, sub, waiting) {
  const btn = document.getElementById('btn-form-' + form);
  if (!btn) return;
  const open = formOpen(form);
  btn.disabled = !open;
  // "waiting" = open but not yet earned: looks locked, still tappable so it can explain why
  btn.classList.toggle('locked', !open || !!waiting);
  btn.innerHTML = !open
    ? `🔒 ${label.replace(/^\S+\s/, '')}<span class="form-btn-sub">Not open yet</span>`
    : waiting
      ? `🔒 ${label.replace(/^\S+\s/, '')}<span class="form-btn-sub">${waiting}</span>`
      : `${label}<span class="form-btn-sub">${sub}</span>`;
}

function applyFormLocks(name) {
  const a         = getFormAttempts(name);
  const done      = testCompleted(name);
  const startCard = document.getElementById('quiz-start-card');
  const doneCard  = document.getElementById('completed-container');
  const retake    = document.getElementById('retake-card');
  setFormButton('P', '🌱 Practice',
    a.P === 0 ? '18 questions · the easy start · 💡 hints' : '🔁 Practice again any time');
  [['A', '📘', '💡 hints'], ['B', '📗', 'no hints']].forEach(([form, icon, kind]) => {
    setFormButton(form, `${icon} Review ${form}`,
      a[form] === 0 ? `17 questions · ${kind} · 2 tries`
      : a[form] === 1 ? `🔁 Try 2 of 2 · ${kind}`
      : '🔒 2 of 2 tries used');
    const btn = document.getElementById('btn-form-' + form);
    if (btn && formOpen(form) && a[form] >= 2) btn.classList.add('locked');
  });
  setFormButton('T', '📝 Take Test A', '17 questions · one try',
    gate(reviewFinished(name)) ? '' : 'Finish Review A or Review B first');
  if (startCard) startCard.classList.toggle('hidden', done);
  if (doneCard)  doneCard.classList.toggle('hidden', !done || retakeUnlocked);
  if (retake)    retake.classList.toggle('hidden', !retakeUnlocked);
  if (done) {
    const taken = a.T + a.U;
    const detail = document.getElementById('completed-detail');
    if (detail) detail.textContent = taken === 1
      ? 'You have already taken Test A.'
      : 'You have already taken Test A and a retake.';
  }
}

/* ── SPEAK DIRECTIONS ───────────────────────────────── */
function speakDir(btn) {
  if (activeSpeakBtn === btn) { stopActiveSpeech(); return; }
  stopActiveSpeech();

  const p = btn.closest('.dir-section').querySelector('.dir-text');
  if (!p) return;
  if (!p.querySelector('.wrd')) p.innerHTML = wrapWords(p.innerHTML);

  const spans = Array.from(p.querySelectorAll('.wrd'));
  if (!spans.length) return;

  activeSpeakBtn = btn;
  btn.textContent = '⏹';

  const speechText = spans.map(s => s.textContent).join(' ');
  let hlIdx = 0;
  const u = new SpeechSynthesisUtterance(speechText);
  u.lang = 'en-US'; u.rate = 0.92;

  u.onboundary = e => {
    if (e.name !== 'word') return;
    document.querySelectorAll('.dir-text .wrd.hl').forEach(el => el.classList.remove('hl'));
    if (spans[hlIdx]) spans[hlIdx].classList.add('hl');
    hlIdx++;
  };
  u.onend = () => {
    document.querySelectorAll('.dir-text .wrd.hl').forEach(el => el.classList.remove('hl'));
    if (activeSpeakBtn === btn) { btn.textContent = '🔊'; activeSpeakBtn = null; }
  };
  addHighlightFallback(u, spans);
  window.speechSynthesis.speak(u);
}

/* ── READ-ALOUD INTRO SPEAKS ITSELF ─────────────────
   Marcos 10/6: the "Read Aloud is Available!" screen announces itself
   the moment it opens — no reading, no button. The click on "Let's Get
   Started!" is the user gesture the browser needs. The icons are said
   as words, and each word lights up as it is read. Leaving the screen
   (app.show) cancels the speech. */
const INTRO_SAY = { '🔊': 'the speaker button', '⏹': 'the stop button', '—': ',' };
const INTRO_RATE = 0.82;   // Marcos 10/6: 0.92 ran ahead of the highlight
let introToken = 0, introTimer = null;
let introMsPerChar = null, introMsPerWord = null;   // learned from this device's voice
function speakReadAloudIntro() {
  stopActiveSpeech();
  clearTimeout(introTimer);
  const screen = document.getElementById('readaloud-screen');
  const els = Array.from(screen.querySelectorAll('.ra-read'));
  els.forEach(el => { if (!el.querySelector('.wrd')) el.innerHTML = wrapWords(el.innerHTML); });
  // One piece per SENTENCE (Marcos 10/6: the end of a long sentence lost its
  // highlight). Each piece = the words to say + the on-screen word each one lights.
  const pieces = [];
  els.forEach(el => {
    let words = [], wordSpan = [];
    const flush = () => { if (words.length) pieces.push({ words, wordSpan }); words = []; wordSpan = []; };
    el.querySelectorAll('.wrd').forEach(sp => {
      const t = sp.textContent.replace(/\uFE0F/g, '').trim();
      const key = t.replace(/[.!?,]+$/, ''), punct = t.slice(key.length);   // "🔊." → icon + "."
      let say = INTRO_SAY[key] != null ? INTRO_SAY[key] + punct : (/[A-Za-z0-9]/.test(t) ? t : '');
      if (!say) return;
      if (say === ',') { if (words.length) words[words.length - 1] += ','; return; }
      if (/^the /.test(say) && /^(every|each)$/i.test(words[words.length - 1] || '')) say = say.slice(4);
      // past-tense "read" ("is read aloud") must sound like "red", not "reed" (Marcos 10/6)
      if (/^read[.!?,]?$/i.test(say) && /^(is|was|are|were|be|been|being)$/i.test(words[words.length - 1] || '')) say = say.replace(/^read/i, 'red');
      say.split(' ').forEach(w => { words.push(w); wordSpan.push(sp); });
      if (/[.!?]$/.test(say)) flush();
    });
    if (words.length && !/[.!?,]$/.test(words[words.length - 1])) words[words.length - 1] += '.';
    flush();
  });
  const factor = (typeof READ_SPEEDS !== 'undefined' && typeof readSpeed !== 'undefined' && READ_SPEEDS[readSpeed]) ? READ_SPEEDS[readSpeed].factor : 1;
  const rate = INTRO_RATE * factor;
  const token = ++introToken;
  const live = () => token === introToken && !screen.classList.contains('hidden');
  const sayPiece = k => {
    if (!live() || k >= pieces.length) return;
    const p = pieces[k];
    const text = p.words.join(' ');
    const starts = []; let pos = 0;
    p.words.forEach(w => { starts.push(pos); pos += w.length + 1; });
    const lit = new Set(p.wordSpan);
    let idx = -1, lastHeard = 0, startedAt = 0, viaVoice = false;
    const mark = j => {
      j = Math.max(0, Math.min(j, p.words.length - 1));
      if (j === idx) return;
      idx = j;
      lit.forEach(sp => sp.classList.remove('hl'));
      p.wordSpan[j].classList.add('hl');
    };
    // Watchdog: when the voice goes quiet about word positions (some voices
    // never report them, Chrome sometimes stops partway), step on at a
    // speaking pace — never past the last word, which stays lit until the end.
    // Pace comes from how long this voice really took on the sentences before
    // (first sentence: a guess), so the highlight keeps up on any voice.
    // (a hair quick on purpose: the last word stays lit until the voice ends, so early is safe, late is not)
    const wordMs = w => introMsPerChar ? 0.92 * (w.length + 1) * introMsPerChar : (120 + w.replace(/[^A-Za-z0-9]/g, '').length * 55) / rate;
    const tick = () => {
      if (!live()) return;
      // while the voice is reporting words it leads; step in only once it has gone quiet
      const base = wordMs(p.words[idx] || ''), quiet = Date.now() - lastHeard;
      const avg = Math.max(base, introMsPerWord || 0);   // a normal pause between reported words is never "quiet"
      if (idx >= 0 && viaVoice && quiet > avg * 1.8) {
        const n = Math.max(1, Math.floor(quiet / avg));   // catch up the words said while it was quiet
        viaVoice = false; mark(idx + n); lastHeard += n * avg;
      } else if (idx >= 0 && !viaVoice && quiet > base) {
        mark(idx + 1); lastHeard = Math.min(Date.now(), lastHeard + base);   // keep exact time between steps
      }
      introTimer = setTimeout(tick, 60);
    };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate;
    u.onstart = () => { startedAt = lastHeard = Date.now(); mark(0); clearTimeout(introTimer); tick(); };
    u.onboundary = e => {
      if (e.name !== 'word') return;
      let j = 0;
      while (j + 1 < starts.length && starts[j + 1] <= e.charIndex) j++;
      mark(j); lastHeard = Date.now(); viaVoice = true;
    };
    u.onend = () => {
      clearTimeout(introTimer);
      const took = Date.now() - startedAt;
      if (startedAt && live() && took > 300) {   // learn the voice's real speed (skip cancelled/odd pieces)
        const perChar = took / (text.length + 1);
        introMsPerChar = introMsPerChar ? (introMsPerChar + perChar) / 2 : perChar;
        const perWord = took / p.words.length;
        introMsPerWord = introMsPerWord ? (introMsPerWord + perWord) / 2 : perWord;
      }
      lit.forEach(sp => sp.classList.remove('hl'));
      if (live()) introTimer = setTimeout(() => sayPiece(k + 1), 250);
    };
    window.speechSynthesis.speak(u);
  };
  sayPiece(0);
}

function wrapWords(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  let idx = 0;
  function walk(node) {
    if (node.nodeType === 3) {
      const text = node.textContent.replace(/—/g, ' — ').replace(/  +/g, ' ');
      const words = text.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      words.forEach(part => {
        if (/\S/.test(part)) {
          const sp = document.createElement('span');
          sp.className = 'wrd'; sp.dataset.wi = idx++; sp.textContent = part;
          frag.appendChild(sp);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else {
      [...node.childNodes].forEach(walk);
    }
  }
  walk(tmp);
  return tmp.innerHTML;
}

/* ══════════════════════════════════════════════════════
   APP OBJECT
══════════════════════════════════════════════════════ */
/* ── SESSION EVENT LOG ───────────────────────────────
   start · leave · return · resume · close · finish, each with the
   on-task clock. elapsed is time ON TASK: the timer pauses while the
   page is hidden and counts ticks, so a slept device cannot inflate it. */
function logEvent(kind, extra) {
  if (!app.events) app.events = [];
  app.events.push(Object.assign({
    at: new Date().toISOString(),
    e:  kind,
    q:  (app.currentIndex || 0) + 1,
    on: app.timerSeconds || 0
  }, extra || {}));
  if (app.events.length > 200) app.events.splice(0, app.events.length - 200);
}

const app = {

  /* ── state ── */
  studentName:       '',
  currentForm:       '',
  currentBank:       [],
  currentIndex:      0,
  score:             0,
  streak:            0,
  missedQuestions:   [],
  currentAttemptNum: 1,
  selectedAnswer:    null,
  questionLocked:    false,
  timerSeconds:      0,
  timerInterval:     null,
  timerOn:           false,
  instructInterval:  null,
  readInterval:      null,
  nextInterval:      null,

  /* ── screens ── */
  show(id) {
    ['start-screen','readaloud-screen','directions-screen','quiz-screen','end-screen','scoreboard-screen']
      .forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0, 0);   // every new screen starts at the top
    window.speechSynthesis.cancel();
  },

  /* ── INIT ── */
  init() {
    this.show('start-screen');
    document.getElementById('welcome-panel').classList.remove('hidden');
    document.getElementById('student-login-panel').classList.add('hidden');
  },

  /* ── READ ALOUD INTRO ── */
  showReadAloudIntro() {
    if (!PRACTICE_OPEN && !REVIEW_OPEN && !TEST_OPEN) return;
    document.getElementById('welcome-panel').classList.add('hidden');
    this.show('readaloud-screen');
    setTimeout(speakReadAloudIntro, 150);   // announces itself (show() just cancelled any speech)
    const btn   = document.getElementById('readaloud-btn');
    const fill  = document.getElementById('readaloud-fill');
    const count = document.getElementById('readaloud-count');
    btn.disabled = true; btn.style.opacity = '0.45'; btn.style.cursor = 'not-allowed';
    count.textContent = 6;
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = 'width 6s linear';
      fill.style.width = '0%';
    }));
    let remaining = 6;
    const iv = setInterval(() => {
      remaining--;
      count.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(iv);
        btn.disabled = false; btn.style.opacity = '1';
        btn.style.cursor = 'pointer'; btn.textContent = "✅ Got It — Show Me the Directions!";
      }
    }, 1000);
  },

  /* ── DIRECTIONS ── */
  showDirections() {
    this.show('directions-screen');
    this.startInstructionsTimer();
  },

  showLogin() {
    if (this.instructInterval) { clearInterval(this.instructInterval); this.instructInterval = null; }
    window.speechSynthesis.cancel();
    document.querySelectorAll('.dir-text .wrd.hl').forEach(e => e.classList.remove('hl'));
    this.studentName = '';
    loggedInName = '';
    document.getElementById('resume-container').classList.add('hidden');
    document.getElementById('form-select-section').classList.add('hidden');
    const loginCard = document.getElementById('login-step-card');
    if (loginCard) loginCard.classList.remove('hidden');
    this.show('start-screen');
    document.getElementById('welcome-panel').classList.add('hidden');
    document.getElementById('student-login-panel').classList.remove('hidden');
  },

  /* ── NAME SELECT ── */
  onNameSelect() {
    const val = document.getElementById('name-select').value;
    const pinSec   = document.getElementById('pin-section');
    const guestSec = document.getElementById('guest-name-section');
    document.getElementById('login-error').textContent = '';
    if (!val) { pinSec.classList.add('hidden'); return; }
    pinSec.classList.remove('hidden');
    if (val.startsWith('GUEST:')) {
      guestSec.classList.remove('hidden');
      document.getElementById('pin-label').textContent = '🔒 Enter guest code:';
    } else {
      guestSec.classList.add('hidden');
      document.getElementById('pin-label').textContent = '🔒 Enter your student number:';
    }
    setTimeout(() => document.getElementById('student-pin').focus(), 80);
  },

  /* ── LOGIN ── */
  attemptLogin() {
    const selVal = document.getElementById('name-select').value;
    const pin    = document.getElementById('student-pin').value.trim();
    const errEl  = document.getElementById('login-error');
    errEl.textContent = ''; errEl.style.color = '#c0392b';

    if (!selVal) { errEl.textContent = '⚠️ Please select your name.'; return; }
    if (!pin)    { errEl.textContent = '⚠️ Please enter your student number.'; return; }

    let matched = false, displayName = '';

    if (selVal.startsWith('GUEST:')) {
      const code = selVal.replace('GUEST:', '');
      if (pin === code) {
        const firstName = (document.getElementById('guest-display-name').value || '').trim();
        if (!firstName) { errEl.textContent = '⚠️ Please enter your first name.'; return; }
        matched = true;
        displayName = firstName + ' (Guest)';
      } else {
        errEl.textContent = '❌ Incorrect guest code. Try again.'; return;
      }
    } else {
      const student = ROSTER.find(s => s.name === selVal);
      if (student && student.id === pin) {
        matched = true; displayName = selVal;
      } else {
        errEl.textContent = '❌ Incorrect student number. Try again.'; return;
      }
    }

    if (matched) {
      loggedInName     = displayName;
      this.studentName = displayName;
      document.getElementById('student-pin').value = '';
      document.getElementById('login-error').textContent = '';
      const loginCard = document.getElementById('login-step-card');
      if (loginCard) loginCard.classList.add('hidden');
      document.getElementById('form-select-section').classList.remove('hidden');
      retakeUnlocked = false;   // a PIN unlock never carries over to the next student
      applyFormLocks(displayName);
      this.checkResume();
    }
  },

  /* ── ATTEMPT START ── */
  attemptStart(form) {
    if (!this.studentName || !['P', 'A', 'B', 'T'].includes(form) || !formOpen(form)) return;
    // The test is one try — a finished one needs a Teacher-PIN retake
    if (form === 'T' && testCompleted(this.studentName)) { applyFormLocks(this.studentName); return; }
    // The test waits for one finished review; the Teacher PIN can skip that for one student
    if (form === 'T' && !gate(reviewFinished(this.studentName))) {
      this.showPinModal(
        '📘 Review First',
        `${getFirstName(this.studentName)}, finish Review A or Review B before you take the test. ` +
        `Teachers: enter your PIN to let this student take Test A without a review.`,
        () => this.startSession('T')
      );
      return;
    }
    // Each review form is two tries; each extra try needs the Teacher PIN
    if (isReview(form) && getFormAttempts(this.studentName)[form] >= 2) {
      this.showPinModal(
        '🔓 Unlock the Review',
        `${getFirstName(this.studentName)} has already taken Review ${form} two times. Enter Teacher PIN to allow an extra try.`,
        () => this.startSession(form)
      );
      return;
    }
    this.startSession(form);
  },

  /* ── RETAKE (Teacher PIN) ── */
  requestRetake() {
    if (!this.studentName) return;
    this.showPinModal(
      '🔑 Allow a Retake',
      `Enter Teacher PIN to let ${getFirstName(this.studentName)} take a retake. The retake is Test B. It has new numbers.`,
      () => { retakeUnlocked = true; applyFormLocks(this.studentName); }
    );
  },

  startRetake() {
    if (!this.studentName || !retakeUnlocked) return;
    retakeUnlocked = false;            // one PIN = one retake
    this.startSession('U');            // Test B: same skills, new numbers
  },

  /* ── TEACHER REVIEW MODE ── */
  promptTeacherReview() {
    const pin = prompt('Enter Teacher PIN to access Review Mode:');
    if (pin !== '9377') { if (pin !== null) alert('Incorrect PIN.'); return; }
    this.studentName = 'Mr. O (Teacher)';
    reviewMode = true;
    localStorage.removeItem(STORAGE_KEY);
    this._showReviewPicker();
  },

  _showReviewPicker() {
    const form = prompt('Choose a copy to look at:\n1 — Practice\n2 — Review A (hints)\n3 — Review B (no hints)\n4 — Test A (official)\n5 — Test B (retake)\n\nEnter 1, 2, 3, 4 or 5:');
    const map = { '1': 'P', '2': 'A', '3': 'B', '4': 'T', '5': 'U' };
    if (!map[form]) { alert('Invalid choice.'); reviewMode = false; return; }
    const mode = prompt('Choose review mode:\n1 — Manual (tap Next each question)\n2 — Auto-run (fully automatic)\n\nEnter 1 or 2:');
    if (mode !== '1' && mode !== '2') { alert('Invalid choice.'); reviewMode = false; return; }
    reviewAutoRun = (mode === '2');
    this.startSession(map[form]);
  },

  exitReviewMode() {
    reviewMode    = false;
    reviewAutoRun = false;
    this.stopTimerEngine();
    const banner = document.getElementById('review-mode-banner');
    if (banner) banner.classList.add('hidden');
    this.show('start-screen');
    document.getElementById('welcome-panel').classList.remove('hidden');
    document.getElementById('student-login-panel').classList.add('hidden');
  },

  /* The question on screen: the "try one like it" twin while one is up, else the form's own question */
  currentQ() {
    return this.twin || (this.currentBank && this.currentBank[this.currentIndex]) || null;
  },

  /* TRY ONE LIKE IT — after a miss in Review A / B, line up the same kind of
     question with new numbers. Not in the teacher's auto-run. */
  _offerTwin() {
    const bank = window['FORM_' + TWINS[this.currentForm]];
    const orig = this.currentBank[this.currentIndex];
    if (!this.lastMissed || !bank || !orig || reviewAutoRun) return false;
    const t = bank.find(x => x.id.slice(1) === orig.id.slice(1));
    if (!t) return false;
    this.twin = { ...t, choices: [...t.choices].sort(() => Math.random() - 0.5), twinOf: orig.id };
    this.lastMissed = false;
    return true;
  },

  _autoAnswer() {
    const q = this.currentQ();
    document.querySelectorAll('.answer-btn').forEach(btn => {
      if (btn.dataset.answer === q.answer) {
        this._selectChoice(q.answer, btn);
      }
    });
    setTimeout(() => this.confirmAnswer(), 600);
  },

  /* ── START SESSION ── */
  startSession(form) {
    this.events = []; this.startedAt = new Date().toISOString();
    this.finishedAt = '';
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RNDQ_SESSION_ID_KEY);
    tabSwitchCount     = 0;
    const warnBanner = document.getElementById('tab-warning-banner');
    if (warnBanner) warnBanner.classList.add('hidden');
    this.currentForm   = form;
    this.score         = 0;
    this.streak        = 0;
    this.missedQuestions = [];
    this.currentIndex  = 0;
    this.questionLocked = false;   // a finished form leaves it set
    this.twin          = null;
    this.lastMissed    = false;
    this.timerSeconds  = 0;

    const rawBank = [...window['FORM_' + form]];

    const shuffleQ = q => {
      const shuffled = [...q.choices].sort(() => Math.random() - 0.5);
      return { ...q, choices: shuffled };
    };
    this.currentBank = rawBank.map(shuffleQ);
    // Practice keeps its order: easiest first
    if (!isPractice(form)) shuffle(this.currentBank);

    const banner = document.getElementById('review-mode-banner');
    if (banner) {
      banner.classList.toggle('hidden', !reviewMode);
      const label = banner.querySelector('span');
      if (label) label.textContent = reviewAutoRun
        ? '🔍 Teacher Review Mode — auto-run'
        : '🔍 Teacher Review Mode — tap Next to advance';
    }

    this.show('quiz-screen');
    logEvent('start');
    this.startTimer();
    this.renderQuestion();
  },

  /* ── RESUME ── */
  checkResume() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const rc = document.getElementById('resume-container');
    const formSelect = document.getElementById('form-select-section');
    if (saved && rc) {
      const data = JSON.parse(saved);
      if (this.studentName && data.studentName === this.studentName) {
        rc.classList.remove('hidden');
        document.getElementById('resume-detail').textContent =
          `${FORM_NAMES[data.currentForm] || 'Test A'} — Q${data.currentIndex + 1} of ${data.currentBank.length}`;
        if (formSelect) formSelect.classList.add('hidden');
      } else {
        rc.classList.add('hidden');
        if (formSelect && this.studentName) formSelect.classList.remove('hidden');
      }
    } else if (rc) {
      rc.classList.add('hidden');
      if (formSelect && this.studentName) formSelect.classList.remove('hidden');
    }
  },

  resumeSession() {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    this.studentName    = saved.studentName;
    this.currentForm    = saved.currentForm;
    this.currentBank    = saved.currentBank;
    this.currentIndex   = saved.currentIndex;
    this.score          = saved.score;
    this.streak         = saved.streak || 0;
    this.missedQuestions = saved.missedQuestions || [];
    this.timerSeconds   = saved.timerSeconds || 0;
    this.events = saved.events || [];
    this.startedAt = saved.startedAt || new Date().toISOString();
    this.twin = null; this.lastMissed = false;   // a twin is a bonus question — it is not carried across a restart
    logEvent('resume');
    this.show('quiz-screen');
    this.startTimer();
    // Saved right after answering the last question → nothing left to ask
    if (this.currentIndex >= this.currentBank.length) { this._finishSession(); return; }
    this.renderQuestion();
  },

  saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      studentName:     this.studentName,
      currentForm:     this.currentForm,
      currentBank:     this.currentBank,
      currentIndex:    (this.questionLocked || this.twin) ? this.currentIndex + 1 : this.currentIndex, // answered (or on its twin) → resume at the next one
      score:           this.score,
      streak:          this.streak,
      missedQuestions: this.missedQuestions,
      timerSeconds:    this.timerSeconds,
      events: this.events,
      startedAt: this.startedAt
    }));
  },

  discardProgress() {
    this.showPinModal(
      '🗑️ Discard Progress',
      'Enter Teacher PIN to clear the current in-progress session. The student will start fresh.',
      () => {
        localStorage.removeItem(STORAGE_KEY);
        document.getElementById('resume-container').classList.add('hidden');
        applyFormLocks(this.studentName);
        this.checkResume();
      }
    );
  },

  /* ── OVERALL TIMER ── */
  startTimer() {
    this.stopTimerEngine();
    this.timerOn = true;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this._tickTimer();
      if (this.timerSeconds % 30 === 0) this.saveProgress();
    }, 1000);
  },

  stopTimerEngine() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    this.timerOn = false;
  },

  _tickTimer() {
    const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
    const s = String(this.timerSeconds % 60).padStart(2, '0');
    const el = document.getElementById('timer-display');
    if (el) el.textContent = `${m}:${s}`;
  },

  /* ── INSTRUCTIONS LOCK (20s) ── */
  startInstructionsTimer() {
    if (this.instructInterval) { clearInterval(this.instructInterval); this.instructInterval = null; }
    const btn   = document.getElementById('ready-btn');
    const fill  = document.getElementById('instruct-fill');
    const count = document.getElementById('instruct-count');
    if (!btn) return;
    if (reviewMode) {
      btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
      btn.textContent = "✅ Got It — Let's Begin!";
      return;
    }
    btn.disabled = true;
    btn.style.opacity = '0.45';
    btn.style.cursor  = 'not-allowed';
    if (count) count.textContent = INSTRUCT_SECS;
    if (fill) {
      fill.style.transition = 'none';
      fill.style.width = '100%';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.transition = `width ${INSTRUCT_SECS}s linear`;
        fill.style.width = '0%';
      }));
    }
    let remaining = INSTRUCT_SECS;
    this.instructInterval = setInterval(() => {
      remaining--;
      if (count) count.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this.instructInterval);
        this.instructInterval = null;
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor  = 'pointer';
        btn.textContent   = "✅ Got It — Let's Begin!";
      }
    }, 1000);
  },

  /* ── READING LOCK TIMER (12s) ── */
  startReadTimer() {
    if (this.readInterval) { clearInterval(this.readInterval); this.readInterval = null; }
    const bar   = document.getElementById('reading-timer-bar');
    const fill  = document.getElementById('reading-fill');
    const count = document.getElementById('reading-count');

    if (reviewMode) {
      bar.classList.add('hidden');
      document.querySelectorAll('.answer-btn').forEach(b => {
        b.classList.remove('locked-choice'); b.disabled = false;
      });
      setTimeout(() => this._autoAnswer(), 300);
      return;
    }

    bar.classList.remove('hidden');
    count.textContent = READ_SECS;

    // Single CSS transition — truly smooth over full duration
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = `width ${READ_SECS}s linear`;
      fill.style.width = '0%';
    }));

    document.querySelectorAll('.answer-btn').forEach(b => {
      b.classList.add('locked-choice');
      b.disabled = true;
    });

    let remaining = READ_SECS;
    this.readInterval = setInterval(() => {
      remaining--;
      count.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this.readInterval);
        this.readInterval = null;
        bar.classList.add('hidden');
        document.querySelectorAll('.answer-btn').forEach(b => {
          b.classList.remove('locked-choice');
          b.disabled = false;
        });
        document.getElementById('confirm-btn').classList.remove('hidden');
      }
    }, 1000);
  },

  /* ── NEXT SOAK TIMER (8s) ── */
  startNextTimer() {
    if (this.nextInterval) { clearInterval(this.nextInterval); this.nextInterval = null; }
    const bar   = document.getElementById('next-timer-bar');
    const fill  = document.getElementById('next-fill');
    const count = document.getElementById('next-count');

    if (reviewMode) {
      bar.classList.add('hidden');
      if (reviewAutoRun) {
        setTimeout(() => this.nextQuestion(), 800);
      } else {
        document.getElementById('next-btn').classList.remove('hidden');
      }
      return;
    }

    bar.classList.remove('hidden');
    count.textContent = NEXT_SECS;

    // Single CSS transition — truly smooth over full duration
    fill.style.transition = 'none';
    fill.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      fill.style.transition = `width ${NEXT_SECS}s linear`;
      fill.style.width = '0%';
    }));

    let remaining = NEXT_SECS;
    this.nextInterval = setInterval(() => {
      remaining--;
      count.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(this.nextInterval);
        this.nextInterval = null;
        bar.classList.add('hidden');
        document.getElementById('next-btn').classList.remove('hidden');
      }
    }, 1000);
  },

  /* ── RENDER QUESTION ── */
  renderQuestion() {
    setPartBanner(this.currentForm);
    const q     = this.currentQ();
    const total = this.currentBank.length;

    document.getElementById('progress-text').textContent = `Question ${this.currentIndex + 1} of ${total}`;
    // "Try one like it" strip: shown only while a twin question is up
    const twinNote = document.getElementById('twin-note');
    if (twinNote) twinNote.classList.toggle('hidden', !this.twin);
    document.getElementById('score-text').textContent    = `${getFirstName(this.studentName)} · ${this.score}`;
    document.getElementById('progress-fill').style.width = `${(this.currentIndex / total) * 100}%`;

    this._renderStreak();

    // Question text
    const qtEl = document.getElementById('question-text');
    let qHTML = formatMathText(q.q);
    this.hintShown = false;   // every question starts with the hint closed
    if (q.hint) qHTML += hintBoxHTML(q.hint, false);
    qtEl.innerHTML = qHTML;
    // The picture lives outside #question-text, so speakQuestion's
    // word-wrapping never touches it
    document.getElementById('q-visual').innerHTML = M2V.picHTML(q.pic);
    // Word help buttons (not on the tests; the teacher's look at a test shows none either)
    this.wordOpen = null;
    this._renderWords();

    // Reset feedback / buttons
    const fb = document.getElementById('feedback');
    fb.className = 'feedback-box';
    fb.style.display = 'none';
    fb.textContent = '';

    document.getElementById('confirm-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');
    document.getElementById('next-timer-bar').classList.add('hidden');

    // Build choices
    this.selectedAnswer  = null;
    this.questionLocked  = false;
    const wrap = document.getElementById('answers');
    wrap.innerHTML = '';

    q.choices.forEach((text, i) => {
      const row = document.createElement('div');
      row.className = 'answer-row';

      const speakBtn = document.createElement('button');
      speakBtn.className = 'choice-speak-btn';
      speakBtn.textContent = '🔊';
      speakBtn.title = 'Read this choice aloud';
      speakBtn.onclick = e => {
        e.stopPropagation();
        if (activeSpeakBtn === speakBtn) { stopActiveSpeech(); return; }
        stopActiveSpeech();

        // Wrap choice words in spans on first speak for word-by-word highlighting
        if (!btn.querySelector('.wrd')) {
          const parts = text.split(/(\s+)/);
          let choiceHTML = `<strong>${['A','B','C','D'][i]}.</strong>&nbsp;`;
          parts.forEach(w => { choiceHTML += /^\s+$/.test(w) ? w : (w ? `<span class="wrd">${formatMathText(w)}</span>` : ''); });
          btn.innerHTML = choiceHTML.trim();
        }
        const hlSpans = Array.from(btn.querySelectorAll('.wrd'));

        activeSpeakBtn = speakBtn;
        speakBtn.textContent = '⏹';

        let hlIdx = 0;
        const u = new SpeechSynthesisUtterance(convertToSpokenText(text));
        u.lang = 'en-US'; u.rate = 0.9;
        u.onboundary = e => {
          if (e.name !== 'word') return;
          btn.querySelectorAll('.wrd.hl').forEach(el => el.classList.remove('hl'));
          if (hlSpans[hlIdx]) hlSpans[hlIdx].classList.add('hl');
          hlIdx++;
        };
        u.onend = () => {
          btn.querySelectorAll('.wrd.hl').forEach(el => el.classList.remove('hl'));
          if (activeSpeakBtn === speakBtn) { speakBtn.textContent = '🔊'; activeSpeakBtn = null; }
        };
        addHighlightFallback(u, hlSpans);
        window.speechSynthesis.speak(u);
      };

      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.dataset.answer = text;
      btn.innerHTML = `<strong>${['A','B','C','D'][i]}.</strong>&nbsp;${formatMathText(text)}`;
      btn.onclick = () => this._selectChoice(text, btn);

      row.appendChild(speakBtn);
      row.appendChild(btn);
      wrap.appendChild(row);
    });

    if (!this.twin && this.currentIndex > 0 && this.currentIndex % 5 === 0) submitScorePartial();
    this.saveProgress();
    this.startReadTimer();
  },

  _selectChoice(text, btn) {
    if (this.questionLocked) return;
    document.querySelectorAll('.answer-btn').forEach(b => b.classList.remove('selected'));
    this.selectedAnswer = text;
    btn.classList.add('selected');
  },

  _renderStreak() {
    const el = document.getElementById('streak-bar');
    if (this.streak >= 3) {
      el.textContent = '🔥'.repeat(Math.min(this.streak, 8)) + ` ${this.streak} in a row!`;
    } else {
      el.textContent = '';
    }
  },

  /* ── CONFIRM ANSWER ── */
  confirmAnswer() {
    if (!this.selectedAnswer) return;
    this.questionLocked = true;

    const q = this.currentQ();
    const correct = this.selectedAnswer === q.answer;
    const isTwin = !!this.twin;

    if (isTwin) {
      // "Try one like it" never changes the score. The result rides in the event
      // log (the dashboard reads it) and on the miss it follows (the end screen shows it).
      logEvent('twin', Object.assign({ id: q.id, of: q.twinOf, ok: correct }, correct ? {} : { pick: this.selectedAnswer }));
      const m = this.missedQuestions[this.missedQuestions.length - 1];
      if (m && m.id === q.twinOf) m.twin = correct ? 'right' : 'wrong';
    } else if (correct) {
      this.score++;
      this.streak++;
      this.lastMissed = false;
    } else {
      this.streak = 0;
      this.lastMissed = true;
      this.missedQuestions.push({ id: q.id, q: q.q, skill: (window.SKILLS || {})[q.id], yourAnswer: this.selectedAnswer, correct: q.answer, explanation: q.explanation || '' });
    }

    // Review A and Review B teach: the right answer + why, every time.
    // Test A and Test B: mark only the student's own pick — the right
    // answer is never shown (the teacher's review mode still sees it).
    const teach = teaches(this.currentForm) || reviewMode;
    document.querySelectorAll('.answer-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.dataset.answer === this.selectedAnswer) btn.classList.add(correct ? 'correct' : 'incorrect');
      else if (teach && btn.dataset.answer === q.answer) btn.classList.add('correct');
    });

    const fb = document.getElementById('feedback');
    fb.className = 'feedback-box ' + (correct ? 'correct' : 'incorrect');
    fb.style.display = 'block';
    // A wrong answer names the mistake (Marcos 10/10): each wrong choice stands for one slip
    const slip = !correct && teach && q.slips ? q.slips[this.selectedAnswer] : null;
    fb.innerHTML = !teach
      ? (correct ? `✅ <strong>Correct!</strong>` : `❌ <strong>Not quite.</strong>`)
      : correct
        ? `✅ <strong>Correct!</strong>${isTwin ? ' You fixed it!' : ''}<br>${formatMathText(q.explanation)}`
        : `❌ <strong>Not quite.</strong>${slip ? ` <span class="slip-note">${formatMathText(slip.say)}</span>` : ''} The correct answer is: <strong>${formatMathText(q.answer)}</strong><br>${formatMathText(q.explanation)}`;

    // Feedback read-aloud button
    const fbSpeakBtn = document.createElement('button');
    fbSpeakBtn.className = 'speak-btn';
    fbSpeakBtn.style.cssText = 'float:left;margin:0 10px 4px 0;';
    fbSpeakBtn.textContent = '🔊';
    // Wrap feedback words in spans for word-by-word highlighting (skip emoji-only tokens)
    fb.innerHTML = wrapWords(fb.innerHTML);
    const fbSpans = Array.from(fb.querySelectorAll('.wrd')).filter(s => /[A-Za-z0-9+=×−]/.test(s.textContent))   /* keep + − = × so they are read aloud */;
    const spokenFb = convertToSpokenText(fbSpans.map(s => {
      const gap = s.nextSibling && s.nextSibling.nodeType === 3 && /\u00a0{2,}/.test(s.nextSibling.textContent);
      return s.textContent + (gap ? ',' : '');
    }).join(' '));
    fbSpeakBtn.onclick = () => {
      if (activeSpeakBtn === fbSpeakBtn) { stopActiveSpeech(); return; }
      stopActiveSpeech();
      activeSpeakBtn = fbSpeakBtn; fbSpeakBtn.textContent = '⏹';
      const u = new SpeechSynthesisUtterance(spokenFb);
      u.lang = 'en-US'; u.rate = 0.9;
      let hlIdx = 0;
      u.onboundary = e => {
        if (e.name !== 'word') return;
        fbSpans.forEach(el => el.classList.remove('hl'));
        if (fbSpans[hlIdx]) fbSpans[hlIdx].classList.add('hl');
        hlIdx++;
      };
      u.onend = () => {
        fbSpans.forEach(el => el.classList.remove('hl'));
        fbSpeakBtn.textContent = '🔊'; if (activeSpeakBtn === fbSpeakBtn) activeSpeakBtn = null;
      };
      addHighlightFallback(u, fbSpans);
      window.speechSynthesis.speak(u);
    };
    fb.prepend(fbSpeakBtn);

    // Review: show the worked pictures (bar model · rectangle · columns)
    if (teach) fb.insertAdjacentHTML('beforeend', M2V.explainHTML(q.explain));

    document.getElementById('confirm-btn').classList.add('hidden');
    document.getElementById('score-text').textContent = `${getFirstName(this.studentName)} · ${this.score}`;
    this._renderStreak();
    this.saveProgress();
    this.startNextTimer();
  },

  /* ── NEXT QUESTION ── */
  nextQuestion() {
    stopActiveSpeech();
    if (this.twin) {
      this.twin = null;                       // the twin is done → on to the next question of the form
    } else if (TWINS[this.currentForm] && this._offerTwin()) {
      this.renderQuestion();                  // a miss in a review → try one like it
      return;
    }
    this.currentIndex++;
    if (this.currentIndex >= this.currentBank.length) {
      this._finishSession();
    } else {
      this.renderQuestion();
    }
  },

  /* ── FINISH SESSION ── */
  _finishSession() {
    this.twin = null;
    this.finishedAt = new Date().toISOString(); logEvent('finish');
    this.stopTimerEngine();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(RNDQ_SESSION_ID_KEY);

    const total = this.currentBank.length;
    const pct   = Math.round((this.score / total) * 100);
    const date  = new Date();

    const scores   = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
    const prevDone = reviewMode ? 0 : scores.filter(s => s.name === this.studentName && s.form === this.currentForm && s.done).length;
    const attemptNum = prevDone + 1;
    this.currentAttemptNum = attemptNum;

    if (!reviewMode) {
      scores.push({
        name:    this.studentName,
        form:    this.currentForm,
        attempt: attemptNum,
        score:   this.score,
        total,
        pct,
        elapsed: this.timerSeconds,
        date:    date.toLocaleDateString(),
        time:    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        done:    true
      });
      localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    }

    submitScoreFinal();

    let letter = 'F', msg = "Let's practice more! 📚";
    if (pct === 100) { letter = 'A+'; msg = "⭐ PERFECT SCORE! ⭐"; }
    else if (pct >= 90) { letter = 'A'; msg = "Outstanding Work! 🌟"; }
    else if (pct >= 80) { letter = 'B'; msg = "Great Job! 👏"; }
    else if (pct >= 70) { letter = 'C'; msg = "Good Effort! 💪"; }
    else if (pct >= 60) { letter = 'D'; msg = "Keep Practicing! 🔄"; }

    this.show('end-screen');

    const reviewNextBtn = document.getElementById('review-next-btn');
    if (reviewNextBtn) reviewNextBtn.classList.toggle('hidden', !reviewMode);
    const againBtn = document.getElementById('end-again-btn');
    if (againBtn) againBtn.classList.toggle('hidden', reviewMode);
    document.getElementById('end-title').textContent =
      isPractice(this.currentForm) ? '🎉 Practice Complete!' : isReview(this.currentForm) ? '🎉 Review Complete!' : '🎉 Test Complete!';

    document.getElementById('final-score-sub').textContent =
      `${formLabel(attemptNum)}${attemptNum > 1 ? ' · Attempt ' + attemptNum : ''} · ${this.studentName}`;
    document.getElementById('final-msg').textContent = msg;

    const pctEl = document.getElementById('final-percent');
    pctEl.innerHTML = `${this.score}/${total}<br><small style="font-size:0.5em;color:${pct>=70?'var(--correct)':'var(--danger)'};">${pct}% · ${letter}</small>`;
    setTimeout(() => pctEl.classList.add('revealed'), 50);

    const missedSec = document.getElementById('missed-section');
    // The review shows the fix for every miss; the test shows the pick only.
    const showFix = teaches(this.currentForm) || reviewMode;
    if (this.missedQuestions.length) {
      missedSec.classList.remove('hidden');
      document.getElementById('missed-items').innerHTML =
        this.missedQuestions.map(m =>
          `<div class="missed-item">
            <div class="mi-label">${m.id}</div>
            <div style="margin:3px 0;">${formatMathText(m.q)}</div>
            <div>Your answer: <span style="color:var(--danger);">${formatMathText(m.yourAnswer)}</span>${showFix ? ` &nbsp; ✅ Correct: <strong style="color:var(--correct);">${formatMathText(m.correct)}</strong>` : ''}</div>
            ${showFix && m.explanation ? `<div style="margin-top:5px;font-size:0.85rem;color:#555;font-style:italic;">💡 ${formatMathText(m.explanation)}</div>` : ''}
            ${m.twin ? `<div class="mi-twin ${m.twin}">🔁 Try one like it: ${m.twin === 'right' ? '✅ you got the next one right' : '❌ missed again — ask for help with this one'}</div>` : ''}
          </div>`
        ).join('');
    } else {
      missedSec.classList.add('hidden');
    }

    if (pct >= 70) startConfetti(pct);
  },

  /* 📖 Word help: draw the buttons (and the open card) under the question */
  _renderWords() {
    const box = document.getElementById('q-words');
    if (!box) return;
    const q = this.currentQ();
    box.innerHTML = q && !isTest(this.currentForm) ? wordChipsHTML(q, this.wordOpen) : '';
  },

  /* Tap a word button → its card opens (tap again → closes). Nothing is read until its 🔊 is tapped. */
  showWord(key) {
    const q = this.currentQ();
    if (!q) return;
    stopActiveSpeech();
    const opening = this.wordOpen !== key;
    this.wordOpen = opening ? key : null;
    if (opening) { logEvent('word', { id: q.id, w: key }); this.saveProgress(); }
    this._renderWords();
    const focus = document.querySelector(opening ? '#q-words .word-speak-btn' : `#q-words .word-chip`);
    if (focus) focus.focus();
  },

  /* ── SPEAK QUESTION ── */
  /* 💡 Need a hint? → open the hint box (not read aloud until its own 🔊 is tapped) */
  showHint() {
    const q = this.currentQ();
    const wrap = document.querySelector('#question-text .hint-wrap');
    if (!q || !q.hint || !wrap) return;
    this.hintShown = true;
    // Hint use is saved in the attempt's event log → the dashboard shows who
    // opened which hint (Marcos 10/8: "add hint tracking to dashboard")
    logEvent('hint', { id: q.id });
    this.saveProgress();
    wrap.outerHTML = hintBoxHTML(q.hint, true);
    const btn = document.querySelector('#question-text .hint-speak-btn');
    if (btn) btn.focus();
  },

  speakQuestion() {
    const qBtn = document.getElementById('speak-q-btn');
    if (activeSpeakBtn === qBtn) { stopActiveSpeech(); return; }
    stopActiveSpeech();
    activeSpeakBtn = qBtn;
    qBtn.textContent = '⏹';

    const q = this.currentQ();
    if (!q) return;

    // the hint box is read aloud after the question (class reads mostly at Level 1)
    // the question only — a hint is read by its own 🔊, and only after the student opens it
    const spokenText = convertToSpokenText(q.q);
    const qtEl = document.getElementById('question-text');
    const originalWords = q.q.split(/\s+/);

    let qHTML = '';
    originalWords.forEach((w, i) => {
      qHTML += `<span class="wrd" id="wrd${i}">${formatMathText(w)}</span> `;
    });
    if (q.hint) qHTML += hintBoxHTML(q.hint, this.hintShown);
    qtEl.innerHTML = qHTML;

    const hlSpans = originalWords.map((_, i) => document.getElementById('wrd' + i));
    let hlIdx = 0;

    const u = new SpeechSynthesisUtterance(spokenText);
    u.lang = 'en-US'; u.rate = 0.92;

    u.onboundary = e => {
      if (e.name !== 'word') return;
      document.querySelectorAll('#question-text .wrd.hl').forEach(el => el.classList.remove('hl'));
      if (hlSpans[hlIdx]) hlSpans[hlIdx].classList.add('hl');
      hlIdx++;
    };
    u.onend = () => {
      document.querySelectorAll('#question-text .wrd.hl').forEach(el => el.classList.remove('hl'));
      if (activeSpeakBtn === qBtn) { qBtn.textContent = '🔊'; activeSpeakBtn = null; }
    };
    addHighlightFallback(u, hlSpans.filter(Boolean));
    window.speechSynthesis.speak(u);
  },

  /* ── SCORES ── */
  showScores(autoShow = false) {
    this.show('scoreboard-screen');
    const teacherBtns = document.getElementById('teacher-score-btns');
    if (teacherBtns) teacherBtns.style.display = this.studentName === 'Mr. O (Teacher)' ? 'flex' : 'none';
    if (!reviewMode) this._startScoreLock(autoShow ? 60 : 0);

    const all    = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
    const listEl = document.getElementById('score-list');
    const noEl   = document.getElementById('no-scores-msg');

    if (!all.length) {
      listEl.innerHTML = '';
      noEl.style.display = 'block';
      return;
    }
    noEl.style.display = 'none';

    const forms = FORMS;

    const summaryCards = forms.map(form => {
      const best = all.filter(s => s.form === form && s.done)
        .reduce((b, r) => (!b || r.pct > b.pct) ? r : b, null);
      if (!best) {
        return `<div class="sb-summary-card">
          <div class="sb-summary-label">${FORM_NAMES[form]}</div>
          <div class="sb-summary-grade" style="color:#ccc;">—</div>
          <div class="sb-summary-score" style="color:#aaa;">Not yet completed</div>
        </div>`;
      }
      const grade = letterGrade(best.pct);
      const gc = best.pct>=90?'#27ae60':best.pct>=80?'#2980b9':best.pct>=70?'#f39c12':best.pct>=60?'#e67e22':'#e74c3c';
      return `<div class="sb-summary-card">
        <div class="sb-summary-label">${FORM_NAMES[form]}</div>
        <div class="sb-summary-grade" style="color:${gc};">${grade}</div>
        <div class="sb-summary-score">${best.score}/${best.total} · ${best.pct}%</div>
        <div class="sb-summary-attempt">Best of ${all.filter(s=>s.form===form&&s.done).length} attempt(s)</div>
      </div>`;
    }).join('');

    const details = forms.map(form => {
      const rows = all.filter(s => s.form === form && s.done);
      if (!rows.length) return '';
      const att1 = rows.filter(r => (r.attempt||1) === 1);
      const att2 = rows.filter(r => (r.attempt||1) >= 2);

      const buildTable = (attempts, label, headerColor) => {
        if (!attempts.length) return '';
        return `<div style="margin-bottom:14px;">
          <div style="display:inline-block;background:${headerColor};color:white;
                      font-size:0.72rem;font-weight:bold;letter-spacing:1px;
                      text-transform:uppercase;border-radius:6px;padding:3px 10px;
                      margin-bottom:6px;">${label}</div>
          <table class="scoreboard-table">
            <thead><tr><th>Score</th><th>%</th><th>Grade</th><th>Time</th><th>Date</th></tr></thead>
            <tbody>${attempts.map(r => {
              const grade = letterGrade(r.pct);
              const cls   = r.pct>=90?'score-good':r.pct>=70?'score-ok':'score-bad';
              return `<tr>
                <td>${r.score}/${r.total}</td>
                <td class="${cls}">${r.pct}%</td>
                <td class="${cls}" style="font-weight:800;">${grade}</td>
                <td>${r.time||'—'}</td>
                <td>${r.date}</td>
              </tr>`;
            }).join('')}</tbody>
          </table>
        </div>`;
      };

      return `<h3 style="color:var(--primary);margin:22px 0 8px;border-bottom:2px solid #e0e0e0;padding-bottom:6px;">${FORM_NAMES[form]}</h3>
        ${buildTable(att1,'Attempt 1','#5b3cc4')}
        ${buildTable(att2,'Attempt 2','#f39c12')}`;
    }).join('');

    listEl.innerHTML = `
      <div style="margin-bottom:6px;font-size:0.8rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;">Your Best Scores</div>
      <div class="sb-summary-row">${summaryCards}</div>
      <div style="margin-top:24px;">${details}</div>`;
  },

  _startScoreLock(secs) {
    const bar     = document.getElementById('sb-lock-bar');
    const fill    = document.getElementById('sb-lock-fill');
    const count   = document.getElementById('sb-lock-count');
    const buttons = document.querySelectorAll('#scoreboard-screen button:not(#sb-lock-bar button)');
    if (!secs || secs <= 0) { if (bar) bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    fill.style.width = '100%';
    count.textContent = secs;
    buttons.forEach(b => { b.disabled = true; b.style.opacity = '0.4'; });
    let remaining = secs;
    const iv = setInterval(() => {
      remaining--;
      count.textContent = remaining;
      fill.style.width = (remaining / secs * 100) + '%';
      if (remaining <= 0) {
        clearInterval(iv);
        bar.classList.add('hidden');
        buttons.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
      }
    }, 1000);
  },

  clearScores() {
    const panel = document.getElementById('clear-confirm-panel');
    panel.classList.remove('hidden');
    document.getElementById('clear-pin-input').value = '';
    document.getElementById('clear-pin-error').textContent = '';
    setTimeout(() => document.getElementById('clear-pin-input').focus(), 80);
  },

  confirmClearScores() {
    const pin = document.getElementById('clear-pin-input').value.trim();
    if (pin === '9377') {
      localStorage.removeItem(SCORES_KEY);
      document.getElementById('clear-confirm-panel').classList.add('hidden');
      this.showScores();
    } else {
      document.getElementById('clear-pin-error').textContent = '❌ Incorrect PIN. Try again.';
      document.getElementById('clear-pin-input').value = '';
      document.getElementById('clear-pin-input').focus();
    }
  },

  cancelClearScores() {
    document.getElementById('clear-confirm-panel').classList.add('hidden');
  },

  printResults() {
    const all = JSON.parse(localStorage.getItem(SCORES_KEY) || '[]');
    if (!all.length) { alert('No scores to print yet!'); return; }
    const rows = FORMS.flatMap(form =>
      all.filter(s => s.form === form).map(r => {
        const cc  = r.pct >= 80 ? 'good' : r.pct >= 60 ? 'ok' : 'bad';
        const att = r.attempt || 1;
        const attStyle = att === 1
          ? 'background:#d35400;color:white;padding:2px 7px;border-radius:4px;font-size:0.8em;'
          : 'background:#f39c12;color:#5a3000;padding:2px 7px;border-radius:4px;font-size:0.8em;';
        return `<tr>
          <td>${r.name||'—'}</td>
          <td>${FORM_NAMES[r.form] || 'Form ' + r.form}</td>
          <td><span style="${attStyle}">Attempt ${att}</span></td>
          <td>${r.score}/${r.total}</td>
          <td class="${cc}">${r.pct}%</td>
          <td>${r.time||'—'}</td>
          <td>${r.date}</td>
        </tr>`;
      })
    ).join('');
    const html = `<html><head><title>Math Module 2 Review and Test Scores</title>
      <style>body{font-family:Arial;padding:20px;}h2{color:#5b3cc4;}
      table{width:100%;border-collapse:collapse;margin-top:12px;}
      th,td{border:1px solid #ccc;padding:8px 12px;text-align:center;}
      th{background:#5b3cc4;color:white;}
      .good{color:green;font-weight:bold;}.ok{color:orange;font-weight:bold;}.bad{color:red;font-weight:bold;}</style>
      </head><body>
      <h2>🧮 Math Module 2 Review and Test — Score Report</h2>
      <p>Printed: ${new Date().toLocaleString()}</p>
      <table><tr><th>Name</th><th>Form</th><th>Attempt</th><th>Score</th><th>%</th><th>Time</th><th>Date</th></tr>${rows}</table>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close(); w.print();
  },

  /* ── END SCREEN ACTIONS ── */
  tryAgain() {
    stopConfetti();
    this.timerSeconds = 0;
    this.show('start-screen');
    document.getElementById('welcome-panel').classList.add('hidden');
    document.getElementById('student-login-panel').classList.remove('hidden');
    applyFormLocks(this.studentName);
    this.checkResume();
  },

  restart() {
    stopConfetti();
    this.stopTimerEngine();
    this.timerSeconds   = 0;
    this.studentName    = '';
    loggedInName        = '';
    unlockedForms       = new Set();
    retakeUnlocked      = false;
    document.getElementById('name-select').value = '';
    document.getElementById('student-pin').value = '';
    document.getElementById('pin-section').classList.add('hidden');
    document.getElementById('form-select-section').classList.add('hidden');
    document.getElementById('resume-container').classList.add('hidden');
    document.getElementById('login-error').textContent = '';
    const loginCard = document.getElementById('login-step-card');
    if (loginCard) loginCard.classList.remove('hidden');
    this.show('start-screen');
    document.getElementById('welcome-panel').classList.remove('hidden');
    document.getElementById('student-login-panel').classList.add('hidden');
  },

  /* ── GLOBAL PIN MODAL ── */
  showPinModal(title, msg, onSuccess) {
    pinModalCallback = onSuccess;
    document.getElementById('pin-modal-title').textContent = title;
    document.getElementById('pin-modal-msg').textContent   = msg;
    document.getElementById('pin-modal-input').value       = '';
    document.getElementById('pin-modal-error').textContent = '';
    document.getElementById('pin-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('pin-modal-input').focus(), 80);
  },

  confirmPinModal() {
    const pin = document.getElementById('pin-modal-input').value.trim();
    if (pin === '9377') {
      document.getElementById('pin-modal').classList.add('hidden');
      const cb = pinModalCallback;
      pinModalCallback = null;
      if (cb) cb();
    } else {
      document.getElementById('pin-modal-error').textContent = '❌ Incorrect PIN. Try again.';
      document.getElementById('pin-modal-input').value = '';
      document.getElementById('pin-modal-input').focus();
    }
  },

  cancelPinModal() {
    document.getElementById('pin-modal').classList.add('hidden');
    pinModalCallback = null;
  }
};

/* ── VISIBILITY / UNLOAD ─────────────────────────────── */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (!app.timerOn) return;
    tabSwitchCount++;
    logEvent('leave');
    app.stopTimerEngine();
    app.saveProgress();
    if (app.instructInterval) { clearInterval(app.instructInterval); }
    if (app.readInterval)     { clearInterval(app.readInterval); app.readInterval = null; app._readLockPaused = true; }
    app._wasTimerRunning = true;
  } else {
    if (!app._wasTimerRunning) return;
    app._wasTimerRunning = false;
    logEvent('return');
    const warnBanner = document.getElementById('tab-warning-banner');
    if (warnBanner) warnBanner.classList.remove('hidden');
    app.stopTimerEngine();
    app.timerInterval = setInterval(() => {
      app.timerSeconds++;
      app._tickTimer();
      if (app.timerSeconds % 30 === 0) app.saveProgress();
    }, 1000);
    app.timerOn = true;
    // The read lock stopped while the page was hidden; start it over so the
    // answers unlock again (left alone they stayed locked until a refresh).
    if (app._readLockPaused) { app._readLockPaused = false; app.startReadTimer(); }
  }
});

window.addEventListener('beforeunload', () => {
  if (app.timerOn) logEvent('close');
  if (app.timerOn) app.saveProgress();
});

/* ── CONFETTI ────────────────────────────────────────── */
const canvas = document.getElementById('confetti-canvas');
const ctx    = canvas.getContext('2d');
let particles = [], animId = null;

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

function startConfetti(pct) {
  particles = [];
  let count, cols;
  if (pct === 100) {
    count = 300;
    cols = ['#FFD700','#FFA500','#FFFACD','#f39c12','#ffffff','#FFD700'];
  } else if (pct >= 90) {
    count = 220;
    cols = ['#d35400','#f39c12','#2ecc71','#3498db','#9b59b6','#e74c3c','#FFD700'];
  } else if (pct >= 80) {
    count = 160;
    cols = ['#d35400','#f39c12','#2ecc71','#3498db','#e74c3c','#9b59b6'];
  } else {
    count = 80;
    cols = ['#d35400','#f39c12','#7f8c8d','#95a5a6','#bdc3c7'];
  }
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      c: cols[~~(Math.random() * cols.length)],
      s: Math.random() * 5 + 3,
      d: Math.random() * 5 + 2,
      r: Math.random() * Math.PI * 2
    });
  }
  animateConfetti();
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r += 0.05);
    ctx.fillStyle = p.c; ctx.fillRect(-p.s/2, -p.s/2, p.s, p.s);
    ctx.restore();
    p.y += p.d; p.x += Math.sin(p.r) * 1.5;
    if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
  });
  animId = requestAnimationFrame(animateConfetti);
}

function stopConfetti() {
  if (animId) cancelAnimationFrame(animId);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  animId = null;
}

/* ── BOOT ────────────────────────────────────────────── */
app.init();

/* ── CLOSED-TO-STUDENTS LOCK ────────────────────────── */
(function applyReviewLock() {
  if (PRACTICE_OPEN || REVIEW_OPEN || TEST_OPEN) return;   // any part open → students can get in
  const btn = document.querySelector('.lgs-btn');
  if (!btn) return;
  btn.disabled = true;
  btn.classList.add('locked');
  btn.textContent = '🔒 Not Open Yet';
  const note = document.createElement('p');
  note.className = 'locked-note';
  note.textContent = "Mr. O will let you know when this is ready!";
  btn.insertAdjacentElement('afterend', note);
})();

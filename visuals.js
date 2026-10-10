/* ═══════════════════════════════════════════════════════
   MATH MODULE 2 REVIEW AND TEST · visuals.js
   The pictures that go with a question or its explanation.
   Each one is built from numbers in the data file, so the
   picture can never disagree with the answer:
   - stack : the problem worked in columns, with the regrouping
             marks a student would write (carried 1s when adding,
             crossed-out digits when subtracting)
   - rect  : a rectangle or square with its sides labeled
   - bar   : the parts / total bar model for comparison problems
             (same model as the M1–M2 review homework)
   - work  : short lines of work, used for the rounding estimates
   A question can carry `pic` (shown under the question) and
   `explain` (shown in the feedback when the form teaches).
═══════════════════════════════════════════════════════ */
(function (root) {
  const fmt = n => Number(n).toLocaleString('en-US');
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ── COLUMN WORK ─────────────────────────────────────
     Works a + b or a − b the way the standard algorithm does, right to
     left, and keeps what a student writes above the top number:
     adding      → a small 1 over the next place each time a place makes 10+
     subtracting → the new value over every top digit that changed
                   (5,032 − 3,981: the 5 becomes 4, the 0 becomes 9, the 3 becomes 13) */
  function stackModel(a, b, op) {
    const res = op === '+' ? a + b : a - b;
    const n = Math.max(String(a).length, String(b).length, String(res).length);
    const pad = v => String(v).padStart(n, ' ').split('');
    const A = pad(a), B = pad(b), R = pad(res);
    const digit = (arr, i) => (arr[i] === ' ' ? 0 : Number(arr[i]));
    const marks = new Array(n).fill('');
    const struck = new Array(n).fill(false);
    if (op === '+') {
      let carry = 0;
      for (let i = n - 1; i >= 0; i--) {
        if (carry) marks[i] = '1';
        carry = digit(A, i) + digit(B, i) + carry >= 10 ? 1 : 0;
      }
    } else {
      let borrow = 0;
      for (let i = n - 1; i >= 0; i--) {
        let cur = digit(A, i) - borrow;
        if (cur < digit(B, i)) { cur += 10; borrow = 1; } else { borrow = 0; }
        if (A[i] !== ' ' && cur !== digit(A, i)) { marks[i] = String(cur); struck[i] = true; }
      }
    }
    return { n, A, B, R, marks, struck, res };
  }

  function stackHTML(cfg) {
    const m = stackModel(cfg.a, cfg.b, cfg.op);
    const sign = cfg.op === '+' ? '+' : '−';
    // the thousands digit (and the millions digit) carries the comma
    const cell = (ch, i, cls) => {
      const fromRight = m.n - 1 - i;
      const comma = ch !== ' ' && fromRight > 0 && fromRight % 3 === 0;
      const klass = [cls, comma ? 'm2-comma' : ''].filter(Boolean).join(' ');
      return `<td${klass ? ` class="${klass}"` : ''}>${ch === ' ' ? '' : ch}</td>`;
    };
    const row = (arr, cls, lead, each) =>
      `<tr${cls ? ` class="${cls}"` : ''}><td class="m2-op">${lead}</td>${arr.map((ch, i) => cell(ch, i, each ? each(i) : '')).join('')}</tr>`;
    const hasMarks = m.marks.some(Boolean);
    const marksRow = hasMarks
      ? `<tr class="m2-marks"><td class="m2-op"></td>${m.marks.map(v => `<td>${v}</td>`).join('')}</tr>` : '';
    const said = `${fmt(cfg.a)} ${cfg.op === '+' ? 'plus' : 'minus'} ${fmt(cfg.b)} equals ${fmt(m.res)}, worked in columns`;
    return `<div class="m2-vis m2-stack-wrap"><table class="m2-stack" role="img" aria-label="${said}">` +
      marksRow +
      row(m.A, '', '', i => (m.struck[i] ? 'm2-struck' : '')) +
      row(m.B, 'm2-bot', sign) +
      row(m.R, 'm2-ans', '') +
      `</table></div>`;
  }

  /* ── RECTANGLE / SQUARE ──────────────────────────────
     cfg = { l, w, unit, sides: 'all' | 'one', name }
     sides 'all' labels all four sides (the worked picture);
     sides 'one' labels a single side (a square in a question). */
  function rectSVG(cfg) {
    const W = 640, H = 210, RH = 112;
    const ratio = Math.max(1, Math.min(2.4, cfg.l / cfg.w));
    const RW = Math.round(RH * ratio);
    const x0 = (W - RW) / 2, y0 = 48;
    const lenLabel = `${cfg.l} ${cfg.unit}`, widLabel = `${cfg.w} ${cfg.unit}`;
    const square = cfg.l === cfg.w;
    let s = `<rect x="${x0}" y="${y0}" width="${RW}" height="${RH}" rx="3" class="m2-rect-shape"/>`;
    if (cfg.name) {
      const lines = String(cfg.name).split('\n');
      const top = y0 + RH / 2 - (lines.length - 1) * 11 + 6;
      lines.forEach((ln, i) => { s += `<text x="${W / 2}" y="${top + i * 22}" class="m2-rect-name">${esc(ln)}</text>`; });
    }
    s += `<text x="${x0 + RW + 14}" y="${y0 + RH / 2 + 7}" class="m2-rect-label m2-rect-side">${esc(widLabel)}</text>`;
    if (cfg.sides === 'all' || !square) {
      s += `<text x="${W / 2}" y="${y0 - 12}" class="m2-rect-label">${esc(lenLabel)}</text>`;
    }
    if (cfg.sides === 'all') {
      s += `<text x="${W / 2}" y="${y0 + RH + 28}" class="m2-rect-label">${esc(lenLabel)}</text>`;
      s += `<text x="${x0 - 14}" y="${y0 + RH / 2 + 7}" class="m2-rect-label m2-rect-side-left">${esc(widLabel)}</text>`;
    }
    const said = square
      ? `A square. Each side is ${lenLabel}.`
      : `A rectangle. It is ${lenLabel} long and ${widLabel} wide.`;
    return `<div class="m2-vis m2-rect-wrap"><svg viewBox="0 0 ${W} ${H}" class="m2-rect" role="img" aria-label="${esc(said)}">${s}</svg></div>`;
  }

  /* ── BAR MODEL (parts on top, total on the bottom) ───
     cfg = { total, part, answer } — the answer is the other part,
     shown in green because this picture only appears in the explanation. */
  function barHTML(cfg) {
    const share = Math.max(28, Math.min(72, Math.round(cfg.part / cfg.total * 100)));
    const said = `Bar model. The total is ${fmt(cfg.total)}. One part is ${fmt(cfg.part)}. The other part is ${fmt(cfg.answer)}.`;
    return `<div class="m2-vis m2-bar" role="img" aria-label="${said}">` +
      `<div class="m2-bar-labs" aria-hidden="true"><span>Parts</span><span>Total</span></div>` +
      `<div class="m2-bar-box" aria-hidden="true">` +
        `<div class="m2-bar-top" style="grid-template-columns:${share}fr ${100 - share}fr">` +
          `<div>${fmt(cfg.part)}</div><div class="m2-bar-ans">${fmt(cfg.answer)}</div></div>` +
        `<div class="m2-bar-bot">${fmt(cfg.total)}</div>` +
      `</div></div>`;
  }

  /* ── LINES OF WORK (rounding, then adding or subtracting) ── */
  function workHTML(lines) {
    const said = lines.map(l => l.replace(/→/g, 'rounds to').replace(/−/g, 'minus').replace(/\+/g, 'plus').replace(/=/g, 'equals')).join('. ');
    return `<div class="m2-vis m2-work" role="img" aria-label="${esc(said)}">` +
      lines.map((l, i) => `<div${i === lines.length - 1 ? ' class="m2-work-last"' : ''} aria-hidden="true">${esc(l)}</div>`).join('') +
      `</div>`;
  }

  /* Picture under the question */
  function picHTML(pic) {
    if (!pic) return '';
    return pic.rect ? rectSVG(pic.rect) : '';
  }

  /* Pictures in the feedback: model first, then the worked columns */
  function explainHTML(ex) {
    if (!ex) return '';
    let out = '';
    if (ex.bar)   out += barHTML(ex.bar);
    if (ex.rect)  out += rectSVG(ex.rect);
    if (ex.work)  out += workHTML(ex.work);
    if (ex.stack) out += stackHTML(ex.stack);
    return out ? `<div class="m2-explain">${out}</div>` : '';
  }

  const api = { stackModel, stackHTML, rectSVG, barHTML, workHTML, picHTML, explainHTML };
  root.M2V = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

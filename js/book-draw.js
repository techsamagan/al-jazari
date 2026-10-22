// Shared drawing kit for the machine books: manuscript colours, small shape helpers, labels,
// highlight rings, the info box, simple figures, and the page "scene" timeline.
// Every drawing uses a 500 × 700 canvas; book.js scales and zooms it onto the page.

export const TAU = Math.PI * 2, PI = Math.PI;
export const C = {
  ink: '#3a2614', red: '#a3342a', lapis: '#2e4b8a', gold: '#c9973a', brass: '#d9b45a', green: '#4d7a45',
  grey: '#9b958c', grey2: '#7f7a72', stone: '#dccca4', ivory: '#f3ead6', skin: '#c98f5f', copper: '#b4723a',
  wood: '#8a5a32', wood2: '#6b4422', teal: '#2f7f8f', turq: '#3f9f9a', saffron: '#d9952f', violet: '#6a3f7a',
  water: 'rgba(60,120,180,0.5)', water2: 'rgba(40,95,160,0.78)', paper: 'rgba(243,234,214,0.6)',
};

export const lerp = (a, b, p) => a + (b - a) * p;
export const clamp01 = (p) => (p < 0 ? 0 : p > 1 ? 1 : p);
export const ease = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p));
export const seg = (t, a, b) => ease((t - a) / (b - a)); // 0 before a, 1 after b, smooth between
export const pulse = (t, at, w) => Math.max(0, 1 - Math.abs(t - at) / w);

export function paint(g, fill, stroke = C.ink, lw = 2) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
}
export function dot(g, x, y, r, fill, stroke = null, lw = 1) { g.beginPath(); g.arc(x, y, r, 0, TAU); paint(g, fill, stroke, lw); }
export function rect(g, x, y, w, h, fill, stroke = C.ink, lw = 2) { g.beginPath(); g.rect(x, y, w, h); paint(g, fill, stroke, lw); }
export function line(g, x1, y1, x2, y2, color = C.ink, lw = 2) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineCap = 'round'; paint(g, null, color, lw);
}
export function poly(g, pts, fill, stroke = C.ink, lw = 2) {
  g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) g.lineTo(...pts[i]); g.closePath(); paint(g, fill, stroke, lw);
}
// a toothed gear seen face-on
export function gear(g, x, y, r, teeth, angle, fill = C.wood, toothLen = 6) {
  g.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = angle + (i / (teeth * 2)) * TAU, rr = i % 2 ? r : r + toothLen;
    const a2 = angle + ((i + 1) / (teeth * 2)) * TAU;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    g.lineTo(x + Math.cos(a2) * rr, y + Math.sin(a2) * rr);
  }
  g.closePath(); paint(g, fill, C.ink, 1.5);
  dot(g, x, y, r * 0.22, C.gold, C.ink);
}
// flowing water along a path: moving dashes
export function flow(g, pts, t, color = C.water2, lw = 4, speed = 40) {
  g.save();
  g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) g.lineTo(...pts[i]);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.setLineDash([8, 7]); g.lineDashOffset = -t * speed;
  g.lineWidth = lw; g.strokeStyle = color; g.stroke();
  g.restore();
}
export function waves(g, x0, x1, y, h, t, fill = 'rgba(70,130,185,0.45)') {
  g.beginPath(); g.moveTo(x0, y + h);
  for (let x = x0; x <= x1; x += 5) g.lineTo(x, y + Math.sin(x * 0.07 + t * 2.2) * 2.5);
  g.lineTo(x1, y + h); g.closePath(); paint(g, fill, null);
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 1.2;
  for (let r = 0; r < 3; r++) {
    g.beginPath();
    for (let x = x0 + 10; x < x1 - 10; x += 34) { const xx = x + ((t * 18 + r * 11) % 34); g.moveTo(xx, y + 12 + r * 14); g.lineTo(xx + 12, y + 12 + r * 14); }
    g.stroke();
  }
}

// A small manuscript-style figure. (x, y) = feet; h = height. arm = angle of the right arm
// (0 = straight down, positive = raised forward). Returns the hand position.
export function figure(g, { x, y, h = 60, robe = C.lapis, turban = C.ivory, seated = false, arm = 0.3, facing = 1, arm2 = null }) {
  const s = h / 60, bodyTop = y - (seated ? 34 : 46) * s, headY = bodyTop - 9 * s;
  g.save();
  g.beginPath();
  g.moveTo(x - (seated ? 15 : 11) * s, y); g.lineTo(x - 7 * s, bodyTop); g.lineTo(x + 7 * s, bodyTop); g.lineTo(x + (seated ? 15 : 11) * s, y);
  g.closePath(); paint(g, robe, C.ink, 1.4);
  const sx = x + 3 * s * facing, sy = bodyTop + 5 * s, L = 17 * s;
  const hand = (a) => [sx + Math.sin(a) * L * facing, sy + Math.cos(a) * L];
  if (arm2 !== null) { const [hx, hy] = hand(arm2); line(g, sx - 4 * s * facing, sy, hx - 3 * s * facing, hy, C.ink, 2.4 * s); }
  dot(g, x, headY, 8 * s, C.skin, C.ink, 1.2);
  g.beginPath(); g.ellipse(x, headY - 6 * s, 9 * s, 5 * s, 0, 0, TAU); paint(g, turban, C.ink, 1.1);
  const [hx, hy] = hand(arm);
  line(g, sx, sy, hx, hy, C.ink, 2.6 * s);
  g.restore();
  return [hx, hy];
}

// ---------------------------------------------------------------- labels, rings, info box
// k (from book.js) scales these so they keep the same size on screen while the drawing zooms.
export function label(g, text, x, y, tx, ty, k) {
  g.save();
  g.font = `italic ${20 * k}px "EB Garamond", Georgia, serif`;
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.strokeStyle = C.red; g.lineWidth = 1.3 * k;
  g.beginPath(); g.moveTo(tx, y > ty ? ty + 6 * k : ty - 18 * k); g.lineTo(x, y); g.stroke();
  dot(g, x, y, 2.8 * k, C.red);
  g.lineJoin = 'round';
  g.lineWidth = 5 * k; g.strokeStyle = 'rgba(238,224,192,0.92)'; g.strokeText(text, tx, ty);
  g.fillStyle = '#7d2118'; g.fillText(text, tx, ty);
  g.restore();
}
export function ring(g, x, y, r, t, k) {
  g.save();
  g.setLineDash([7 * k, 5 * k]); g.lineDashOffset = -t * 14 * k;
  g.beginPath(); g.arc(x, y, r + Math.sin(t * 3) * 2.5 * k, 0, TAU);
  g.lineWidth = 2.6 * k; g.strokeStyle = 'rgba(201,151,58,0.95)'; g.stroke();
  g.restore();
}
export function infoBox(g, text, view, k) {
  g.save();
  g.translate(view[0] + 8 * k, view[1] + 6 * k); g.scale(k, k);
  g.font = '600 18px "EB Garamond", Georgia, serif';
  const w = g.measureText(text).width + 24;
  g.beginPath(); g.roundRect(0, 0, w, 36, 6); paint(g, 'rgba(243,234,214,0.82)', C.gold, 1.5);
  g.fillStyle = C.ink; g.textBaseline = 'middle';
  g.fillText(text, 12, 19);
  g.restore();
}

const crossed = (a, b, at) => (a <= b ? a < at && b >= at : at > a || at <= b);

// A machine's animation: a loop of T seconds. cycle(tc, t, flags) → state, draw(g, state, t, flags)
// paints it, info(state, flags) → optional text for the info box, events → [[time, sound], …].
// Returns a page factory: scene({ offset, labels, focus, ...flags }).
export function makeScene({ T, events = [], cycle, draw, info = null }) {
  return ({ offset = 0, labels = [], focus = null, ...flags } = {}) => {
    let prev = -1;
    const evs = typeof events === 'function' ? events(flags) : events;
    return {
      reset() { prev = -1; },
      draw(g, t, fx, view, k) {
        const tc = (t + offset) % T;
        if (prev >= 0) for (const [at, name] of evs) if (crossed(prev, tc, at)) fx(name);
        prev = tc;
        const s = cycle(tc, t + offset, flags);
        draw(g, s, t, flags);
        if (focus) { const [x, y, r] = focus(s, tc); if (r) ring(g, x, y, r, t, k); }
        for (const L of labels) {
          const [x, y] = typeof L.at === 'function' ? L.at(s) : L.at;
          label(g, L.text, x, y, L.tx, L.ty, k);
        }
        const txt = info && info(s, flags);
        if (txt) infoBox(g, txt, view, k);
      },
    };
  };
}

// The Peacock Hand-Washing Basin teaching book.
import { TAU, PI, C, lerp, seg, paint, dot, rect, line, flow, figure, makeScene } from './book-draw.js';

const T = 14;
const TANK_TOP = 520, TANK_BOT = 630, FLOAT_X = 310, POST_X = 332, CATCH1 = 500, CATCH2 = 470, DRAIN_X = 190;

function cycle(tc) {
  const s = {};
  s.fan = seg(tc, 0, 0.8) * (1 - seg(tc, 12.4, 13.4));
  s.pouring = tc > 0.8 && tc < 5.5;
  s.basin = seg(tc, 0.8, 3) * (1 - seg(tc, 5.5, 8));
  s.draining = tc > 1.4 && tc < 8.5;
  s.tank = 0.1 + 0.85 * seg(tc, 1.6, 8.5) - 0.85 * seg(tc, 12.8, 13.8);
  s.d1 = seg(tc, 5.0, 5.6) * (1 - seg(tc, 12.5, 13.0));
  s.o1 = seg(tc, 5.4, 6.0) * (1 - seg(tc, 12.0, 12.5));
  s.d2 = seg(tc, 7.0, 7.6) * (1 - seg(tc, 12.6, 13.1));
  s.o2 = seg(tc, 7.4, 8.0) * (1 - seg(tc, 12.1, 12.6));
  s.floatY = TANK_BOT - s.tank * (TANK_BOT - TANK_TOP) - 8;
  s.rodTop = s.floatY - 66;
  return s;
}

function cabinet(g, cut) {
  rect(g, 90, 640, 320, 12, C.wood2, C.ink, 1.5);
  g.save(); if (cut) g.globalAlpha = 0.4;
  rect(g, 140, 252, 220, 388, '#3f8f9a', null);
  g.fillStyle = C.gold;
  for (let y = 268; y < 636; y += 30) for (let x = 155; x < 356; x += 30) {
    g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 5, y); g.lineTo(x, y + 5); g.lineTo(x - 5, y); g.closePath(); g.fill();
  }
  g.restore();
  rect(g, 140, 252, 220, 388, null, C.ink, 2);
  rect(g, 130, 240, 240, 13, C.gold, C.ink, 1.5);
}

function doorAndServant(g, x0, open, out, robe, item) {
  rect(g, x0, 290, 70, 90, '#2a1d12', C.ink, 1.5);
  if (out > 0.01) {
    const sc = lerp(0.85, 1.25, out);
    const hand = figure(g, { x: x0 + 35, y: 380 + out * 10, h: 64 * sc, robe, arm: lerp(0.3, 1.5, out) });
    if (item === 'soap') { rect(g, hand[0] - 6, hand[1] - 8, 13, 9, C.ivory, C.ink, 1); }
    else { rect(g, hand[0] - 4, hand[1], 10, 26 * sc, C.ivory, C.ink, 1); line(g, hand[0] - 4, hand[1] + 8, hand[0] + 6, hand[1] + 8, C.red, 1.2); }
  }
  // the door swings open on its outer hinge
  const w = 70 * (1 - open * 0.92), left = x0 < 250;
  const dx = left ? x0 : x0 + 70 - w;
  rect(g, dx, 290, w, 90, C.wood, C.ink, 1.5);
  if (w > 14) rect(g, dx + w * 0.15, 300, w * 0.7, 70, null, C.gold, 1.5);
}

function peacock(g, s, t) {
  // the tail fans out behind the bird
  const px = 216, py = 208, n = 13;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) - 0.5;
    const a = PI + lerp(-0.25, 0.62, s.fan) + u * lerp(0.12, 1.85, s.fan); // folded: trailing down; open: a fan rising behind
    const L = lerp(96, 118, s.fan), ex = px + Math.cos(a) * L, ey = py + Math.sin(a) * L;
    line(g, px, py, ex, ey, C.teal, 3);
    g.beginPath(); g.ellipse(ex, ey, 9, 6, a, 0, TAU); paint(g, C.green, C.ink, 1);
    dot(g, ex, ey, 4, C.gold); dot(g, ex, ey, 2, C.lapis);
  }
  line(g, 232, 228, 232, 241, C.ink, 2); line(g, 248, 228, 248, 241, C.ink, 2);
  g.beginPath(); g.ellipse(240, 206, 36, 24, -0.15, 0, TAU); paint(g, C.teal, C.ink, 2);
  g.beginPath(); g.ellipse(236, 208, 22, 12, -0.3, 0, TAU); paint(g, '#4a9fa8', C.ink, 1);
  g.beginPath(); g.moveTo(258, 196); g.quadraticCurveTo(284, 186, 286, 156); g.lineCap = 'round'; paint(g, null, C.ink, 13); paint(g, null, C.teal, 9);
  dot(g, 291, 148, 10, C.teal, C.ink, 1.5);
  for (const k of [-1, 0, 1]) { line(g, 290, 140, 288 + k * 5, 126, C.ink, 1.2); dot(g, 288 + k * 5, 125, 2.5, C.teal); }
  g.beginPath(); g.moveTo(299, 145); g.lineTo(312, 156); g.lineTo(298, 153); g.closePath(); paint(g, C.gold, C.ink, 1);
  dot(g, 294, 146, 2, C.ivory); dot(g, 294, 146, 1, C.ink);
  if (s.pouring) {
    g.beginPath(); g.moveTo(311, 156); g.quadraticCurveTo(322, 260, 300, 462 - s.basin * 12);
    g.lineCap = 'round'; paint(g, null, 'rgba(90,150,205,0.55)', 5);
    flow(g, [[311, 156], [318, 220], [314, 330], [304, 440]], t, 'rgba(255,255,255,0.7)', 2, 70);
  }
}

function basin(g, s) {
  g.beginPath(); g.moveTo(236, 500); g.lineTo(226, 632); g.lineTo(274, 632); g.lineTo(264, 500); g.closePath(); paint(g, C.brass, C.ink, 1.5);
  g.beginPath(); g.ellipse(250, 636, 40, 6, 0, 0, TAU); paint(g, C.brass, C.ink, 1.5);
  g.beginPath(); g.ellipse(250, 452, 108, 54, 0, 0, PI); g.closePath(); paint(g, C.brass, C.ink, 2);
  line(g, 160, 470, 340, 470, 'rgba(58,38,20,0.35)', 1);
  g.beginPath(); g.ellipse(250, 452, 108, 13, 0, 0, TAU); paint(g, '#8a6a30', C.ink, 2);
  if (s.basin > 0.02) { g.beginPath(); g.ellipse(250, 454, 100 * (0.6 + 0.4 * s.basin), 10 * (0.6 + 0.4 * s.basin), 0, 0, TAU); paint(g, C.water2, null); }
}

function hidden(g, s, t) {
  // the used water drains into a hidden tank; a float rises with it and trips two catches
  rect(g, 165, TANK_TOP, 170, TANK_BOT - TANK_TOP, 'rgba(243,234,214,0.6)', null);
  const wy = TANK_BOT - s.tank * (TANK_BOT - TANK_TOP);
  rect(g, 166, wy, 168, TANK_BOT - wy, C.water, null);
  rect(g, 165, TANK_TOP, 170, TANK_BOT - TANK_TOP, null, C.ink, 2.5);
  line(g, DRAIN_X, 500, DRAIN_X, TANK_TOP + 6, C.copper, 6);
  if (s.draining) flow(g, [[DRAIN_X, 500], [DRAIN_X, wy - 2]], t, C.water2, 3, 50);
  rect(g, FLOAT_X - 20, s.floatY, 40, 16, C.wood, C.ink, 1.5);
  line(g, FLOAT_X, s.floatY, FLOAT_X, s.rodTop, '#5a3a1e', 3);
  rect(g, POST_X - 2, 440, 4, 80, C.wood2, null);
  const hit1 = s.rodTop <= CATCH1 + 1, hit2 = s.rodTop <= CATCH2 + 1;
  for (const [y, hit, door] of [[CATCH1, hit1, [228, 380]], [CATCH2, hit2, [272, 380]]]) {
    g.beginPath(); g.moveTo(POST_X, y); g.lineTo(FLOAT_X + 2, y + (hit ? -6 : 0)); paint(g, null, hit ? C.red : C.ink, 3);
    g.save(); g.setLineDash([5, 4]);
    g.beginPath(); g.moveTo(POST_X, y); g.lineTo(door[0], door[1]); paint(g, null, hit ? C.red : 'rgba(163,52,42,0.45)', hit ? 2.4 : 1.4);
    g.restore();
  }
  dot(g, FLOAT_X, s.rodTop, 3.5, C.gold, C.ink);
}

function draw(g, s, t, f) {
  const cut = !!f.cut;
  cabinet(g, cut);
  doorAndServant(g, 160, s.d1, s.o1, C.turq, 'soap');
  doorAndServant(g, 270, s.d2, s.o2, C.saffron, 'towel');
  rect(g, 150, 380, 200, 8, C.wood2, C.ink, 1.2);
  // in the cut-away the basin is see-through, so the hidden works behind it show
  g.save(); if (cut) g.globalAlpha = 0.5; basin(g, s); g.restore();
  if (cut) hidden(g, s, t);
  peacock(g, s, t);
}

const scene = makeScene({
  T,
  events: [[0.8, 'pour:4.5'], [5.0, 'click'], [5.5, 'bell:1046'], [7.0, 'click'], [7.5, 'bell:1318']],
  cycle, draw,
  info: (s, f) => (f.cut ? `Hidden tank: ${Math.round(s.tank * 100)}% full` : null),
});

const tankLabels = [
  { text: 'drain', at: [DRAIN_X, 510], tx: 122, ty: 474 },
  { text: 'hidden tank', at: [200, 610], tx: 250, ty: 672 },
  { text: 'float', at: (s) => [FLOAT_X + 20, s.floatY + 8], tx: 392, ty: 590 },
  { text: 'first catch', at: [POST_X, CATCH1], tx: 388, ty: 524 },
];

export const peacock_ = {
  title: 'The Peacock Basin',
  arabic: 'حوض الطاووس',
  view: [60, 80, 400, 590],
  pages: [
    {
      title: 'The Peacock Basin',
      text: [
        'Al-Jazari made this basin for a king who did not want servants to help him wash before prayer.',
        'So al-Jazari built a machine to do the job instead.',
        'A peacock pours the water, and little servant figures bring soap and a towel, all by themselves.',
      ],
      scene: scene({ offset: 4 }),
    },
    {
      title: 'Water from the peacock',
      view: [110, 90, 300, 430],
      text: [
        'When the king pulled a plug in the peacock\'s tail, water flowed out through the peacock\'s beak.',
        'The water poured into the basin, and the king washed his hands.',
        'The used water then drained away through a hole in the bottom of the basin.',
      ],
      scene: scene({
        focus: (s, tc) => (tc < 5.5 ? [302, 160, 26] : [0, 0, 0]),
        labels: [
          { text: 'tail', at: [150, 190], tx: 150, ty: 115 },
          { text: 'beak', at: [310, 156], tx: 370, ty: 135 },
          { text: 'basin', at: [340, 470], tx: 380, ty: 420 },
        ],
      }),
    },
    {
      title: 'A float in the hidden tank',
      view: [96, 250, 336, 420],
      text: [
        'Below the basin, hidden inside the cabinet, there is a tank.',
        'The used water drains into it, so the water level rises.',
        'A float sits on the water and rises with it, pushing a rod upward.',
        'When the rod reaches the first catch, the first door opens, and a servant comes out holding soap.',
      ],
      scene: scene({
        cut: true, offset: 2,
        focus: (s, tc) => (tc > 4.6 && tc < 6.4 ? [195, 335, 50] : [FLOAT_X, s.rodTop, 16]),
        labels: tankLabels,
      }),
    },
    {
      title: 'The second servant',
      view: [96, 250, 336, 420],
      text: [
        'The king keeps washing, so more water drains into the tank.',
        'The float rises even higher and reaches a second catch.',
        'The second door opens, and another servant appears with a towel.',
        'The machine knows what to do next by measuring the water level.',
      ],
      scene: scene({
        cut: true, offset: 4.5,
        focus: (s, tc) => (tc > 6.6 && tc < 8.4 ? [305, 335, 50] : [FLOAT_X, s.rodTop, 16]),
        labels: [
          { text: 'float', at: (s) => [FLOAT_X + 20, s.floatY + 8], tx: 392, ty: 590 },
          { text: 'second catch', at: [POST_X, CATCH2], tx: 388, ty: 455 },
          { text: 'towel', at: [326, 392], tx: 392, ty: 360 },
        ],
      }),
    },
    {
      title: 'Floats still at work today',
      text: [
        'Using a float to make a machine react to the water level was a clever idea.',
        'The same idea is still used today, for example in the float valve inside a toilet tank, which shuts off the water when the tank is full.',
        'Close the book and press the brass button to wash your hands with the peacock!',
      ],
      scene: scene({ cut: true, offset: 6 }),
    },
  ],
};

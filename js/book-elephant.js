// The Elephant Clock teaching book: six pages, each with an animated drawing in the
// style of al-Jazari's manuscript and a short text the narrator reads aloud.
// Drawings use a 500 × 700 canvas; book.js scales them to fit the page.

import { TAU, PI, C, lerp, ease, seg, paint, dot, makeScene } from './book-draw.js';

const { ink: INK, red: RED, lapis: LAPIS, gold: GOLD, brass: BRASS, green: GREEN, grey: GREY, grey2: GREY2,
  stone: STONE, ivory: IVORY, skin: SKIN, copper: COPPER } = C;
const BALL = '#7d5b2e', WATER = C.water, WATER2 = C.water2;

// ---------------------------------------------------------------- the machine's timeline
// One full half-hour cycle, sped up to 12 seconds.
const T = 12;
const EVENTS = [[6.3, 'click'], [7.7, 'clang'], [7.8, 'drum'], [7.85, 'whistle'], [8.1, 'drum2']];
const BALL_REST = [219, 238], BEAK = [192, 240], VASE = [212, 404];

// The left serpent bends between a resting pose and a tipped pose.
const SERP_REST = [[214, 270], [186, 294], [232, 320], [204, 340], [182, 354], [186, 364], [190, 374]];
const SERP_TIP = [[214, 270], [190, 296], [234, 324], [204, 350], [196, 374], [204, 388], [208, 398]];
const serpPts = (p) => SERP_REST.map((a, i) => [lerp(a[0], SERP_TIP[i][0], p), lerp(a[1], SERP_TIP[i][1], p)]);

function cycle(tc) {
  const s = {};
  s.minutes = tc < 6 ? (tc / 6) * 30 : tc < 7.4 ? 30 : 0;
  s.bowl = tc < 6 ? tc / 6 : 1 - seg(tc, 7.4, 9.0);           // 0 = floating at the top, 1 = at the bottom
  s.fill = s.bowl;                                              // water inside the bowl
  s.sinking = tc < 6;
  s.lever = seg(tc, 6.0, 6.3) * (1 - seg(tc, 6.8, 7.2));
  s.serp = seg(tc, 7.0, 7.4) * (1 - seg(tc, 9.0, 10.0));
  s.scribe = tc < 6 ? tc / 6 : 1 - seg(tc, 7.4, 9.0);
  s.mahout = Math.max(0, 1 - Math.abs(tc - 7.8) / 0.12) + Math.max(0, 1 - Math.abs(tc - 8.1) / 0.12);
  s.phoenix = seg(tc, 7.8, 9.4) * TAU;
  s.cord = tc > 7.4 && tc < 9.0;
  const head = serpPts(s.serp)[6];
  s.ball = null;
  if (tc >= 6.3 && tc < 6.6) { const p = (tc - 6.3) / 0.3; s.ball = [lerp(BALL_REST[0], BEAK[0], p), lerp(BALL_REST[1], BEAK[1], p)]; }
  else if (tc >= 6.6 && tc < 7.0) { const p = (tc - 6.6) / 0.4; s.ball = [lerp(BEAK[0], head[0], p), BEAK[1] + (head[1] - 6 - BEAK[1]) * p * p]; }
  else if (tc >= 7.0 && tc < 7.4) s.ball = [head[0], head[1] - 6];
  else if (tc >= 7.4 && tc < 7.7) { const p = (tc - 7.4) / 0.3; s.ball = [lerp(head[0], VASE[0], p), lerp(head[1] - 6, VASE[1], p * p)]; }
  s.ballWaiting = tc < 6.3 || tc >= 7.7; // the next ball sits behind the latch
  return s;
}
const bowlY = (s) => 484 + s.bowl * 44;

// ---------------------------------------------------------------- drawing the clock
function carpet(g) {
  g.beginPath(); g.rect(50, 636, 400, 20); paint(g, RED);
  g.strokeStyle = GOLD; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(54, 640); g.lineTo(446, 640); g.moveTo(54, 652); g.lineTo(446, 652); g.stroke();
  for (let x = 62; x < 446; x += 16) { g.beginPath(); g.moveTo(x, 646); g.lineTo(x + 4, 642.5); g.lineTo(x + 8, 646); g.lineTo(x + 4, 649.5); g.closePath(); paint(g, GOLD, null); }
}

function elephantBody(g, cut) {
  for (const [x, c] of [[214, GREY2], [362, GREY2], [168, GREY], [318, GREY]]) {
    g.beginPath(); g.roundRect(x - 17, 540, 34, 98, 9); paint(g, c);
    g.beginPath(); for (const k of [-9, 0, 9]) { g.moveTo(x + k + 4, 636); g.arc(x + k, 636, 4, 0, PI, true); } paint(g, IVORY, INK, 1);
  }
  g.beginPath(); g.moveTo(410, 500); g.quadraticCurveTo(428, 540, 420, 580); g.lineCap = 'round'; paint(g, null, INK, 3);
  g.save(); if (cut) g.globalAlpha = 0.32;
  g.beginPath(); g.ellipse(270, 512, 145, 72, 0, 0, TAU); paint(g, GREY, null);
  g.restore();
  g.beginPath(); g.ellipse(270, 512, 145, 72, 0, 0, TAU); paint(g, null, INK, 2.5);
  g.beginPath(); g.arc(132, 490, 50, 0, TAU); paint(g, GREY, INK, 2.5);
  g.beginPath(); g.moveTo(96, 505); g.bezierCurveTo(70, 540, 95, 585, 76, 616); g.quadraticCurveTo(80, 630, 96, 622);
  g.bezierCurveTo(104, 590, 92, 548, 122, 532); g.closePath(); paint(g, GREY, INK, 2.5);
  for (const y of [560, 580, 600]) { g.beginPath(); g.moveTo(86, y); g.lineTo(98, y + 2); paint(g, null, INK, 1); }
  g.beginPath(); g.moveTo(112, 528); g.quadraticCurveTo(92, 552, 70, 548); g.lineCap = 'round'; paint(g, null, INK, 9); paint(g, null, IVORY, 6);
  g.beginPath(); g.ellipse(166, 494, 28, 42, -0.15, 0, TAU); paint(g, GREY2, INK, 2);
  dot(g, 114, 478, 3.5, INK);
}

function saddle(g, cut) {
  g.save(); if (cut) g.globalAlpha = 0.4;
  g.beginPath(); g.moveTo(198, 452); g.lineTo(352, 452); g.lineTo(358, 520);
  for (let i = 0; i < 8; i++) { const x0 = 358 - i * 20.75, x1 = x0 - 20.75; g.quadraticCurveTo((x0 + x1) / 2, 536, x1, 520); }
  g.closePath(); paint(g, RED, INK, 2);
  g.strokeStyle = GOLD; g.lineWidth = 2;
  g.beginPath(); g.moveTo(203, 460); g.lineTo(348, 460); g.moveTo(205, 510); g.lineTo(352, 510); g.stroke();
  for (let x = 214; x < 350; x += 18) { g.beginPath(); g.moveTo(x, 485); g.lineTo(x + 6, 478); g.lineTo(x + 12, 485); g.lineTo(x + 6, 492); g.closePath(); paint(g, GOLD, null); }
  g.restore();
}

function tankAndBowl(g, s, t) {
  g.beginPath(); g.roundRect(222, 466, 116, 86, 6); paint(g, 'rgba(243,234,214,0.55)', null);
  g.save(); g.beginPath(); g.roundRect(222, 466, 116, 86, 6); g.clip();
  g.beginPath(); g.moveTo(222, 552); g.lineTo(222, 482);
  for (let x = 222; x <= 338; x += 4) g.lineTo(x, 482 + Math.sin(x * 0.15 + t * 3) * 1.5);
  g.lineTo(338, 552); g.closePath(); g.fillStyle = WATER; g.fill();
  g.restore();
  g.beginPath(); g.roundRect(222, 466, 116, 86, 6); paint(g, null, INK, 2.5);
  const by = bowlY(s);
  if (s.sinking) for (let k = 0; k < 3; k++) { const p = (t * 1.4 + k / 3) % 1; dot(g, 280, by + 24 - p * 16, 2, WATER2); }
  g.save(); g.beginPath(); g.ellipse(280, by, 32, 24, 0, 0, PI); g.clip();
  g.fillStyle = WATER2; g.fillRect(246, by + 24 * (1 - s.fill), 68, 30);
  g.restore();
  g.beginPath(); g.ellipse(280, by, 32, 24, 0, 0, PI); g.closePath(); paint(g, null, COPPER, 4);
  g.beginPath(); g.ellipse(280, by, 32, 24, 0, 0, PI); g.closePath(); paint(g, null, INK, 1);
  dot(g, 280, by + 24, 2.2, INK);
}

function tower(g) {
  g.beginPath(); g.roundRect(195, 428, 170, 24, 3); paint(g, GOLD, INK, 2);
  g.strokeStyle = INK; g.lineWidth = 1;
  g.beginPath(); g.moveTo(199, 440); g.lineTo(361, 440); g.stroke();
  for (const x of [228, 322]) {
    g.beginPath(); g.rect(x, 262, 10, 166); paint(g, LAPIS, INK, 1.5);
    g.beginPath(); g.rect(x - 3, 262, 16, 6); paint(g, GOLD, INK, 1);
    g.beginPath(); g.rect(x - 3, 422, 16, 6); paint(g, GOLD, INK, 1);
  }
  g.beginPath(); g.moveTo(238, 302); g.quadraticCurveTo(280, 264, 322, 302); paint(g, null, GOLD, 3);
}

function vase(g, x) {
  g.beginPath(); g.ellipse(x, 418, 11, 10, 0, 0, TAU); paint(g, BRASS, INK, 1.5);
  g.beginPath(); g.rect(x - 5, 402, 10, 8); paint(g, BRASS, INK, 1.5);
  g.beginPath(); g.ellipse(x, 402, 8, 3, 0, 0, TAU); paint(g, INK, INK, 1);
}

function scribe(g, s) {
  g.beginPath(); g.arc(296, 352, 22, PI, TAU); g.closePath(); paint(g, IVORY, INK, 1.5);
  g.strokeStyle = INK; g.lineWidth = 1;
  for (let k = 0; k <= 6; k++) {
    const a = PI + (k / 6) * PI;
    g.beginPath(); g.moveTo(296 + Math.cos(a) * 17, 352 + Math.sin(a) * 17); g.lineTo(296 + Math.cos(a) * 21, 352 + Math.sin(a) * 21); g.stroke();
  }
  const a = PI + s.scribe * PI;
  g.beginPath(); g.moveTo(296, 352); g.lineTo(296 + Math.cos(a) * 19, 352 + Math.sin(a) * 19); paint(g, null, RED, 2.2);
  dot(g, 296, 352, 2.5, GOLD);
  g.beginPath(); g.moveTo(282, 428); g.lineTo(287, 386); g.lineTo(305, 386); g.lineTo(310, 428); g.closePath(); paint(g, GREEN, INK, 1.5);
  dot(g, 296, 377, 9, SKIN, INK);
  g.beginPath(); g.ellipse(296, 370, 10.5, 6, 0, 0, TAU); paint(g, IVORY, INK, 1.2);
}

function mahout(g, s) {
  g.beginPath(); g.rect(113, 444, 18, 11); paint(g, RED, INK, 1.2);
  g.beginPath(); g.ellipse(122, 444, 9, 3.5, 0, 0, TAU); paint(g, IVORY, INK, 1);
  g.beginPath(); g.moveTo(140, 452); g.lineTo(144, 414); g.lineTo(160, 414); g.lineTo(166, 452); g.closePath(); paint(g, LAPIS, INK, 1.5);
  dot(g, 152, 405, 8.5, SKIN, INK);
  g.beginPath(); g.ellipse(152, 398, 9.5, 5.5, 0, 0, TAU); paint(g, IVORY, INK, 1.2);
  const a = lerp(4.0, 2.4, Math.min(1, s.mahout)), sx = 146, sy = 420;
  g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * 26, sy + Math.sin(a) * 26); g.lineCap = 'round'; paint(g, null, INK, 2.5);
  dot(g, sx + Math.cos(a) * 27, sy + Math.sin(a) * 27, 4.5, GOLD, INK);
}

function serpent(g, p, mirror) {
  const pts = serpPts(p).map(([x, y]) => [mirror ? 560 - x : x, y]);
  const path = () => {
    g.beginPath(); g.moveTo(...pts[0]);
    g.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]);
    g.bezierCurveTo(...pts[4], ...pts[5], ...pts[6]);
  };
  g.lineCap = 'round';
  path(); paint(g, null, INK, 12);
  path(); paint(g, null, GREEN, 8);
  g.setLineDash([2, 6]); path(); paint(g, null, GOLD, 2); g.setLineDash([]);
  const [hx, hy] = pts[6];
  g.beginPath(); g.moveTo(hx - 3, hy - 4); g.lineTo(hx - 9, hy - 14); g.moveTo(hx + 3, hy - 4); g.lineTo(hx + 9, hy - 14); paint(g, null, INK, 3);
  dot(g, hx, hy, 8, GREEN, INK);
  g.beginPath(); g.moveTo(hx, hy - 4); g.lineTo(hx, hy - 11); paint(g, null, RED, 1.5);
  dot(g, hx + (mirror ? 3 : -3), hy + 1, 1.6, IVORY);
}

function castle(g, cut) {
  g.save(); if (cut) g.globalAlpha = 0.45;
  g.beginPath(); g.rect(212, 232, 136, 30); paint(g, STONE, null);
  for (const x of [213, 225, 326, 338]) { g.beginPath(); g.rect(x, 224, 9, 8); paint(g, STONE, INK, 1.2); }
  for (const x of [244, 280, 316]) { g.beginPath(); g.moveTo(x - 5, 258); g.lineTo(x - 5, 246); g.arc(x, 246, 5, PI, 0); g.lineTo(x + 5, 258); g.closePath(); paint(g, INK, null); }
  g.beginPath(); g.ellipse(280, 232, 44, 50, 0, PI, TAU); g.closePath(); paint(g, LAPIS, null);
  g.strokeStyle = GOLD; g.lineWidth = 1.6;
  for (const rx of [30, 14]) { g.beginPath(); g.ellipse(280, 232, rx, 50, 0, PI, TAU); g.stroke(); }
  g.restore();
  g.beginPath(); g.rect(212, 232, 136, 30); paint(g, null, INK, 2);
  g.beginPath(); g.ellipse(280, 232, 44, 50, 0, PI, TAU); g.closePath(); paint(g, null, INK, 2);
  g.beginPath(); g.moveTo(280, 182); g.lineTo(280, 176); paint(g, null, GOLD, 3);
}

function insideWorks(g, s, cord) {
  for (let i = 0; i < 4; i++) { dot(g, 258 + i * 14, 222, 6, BALL, INK); }
  // the latch lever: the string pulls its right end down, which lifts the latch off the ball
  const a = s.lever * 0.3, px = 246, py = 228;
  const rx = px + 18 * Math.cos(a), ry = py + 18 * Math.sin(a), lx = px - 32 * Math.cos(a), ly = py - 32 * Math.sin(a);
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(lx, ly); g.lineTo(rx, ry); paint(g, null, '#6b4422', 4);
  g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx, ly + 12); paint(g, null, '#6b4422', 4);
  dot(g, px, py, 3, GOLD, INK);
  // the string from the bowl up to the lever
  g.beginPath(); g.moveTo(rx, ry); g.lineTo(264, bowlY(s)); paint(g, null, '#5a3a1e', 1.6);
  // the second cord: from the serpent to the bowl string
  g.setLineDash([5, 4]);
  g.beginPath(); g.moveTo(216, 272); g.lineTo(264, 272);
  paint(g, null, cord ? RED : 'rgba(163,52,42,0.45)', cord ? 3 : 1.6);
  g.setLineDash([]);
  if (s.ballWaiting) dot(g, ...BALL_REST, 5, BALL, INK);
}

function bird(g, kind) { // drawn facing right with its feet at the origin
  if (kind === 'phoenix') {
    g.beginPath(); g.moveTo(-6, -14); g.bezierCurveTo(-30, -8, -34, -34, -52, -24); g.bezierCurveTo(-40, -18, -34, -4, -8, -8); g.closePath(); paint(g, RED, INK, 1.2);
    g.beginPath(); g.moveTo(-6, -12); g.bezierCurveTo(-26, 0, -40, -6, -50, 4); g.bezierCurveTo(-36, 4, -26, 6, -6, -6); g.closePath(); paint(g, GOLD, INK, 1.2);
    g.beginPath(); g.ellipse(0, -16, 13, 9, -0.2, 0, TAU); paint(g, RED, INK, 1.5);
    g.beginPath(); g.ellipse(-2, -17, 9, 5, -0.4, 0, TAU); paint(g, GOLD, INK, 1);
    g.beginPath(); g.moveTo(8, -20); g.lineTo(10, -30); paint(g, null, INK, 5); paint(g, null, RED, 3);
    dot(g, 11, -31, 6, RED, INK);
    g.beginPath(); g.moveTo(16, -32); g.lineTo(23, -30); g.lineTo(16, -28); g.closePath(); paint(g, GOLD, INK, 1);
    for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(9, -36); g.lineTo(6 + k * 4, -44); paint(g, null, GOLD, 1.5); }
    dot(g, 13, -32, 1.2, INK);
    g.beginPath(); g.moveTo(0, -8); g.lineTo(0, 0); paint(g, null, INK, 1.5);
  } else {
    g.beginPath(); g.moveTo(-8, -10); g.lineTo(-20, -4); g.lineTo(-18, -12); g.closePath(); paint(g, '#6e5236', INK, 1);
    g.beginPath(); g.ellipse(0, -12, 10, 8, -0.3, 0, TAU); paint(g, '#8a6a4a', INK, 1.5);
    g.beginPath(); g.ellipse(-2, -12, 7, 4, -0.3, 0, TAU); paint(g, '#6e5236', INK, 1);
    dot(g, 8, -20, 5.5, '#8a6a4a', INK);
    g.beginPath(); g.moveTo(12, -22); g.quadraticCurveTo(17, -21, 14, -16); g.lineTo(12, -18); g.closePath(); paint(g, GOLD, INK, 1);
    dot(g, 9, -21, 1.2, INK);
    g.beginPath(); g.moveTo(0, -5); g.lineTo(0, 0); paint(g, null, INK, 1.5);
  }
}

function drawClock(g, s, t, cut) {
  carpet(g);
  elephantBody(g, cut);
  if (cut) tankAndBowl(g, s, t);
  saddle(g, cut);
  mahout(g, s);
  tower(g);
  scribe(g, s);
  vase(g, 212); vase(g, 348);
  serpent(g, 0, true);
  serpent(g, s.serp, false);
  castle(g, cut);
  if (cut) insideWorks(g, s, s.cord);
  for (const [x, f] of [[205, -1], [355, 1]]) {
    g.beginPath(); g.moveTo(x - 6 * f, 257); g.lineTo(x + 8 * f, 257); paint(g, null, INK, 3);
    g.save(); g.translate(x, 256); g.scale(f, 1); bird(g, 'falcon'); g.restore();
  }
  const c = Math.cos(s.phoenix);
  g.save(); g.translate(280, 176); g.scale(Math.sign(c || 1) * Math.max(0.12, Math.abs(c)), 1); bird(g, 'phoenix'); g.restore();
  if (s.ball) dot(g, s.ball[0], s.ball[1], 5, BALL, INK);
}

const scene = makeScene({
  T, events: EVENTS, cycle,
  draw: (g, s, t, f) => drawClock(g, s, t, f.cut !== false),
  info: (s, f) => {
    if (f.cut === false) return null;
    const m = Math.floor(s.minutes);
    return m >= 30 ? 'Half an hour has passed!' : `Minutes passed: ${m}`;
  },
});

// ---------------------------------------------------------------- the pages
export const elephant = {
  title: 'The Elephant Clock',
  arabic: 'ساعة الفيل',
  view: [15, 84, 480, 622],
  pages: [
    {
      title: 'The Elephant Clock',
      text: [
        'More than eight hundred years ago, the engineer al-Jazari designed a clock shaped like an elephant.',
        'He described it in his famous book of machines, which he finished in the year 1206.',
        'It had no springs and no batteries. It was powered by water.',
        'Every half hour, it put on a little show of moving figures and sounds.',
        'Let us open it up and see how it works.',
      ],
      scene: scene({ cut: false, offset: 4 }),
    },
    {
      title: 'A bowl that measures time',
      text: [
        'Inside the elephant\'s body there is a tank full of water.',
        'A copper bowl floats on the water. It has a tiny hole in the bottom.',
        'Water slowly leaks in through the hole, so the bowl sinks, little by little.',
        'Al-Jazari made the hole just the right size, so the bowl takes half an hour to reach the bottom.',
        'This sinking bowl is the heart of the clock. It measures the time.',
      ],
      view: [155, 335, 250, 370], // close-up of the tank and bowl
      scene: scene({
        offset: 0,
        focus: (s) => [280, bowlY(s) + 8, 44],
        labels: [
          { text: 'water tank', at: [336, 540], tx: 378, ty: 596 },
          { text: 'floating bowl', at: (s) => [306, bowlY(s) + 6], tx: 372, ty: 418 },
          { text: 'tiny hole', at: (s) => [280, bowlY(s) + 24], tx: 284, ty: 690 },
        ],
      }),
    },
    {
      title: 'Pulling the string',
      text: [
        'The bowl is tied to a string that runs up through the tower.',
        'As the bowl sinks, it pulls the string down.',
        'When the bowl reaches the bottom, the string tips a small lever at the top of the castle.',
        'The lever lifts a latch, and one metal ball rolls out through the falcon\'s beak.',
      ],
      view: [135, 137, 220, 326], // close-up of the castle top
      scene: scene({
        offset: 3,
        focus: () => [232, 234, 30],
        labels: [
          { text: 'string', at: [264, 330], tx: 160, ty: 334 },
          { text: 'lever', at: [252, 229], tx: 182, ty: 172 },
          { text: 'metal ball', at: BALL_REST, tx: 166, ty: 212 },
          { text: 'falcon', at: [200, 248], tx: 160, ty: 282 },
        ],
      }),
    },
    {
      title: 'The ball\'s journey',
      text: [
        'The ball falls into the open mouth of a serpent.',
        'The weight of the ball makes the serpent tip forward and drop the ball into a vase.',
        'Then the show begins! The mahout strikes his drum, and the phoenix on the dome turns and whistles.',
        'Everyone nearby knows that another half hour has passed.',
      ],
      view: [95, 125, 260, 385], // close-up of the serpent, vase, mahout and phoenix
      scene: scene({
        offset: 4.6,
        focus: (s, tc) => (tc > 6.2 && tc < 7.8 ? [200, 330, 58] : tc >= 7.8 && tc < 9.4 ? [280, 160, 40] : [0, 0, 0]),
        labels: [
          { text: 'falcon', at: [200, 248], tx: 140, ty: 222 },
          { text: 'serpent', at: [202, 336], tx: 136, ty: 300 },
          { text: 'vase', at: [203, 418], tx: 128, ty: 372 },
          { text: 'mahout', at: [146, 430], tx: 122, ty: 478 },
          { text: 'phoenix', at: [290, 152], tx: 330, ty: 142 },
        ],
      }),
    },
    {
      title: 'Starting again by itself',
      text: [
        'As the serpent tips, it also pulls a second cord.',
        'This cord lifts the bowl back up to the top and empties it.',
        'The bowl floats again, and the next half hour begins.',
        'Meanwhile, the scribe on the platform slowly turns his pen to point at the minutes.',
        'Because the clock resets itself, it could keep running for hours without anyone touching it, until all the balls were used up.',
      ],
      view: [160, 215, 250, 370], // from the serpent's cord down to the bowl
      scene: scene({
        offset: 5.5,
        focus: (s, tc) => (tc > 7.2 && tc < 9.2 ? [280, bowlY(s) + 8, 44] : [296, 362, 32]),
        labels: [
          { text: 'second cord', at: [240, 272], tx: 196, ty: 300 },
          { text: 'bowl is lifted', at: (s) => [306, bowlY(s) + 6], tx: 374, ty: 418 },
          { text: 'scribe', at: [318, 352], tx: 382, ty: 330 },
        ],
      }),
    },
    {
      title: 'A clock of many cultures',
      text: [
        'Al-Jazari mixed ideas from many lands in one machine.',
        'The elephant stands for India, the serpents are Chinese dragons, and the phoenix comes from ancient Egypt.',
        'The carpet is Persian, and the figures in turbans come from the Arab world.',
        'The clock is often described as a celebration of the many cultures of its time.',
        'Now close the book and press the brass button on the plaque to watch the museum\'s model work!',
      ],
      scene: scene({
        cut: false,
        offset: 6,
        labels: [
          { text: 'Elephant · India', at: [330, 560], tx: 420, ty: 610 },
          { text: 'Dragons · China', at: [202, 336], tx: 85, ty: 290 },
          { text: 'Phoenix · Egypt', at: [286, 150], tx: 400, ty: 110 },
          { text: 'Carpet · Persia', at: [250, 650], tx: 250, ty: 688 },
          { text: 'Turbans · Arab world', at: [152, 398], tx: 100, ty: 200 },
        ],
      }),
    },
  ],
};

// The Saqiya teaching book (chain-of-pots water raiser).
import { TAU, PI, C, lerp, paint, dot, rect, line, flow, gear, waves, makeScene } from './book-draw.js';

const T = 8, GROUND = 470;
const W = { x: 380, y: 400, r: 40 };          // the pot wheel over the well
const LOOP_R = 35, BOT_Y = 650, LEFT = W.x - LOOP_R, RIGHT = W.x + LOOP_R;
const RUN = BOT_Y - W.y, ARC = PI * LOOP_R, LOOP = 2 * RUN + 2 * ARC;
const POTS = 12, SPACING = LOOP / POTS, SPEED = 60;   // pots move 60 units a second: one pours every second
const SHAFT_X = 225, SWEEP = 125;
const VG = { x: 285, y: 400, r: 30 };          // upright gear on the axle

// a point on the rope loop: up the left side, over the top, down the right, round the bottom
function loopPoint(d) {
  d = ((d % LOOP) + LOOP) % LOOP;
  if (d < RUN) return { x: LEFT, y: BOT_Y - d, rot: 0, full: true };
  d -= RUN;
  if (d < ARC) { const a = -PI + d / LOOP_R; return { x: W.x + Math.cos(a) * LOOP_R, y: W.y + Math.sin(a) * LOOP_R, rot: a + PI, full: a < -PI / 2 + 0.35, top: a }; }
  d -= ARC;
  if (d < RUN) return { x: RIGHT, y: W.y + d, rot: PI, full: false };
  d -= RUN;
  const a = d / LOOP_R;
  return { x: W.x + Math.cos(a) * LOOP_R, y: BOT_Y + Math.sin(a) * LOOP_R, rot: PI + a, full: a > PI * 0.55 };
}

function cycle(tc, t) {
  const chain = SPEED * t, psi = chain / LOOP_R;
  return { chain, psi, phi: psi / 2, t };
}

function pot(g, p) {
  g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
  g.beginPath(); g.moveTo(-4, -9); g.quadraticCurveTo(-11, -2, -7, 6); g.quadraticCurveTo(0, 11, 7, 6); g.quadraticCurveTo(11, -2, 4, -9); g.closePath();
  paint(g, '#b5643a', C.ink, 1.2);
  if (p.full) { g.beginPath(); g.ellipse(0, -8, 4, 1.6, 0, 0, TAU); paint(g, C.water2, null); }
  g.restore();
}

function animal(g, x, y, sc, facing, t, walking) {
  g.save(); g.translate(x, y); g.scale(sc * facing, sc);
  const step = walking ? Math.sin(t * 7) * 4 : 0;
  for (const [lx, ph] of [[-18, 1], [-10, -1], [14, -1], [21, 1]]) line(g, lx, -14, lx + step * ph, 0, C.ink, 3.2);
  g.beginPath(); g.ellipse(0, -22, 28, 13, 0, 0, TAU); paint(g, C.ivory, C.ink, 1.6);
  g.beginPath(); g.ellipse(-6, -24, 9, 6, 0.3, 0, TAU); paint(g, '#8a5a32', null);
  g.beginPath(); g.moveTo(22, -28); g.lineTo(36, -34); g.lineTo(40, -24); g.lineTo(30, -18); g.closePath(); paint(g, C.ivory, C.ink, 1.4);
  line(g, 33, -34, 30, -42, C.ink, 2); line(g, 37, -33, 40, -41, C.ink, 2);
  dot(g, 35, -29, 1.4, C.ink);
  line(g, -28, -24, -34, -6, C.ink, 1.6);
  if (!walking) { rect(g, -26, -1, 52, 5, C.wood2, C.ink, 1); }   // the model rides on a board fixed to the sweep
  g.restore();
}

function sweepAndAnimal(g, s, t, front, walking) {
  const z = Math.sin(s.phi), x = SHAFT_X + SWEEP * Math.cos(s.phi);
  if ((z >= 0) !== front) return;
  line(g, SHAFT_X, 450, x, 450 + z * 8, C.wood2, 6);
  line(g, SHAFT_X, 450, x, 450 + z * 8, C.wood, 3);
  animal(g, x, 458 + z * 12, 1 + 0.14 * z, -Math.sign(Math.sin(s.phi)) || 1, t, walking);
}

function draw(g, s, t, f) {
  const cut = !!f.cut;
  // earth, with the well cut open so the pots show
  g.save(); if (cut) g.globalAlpha = 0.45;
  rect(g, 20, GROUND, 460, 230, '#b39469', null);
  g.restore();
  line(g, 20, GROUND, 480, GROUND, C.ink, 2);
  rect(g, LEFT - 18, GROUND, RIGHT - LEFT + 36, 230, '#4a3a2a', C.ink, 2);
  waves(g, LEFT - 17, RIGHT + 17, 626, 74, t);
  if (cut) {
    // al-Jazari's hidden water wheel under the ground
    rect(g, 30, 588, 270, 52, C.water, C.ink, 1.5);
    flow(g, [[35, 614], [295, 614]], t, 'rgba(255,255,255,0.7)', 2, 60);
    line(g, SHAFT_X, GROUND, SHAFT_X, 604, '#555', 6);
    g.beginPath(); g.ellipse(SHAFT_X, 606, 64, 13, 0, 0, TAU); paint(g, 'rgba(138,90,50,0.55)', C.ink, 1.5);
    for (let i = 0; i < 12; i++) {
      const a = s.phi * 1 + (i / 12) * TAU;
      const px = SHAFT_X + Math.cos(a) * 60, py = 606 + Math.sin(a) * 12;
      line(g, px, py - 10, px, py + 6, Math.sin(a) > 0 ? C.wood2 : 'rgba(107,68,34,0.5)', 4);
    }
  }
  sweepAndAnimal(g, s, t, false, !f.model);
  // upright shaft, flat gear and frame
  rect(g, SHAFT_X - 4, 300, 8, GROUND - 300, '#555', C.ink, 1);
  rect(g, 150, 292, 160, 10, C.wood2, C.ink, 1.5);
  for (const x of [150, 302]) rect(g, x, 300, 8, GROUND - 300, C.wood, C.ink, 1);
  gear(g, VG.x, VG.y, VG.r, 12, s.psi, C.wood, 6);
  g.beginPath(); g.ellipse(SHAFT_X, 434, 62, 12, 0, 0, TAU); paint(g, C.wood, C.ink, 1.5);
  for (let i = 0; i < 14; i++) {
    const a = -s.phi + (i / 14) * TAU;
    if (Math.sin(a) < 0) continue;
    const px = SHAFT_X + Math.cos(a) * 58, py = 434 + Math.sin(a) * 11;
    line(g, px, py, px, py - 9, C.wood2, 3);
  }
  // axle to the pot wheel, and the wheel's frame
  line(g, VG.x, VG.y, W.x, W.y, '#555', 5);
  for (const x of [W.x - 52, W.x + 52]) line(g, x, GROUND, W.x, W.y - 4, C.wood2, 5);
  g.beginPath(); g.arc(W.x, W.y, W.r, 0, TAU); paint(g, null, C.wood2, 5);
  for (let i = 0; i < 8; i++) { const a = s.psi + (i / 8) * TAU; line(g, W.x, W.y, W.x + Math.cos(a) * W.r, W.y + Math.sin(a) * W.r, C.wood, 3); }
  dot(g, W.x, W.y, 6, C.gold, C.ink);
  // rope loop and pots
  g.beginPath(); g.moveTo(LEFT, BOT_Y); g.lineTo(LEFT, W.y); g.arc(W.x, W.y, LOOP_R, PI, 0); g.lineTo(RIGHT, BOT_Y); g.arc(W.x, BOT_Y, LOOP_R, 0, PI);
  paint(g, null, '#7a5a34', 2);
  let pouring = false;
  for (let i = 0; i < POTS; i++) {
    const p = loopPoint(s.chain + i * SPACING);
    if (p.top !== undefined && p.top > -PI / 2 + 0.35 && p.top < -0.2) pouring = true;
    pot(g, p);
  }
  // trough to the fields
  g.beginPath(); g.moveTo(418, 380); g.lineTo(488, 388); g.lineTo(488, 398); g.lineTo(418, 392); g.closePath(); paint(g, C.wood, C.ink, 1.5);
  if (pouring) { g.beginPath(); g.moveTo(410, 372); g.quadraticCurveTo(424, 376, 428, 386); paint(g, null, C.water2, 4); }
  flow(g, [[422, 387], [486, 394]], t, C.water2, 3, 40);
  sweepAndAnimal(g, s, t, true, !f.model);
}

// a pot pours about once a second
const scene = makeScene({
  T, cycle, draw,
  events: Array.from({ length: 8 }, (_, k) => [k + 0.01, 'splash']),
});

export const saqiya = {
  title: 'The Saqiya',
  arabic: 'الساقية',
  view: [40, 280, 450, 420],
  pages: [
    {
      title: 'The Saqiya',
      text: [
        'The saqiya is a water-lifting machine that was already ancient in al-Jazari\'s time.',
        'An animal walks round and round, and the machine lifts water from a well, pot by pot.',
        'The water then flows along a channel to the fields.',
      ],
      scene: scene({ labels: [{ text: 'to the fields', at: [484, 394], tx: 440, ty: 340 }] }),
    },
    {
      title: 'Walking in circles',
      view: [110, 280, 300, 220],
      text: [
        'The animal is harnessed to a long pole called a sweep.',
        'As it walks in a circle, the sweep turns an upright shaft with a flat gear on it.',
        'The flat gear meshes with an upright gear, which turns an axle.',
        'The axle turns the big wheel above the well.',
      ],
      scene: scene({
        focus: () => [VG.x - 20, 425, 34],
        labels: [
          { text: 'sweep', at: (s) => [SHAFT_X + SWEEP * 0.5 * Math.cos(s.phi), 451], tx: 160, ty: 488 },
          { text: 'upright shaft', at: [SHAFT_X, 330], tx: 200, ty: 300 },
          { text: 'flat gear', at: [SHAFT_X - 50, 436], tx: 150, ty: 395 },
          { text: 'upright gear', at: [VG.x + 10, VG.y - 26], tx: 330, ty: 330 },
          { text: 'axle', at: [335, 400], tx: 360, ty: 450 },
        ],
      }),
    },
    {
      title: 'A chain of pots',
      view: [300, 340, 200, 350],
      text: [
        'A long loop of rope hangs from the wheel down into the well, with clay pots tied along it.',
        'At the bottom, each pot dips into the water and fills up.',
        'As it goes over the top of the wheel, the pot tips over and pours its water into a trough.',
        'The empty pots go back down for more.',
      ],
      scene: scene({
        focus: () => [412, 380, 22],
        labels: [
          { text: 'full pot', at: [LEFT - 8, 520], tx: 318, ty: 480 },
          { text: 'empty pot', at: [RIGHT + 8, 540], tx: 465, ty: 500 },
          { text: 'trough', at: [455, 392], tx: 455, ty: 440 },
          { text: 'well', at: [RIGHT + 14, 640], tx: 462, ty: 610 },
        ],
      }),
    },
    {
      title: 'Al-Jazari\'s trick',
      view: [30, 280, 440, 420],
      text: [
        'Al-Jazari described a saqiya with a surprise.',
        'Hidden under the ground, flowing water turned a water wheel that drove the whole machine.',
        'The cow on the sweep was only a wooden model, riding along on a board.',
        'People watching thought the little cow was doing all the work!',
      ],
      scene: scene({
        cut: true, model: true,
        focus: () => [SHAFT_X, 606, 70],
        labels: [
          { text: 'hidden water wheel', at: [SHAFT_X + 50, 612], tx: 360, ty: 560 },
          { text: 'model cow', at: (s) => [SHAFT_X + SWEEP * Math.cos(s.phi), 440], tx: 110, ty: 330 },
        ],
      }),
    },
    {
      title: 'Water for the fields',
      text: [
        'Machines like this watered fields for hundreds of years, across North Africa, the Middle East and Spain.',
        'This museum\'s model shows al-Jazari\'s version, with a marble horse standing in for his model cow.',
        'Close the book and press the brass button to speed up the hidden water wheel!',
      ],
      scene: scene({ cut: true, model: true }),
    },
  ],
};

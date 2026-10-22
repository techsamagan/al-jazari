// The Drink-Serving Automaton teaching book.
import { TAU, PI, C, lerp, seg, paint, dot, rect, line, flow, makeScene } from './book-draw.js';

const T = 13;
const BOX = { x: 296, y: 192, w: 56, h: 44 };   // the hidden container above the arch

function cycle(tc) {
  const s = {};
  s.minutes = tc < 6 ? (tc / 6) * 7 : tc < 11.4 ? 7 : 0;
  s.dripping = tc < 6;
  s.box = tc < 6 ? tc / 6 : 1 - seg(tc, 8.0, 9.4);
  s.tank = 0.9 - 0.12 * Math.min(1, tc / 6) - 0.18 * seg(tc, 8.0, 9.4) + 0.3 * seg(tc, 12.2, 13);
  s.released = tc > 6 && tc < 11.6;
  s.fwd = seg(tc, 6.0, 7.0) * (1 - seg(tc, 11.4, 12.4));
  s.armR = lerp(-0.35, 1.2, seg(tc, 7.0, 7.6) * (1 - seg(tc, 9.8, 10.4)));
  s.tilt = seg(tc, 7.6, 8.0) * (1 - seg(tc, 9.4, 9.8));
  s.pouring = tc > 8.0 && tc < 9.4;
  s.armL = lerp(0.2, 0.45, seg(tc, 6.8, 7.4)) + 0.55 * seg(tc, 9.9, 10.6) * (1 - seg(tc, 11.0, 11.6)) - 0.25 * seg(tc, 11.4, 12.2);
  s.cup = seg(tc, 8.0, 9.4) * (1 - seg(tc, 11.0, 11.5));
  return s;
}

function building(g, cut) {
  rect(g, 86, 640, 328, 16, '#5a5048', C.ink, 1.5);
  rect(g, 120, 190, 260, 450, '#2f6f8a', C.ink, 1.5);
  g.fillStyle = 'rgba(217,180,90,0.55)';
  for (let y = 312; y < 636; y += 28) for (let x = 162; x < 342; x += 28) {
    g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill();
  }
  for (const x of [128, 354]) {
    rect(g, x, 300, 18, 340, '#e8e0d0', C.ink, 1.2);
    rect(g, x - 4, 294, 26, 8, C.gold, C.ink, 1);
  }
  // facade with a pointed arch
  g.save(); if (cut) g.globalAlpha = 0.45;
  g.beginPath(); g.moveTo(110, 182); g.lineTo(390, 182); g.lineTo(390, 300); g.lineTo(350, 300);
  g.quadraticCurveTo(346, 250, 250, 226); g.quadraticCurveTo(154, 250, 150, 300); g.lineTo(110, 300); g.closePath();
  paint(g, C.stone, null);
  g.restore();
  g.beginPath(); g.moveTo(350, 300); g.quadraticCurveTo(346, 250, 250, 226); g.quadraticCurveTo(154, 250, 150, 300); paint(g, null, C.gold, 4);
  rect(g, 110, 182, 280, 118, null, C.ink, 1.5);
  rect(g, 100, 166, 300, 16, C.wood2, C.ink, 1.5);
  line(g, 102, 170, 398, 170, C.gold, 1.5);
  g.beginPath(); g.ellipse(196, 166, 46, 54, 0, PI, TAU); g.closePath(); paint(g, C.lapis, C.ink, 2);
  line(g, 196, 112, 196, 98, C.gold, 3);
}

function reservoir(g, s) {
  const x = 292, w = 48, top = 96, bot = 166, wy = bot - s.tank * (bot - top - 6);
  rect(g, x, top, w, bot - top, 'rgba(220,235,240,0.35)', null);
  rect(g, x + 1, wy, w - 2, bot - wy, C.water, null);
  rect(g, x, top, w, bot - top, null, C.ink, 1.5);
  line(g, x + 8, top + 6, x + 8, bot - 6, 'rgba(255,255,255,0.7)', 2);
  for (const y of [top, bot - 4]) rect(g, x - 3, y, w + 6, 5, C.copper, C.ink, 1);
}

function hiddenWorks(g, s, t) {
  // the drip into the hidden container, its float, and the cord that releases the servant
  line(g, 316, 166, 316, BOX.y, C.copper, 4);
  if (s.dripping) for (let k = 0; k < 2; k++) { const p = (t * 1.2 + k / 2) % 1; dot(g, 316, BOX.y + 3 + p * 22, 2.2, C.water2); }
  rect(g, BOX.x, BOX.y, BOX.w, BOX.h, 'rgba(243,234,214,0.75)', null);
  const wy = BOX.y + BOX.h - s.box * (BOX.h - 6);
  rect(g, BOX.x + 1, wy, BOX.w - 2, BOX.y + BOX.h - wy, C.water, null);
  rect(g, BOX.x, BOX.y, BOX.w, BOX.h, null, C.ink, 2);
  rect(g, BOX.x + 30, wy - 7, 18, 9, C.wood, C.ink, 1);
  const cordTop = wy - 7;
  g.save(); g.setLineDash([5, 4]);
  g.beginPath(); g.moveTo(BOX.x + 39, cordTop); g.lineTo(BOX.x + 39, BOX.y - 8); g.lineTo(366, BOX.y - 8); g.lineTo(366, 628); g.lineTo(300, 628);
  paint(g, null, s.released ? C.red : 'rgba(163,52,42,0.5)', s.released ? 2.6 : 1.5);
  g.restore();
  // the catch that holds the servant's sliding platform
  const a = s.released ? -0.6 : 0;
  line(g, 300, 628, 300 - Math.cos(a) * 26, 628 + Math.sin(a) * 26, '#5a3a1e', 4);
  dot(g, 300, 628, 3, C.gold, C.ink);
}

function servant(g, s, t) {
  const sc = lerp(1, 1.14, s.fwd), x = 250, feet = 626 + s.fwd * 6;
  const sy = feet - 150 * sc, L = 56 * sc;
  rect(g, x - 46 * sc, feet - 4, 92 * sc, 8, C.wood2, C.ink, 1);
  // robe and sash
  g.beginPath(); g.moveTo(x - 24 * sc, sy); g.lineTo(x + 24 * sc, sy); g.lineTo(x + 42 * sc, feet - 4); g.lineTo(x - 42 * sc, feet - 4); g.closePath(); paint(g, C.violet, C.ink, 2);
  rect(g, x - 28 * sc, sy + 50 * sc, 56 * sc, 9 * sc, C.gold, C.ink, 1);
  dot(g, x, sy - 18 * sc, 16 * sc, C.skin, C.ink, 1.5);
  g.beginPath(); g.ellipse(x, sy - 30 * sc, 18 * sc, 10 * sc, 0, 0, TAU); paint(g, C.saffron, C.ink, 1.5);
  dot(g, x - 5 * sc, sy - 19 * sc, 1.6 * sc, C.ink); dot(g, x + 5 * sc, sy - 19 * sc, 1.6 * sc, C.ink);
  // left arm (viewer's left) holds the cup; right arm holds the jug
  const lsx = x - 22 * sc, lsy = sy + 6 * sc, rsx = x + 22 * sc, rsy = sy + 6 * sc;
  const lh = [lsx + Math.sin(s.armL) * L, lsy + Math.cos(s.armL) * L - 10 * Math.max(0, s.armL - 0.5)];
  const rh = [rsx - Math.sin(s.armR) * L, rsy + Math.cos(s.armR) * L];
  line(g, lsx, lsy, lh[0], lh[1], C.ink, 7 * sc); line(g, lsx, lsy, lh[0], lh[1], C.violet, 4.5 * sc);
  line(g, rsx, rsy, rh[0], rh[1], C.ink, 7 * sc); line(g, rsx, rsy, rh[0], rh[1], C.violet, 4.5 * sc);
  // cup
  const cx = lh[0] + 6 * sc, cy = lh[1] - 4 * sc;
  s.cupPos = [cx - 10 * sc, cy - 8 * sc]; s.jugPos = [rh[0] + 8 * sc, rh[1] - 12 * sc]; // for the labels
  g.beginPath(); g.moveTo(cx - 13 * sc, cy - 14 * sc); g.lineTo(cx + 13 * sc, cy - 14 * sc); g.lineTo(cx + 7 * sc, cy); g.lineTo(cx - 7 * sc, cy); g.closePath(); paint(g, C.gold, C.ink, 1.3);
  if (s.cup > 0.02) { g.beginPath(); g.ellipse(cx, cy - 14 * sc + (1 - s.cup) * 8 * sc, 11 * sc * (0.7 + 0.3 * s.cup), 2.5 * sc, 0, 0, TAU); paint(g, '#b0451a', null); }
  // jug, tilting to pour
  g.save(); g.translate(rh[0], rh[1]); g.rotate(s.tilt * 1.15);
  g.beginPath(); g.moveTo(-9 * sc, 0); g.quadraticCurveTo(-14 * sc, -16 * sc, -6 * sc, -26 * sc); g.lineTo(6 * sc, -26 * sc);
  g.quadraticCurveTo(14 * sc, -16 * sc, 9 * sc, 0); g.closePath(); paint(g, C.copper, C.ink, 1.3);
  g.beginPath(); g.moveTo(6 * sc, -24 * sc); g.lineTo(16 * sc, -30 * sc); paint(g, null, C.ink, 4 * sc); paint(g, null, C.copper, 2.5 * sc);
  g.restore();
  const a = s.tilt * 1.15, spx = rh[0] + Math.cos(a) * 16 * sc - Math.sin(a) * -30 * sc, spy = rh[1] + Math.sin(a) * 16 * sc + Math.cos(a) * -30 * sc;
  if (s.pouring) {
    g.beginPath(); g.moveTo(spx, spy); g.quadraticCurveTo(spx + 4, (spy + cy) / 2, cx, cy - 12 * sc); paint(g, null, 'rgba(176,69,26,0.85)', 3);
  }
}

function draw(g, s, t, f) {
  building(g, !!f.cut);
  reservoir(g, s);
  if (f.cut) hiddenWorks(g, s, t);
  servant(g, s, t);
}

const scene = makeScene({
  T,
  events: [[0.5, 'tek'], [1.5, 'tek'], [2.5, 'tek'], [3.5, 'tek'], [4.5, 'tek'], [5.5, 'tek'], [6.0, 'click'], [8.0, 'pour:1.6'], [10.2, 'chime']],
  cycle, draw,
  info: (s, f) => (f.minutes ? (s.minutes >= 7 ? 'About 7 minutes: time to serve!' : `Minutes passed: ${Math.floor(s.minutes)}`) : null),
});

export const drink = {
  title: 'The Drink Server',
  arabic: 'الجارية الساقية',
  view: [80, 80, 340, 590],
  pages: [
    {
      title: 'The Drink-Serving Servant',
      text: [
        'At royal parties, al-Jazari\'s machines served drinks to the guests.',
        'In this one, a servant figure waits inside an arch.',
        'Every few minutes he steps forward, pours a drink into a cup, and offers it to a guest.',
        'No one pushes a button. The machine keeps its own time.',
      ],
      scene: scene({ offset: 5 }),
    },
    {
      title: 'A slow drip',
      view: [180, 80, 220, 300],
      text: [
        'On the roof stands a glass tank full of drink.',
        'The drink drips slowly through a pipe into a hidden container.',
        'The slow dripping measures time, just like a water clock.',
        'In one of al-Jazari\'s designs, it took about seven minutes for enough drink to collect.',
      ],
      scene: scene({
        cut: true, minutes: true,
        focus: () => [324, 214, 40],
        labels: [
          { text: 'glass tank', at: [292, 130], tx: 225, ty: 120 },
          { text: 'drip', at: [316, 200], tx: 380, ty: 120 },
          { text: 'hidden container', at: [BOX.x, 228], tx: 230, ty: 330 },
        ],
      }),
    },
    {
      title: 'Time to serve',
      view: [120, 170, 290, 480],
      text: [
        'When the hidden container is full, a float inside it has risen to the top.',
        'The float pulls a cord, and the cord lifts a catch near the floor.',
        'Now nothing holds the servant back, and he glides forward through the arch.',
      ],
      scene: scene({
        cut: true, minutes: true, offset: 4,
        focus: (s, tc) => (tc < 6.2 ? [BOX.x + 39, 210, 22] : [282, 626, 30]),
        labels: [
          { text: 'float', at: [BOX.x + 48, 196], tx: 395, ty: 260 },
          { text: 'cord', at: [366, 420], tx: 400, ty: 470 },
          { text: 'catch', at: [282, 630], tx: 190, ty: 600 },
        ],
      }),
    },
    {
      title: 'Pouring the drink',
      view: [160, 400, 190, 200],
      text: [
        'The servant raises his jug and tips it over the cup.',
        'The drink pours out until the cup is full.',
        'Then he holds the cup out to the guest, and a little bell rings.',
      ],
      scene: scene({
        offset: 6.6,
        labels: [
          { text: 'jug', at: (s) => s.jugPos, tx: 330, ty: 430 },
          { text: 'cup', at: (s) => s.cupPos, tx: 186, ty: 575 },
        ],
      }),
    },
    {
      title: 'Siphons and floats',
      text: [
        'Al-Jazari designed several drink-serving machines like this for royal gatherings.',
        'He controlled the flow of drink with floats and with siphons.',
        'A siphon is a bent tube that, once started, keeps liquid flowing up over the edge of a container and down the other side.',
        'This museum model is a reconstruction of the idea. Close the book and press the brass button to be served!',
      ],
      scene: scene({ cut: true, offset: 8 }),
    },
  ],
};

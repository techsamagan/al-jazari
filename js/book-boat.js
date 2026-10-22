// The Musical Boat teaching book.
import { TAU, PI, C, lerp, paint, dot, rect, line, waves, figure, makeScene } from './book-draw.js';

const T = 8, REV = 4, SLOT = 0.5;               // the peg drum turns once every 4 seconds, 8 peg holes
const RHYTHM_A = [1, 0, 0, 1, 0, 0, 1, 0];
const RHYTHM_B = [1, 0, 1, 0, 1, 1, 0, 1];
const FLUTE = [1, 0, 1, 1, 0, 1, 0, 1];
const NOTES = [293.66, 311.13, 369.99, 392.0, 440.0, 392.0, 369.99, 311.13];

const rhythmFor = (rev, f) => (f.mode === 'program' && !f.rows2 && rev % 2 ? RHYTHM_B : RHYTHM_A);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function cycle(tc, t, f) {
  const rev = Math.floor(tc / REV), u = tc % REV;
  const pat = rhythmFor(rev, f);
  const angle = (k) => -PI / 2 + ((k * SLOT - u) / REV) * TAU; // where peg hole k is on the drum
  let lift = 0, fl = 0;
  for (let k = 0; k < 8; k++) {
    const d = Math.abs(wrap(angle(k) + PI / 2));
    if (pat[k]) lift = Math.max(lift, Math.max(0, 1 - d / 0.33));
    if (FLUTE[k]) fl = Math.max(fl, Math.max(0, 1 - d / 0.33));
  }
  return { rev, u, pat, angle, lift, flute: fl, wheel: t * 3.2 };
}

// ---------------------------------------------------------------- the boat, side view
function hullPath(g) {
  g.beginPath(); g.moveTo(80, 455);
  g.quadraticCurveTo(110, 538, 250, 542); g.quadraticCurveTo(390, 538, 420, 455); g.closePath();
}
function drawBoat(g, s, t, cut) {
  waves(g, 20, 480, 505, 120, t);
  g.save();
  const bob = Math.sin(t * 1.3) * 3;
  g.translate(250, 470 + bob); g.rotate(Math.sin(t * 0.9) * 0.012); g.translate(-250, -470);
  // stern and bow scrolls
  for (const [x, d] of [[84, -1], [416, 1]]) {
    g.beginPath(); g.moveTo(x, 458); g.bezierCurveTo(x + d * 22, 440, x + d * 30, 410, x + d * 12, 392);
    g.arc(x + d * 4, 398, 8, -PI / 2 - d * 0.6, PI * 0.9, d < 0);
    g.lineCap = 'round'; paint(g, null, C.ink, 9); paint(g, null, C.gold, 5);
  }
  g.save(); if (cut) g.globalAlpha = 0.35;
  hullPath(g); paint(g, C.wood, null);
  for (let x = 115; x < 400; x += 22) { g.beginPath(); g.moveTo(x, 482); g.lineTo(x + 6, 476); g.lineTo(x + 12, 482); g.lineTo(x + 6, 488); g.closePath(); paint(g, C.gold, null); }
  g.restore();
  hullPath(g); paint(g, null, C.ink, 2.5);
  line(g, 80, 455, 420, 455, C.gold, 5); line(g, 80, 455, 420, 455, C.ink, 1);
  if (cut) insides(g, s, t);
  // canopy
  for (const x of [118, 382]) rect(g, x - 2, 332, 4, 123, C.gold, C.ink, 1);
  rect(g, 104, 318, 292, 15, C.red, C.ink, 1.5);
  line(g, 106, 322, 394, 322, C.gold, 1.5); line(g, 106, 329, 394, 329, C.gold, 1.5);
  g.beginPath(); g.arc(250, 318, 20, PI, TAU); g.closePath(); paint(g, C.gold, C.ink, 1.5);
  // musicians: two flute players, a harpist, a drummer
  for (const [x, robe, tur] of [[140, C.violet, C.ivory], [195, C.green, C.saffron]]) {
    const head = 455 - 34 * (56 / 60) - 9 * (56 / 60);
    figure(g, { x, y: 455, h: 56, robe, turban: tur, seated: true, arm: 2.0 });
    line(g, x + 7, head + 3, x + 32, head + 14 - s.flute * 2, C.ivory, 3);
    line(g, x + 7, head + 3, x + 32, head + 14 - s.flute * 2, C.ink, 0.8);
  }
  const hx = 255;
  figure(g, { x: hx, y: 455, h: 56, robe: C.lapis, seated: true, arm: 1.5 + Math.sin(t * 4) * 0.25 });
  g.beginPath(); g.moveTo(hx + 12, 452); g.lineTo(hx + 15, 404); g.quadraticCurveTo(hx + 34, 404, hx + 36, 420); g.closePath();
  paint(g, null, C.gold, 3);
  for (let i = 1; i < 4; i++) line(g, hx + 14 + i * 1, 452 - i * 2, hx + 14 + i * 5, 410 + i * 2, C.ivory, 0.8);
  const dx = 320;
  rect(g, dx + 18, 440, 22, 14, C.saffron, C.ink, 1.2);
  g.beginPath(); g.ellipse(dx + 29, 440, 11, 4, 0, 0, TAU); paint(g, C.ivory, C.ink, 1);
  const hand = figure(g, { x: dx, y: 455, h: 56, robe: C.red, seated: true, arm: lerp(2.3, 1.15, s.lift) });
  if (cut) line(g, s.leverEnd[0], s.leverEnd[1], hand[0], hand[1], '#5a3a1e', 1.8); // the rod to the drummer's arm
  g.restore();
}

function pegDrum(g, s, x, y, r, pegLen, pat) {
  g.beginPath(); g.arc(x, y, r, 0, TAU); paint(g, C.brass, C.ink, 2);
  g.beginPath(); g.arc(x, y, r * 0.78, 0, TAU); paint(g, null, 'rgba(58,38,20,0.35)', 1);
  for (let k = 0; k < 8; k++) {
    const a = s.angle(k), cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r;
    if (pat[k]) {
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(x + Math.cos(a) * (r + pegLen), y + Math.sin(a) * (r + pegLen));
      g.lineCap = 'round'; paint(g, null, C.ink, pegLen * 0.75); paint(g, null, '#f0c869', pegLen * 0.5);
    } else dot(g, x + Math.cos(a) * (r - pegLen * 0.25), y + Math.sin(a) * (r - pegLen * 0.25), pegLen * 0.22, C.ink);
  }
  dot(g, x, y, r * 0.12, C.wood2, C.ink);
}

function insides(g, s, t) {
  // water from a small tank turns the wheel, the wheel turns the peg drum
  rect(g, 98, 462, 34, 34, 'rgba(243,234,214,0.6)', C.ink, 1.5);
  rect(g, 99, 474, 32, 21, C.water, null);
  for (let k = 0; k < 3; k++) { const p = (t * 1.6 + k / 3) % 1; dot(g, 138 + p * 8, 486 + p * 10, 2, C.water2); }
  const wx = 165, wy = 505;
  g.beginPath(); g.arc(wx, wy, 20, 0, TAU); paint(g, null, C.wood2, 3);
  for (let i = 0; i < 8; i++) { const a = s.wheel + (i / 8) * TAU; line(g, wx, wy, wx + Math.cos(a) * 24, wy + Math.sin(a) * 24, C.wood2, 3); }
  line(g, wx, wy, 290, 503, C.wood2, 4);
  pegDrum(g, s, 290, 503, 22, 7, s.pat);
  // the follower lever and the rod up to the drummer's arm
  const px = 320, py = 472, tipY = 476 - s.lift * 9;
  const a = Math.atan2(py - tipY, px - 293), ry = py + Math.sin(a) * 26;
  line(g, 293, tipY, px + Math.cos(a) * 26, ry, '#6b4422', 4);
  dot(g, px, py, 3, C.gold, C.ink);
  s.leverEnd = [px + 26, ry];
}

// ---------------------------------------------------------------- the peg drum "program"
function drawProgram(g, s, t, f) {
  const cx = 230, cy = 240, R = 92;
  pegDrum(g, s, cx, cy, R, 16, s.pat);
  // lever riding on the top of the drum, with a rod to the drummer
  const tipY = cy - R - 3 - s.lift * 14, px = 300, py = 140;
  const a = Math.atan2(py - tipY, px - cx), ex = px + Math.cos(a) * 46, ey = py + Math.sin(a) * 46;
  line(g, cx, tipY, ex, ey, '#6b4422', 6);
  dot(g, px, py, 5, C.gold, C.ink);
  rect(g, px - 3, py, 6, 60, C.wood2, C.ink, 1);
  rect(g, 398, 228, 30, 18, C.saffron, C.ink, 1.2);
  g.beginPath(); g.ellipse(413, 228, 15, 5, 0, 0, TAU); paint(g, C.ivory, C.ink, 1);
  const hand = figure(g, { x: 380, y: 250, h: 80, robe: C.red, seated: true, arm: lerp(2.3, 1.2, s.lift) });
  line(g, ex, ey, hand[0], hand[1], '#5a3a1e', 2);
  // the pegs unrolled into a strip: what the drum will play
  const rows = f.rows2 ? [[s.pat, 'drum'], [FLUTE, 'flute']] : [[s.pat, null]];
  const x0 = 60, cw = 47.5, top = 390;
  rows.forEach(([pat, name], r) => {
    const y = top + r * 78;
    rect(g, x0, y, cw * 8, 54, 'rgba(201,151,58,0.25)', C.ink, 1.5);
    for (let k = 0; k < 8; k++) {
      const x = x0 + k * cw + cw / 2;
      if (k) line(g, x0 + k * cw, y, x0 + k * cw, y + 54, 'rgba(58,38,20,0.4)', 1);
      if (pat[k]) { dot(g, x, y + 27, 13, '#f0c869', C.ink, 1.5); dot(g, x - 4, y + 23, 3.5, 'rgba(255,255,255,0.6)'); }
      else dot(g, x, y + 27, 5, C.ink);
    }
    if (name) {
      g.font = 'italic 18px "EB Garamond", Georgia, serif'; g.fillStyle = C.ink; g.textAlign = 'left';
      g.fillText(name === 'drum' ? 'drum pegs' : 'flute pegs', x0, y - 6);
    }
  });
  const ph = x0 + (s.u / REV) * cw * 8;
  line(g, ph, top - 8, ph, top + rows.length * 78 - 16, C.red, 3);
  g.beginPath(); g.moveTo(ph - 7, top - 16); g.lineTo(ph + 7, top - 16); g.lineTo(ph, top - 6); g.closePath(); paint(g, C.red, null);
}

const scene = makeScene({
  T,
  events: (f) => {
    const ev = [];
    for (let rev = 0; rev < 2; rev++) {
      const pat = rhythmFor(rev, f);
      for (let k = 0; k < 8; k++) {
        const at = rev * REV + k * SLOT + 0.001;
        if (pat[k]) ev.push([at, k % 4 === 0 ? 'drum2' : 'drumHi']);
        if (f.rows2 && FLUTE[k]) ev.push([at, `flute:${NOTES[k]}`]);
      }
    }
    return ev;
  },
  cycle,
  draw: (g, s, t, f) => (f.mode === 'program' ? drawProgram(g, s, t, f) : drawBoat(g, s, t, !!f.cut)),
  info: (s, f) => (f.mode === 'program' && !f.rows2 ? (s.pat === RHYTHM_B ? 'Pegs moved: rhythm 2' : 'Rhythm 1') : null),
});

export const boat = {
  title: 'The Musical Boat',
  arabic: 'زورق الموسيقيين',
  view: [20, 240, 460, 470],
  pages: [
    {
      title: 'The Musical Boat',
      text: [
        'Al-Jazari built this boat to entertain guests at royal parties.',
        'It floated on a lake, carrying four musicians: a drummer, a harp player, and two flute players.',
        'As it drifted across the water, the musicians seemed to play music all by themselves.',
        'How did they do it? Let us look inside the boat.',
      ],
      scene: scene({}),
    },
    {
      title: 'A drum full of pegs',
      view: [70, 400, 300, 200],
      text: [
        'Hidden inside the boat was a turning drum, covered with small pegs.',
        'In al-Jazari\'s design, flowing water turned a little wheel, and the wheel turned the drum.',
        'As long as the water flowed, the drum kept turning, round and round.',
      ],
      scene: scene({
        cut: true,
        focus: () => [290, 503, 40],
        labels: [
          { text: 'water', at: [115, 485], tx: 110, ty: 430 },
          { text: 'water wheel', at: [165, 525], tx: 150, ty: 580 },
          { text: 'peg drum', at: [290, 525], tx: 300, ty: 580 },
        ],
      }),
    },
    {
      title: 'Pegs push levers',
      view: [240, 380, 150, 140],
      text: [
        'Resting on the drum was a small lever.',
        'Every time a peg came round, it pushed the lever up.',
        'The lever pulled a rod connected to the drummer\'s arm, and the drummer struck his drum.',
        'Where there was no peg, there was no beat.',
      ],
      scene: scene({
        cut: true,
        focus: () => [300, 476, 18],
        labels: [
          { text: 'peg', at: [290, 482], tx: 262, ty: 532 },
          { text: 'lever', at: [312, 472], tx: 300, ty: 400 },
          { text: 'rod', at: [344, 455], tx: 372, ty: 500 },
        ],
      }),
    },
    {
      title: 'Changing the rhythm',
      view: [40, 96, 420, 480],
      text: [
        'The pegs could be pulled out and put into different holes.',
        'Moving the pegs changed the pattern of beats, so the drummer played a new rhythm.',
        'Giving a machine new instructions like this is called programming.',
        'That is why roboticist Noel Sharkey has called this boat an early programmable drum machine.',
      ],
      scene: scene({
        mode: 'program',
        labels: [
          { text: 'peg', at: [230, 132], tx: 120, ty: 120 },
          { text: 'lever', at: [280, 136], tx: 300, ty: 100 },
        ],
      }),
    },
    {
      title: 'Program it yourself',
      view: [40, 96, 420, 520],
      text: [
        'The model in this museum has a brass drum with two rings of pegs.',
        'The left ring plays the drum. The right ring plays a flute tune, which is our own addition, not part of al-Jazari\'s design.',
        'Close the book and click any peg on the drum to switch it on or off.',
        'Or press the brass button to try ready-made rhythms.',
      ],
      scene: scene({ mode: 'program', rows2: true }),
    },
  ],
};

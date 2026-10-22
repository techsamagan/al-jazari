// The Castle Clock teaching book.
import { TAU, PI, C, lerp, seg, paint, dot, rect, line, flow, figure, makeScene } from './book-draw.js';

const T = 6;                                    // one "hour" of the clock every 6 seconds
const DOOR_X = (i) => 98 + i * 25.4, DOOR_W = 21, DOOR_Y = 298, DOOR_H = 50;
const TANK = { x: 104, y: 548, w: 82, h: 84 }, PULLEY = [156, 276];

function cycle(tc, t) {
  const hour = Math.floor(t / T) % 12, move = seg(tc, 0, 4.5);
  const s = { hour, move };
  s.crescent = DOOR_X(hour) + DOOR_W / 2 - 25.4 + move * 25.4;
  s.door = seg(tc, 4.5, 5.0);
  s.lean = seg(tc, 4.6, 4.9) * (1 - seg(tc, 5.3, 5.7));
  s.ball = tc > 4.75 && tc < 5.2 ? (tc - 4.75) / 0.45 : -1;
  s.playing = tc > 5.15;
  s.level = 1 - (hour + move) / 12;
  s.zodiac = t * 0.06;
  s.lit = hour + (s.door > 0.5 ? 1 : 0);
  return s;
}

function building(g, s, cut) {
  rect(g, 66, 640, 368, 16, '#5a5048', C.ink, 1.5);
  g.save(); if (cut) g.globalAlpha = 0.45;
  rect(g, 80, 170, 340, 470, C.stone, null);
  g.strokeStyle = 'rgba(58,38,20,0.18)'; g.lineWidth = 1;
  for (let y = 190; y < 640; y += 20) { g.beginPath(); g.moveTo(80, y); g.lineTo(420, y); g.stroke(); }
  g.restore();
  rect(g, 80, 170, 340, 470, null, C.ink, 2);
  for (let x = 80; x < 420; x += 26) rect(g, x, 158, 15, 12, C.stone, C.ink, 1.2);
  // gate
  g.beginPath(); g.moveTo(222, 640); g.lineTo(222, 575); g.quadraticCurveTo(250, 540, 278, 575); g.lineTo(278, 640); g.closePath(); paint(g, '#3a2a1a', C.gold, 2.5);
}

function zodiac(g, s) {
  const cx = 250, cy = 222;
  dot(g, cx, cy, 48, C.gold, C.ink, 2);
  dot(g, cx, cy, 42, '#1f2f5f', C.ink, 1);
  for (let i = 0; i < 12; i++) {
    const a = s.zodiac + (i / 12) * TAU;
    line(g, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, cx + Math.cos(a) * 42, cy + Math.sin(a) * 42, 'rgba(217,180,90,0.6)', 1);
    dot(g, cx + Math.cos(a + 0.26) * 36, cy + Math.sin(a + 0.26) * 36, 1.6, C.ivory);
  }
  const sa = s.zodiac * 0.5, ma = -s.zodiac * 0.9 + 1;
  dot(g, cx + Math.cos(sa) * 28, cy + Math.sin(sa) * 28, 6, '#f2c14e', C.ink, 1);
  dot(g, cx + Math.cos(ma) * 20, cy + Math.sin(ma) * 20, 5, C.ivory, C.ink, 1);
  dot(g, cx + Math.cos(ma) * 20 + 2.5, cy + Math.sin(ma) * 20 - 1, 4.2, '#1f2f5f');
}

function gallery(g, s) {
  rect(g, 92, 284, 316, 8, C.gold, C.ink, 1.2);
  // the crescent moon riding along its track
  const x = s.crescent, y = 280;
  dot(g, x, y, 9, '#f2d27a', C.ink, 1.2); dot(g, x + 4, y - 2, 7.5, C.stone);
  for (let i = 0; i < 12; i++) {
    const x0 = DOOR_X(i);
    rect(g, x0, DOOR_Y, DOOR_W, DOOR_H, '#2a1d12', C.ink, 1.2);
    const open = i < s.hour ? 1 : i === s.hour ? s.door : 0;
    if (open > 0.3) figure(g, { x: x0 + DOOR_W / 2, y: DOOR_Y + DOOR_H - 2, h: 34, robe: i % 2 ? C.red : C.green, arm: 1.6 });
    const w = DOOR_W * (1 - open * 0.9);
    rect(g, x0, DOOR_Y, w, DOOR_H, C.wood, C.ink, 1);
    if (w > 8) dot(g, x0 + w - 4, DOOR_Y + DOOR_H / 2, 1.6, C.gold);
  }
}

function lamps(g, s, night) {
  for (let i = 0; i < 12; i++) {
    const x = DOOR_X(i) + DOOR_W / 2, on = night && i < s.lit;
    if (on) { const gr = g.createRadialGradient(x, 368, 1, x, 368, 18); gr.addColorStop(0, 'rgba(255,214,120,0.9)'); gr.addColorStop(1, 'rgba(255,214,120,0)'); g.fillStyle = gr; g.fillRect(x - 18, 350, 36, 36); }
    dot(g, x, 368, 7, on ? '#ffe39a' : 'rgba(200,215,220,0.7)', C.ink, 1);
  }
}

function falconsAndVases(g, s, t) {
  for (const [x, f] of [[100, -1], [400, 1]]) {
    rect(g, x - 14, 428, 28, 6, C.wood2, C.ink, 1);
    g.save(); g.translate(x, 428); g.scale(f, 1); g.rotate(s.lean * 0.6);
    g.beginPath(); g.ellipse(0, -12, 11, 8, -0.3, 0, TAU); paint(g, '#8a6a4a', C.ink, 1.4);
    dot(g, 9, -20, 5.5, '#8a6a4a', C.ink, 1.2);
    g.beginPath(); g.moveTo(13, -22); g.quadraticCurveTo(18, -20, 15, -15); g.closePath(); paint(g, C.gold, C.ink, 1);
    g.restore();
    rect(g, x - 16, 492, 32, 6, C.wood2, C.ink, 1);
    g.beginPath(); g.ellipse(x, 480, 11, 11, 0, 0, TAU); paint(g, C.brass, C.ink, 1.4);
    rect(g, x - 5, 464, 10, 6, C.brass, C.ink, 1.2);
    if (s.ball >= 0) { const p = s.ball; dot(g, x + f * 14 * (1 - p), lerp(410, 466, p * p), 4.5, '#7d5b2e', C.ink); }
  }
}

function band(g, s, t) {
  rect(g, 140, 520, 220, 8, C.wood2, C.ink, 1.2);
  const kinds = ['drum', 'trumpet', 'cymbal', 'trumpet', 'drum'];
  kinds.forEach((k, i) => {
    const x = 170 + i * 40, p = s.playing;
    const arm = k === 'drum' ? (p ? 1.2 + Math.abs(Math.sin(t * 14 + i)) * 0.9 : 1.0) : k === 'trumpet' ? 2.3 : (p ? 1.4 + Math.sin(t * 6) * 0.4 : 1.2);
    const hand = figure(g, { x, y: 520, h: 42, robe: [C.lapis, C.red, C.green, C.violet, C.saffron][i], seated: true, arm });
    if (k === 'drum') { rect(g, x + 8, 506, 12, 12, C.saffron, C.ink, 1); }
    else if (k === 'trumpet') { line(g, x + 4, 488, x + 28 + (p ? 2 : 0), 476, C.gold, 2.5); dot(g, x + 29, 475, 3.5, C.gold, C.ink); }
    else { dot(g, hand[0], hand[1], 5, C.gold, C.ink); }
  });
}

function insides(g, s, t, valveLabel) {
  rect(g, TANK.x, TANK.y, TANK.w, TANK.h, 'rgba(243,234,214,0.65)', null);
  const wy = TANK.y + TANK.h - s.level * (TANK.h - 10);
  rect(g, TANK.x + 1, wy, TANK.w - 2, TANK.y + TANK.h - wy, C.water, null);
  rect(g, TANK.x, TANK.y, TANK.w, TANK.h, null, C.ink, 2.5);
  rect(g, PULLEY[0] - 14, wy - 9, 28, 10, C.wood, C.ink, 1.2);
  // steady outflow through an adjustable tap
  line(g, TANK.x + TANK.w, TANK.y + TANK.h - 8, TANK.x + TANK.w + 18, TANK.y + TANK.h - 8, C.copper, 5);
  dot(g, TANK.x + TANK.w + 12, TANK.y + TANK.h - 8, 5, valveLabel ? C.red : C.gold, C.ink);
  flow(g, [[TANK.x + TANK.w + 18, TANK.y + TANK.h - 8], [TANK.x + TANK.w + 20, 636]], t, C.water2, 3, 40);
  // the cord: float → pulley → along the track → crescent carriage
  g.beginPath(); g.moveTo(PULLEY[0], wy - 9); g.lineTo(PULLEY[0], PULLEY[1]); g.lineTo(s.crescent, PULLEY[1]);
  paint(g, null, C.red, 2);
  dot(g, PULLEY[0], PULLEY[1], 6, C.gold, C.ink);
}

function draw(g, s, t, f) {
  building(g, s, !!f.cut);
  zodiac(g, s);
  if (f.cut) insides(g, s, t, f.valve);
  gallery(g, s);
  lamps(g, s, !!f.night);
  falconsAndVases(g, s, t);
  band(g, s, t);
  if (f.night) { g.fillStyle = 'rgba(20,24,60,0.32)'; g.fillRect(80, 170, 340, 470); lamps(g, s, true); }
}

const scene = makeScene({
  T, cycle, draw,
  events: [[4.5, 'click'], [5.2, 'clang'], [5.25, 'drum'], [5.45, 'trumpet:293.66'], [5.6, 'drum2'], [5.75, 'trumpet:440'], [5.9, 'cymbal']],
  info: (s, f) => (f.hours ? `Hour ${s.hour + 1} of 12` : null),
});

export const castle = {
  title: 'The Castle Clock',
  arabic: 'ساعة القلعة',
  view: [60, 150, 380, 510],
  pages: [
    {
      title: 'The Castle Clock',
      text: [
        'The Castle Clock was a huge water clock, about three and a half metres tall in al-Jazari\'s description.',
        'Every hour it put on a show, with opening doors, falling balls and a band of musicians.',
        'At night it lit up, and a turning disc showed the sun and the moon among the stars.',
      ],
      scene: scene({ offset: 2, hours: true }),
    },
    {
      title: 'A float that sinks steadily',
      view: [80, 250, 300, 400],
      text: [
        'Inside the clock, water flows slowly and steadily out of a tank.',
        'A float on the water sinks lower and lower as the tank empties.',
        'The float is tied to a cord, which runs up over a pulley and pulls a little carriage along a track.',
        'The golden crescent moon rides on that carriage, moving from door to door.',
      ],
      scene: scene({
        cut: true, hours: true,
        focus: (s) => [PULLEY[0], TANK.y + TANK.h - s.level * (TANK.h - 10) - 4, 24],
        labels: [
          { text: 'tank', at: [TANK.x + 12, TANK.y + 50], tx: 140, ty: 540 },
          { text: 'float', at: (s) => [PULLEY[0] + 14, TANK.y + TANK.h - s.level * (TANK.h - 10) - 4], tx: 320, ty: 600 },
          { text: 'cord', at: [PULLEY[0], 420], tx: 205, ty: 448 },
          { text: 'crescent moon', at: (s) => [s.crescent, 272], tx: 280, ty: 262 },
        ],
      }),
    },
    {
      title: 'Every hour, a show',
      view: [78, 270, 344, 290],
      text: [
        'When the crescent reaches the next door, the door opens and a figure appears.',
        'At the same moment, the two falcons lean forward and drop balls into the vases. Clang!',
        'Then the musicians play their drums, trumpets and cymbals.',
      ],
      scene: scene({
        offset: 3.5,
        focus: (s, tc) => (tc > 4.3 && tc < 5.1 ? [DOOR_X(s.hour) + DOOR_W / 2, DOOR_Y + DOOR_H / 2, 22] : tc >= 5.1 ? [250, 500, 50] : [0, 0, 0]),
        labels: [
          { text: 'door', at: (s) => [DOOR_X(s.hour) + DOOR_W / 2, DOOR_Y], tx: 250, ty: 270 },
          { text: 'falcon', at: [392, 414], tx: 400, ty: 384 },
          { text: 'vase', at: [110, 482], tx: 108, ty: 530 },
          { text: 'musicians', at: [290, 492], tx: 345, ty: 548 },
        ],
      }),
    },
    {
      title: 'Lights and stars',
      view: [78, 160, 344, 250],
      text: [
        'At night, a row of lamps lit up one by one, one more every hour.',
        'Above them, the zodiac disc slowly turned, showing where the sun and the moon were among the stars.',
      ],
      scene: scene({
        night: true, hours: true,
        labels: [
          { text: 'zodiac disc', at: [292, 210], tx: 368, ty: 200 },
          { text: 'lamps', at: [DOOR_X(1) + 10, 375], tx: 130, ty: 405 },
        ],
      }),
    },
    {
      title: 'A clock you could program',
      text: [
        'In al-Jazari\'s time, daylight was divided into twelve hours, so an hour was longer in summer and shorter in winter.',
        'The Castle Clock could be adjusted so that its hours matched the season.',
        'That is why it is often described as an early programmable analog computer.',
        'Close the book and press the brass button to move the clock ahead one hour!',
      ],
      scene: scene({
        cut: true, valve: true, hours: true,
        labels: [{ text: 'adjustable flow', at: [TANK.x + TANK.w + 12, TANK.y + TANK.h - 8], tx: 330, ty: 600 }],
      }),
    },
  ],
};

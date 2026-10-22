// The Double-Acting Piston Pump teaching book. Drawn from above, like al-Jazari's own drawing.
import { TAU, PI, C, lerp, paint, dot, rect, line, flow, gear, waves, makeScene } from './book-draw.js';

const T = 8, REV = 4;
const G = { x: 250, y: 455, r: 52 };         // the flat (horizontal) gear
const PIN_R = 30, O = { x: 250, y: 560 }, LEVER = 230, ROD_Y = 330, HALF = 130;
const CYL = { y: 312, h: 36, lx0: 40, lx1: 200, rx0: 300, rx1: 460 };

function cycle(tc) {
  const th = (tc / REV) * TAU;
  const pin = [G.x + PIN_R * Math.cos(th), G.y + PIN_R * Math.sin(th)];
  const beta = Math.atan2(pin[0] - O.x, O.y - pin[1]);
  const end = [O.x + LEVER * Math.sin(beta), O.y - LEVER * Math.cos(beta)];
  const v = -Math.sin(th);                       // + = rod moving right
  return { th, pin, beta, end, v, rodX: end[0] };
}

function valve(g, x, y, open, horizontal) {
  g.save(); g.translate(x, y);
  rect(g, -7, -7, 14, 14, 'rgba(243,234,214,0.9)', C.ink, 1.2);
  g.rotate(horizontal ? (open ? 0.9 : 0) : (open ? PI / 2 - 0.9 : PI / 2));
  line(g, -6, 0, 6, 0, open ? C.green : C.red, 3);
  g.restore();
}

function draw(g, s, t) {
  waves(g, 20, 480, 598, 92, t);
  // paddle wheel seen from above: paddles slide across as it turns
  rect(g, 172, 606, 156, 40, 'rgba(138,90,50,0.35)', C.ink, 2);
  for (let i = 0; i < 10; i++) {
    const a = s.th * 1 + (i / 10) * TAU;
    if (Math.sin(a) < 0) continue;
    const x = 250 + 76 * Math.cos(a);
    line(g, x, 606, x, 646, C.wood2, 4);
  }
  line(g, 250, 606, 250, 528, '#555', 5);
  // upright gear on the axle (seen edge-on) meshing with the flat gear
  rect(g, 198, 512, 104, 16, C.wood, C.ink, 1.5);
  for (let i = 0; i < 12; i++) {
    const a = s.th + (i / 12) * TAU;
    if (Math.sin(a) < 0) continue;
    const x = 250 + 50 * Math.cos(a);
    line(g, x, 512, x, 528, C.wood2, 3);
  }
  gear(g, G.x, G.y, G.r, 16, s.th, C.wood, 7);
  dot(g, s.pin[0], s.pin[1], 6, C.brass, C.ink, 1.5);
  // the slotted swinging rod
  const [ex, ey] = s.end, ca = Math.cos(s.beta), sa = Math.sin(s.beta);
  g.save(); g.translate(O.x, O.y); g.rotate(s.beta);
  rect(g, -7, -LEVER - 6, 14, LEVER + 12, C.copper, C.ink, 1.5);
  rect(g, -2.5, -LEVER + 40, 5, LEVER - 70, '#3a2614', null);
  g.restore();
  dot(g, s.pin[0], s.pin[1], 5, C.brass, C.ink, 1.5);
  dot(g, O.x, O.y, 6, C.gold, C.ink, 1.5);
  // cylinders and pistons
  const lp = s.rodX - HALF, rp = s.rodX + HALF;
  for (const [x0, x1, px, outer] of [[CYL.lx0, CYL.lx1, lp, CYL.lx0], [CYL.rx0, CYL.rx1, rp, CYL.rx1]]) {
    rect(g, x0, CYL.y, x1 - x0, CYL.h, 'rgba(220,235,240,0.35)', null);
    rect(g, Math.min(outer, px), CYL.y + 2, Math.abs(px - outer), CYL.h - 4, C.water, null);
    g.beginPath(); g.moveTo(x0, CYL.y); g.lineTo(x1, CYL.y); g.moveTo(x0, CYL.y + CYL.h); g.lineTo(x1, CYL.y + CYL.h);
    g.moveTo(outer, CYL.y); g.lineTo(outer, CYL.y + CYL.h); paint(g, null, C.ink, 3);
    rect(g, px - 6, CYL.y + 2, 12, CYL.h - 4, C.copper, C.ink, 1.5);
  }
  line(g, lp, ROD_Y, rp, ROD_Y, '#555', 5);
  dot(g, ex, ROD_Y, 5, C.gold, C.ink, 1.2);
  line(g, ex, ey, ex, ROD_Y, C.copper, 3);
  // pipes: suction from the river, delivery up to the outlet
  const leftPush = s.v < 0, rightPush = s.v > 0;
  for (const [x, push, side] of [[48, leftPush, -1], [452, rightPush, 1]]) {
    line(g, x, CYL.y + CYL.h, x, 600, C.copper, 7);
    line(g, x, CYL.y, x, 182, C.copper, 7);
    line(g, x, 182, 250, 182, C.copper, 7);
    valve(g, x, 372, !push, false);
    valve(g, x, 290, push, false);
    if (!push) flow(g, [[x, 598], [x, CYL.y + CYL.h + 2]], t, C.water2, 3, 50);
    else flow(g, [[x, CYL.y - 2], [x, 182], [250 - side * 4, 182]], t, C.water2, 3, 60);
  }
  line(g, 250, 182, 250, 128, C.copper, 8);
  flow(g, [[250, 180], [250, 126]], t, C.water2, 3, 60);
  rect(g, 196, 92, 108, 36, C.stone, C.ink, 1.5);
  rect(g, 200, 104, 100, 20, C.water, null);
  g.font = 'italic 17px "EB Garamond", Georgia, serif'; g.fillStyle = C.ink; g.textAlign = 'center';
  g.fillText('to the gardens', 250, 82);
}

const scene = makeScene({
  T, cycle, draw,
  events: [[0.01, 'click'], [2, 'click'], [4, 'click'], [6, 'click'], [0.3, 'splash'], [2.3, 'splash'], [4.3, 'splash'], [6.3, 'splash']],
});

export const pump = {
  title: 'The Double-Acting Pump',
  arabic: 'المضخة ذات الأسطوانتين',
  view: [20, 70, 460, 630],
  pages: [
    {
      title: 'The Double-Acting Pump',
      text: [
        'This machine lifted water from a river, to water gardens and fields.',
        'It was powered by the river itself, so no people or animals were needed.',
        'Al-Jazari described it in his book in 1206. This drawing shows it from above.',
        'Let us follow the power, step by step.',
      ],
      scene: scene({}),
    },
    {
      title: 'Power from the river',
      view: [95, 395, 310, 300],
      text: [
        'A paddle wheel stands in a flowing stream, and the water pushes it round.',
        'The wheel\'s axle turns an upright gear.',
        'That gear meshes with a second, flat gear and turns it.',
        'Together, the two gears turn upright turning into flat turning.',
      ],
      scene: scene({
        focus: () => [G.x, 512, 30],
        labels: [
          { text: 'paddle wheel', at: [310, 640], tx: 350, ty: 588 },
          { text: 'upright gear', at: [300, 520], tx: 352, ty: 552 },
          { text: 'flat gear', at: [G.x + 40, G.y - 30], tx: 352, ty: 420 },
          { text: 'river', at: [140, 660], tx: 140, ty: 590 },
        ],
      }),
    },
    {
      title: 'From turning to pushing',
      view: [120, 290, 260, 300],
      text: [
        'A pin sticks up from the flat gear and goes round in a circle.',
        'The pin sits inside the slot of a long rod, which swings on a pivot.',
        'As the pin circles, it pushes the rod from side to side.',
        'So the round-and-round motion becomes a back-and-forth motion.',
      ],
      scene: scene({
        focus: (s) => [s.pin[0], s.pin[1], 16],
        labels: [
          { text: 'pin', at: (s) => s.pin, tx: 355, ty: 470 },
          { text: 'slotted rod', at: (s) => [O.x + Math.sin(s.beta) * 160, O.y - Math.cos(s.beta) * 160], tx: 160, ty: 390 },
          { text: 'pivot', at: [O.x, O.y], tx: 165, ty: 560 },
        ],
      }),
    },
    {
      title: 'Two pistons, never resting',
      view: [20, 160, 460, 340],
      text: [
        'The swinging rod moves a long piston rod, with a piston at each end inside a cylinder.',
        'When one piston moves out, it pushes water up the delivery pipe.',
        'At the same moment, the other piston moves back and sucks water up from the river through the suction pipe.',
        'Then they swap, so the pump pushes water on every stroke. That is why it is called double-acting.',
      ],
      scene: scene({
        focus: (s) => (s.v < 0 ? [s.rodX - HALF, ROD_Y, 26] : [s.rodX + HALF, ROD_Y, 26]),
        labels: [
          { text: 'piston', at: (s) => [s.rodX - HALF, CYL.y + CYL.h], tx: 130, ty: 400 },
          { text: 'cylinder', at: [380, CYL.y], tx: 380, ty: 280 },
          { text: 'suction pipe', at: [452, 470], tx: 395, ty: 455 },
          { text: 'delivery pipe', at: [150, 182], tx: 150, ty: 230 },
          { text: 'valve', at: [48, 372], tx: 100, ty: 450 },
        ],
      }),
    },
    {
      title: 'Why it matters',
      text: [
        'Al-Jazari\'s pump turned a turning motion into a pushing motion, using a crank-like pin and a rod.',
        'It is often cited as one of the earliest known machines to combine this with suction pipes.',
        'These same ideas later became central to pumps and engines.',
        'Close the book and press the brass button to send a surge of water!',
      ],
      scene: scene({}),
    },
  ],
};

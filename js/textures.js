// Procedural canvas textures — no image downloads needed.
import * as THREE from 'three';

export function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function tex(c, { repeat = [1, 1], color = true, wrap = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  return t;
}

// ---------- tileable value noise ----------
const P = new Uint8Array(512);
(() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = 1234567;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
})();
const mod = (a, n) => ((a % n) + n) % n;
const hash = (x, y) => P[P[x & 255] + (y & 255)] / 255;
function vnoise(x, y, per) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = mod(xi, per), x1 = mod(xi + 1, per), y0 = mod(yi, per), y1 = mod(yi + 1, per);
  const a = hash(x0, y0), b = hash(x1, y0), c = hash(x0, y1), d = hash(x1, y1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, per, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f, per * f); f *= 2; a *= 0.5; }
  return s / (1 - Math.pow(0.5, oct));
}

function paint(w, h, fn) {
  const c = canvas(w, h);
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const d = img.data, col = [0, 0, 0];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    fn(x / w, y / h, col);
    const i = (y * w + x) * 4;
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
const mix = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---------- geometric helpers ----------
export function star8(g, cx, cy, r, fill, stroke, lw = 3) {
  g.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.7654;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function poly(g, cx, cy, r, n, rot, fill, stroke, lw = 2) {
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + i * Math.PI * 2 / n;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

// ---------- materials ----------
export function marbleCanvas(size = 512, base = [236, 228, 212], vein = [150, 138, 120], scale = 4) {
  return paint(size, size, (u, v, o) => {
    const n = fbm(u * scale, v * scale, scale, 5);
    const s = Math.abs(Math.sin((u * 2 + v + n * 2.4) * Math.PI * 2));
    const vv = Math.pow(1 - s, 9);
    const k = clamp01(vv * 0.75 + (n - 0.5) * 0.18);
    o[0] = mix(base[0], vein[0], k); o[1] = mix(base[1], vein[1], k); o[2] = mix(base[2], vein[2], k);
  });
}

export function floorCanvas() {
  const S = 1024, T = S / 2;
  const c = marbleCanvas(S, [233, 225, 209], [158, 144, 126], 4);
  const g = c.getContext('2d');
  const red = g.createPattern(marbleCanvas(256, [110, 34, 28], [50, 14, 10], 2), 'repeat');
  const black = g.createPattern(marbleCanvas(256, [34, 32, 36], [96, 92, 96], 2), 'repeat');
  // inset bands
  g.lineWidth = 12; g.strokeStyle = red;
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) g.strokeRect(tx * T + 26, ty * T + 26, T - 52, T - 52);
  for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
    const cx = tx * T + T / 2, cy = ty * T + T / 2;
    star8(g, cx, cy, T * 0.31, red, 'rgba(30,15,8,.8)', 4);
    poly(g, cx, cy, T * 0.15, 8, Math.PI / 8, black, 'rgba(210,170,90,.9)', 3);
    star8(g, cx, cy, T * 0.07, 'rgba(214,174,92,1)', null);
  }
  for (const x of [0, T, S]) for (const y of [0, T, S]) poly(g, x, y, T * 0.1, 4, 0, black, 'rgba(30,15,8,.8)', 3);
  g.strokeStyle = 'rgba(70,52,36,.6)'; g.lineWidth = 3;
  for (let i = 0; i <= 2; i++) {
    g.beginPath(); g.moveTo(i * T, 0); g.lineTo(i * T, S); g.stroke();
    g.beginPath(); g.moveTo(0, i * T); g.lineTo(S, i * T); g.stroke();
  }
  return c;
}

export function starTileCanvas() {
  const S = 512, T = 128;
  const c = canvas(S); const g = c.getContext('2d');
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, S, S);
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const cx = x * T + T / 2, cy = y * T + T / 2;
    star8(g, cx, cy, 54, '#1d3f8f', '#e6d39f', 5);
    star8(g, cx, cy, 24, '#e9bf5d', '#7a5a1c', 2);
  }
  for (let y = 0; y <= 4; y++) for (let x = 0; x <= 4; x++) {
    poly(g, x * T, y * T, 28, 4, 0, '#1fa3a0', '#e6d39f', 4);
    poly(g, x * T, y * T, 10, 4, Math.PI / 4, '#9a2219', null);
  }
  g.strokeStyle = 'rgba(60,40,20,.25)'; g.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * T, 0); g.lineTo(i * T, S); g.stroke();
    g.beginPath(); g.moveTo(0, i * T); g.lineTo(S, i * T); g.stroke();
  }
  return c;
}

export function ashlarCanvas() {
  const S = 512;
  const c = paint(S, S, (u, v, o) => {
    const n = fbm(u * 8, v * 8, 8, 5);
    const f = fbm(u * 32, v * 32, 32, 2);
    const k = n * 0.7 + f * 0.3;
    o[0] = mix(170, 214, k); o[1] = mix(140, 184, k); o[2] = mix(102, 140, k);
  });
  const g = c.getContext('2d');
  g.strokeStyle = 'rgba(80,58,36,.55)'; g.lineWidth = 3;
  for (let r = 0; r < 4; r++) {
    const y = r * 128;
    g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke();
    const off = r % 2 ? 128 : 0;
    for (let x = off; x <= S; x += 256) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 128); g.stroke(); }
  }
  g.strokeStyle = 'rgba(255,240,210,.18)'; g.lineWidth = 2;
  for (let r = 0; r < 4; r++) { g.beginPath(); g.moveTo(0, r * 128 + 3); g.lineTo(S, r * 128 + 3); g.stroke(); }
  return c;
}

export function woodCanvas() {
  return paint(512, 512, (u, v, o) => {
    const n = fbm(u * 4, v * 4, 4, 4);
    const s = Math.sin((v * 40 + n * 7 + u * 2) * Math.PI) * 0.5 + 0.5;
    const k = clamp01(Math.pow(s, 1.6) * 0.65 + n * 0.35);
    o[0] = mix(84, 158, k); o[1] = mix(52, 108, k); o[2] = mix(28, 64, k);
  });
}

export function ceilingCanvas() {
  const S = 1024, T = 256;
  const c = canvas(S); const g = c.getContext('2d');
  g.drawImage(woodCanvas(), 0, 0, S, S);
  g.fillStyle = 'rgba(30,16,8,.45)'; g.fillRect(0, 0, S, S);
  g.strokeStyle = '#d4a84c'; g.lineWidth = 5;
  for (let i = 0; i <= 4; i++) {
    g.beginPath(); g.moveTo(i * T, 0); g.lineTo(i * T, S); g.stroke();
    g.beginPath(); g.moveTo(0, i * T); g.lineTo(S, i * T); g.stroke();
  }
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const cx = x * T + T / 2, cy = y * T + T / 2;
    star8(g, cx, cy, 96, '#1b2f63', '#d4a84c', 6);
    star8(g, cx, cy, 52, '#8e2a1f', '#e6c06a', 3);
    star8(g, cx, cy, 20, '#e6c06a', null);
  }
  for (let y = 0; y <= 4; y++) for (let x = 0; x <= 4; x++) poly(g, x * T, y * T, 30, 8, Math.PI / 8, '#1fa3a0', '#d4a84c', 4);
  return c;
}

export function carpetCanvas() {
  const W = 512, H = 1024;
  const c = canvas(W, H); const g = c.getContext('2d');
  g.fillStyle = '#7e1712'; g.fillRect(0, 0, W, H);
  // lattice
  g.strokeStyle = 'rgba(40,6,4,.6)'; g.lineWidth = 3;
  for (let i = -8; i < 16; i++) {
    g.beginPath(); g.moveTo(60, i * 96); g.lineTo(W - 60, i * 96 + (W - 120)); g.stroke();
    g.beginPath(); g.moveTo(W - 60, i * 96); g.lineTo(60, i * 96 + (W - 120)); g.stroke();
  }
  for (let k = 0; k < 2; k++) {
    const cy = k * 512 + 256;
    poly(g, W / 2, cy, 150, 4, 0, '#16224a', '#e3b85a', 6);
    star8(g, W / 2, cy, 96, '#efe2c6', '#16224a', 4);
    star8(g, W / 2, cy, 44, '#c89a3c', null);
  }
  for (const x of [0, W - 56]) {
    g.fillStyle = '#16224a'; g.fillRect(x, 0, 56, H);
    g.fillStyle = '#e3b85a';
    for (let y = 0; y < H; y += 32) poly(g, x + 28, y + 16, 10, 4, 0, '#e3b85a', null);
    g.fillStyle = '#c89a3c'; g.fillRect(x === 0 ? 56 : x - 6, 0, 6, H);
  }
  return c;
}

export function featherCanvas() {
  const W = 128, H = 512;
  const c = canvas(W, H); const g = c.getContext('2d');
  g.lineCap = 'round';
  for (let y = 500; y > 110; y -= 3) {
    const w = 18 + (500 - y) * 0.09;
    g.strokeStyle = `rgba(${60 + (500 - y) * 0.08 | 0},${110 + (500 - y) * 0.06 | 0},70,.6)`;
    g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(64, y); g.lineTo(64 - w, y - 14); g.stroke();
    g.beginPath(); g.moveTo(64, y); g.lineTo(64 + w, y - 14); g.stroke();
  }
  const eye = [[50, 64, '#356f33'], [40, 52, '#c99a2e'], [30, 40, '#219c90'], [19, 26, '#1b2a7b'], [8, 11, '#070a1e']];
  for (const [rx, ry, col] of eye) { g.fillStyle = col; g.beginPath(); g.ellipse(64, 90, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = '#d7c79a'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(64, 512); g.lineTo(64, 150); g.stroke();
  return c;
}

export function zodiacCanvas() {
  const S = 1024, C = S / 2;
  const c = canvas(S); const g = c.getContext('2d');
  const grd = g.createRadialGradient(C, C, 0, C, C, 500);
  grd.addColorStop(0, '#24407e'); grd.addColorStop(1, '#0c1838');
  g.fillStyle = grd; g.beginPath(); g.arc(C, C, 505, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#e1b85c';
  for (const [r, w] of [[500, 10], [384, 6], [250, 5]]) { g.lineWidth = w; g.beginPath(); g.arc(C, C, r, 0, Math.PI * 2); g.stroke(); }
  g.lineWidth = 4;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    g.beginPath(); g.moveTo(C + Math.cos(a) * 384, C + Math.sin(a) * 384); g.lineTo(C + Math.cos(a) * 500, C + Math.sin(a) * 500); g.stroke();
    const m = a + Math.PI / 12;
    g.save(); g.translate(C + Math.cos(m) * 442, C + Math.sin(m) * 442); g.rotate(m + Math.PI / 2);
    g.fillStyle = '#f2d283'; g.font = '700 70px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String.fromCodePoint(0x2648 + i) + '︎', 0, 0); g.restore();
  }
  let s = 7;
  for (let i = 0; i < 90; i++) {
    s = (s * 16807) % 2147483647; const a = s / 2147483647 * Math.PI * 2;
    s = (s * 16807) % 2147483647; const r = 30 + s / 2147483647 * 210;
    g.fillStyle = 'rgba(255,240,200,.85)'; g.beginPath(); g.arc(C + Math.cos(a) * r, C + Math.sin(a) * r, 2 + (i % 3), 0, Math.PI * 2); g.fill();
  }
  // sun
  g.fillStyle = '#ffcf4a';
  g.beginPath(); g.arc(C + 316, C, 46, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.strokeStyle = '#ffcf4a'; g.lineWidth = 6; g.beginPath(); g.moveTo(C + 316 + Math.cos(a) * 54, C + Math.sin(a) * 54); g.lineTo(C + 316 + Math.cos(a) * 70, C + Math.sin(a) * 70); g.stroke(); }
  // moon
  g.fillStyle = '#e8eef5'; g.beginPath(); g.arc(C - 316, C, 44, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#152a5c'; g.beginPath(); g.arc(C - 300, C - 10, 40, 0, Math.PI * 2); g.fill();
  star8(g, C, C, 60, '#e1b85c', null);
  return c;
}

export function rippleCanvas() {
  return paint(256, 256, (u, v, o) => {
    const n = fbm(u * 6, v * 6, 6, 4);
    const r = 1 - Math.abs(n * 2 - 1);
    const k = Math.pow(r, 3) * 255;
    o[0] = o[1] = o[2] = k;
  });
}

export function streamCanvas() {
  const c = canvas(64, 256); const g = c.getContext('2d');
  g.fillStyle = '#9fd3e6'; g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 64, y = Math.random() * 256, h = 20 + Math.random() * 80;
    g.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`;
    g.fillRect(x, y, 1 + Math.random() * 2, h);
    g.fillRect(x, y - 256, 1 + Math.random() * 2, h);
  }
  return c;
}

export function windowCanvas() {
  const W = 256, H = 512;
  const c = canvas(W, H); const g = c.getContext('2d');
  const path = () => {
    g.beginPath(); g.moveTo(10, H); g.lineTo(10, 200);
    g.quadraticCurveTo(14, 70, W / 2, 10); g.quadraticCurveTo(W - 14, 70, W - 10, 200);
    g.lineTo(W - 10, H); g.closePath();
  };
  path();
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#fff6dc'); grd.addColorStop(0.6, '#ffe2a8'); grd.addColorStop(1, '#f7c47a');
  g.fillStyle = grd; g.fill();
  g.save(); path(); g.clip();
  g.strokeStyle = '#2b1a0d'; g.lineWidth = 7;
  for (let i = -20; i < 30; i++) {
    g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 + H, H); g.stroke();
    g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32 - H, H); g.stroke();
  }
  g.lineWidth = 4;
  for (let y = 16; y < H; y += 32) for (let x = (y / 32 | 0) % 2 ? 16 : 0; x < W + 16; x += 32) { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.stroke(); }
  g.restore();
  path(); g.strokeStyle = '#3a2512'; g.lineWidth = 14; g.stroke();
  return c;
}

export function shaftCanvas() {
  const W = 64, H = 256;
  const c = canvas(W, H); const g = c.getContext('2d');
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / (W - 1), v = y / (H - 1);
    const a = Math.pow(1 - Math.abs(u * 2 - 1), 1.6) * Math.pow(Math.sin(v * Math.PI), 0.7) * (1 - v * 0.5);
    const i = (y * W + x) * 4;
    img.data[i] = 255; img.data[i + 1] = 236; img.data[i + 2] = 200; img.data[i + 3] = a * 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export function glowCanvas() {
  const c = canvas(64); const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.3, 'rgba(255,255,255,.5)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return c;
}

export function friezeCanvas() {
  const W = 2048, H = 160;
  const c = canvas(W, H); const g = c.getContext('2d');
  g.fillStyle = '#132a5c'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#d9b25f'; g.fillRect(0, 8, W, 6); g.fillRect(0, H - 14, W, 6);
  g.fillStyle = '#8e2a1f'; g.fillRect(0, 0, W, 8); g.fillRect(0, H - 8, W, 8);
  g.fillStyle = '#e8c56c'; g.font = '700 84px Amiri, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('بديع الزمان أبو العز الجزري', 512, H / 2 + 6);
  g.fillText('كتاب في معرفة الحيل الهندسية', 1536, H / 2 + 6);
  for (const x of [0, 1024, 2048]) star8(g, x, H / 2, 46, '#e8c56c', '#132a5c', 3);
  return c;
}

export function bannerCanvas() {
  const W = 2048, H = 600;
  const c = canvas(W, H); const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#6e1410'); grd.addColorStop(1, '#3d0a08');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#d9b25f'; g.lineWidth = 10; g.strokeRect(22, 22, W - 44, H - 44);
  g.lineWidth = 3; g.strokeRect(42, 42, W - 84, H - 84);
  for (const [x, y] of [[90, 90], [W - 90, 90], [90, H - 90], [W - 90, H - 90]]) star8(g, x, y, 34, '#d9b25f', null);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.fillStyle = '#ecc86f'; g.font = '700 200px Amiri, serif'; g.fillText('الجزري', W / 2, 250);
  g.fillStyle = '#f6e6c2'; g.font = '700 104px Cinzel, serif';
  g.fillText('AL-JAZARI', W / 2, 400);
  g.font = 'italic 52px "EB Garamond", serif'; g.fillStyle = '#e9d6ad';
  g.fillText('The Book of Knowledge of Ingenious Mechanical Devices · 1206', W / 2, 500);
  return c;
}

export function archStripeCanvas() {
  const S = 512;
  const c = canvas(S); const g = c.getContext('2d');
  const n = 46;
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI + i / n * Math.PI, a1 = Math.PI + (i + 1) / n * Math.PI;
    g.fillStyle = i % 2 ? '#8e2a1f' : '#efe2c6';
    g.beginPath(); g.moveTo(S / 2, S); g.arc(S / 2, S, S * 1.2, a0, a1); g.closePath(); g.fill();
  }
  return c;
}

export function latticeCanvas() {
  const S = 256;
  const c = canvas(S); const g = c.getContext('2d');
  g.fillStyle = '#c9a14f'; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'destination-out';
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) star8(g, x * 64 + 32, y * 64 + 32, 22, '#000', null);
  return c;
}

// Lectern-style information plaques with an optional glowing "activate" gem.
import * as THREE from 'three';
import * as TX from './textures.js';
import { M, mesh, box, cyl } from './parts.js';

function wrap(g, text, maxW) {
  const words = text.split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function plaqueCanvas({ arabic, title, date, body, hint }) {
  const W = 1024, H = 1280;
  const c = TX.canvas(W, H), g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#15274e'); grd.addColorStop(1, '#0a1430');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.05;
  for (let y = 0; y < H; y += 128) for (let x = 0; x < W; x += 128) TX.star8(g, x + 64, y + 64, 50, '#ffffff', null);
  g.globalAlpha = 1;
  g.strokeStyle = '#d9b25f'; g.lineWidth = 6; g.strokeRect(24, 24, W - 48, H - 48);
  g.lineWidth = 2; g.strokeRect(42, 42, W - 84, H - 84);
  for (const [x, y] of [[42, 42], [W - 42, 42], [42, H - 42], [W - 42, H - 42]]) TX.star8(g, x, y, 22, '#d9b25f', '#0a1430', 3);

  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  let y = 140;
  if (arabic) { g.fillStyle = '#e7c56f'; g.font = '700 70px Amiri, serif'; g.fillText(arabic, W / 2, y); y += 92; }
  g.fillStyle = '#f6e3b0'; g.font = '700 54px Cinzel, serif';
  for (const l of wrap(g, title.toUpperCase(), 860)) { g.fillText(l, W / 2, y); y += 64; }
  if (date) { g.fillStyle = '#c4b59c'; g.font = 'italic 36px "EB Garamond", serif'; g.fillText(date, W / 2, y); y += 16; }
  y += 22;
  g.strokeStyle = '#d9b25f'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(W / 2 - 220, y); g.lineTo(W / 2 - 30, y); g.moveTo(W / 2 + 30, y); g.lineTo(W / 2 + 220, y); g.stroke();
  TX.star8(g, W / 2, y, 14, '#d9b25f', null);
  y += 64;

  const bottom = hint ? H - 150 : H - 80;
  let fs = 38, lines = [];
  for (; fs >= 24; fs--) {
    g.font = `${fs}px "EB Garamond", serif`;
    lines = [];
    for (const para of body.split('\n')) { lines.push(...wrap(g, para, 850)); lines.push(''); }
    lines.pop();
    if (y + lines.length * fs * 1.3 < bottom) break;
  }
  g.textAlign = 'left'; g.fillStyle = '#efe6d2';
  for (const l of lines) { if (l) g.fillText(l, 87, y); y += l ? fs * 1.3 : fs * 0.7; }

  if (hint) {
    g.textAlign = 'center'; g.fillStyle = '#5fd3c8'; g.font = '600 32px Cinzel, serif';
    for (const [k, l] of wrap(g, hint, 860).entries()) g.fillText(l, W / 2, H - 100 + k * 40);
  }
  return c;
}

export function makePlaque(ctx, info, { x, z, rotY = 0, onActivate = null, activateLabel = '' }) {
  const grp = new THREE.Group();
  grp.position.set(x, 0, z); grp.rotation.y = rotY;
  ctx.scene.add(grp);
  cyl(0.26, 0.3, 0.05, M.bronze, grp, 0, 0.025, 0, 24);
  cyl(0.035, 0.045, 0.78, M.bronze, grp, 0, 0.41, 0, 12);
  const panel = new THREE.Group(); panel.position.set(0, 0.98, -0.05); panel.rotation.x = -0.72; grp.add(panel);
  box(0.98, 1.21, 0.04, M.bronze, panel, 0, 0, -0.025);
  const t = TX.tex(plaqueCanvas(info), { wrap: false });
  const mat = new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.5, roughness: 0.6 });
  mesh(new THREE.PlaneGeometry(0.9, 1.125), mat, panel, 0, 0, 0.001);
  grp.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  let gem = null, gemMat = null;
  if (onActivate) {
    cyl(0.02, 0.03, 0.85, M.bronze, grp, 0.62, 0.43, 0.12, 10);
    cyl(0.07, 0.03, 0.06, M.gold, grp, 0.62, 0.88, 0.12, 12);
    gemMat = new THREE.MeshStandardMaterial({ color: 0x2fd0c0, emissive: 0x1fbfb0, emissiveIntensity: 1, roughness: 0.12, metalness: 0.3 });
    gemMat.userData.pulse = true;
    gem = mesh(new THREE.OctahedronGeometry(0.075), gemMat, grp, 0.62, 1.02, 0.12);
    const hit = mesh(new THREE.SphereGeometry(0.17, 8, 6), M.hit, grp, 0.62, 1.02, 0.12);
    ctx.addInteractable(hit, activateLabel, onActivate, gemMat);
  }
  return {
    group: grp,
    update(time) {
      if (!gem) return;
      gem.rotation.y = time * 1.5;
      gem.position.y = 1.02 + Math.sin(time * 2) * 0.02;
    },
  };
}

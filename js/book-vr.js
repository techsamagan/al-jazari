// The book in VR: a closed book on the plaque stand that opens into a life-size book floating
// in front of the visitor, with buttons they point at and press with the trigger.
// Also usable on desktop / phone: clicking the closed book opens the normal on-screen book.
import * as THREE from 'three';
import { M } from './parts.js';

const IMG_SRC = 'assets/book/old_book.jpg';
const PAGE_W = 0.36, PAGE_H = PAGE_W * 725 / 512;   // metres; the image is 1024 × 725 (two pages)
const LW = 720, LH = Math.round(LW * 725 / 512);    // left page canvas (animated drawing)
const RW = 900, RH = Math.round(RW * 725 / 512);    // right page canvas (text)
const TILT = 0.13;                                  // pages open in a slight V, like a real book
const BUTTONS = [
  { id: 'prev', w: 0.12 }, { id: 'voice', w: 0.13 }, { id: 'next', w: 0.12 }, { id: 'close', w: 0.11 },
];
const INK = '#3a2614';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function texture(c, mipmaps) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (!mipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}
const flat = (map, transparent = false) => new THREE.MeshBasicMaterial({ map, transparent, toneMapped: false });

// ------------------------------------------------------------------ the closed book on the stand
export function makeBookStand(ctx, plaque, onSelect) {
  const grp = new THREE.Group();
  grp.position.set(plaque.x, 0, plaque.z); grp.rotation.y = plaque.rotY || 0;
  ctx.scene.add(grp);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.86, 12), M.bronze);
  post.position.set(-0.62, 0.43, 0.12); grp.add(post);
  const top = new THREE.Group(); top.position.set(-0.62, 0.88, 0.12); top.rotation.x = 0.45; grp.add(top);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.015, 0.32), M.bronze); top.add(board);
  const leather = new THREE.MeshStandardMaterial({ color: 0x5c2716, roughness: 0.75 });
  const pages = new THREE.MeshStandardMaterial({ color: 0xe9dcbc, roughness: 0.9 });
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.26), leather); cover.position.y = 0.03; top.add(cover);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.035, 0.25), pages); edge.position.set(0.006, 0.03, 0); top.add(edge);
  // a gold emblem that pulses softly, so people notice they can use it
  const gold = new THREE.MeshStandardMaterial({ color: 0x8a6420, metalness: 0.8, roughness: 0.35, emissive: 0xe0b050, emissiveIntensity: 0.6 });
  gold.userData.pulse = true;
  const emblem = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 32), gold);
  emblem.rotation.x = Math.PI / 2; emblem.position.y = 0.054; top.add(emblem);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.002, 0.23), gold); frame.position.y = 0.0525; top.add(frame);
  const hollow = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.003, 0.22), leather); hollow.position.y = 0.053; top.add(hollow);
  grp.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M.hit);
  hit.position.set(-0.62, 0.92, 0.12); grp.add(hit);
  ctx.addInteractable(hit, '📖 Open the book', onSelect, gold);
  return grp;
}

// ------------------------------------------------------------------ the open book floating in VR
export class VRBookView {
  constructor({ renderer, scene, camera, ctx }) {
    Object.assign(this, { renderer, scene, camera, ctx });
    this.img = new Image(); this.img.src = IMG_SRC;
    this.img.onload = () => { if (this.book) this.renderPage(); };
    this.frameN = 0; this.hovered = null;

    this.lc = canvas(LW, LH); this.lg = this.lc.getContext('2d'); this.ltex = texture(this.lc, false);
    this.sc = canvas(Math.round(LW * 0.84), Math.round(LH * 0.88)); this.sg = this.sc.getContext('2d');
    this.rc = canvas(RW, RH); this.rg = this.rc.getContext('2d'); this.rtex = texture(this.rc, true);

    const root = this.root = new THREE.Group();
    root.visible = false;
    scene.add(root);
    const leather = new THREE.MeshStandardMaterial({ color: 0x4a2012, roughness: 0.8 });
    const pageGeo = new THREE.PlaneGeometry(PAGE_W, PAGE_H);
    const coverGeo = new THREE.BoxGeometry(PAGE_W + 0.014, PAGE_H + 0.026, 0.01);
    const side = (dir, map) => {
      const pivot = new THREE.Group(); pivot.rotation.y = dir * -TILT; root.add(pivot);
      const page = new THREE.Mesh(pageGeo, flat(map)); page.position.x = dir * PAGE_W / 2; pivot.add(page);
      const cover = new THREE.Mesh(coverGeo, leather); cover.position.set(dir * (PAGE_W / 2 + 0.006), 0, -0.007); pivot.add(cover);
      return page;
    };
    this.leftPage = side(-1, this.ltex);
    this.rightPage = side(1, this.rtex);

    // buttons under the book
    this.buttons = {};
    const total = BUTTONS.reduce((a, b) => a + b.w, 0) + 0.02 * (BUTTONS.length - 1);
    let x = -total / 2;
    for (const b of BUTTONS) {
      const c = canvas(Math.round(b.w * 2400), 120), t = texture(c, true);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(b.w, 0.05), flat(t, true));
      m.position.set(x + b.w / 2, -PAGE_H / 2 - 0.055, 0.04);
      root.add(m);
      this.buttons[b.id] = { mesh: m, canvas: c, tex: t, state: '' };
      x += b.w + 0.02;
    }
    const B = this.buttons;
    B.prev.mesh.userData.onSelect = () => this.book && this.book.goto(this.book.page - 1);
    B.voice.mesh.userData.onSelect = () => this.book && this.book.setVoice(!this.book.voiceOn);
    B.next.mesh.userData.onSelect = () => this.book && this.book.nextOrFinish();
    B.close.mesh.userData.onSelect = () => this.book && this.book.close();
    // the pages catch the pointer too, so aiming at the book never teleports you behind it
    for (const p of [this.leftPage, this.rightPage]) p.userData.onSelect = () => {};
    this.hits = [this.leftPage, this.rightPage, ...Object.values(B).map((b) => b.mesh)];
    for (const h of this.hits) { h.userData.label = h.userData.label || ''; h.userData.glow = null; }
  }

  isPresenting() { return this.renderer.xr.isPresenting; }

  show(book) {
    this.book = book;
    // stand the book a little below eye height, about an arm's length in front, facing the visitor
    const head = new THREE.Vector3(), dir = new THREE.Vector3();
    this.camera.getWorldPosition(head);
    this.camera.getWorldDirection(dir); dir.y = 0;
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, -1);
    dir.normalize();
    const r = this.root;
    r.position.copy(head).addScaledVector(dir, 0.66);
    r.position.y = head.y - 0.14;
    r.lookAt(head.x, r.position.y, head.z);
    r.rotateX(-0.22);
    r.visible = true;
    const list = this.ctx.interactables;
    for (const h of this.hits) if (!list.includes(h)) list.push(h);
    this.renderPage();
  }

  hide() {
    this.root.visible = false;
    const list = this.ctx.interactables;
    for (const h of this.hits) { const i = list.indexOf(h); if (i >= 0) list.splice(i, 1); }
    this.book = null;
  }

  // called by book.js whenever the page, highlight or voice setting changes
  renderPage() {
    if (!this.book) return;
    this.drawText();
    this.drawButtons();
  }

  update(now, hovered) {
    if (!this.book) return;
    if (hovered !== this.hovered) { this.hovered = hovered; this.drawButtons(); }
    if (++this.frameN % 2) return; // the drawing is redrawn at half frame rate: plenty, and light on the headset
    const g = this.lg;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.img.complete && this.img.naturalWidth) g.drawImage(this.img, 0, 0, 512, 725, 0, 0, LW, LH);
    else { g.fillStyle = '#e3d1a8'; g.fillRect(0, 0, LW, LH); }
    if (!this.book.turning) {
      const s = this.sg, w = this.sc.width, h = this.sc.height;
      this.book.drawScene(s, w, h, 30, now);
      // fade the drawing's edges into the paper
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.globalCompositeOperation = 'destination-in';
      let gr = s.createLinearGradient(0, 0, w, 0);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.06, '#000'); gr.addColorStop(0.94, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      s.fillStyle = gr; s.fillRect(0, 0, w, h);
      gr = s.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.05, '#000'); gr.addColorStop(0.95, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      s.fillStyle = gr; s.fillRect(0, 0, w, h);
      s.globalCompositeOperation = 'source-over';
      g.drawImage(this.sc, Math.round(LW * 0.09), Math.round(LH * 0.06));
    }
    this.ltex.needsUpdate = true;
  }

  drawText() {
    const g = this.rg, b = this.book.book, i = this.book.page, p = b.pages[i], hl = this.book.hl;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.img.complete && this.img.naturalWidth) g.drawImage(this.img, 512, 0, 512, 725, 0, 0, RW, RH);
    else { g.fillStyle = '#e3d1a8'; g.fillRect(0, 0, RW, RH); }
    if (this.book.turning) { this.rtex.needsUpdate = true; return; }
    const x0 = RW * 0.08, maxW = RW * 0.81;
    let y = RH * 0.1;
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    if (i === 0) { g.font = '700 46px Amiri, serif'; g.fillStyle = '#8a5a1a'; g.fillText(b.arabic, x0, y); y += 20; }
    else { g.font = '500 25px Cinzel, serif'; g.fillStyle = '#8a5a1a'; g.fillText(b.title.toUpperCase().split('').join(String.fromCharCode(8202)), x0, y); y += 8; }
    g.font = '700 44px Cinzel, serif'; g.fillStyle = '#6b1e14';
    for (const line of wrap(g, p.title.toUpperCase(), maxW)) { y += 54; g.fillText(line, x0, y); }
    y += 30;
    // the text, word by word, so the sentence being read can be highlighted
    const fs = 37, lh = fs * 1.5;
    g.font = `${fs}px "EB Garamond", Georgia, serif`;
    const space = g.measureText(' ').width, words = [];
    let x = x0; y += fs;
    p.text.forEach((sent, si) => {
      for (const w of sent.split(' ')) {
        const ww = g.measureText(w).width;
        if (x + ww > x0 + maxW && x > x0) { x = x0; y += lh; }
        words.push({ w, x, y, ww, si });
        x += ww + space;
      }
    });
    if (hl >= 0) {
      g.fillStyle = 'rgba(201,151,58,0.4)';
      for (const w of words) if (w.si === hl) g.fillRect(w.x - 3, w.y - fs * 0.82, w.ww + space + 2, fs * 1.12);
    }
    g.fillStyle = INK;
    for (const w of words) g.fillText(w.w, w.x, w.y);
    g.font = 'italic 25px "EB Garamond", Georgia, serif'; g.textAlign = 'center'; g.globalAlpha = 0.7;
    g.fillText(`— ${i + 1} of ${b.pages.length} —`, RW * 0.485, RH * 0.92);
    g.globalAlpha = 1;
    this.rtex.needsUpdate = true;
  }

  drawButtons() {
    if (!this.book) return;
    const bk = this.book, last = bk.page === bk.book.pages.length - 1;
    const spec = {
      prev: { text: '◀ Back', off: bk.page === 0 },
      voice: { text: bk.voiceOn ? 'Voice on' : 'Voice off' },
      next: { text: last ? 'Finish ✓' : 'Next ▶', gold: true },
      close: { text: '✕ Close' },
    };
    for (const [id, b] of Object.entries(this.buttons)) {
      const sp = spec[id], hov = this.hovered === b.mesh && !sp.off;
      const state = `${sp.text}|${sp.off}|${hov}`;
      if (state === b.state) continue;
      b.state = state;
      const c = b.canvas, g = c.getContext('2d'), w = c.width, h = c.height;
      g.clearRect(0, 0, w, h);
      g.globalAlpha = sp.off ? 0.35 : 1;
      g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, (h - 8) / 2);
      if (sp.gold) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, hov ? '#f6dc96' : '#ecca7a'); gr.addColorStop(1, hov ? '#cfa04c' : '#b2873a'); g.fillStyle = gr; }
      else g.fillStyle = hov ? 'rgba(80,56,24,0.96)' : 'rgba(24,17,8,0.92)';
      g.fill();
      g.lineWidth = hov ? 6 : 3; g.strokeStyle = hov ? '#5fd3c8' : 'rgba(217,178,95,0.7)'; g.stroke();
      g.font = '700 46px Cinzel, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = sp.gold ? '#1a1206' : '#f6e2ac';
      g.fillText(sp.text, w / 2, h / 2 + 2);
      g.globalAlpha = 1;
      b.tex.needsUpdate = true;
      b.mesh.userData.label = sp.off ? '' : sp.text;
    }
  }
}

function wrap(g, text, maxW) {
  const out = []; let line = '';
  for (const w of text.split(' ')) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

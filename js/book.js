// "Open the book": near an exhibit, a visitor can open an old book with an animated drawing
// of the machine on the left page and a narrated explanation on the right page.
import { elephant } from './book-elephant.js';

const BOOKS = { elephant };
const FULL = [0, 0, 500, 700];
export const hasBook = (key) => !!BOOKS[key];

const VOICE_PREFS = ['Google UK English Male', 'Daniel', 'Google UK English Female', 'Google US English', 'Samantha', 'Microsoft Ryan', 'Microsoft Sonia', 'Microsoft Guy', 'Microsoft Aria', 'Karen', 'Moira'];

export class Book {
  constructor({ sound, isTouch, onOpen, onClose }) {
    Object.assign(this, { sound, isTouch, onOpen, onClose });
    this.isOpen = false; this.nearby = null; this.voiceOn = true;
    this.page = 0; this.turning = false; this.speakToken = 0;
    this.synth = window.speechSynthesis || null;

    const el = this.el = document.createElement('div');
    el.id = 'book'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <div class="book-spread">
        <div class="page left"><canvas class="book-canvas" role="img"></canvas></div>
        <div class="page right"><div class="page-inner">
          <p class="book-kicker"></p>
          <h2 class="book-title"></h2>
          <div class="book-text"></div>
          <p class="book-pno"></p>
        </div></div>
        <div class="leaf"><div class="front"></div><div class="back"></div></div>
      </div>
      <div class="book-bar">
        <button type="button" class="b-prev">◀ Back</button>
        <button type="button" class="b-voice" aria-pressed="true">🔊 Voice on</button>
        <button type="button" class="b-next">Next ▶</button>
        <button type="button" class="b-close" aria-label="Close the book">✕ Close</button>
      </div>`;
    document.body.appendChild(el);
    const q = (s) => el.querySelector(s);
    this.spread = q('.book-spread'); this.canvas = q('.book-canvas'); this.g = this.canvas.getContext('2d');
    this.kicker = q('.book-kicker'); this.titleEl = q('.book-title'); this.textEl = q('.book-text'); this.pno = q('.book-pno');
    this.leaf = q('.leaf'); this.prevBtn = q('.b-prev'); this.nextBtn = q('.b-next'); this.voiceBtn = q('.b-voice');
    if (!this.synth) this.voiceBtn.style.display = 'none';

    this.prevBtn.addEventListener('click', () => this.goto(this.page - 1));
    this.nextBtn.addEventListener('click', () => (this.page < this.book.pages.length - 1 ? this.goto(this.page + 1) : this.close()));
    this.voiceBtn.addEventListener('click', () => this.setVoice(!this.voiceOn));
    q('.b-close').addEventListener('click', () => this.close());
    this.textEl.addEventListener('click', (e) => {
      const s = e.target.closest('.s'); if (!s) return;
      this.setVoice(true, +s.dataset.i);
    });

    this.prompt = document.createElement('button');
    this.prompt.id = 'book-prompt'; this.prompt.type = 'button';
    this.prompt.innerHTML = isTouch ? '📖 Tap to open the book' : '📖 Open the book <kbd>B</kbd>';
    this.prompt.addEventListener('click', () => this.nearby && this.open(this.nearby));
    document.body.appendChild(this.prompt);

    addEventListener('keydown', (e) => {
      if (e.code === 'KeyB' && !e.repeat) { if (this.isOpen) this.close(); else if (this.nearby) this.open(this.nearby); return; }
      if (!this.isOpen) return;
      if (e.code === 'Escape') this.close();
      else if (e.code === 'ArrowRight' || e.code === 'PageDown') this.goto(this.page + 1);
      else if (e.code === 'ArrowLeft' || e.code === 'PageUp') this.goto(this.page - 1);
      else if (e.code === 'Space') { e.preventDefault(); this.setVoice(!this.voiceOn); }
    });

    // swipe left / right on the pages to turn them
    let sx = 0, sy = 0, down = false;
    this.spread.addEventListener('pointerdown', (e) => { down = true; sx = e.clientX; sy = e.clientY; });
    this.spread.addEventListener('pointerup', (e) => {
      if (!down) return; down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) this.goto(this.page + (dx < 0 ? 1 : -1));
    });

    addEventListener('resize', () => this.isOpen && this.sizeCanvas());
    if (this.synth) {
      this.voice = this.pickVoice();
      this.synth.addEventListener?.('voiceschanged', () => { this.voice = this.pickVoice(); });
    }
    this.frame = this.frame.bind(this);
  }

  setNearby(key) {
    if (key === this.nearby) return;
    this.nearby = key;
    this.prompt.classList.toggle('on', !!key && !this.isOpen);
  }

  open(key) {
    const b = BOOKS[key];
    if (!b || this.isOpen) return;
    this.book = b; this.page = 0; this.isOpen = true;
    this.el.classList.add('open'); this.el.setAttribute('aria-hidden', 'false');
    this.prompt.classList.remove('on');
    this.onOpen && this.onOpen();
    this.sound.rustle && this.sound.rustle(0.5);
    this.render();
    this.raf = requestAnimationFrame(this.frame);
    setTimeout(() => this.isOpen && this.speak(0), 450);
    this.nextBtn.focus({ preventScroll: true });
  }

  close() {
    if (!this.isOpen) return;
    this.stopSpeech();
    this.isOpen = false; this.turning = false;
    cancelAnimationFrame(this.raf);
    this.el.classList.remove('open'); this.el.setAttribute('aria-hidden', 'true');
    this.prompt.classList.toggle('on', !!this.nearby);
    this.onClose && this.onClose();
  }

  goto(i) {
    if (!this.isOpen || this.turning || i < 0 || i >= this.book.pages.length || i === this.page) return;
    const dir = i > this.page ? 1 : -1;
    this.stopSpeech();
    this.turning = true;
    this.sound.rustle && this.sound.rustle(0.4);
    const flat = matchMedia('(orientation: portrait) and (max-width: 820px)').matches;
    this.spread.classList.add('turning');
    if (!flat && this.leaf.animate) {
      this.leaf.style.display = 'block';
      const a = this.leaf.animate(
        [{ transform: `rotateY(${dir > 0 ? 0 : -180}deg)` }, { transform: `rotateY(${dir > 0 ? -180 : 0}deg)` }],
        { duration: 650, easing: 'cubic-bezier(.45,.05,.35,1)' });
      a.onfinish = () => { this.leaf.style.display = 'none'; };
    }
    setTimeout(() => { this.page = i; this.render(); }, 330);
    setTimeout(() => {
      this.spread.classList.remove('turning');
      this.turning = false;
      if (this.isOpen) this.speak(0);
    }, 680);
  }

  render() {
    const b = this.book, p = b.pages[this.page], last = this.page === b.pages.length - 1;
    this.kicker.textContent = this.page === 0 ? b.arabic : b.title;
    this.kicker.classList.toggle('ar', this.page === 0);
    this.titleEl.textContent = p.title;
    this.textEl.innerHTML = '';
    p.text.forEach((s, i) => {
      const span = document.createElement('span');
      span.className = 's'; span.dataset.i = i; span.textContent = s + ' ';
      this.textEl.appendChild(span);
    });
    this.pno.textContent = `— ${this.page + 1} of ${b.pages.length} —`;
    this.prevBtn.disabled = this.page === 0;
    this.nextBtn.textContent = last ? 'Finish ✓' : 'Next ▶';
    this.nextBtn.classList.remove('pulse');
    this.canvas.setAttribute('aria-label', `Animated drawing: ${p.title}`);
    this.t0 = performance.now();
    p.scene.reset();
    // each page starts on the whole machine, then zooms in on the part it explains
    this.view = (b.view || FULL).slice();
    this.viewTarget = p.view || b.view || FULL;
    this.lastNow = 0;
    this.sizeCanvas();
  }

  sizeCanvas() {
    const c = this.canvas, dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(c.clientWidth * dpr)), h = Math.max(1, Math.round(c.clientHeight * dpr));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }

  frame(now) {
    if (!this.isOpen) return;
    this.raf = requestAnimationFrame(this.frame);
    const c = this.canvas, g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.width, c.height);
    const dt = this.lastNow ? Math.min(0.1, (now - this.lastNow) / 1000) : 0;
    this.lastNow = now;
    if (now - this.t0 > 700) { // wait a moment, then glide in
      const a = 1 - Math.exp(-dt * 2.6);
      for (let i = 0; i < 4; i++) this.view[i] += (this.viewTarget[i] - this.view[i]) * a;
    }
    const view = this.view, [vx, vy, vw, vh] = view; // the part of the drawing to show
    const s = Math.min(c.width / vw, c.height / vh);
    g.setTransform(s, 0, 0, s, (c.width - vw * s) / 2 - vx * s, (c.height - vh * s) / 2 - vy * s);
    // labels keep a steady on-screen size: about 18px on a computer, 14px on a phone
    const cssPerUnit = s / Math.min(devicePixelRatio || 1, 2), labelPx = innerWidth < 700 ? 14 : 18;
    const k = labelPx / 20 / cssPerUnit;
    this.book.pages[this.page].scene.draw(g, (now - this.t0) / 1000, (name) => this.fx(name), view, k);
  }

  fx(name) {
    const S = this.sound;
    if (!S.ctx) return;
    if (name === 'click') S.clack(null, 0.3);
    else if (name === 'clang') S.bell(null, 660, 0.4);
    else if (name === 'drum') { S.drum(null, 0.55, 0.8); S.cymbal(null, 0.2, 0.02); }
    else if (name === 'drum2') S.drum(null, 0.55, 0.8);
    else if (name === 'whistle') { S.flute(null, 1180, 0.12, 0.16); S.flute(null, 1400, 0.1, 0.16, 0.15); }
  }

  // ---------- narration ----------
  pickVoice() {
    const vs = this.synth.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
    const natural = vs.find((v) => /Natural/i.test(v.name) && /en[-_](GB|US)/i.test(v.lang));
    if (natural) return natural;
    for (const n of VOICE_PREFS) { const v = vs.find((x) => x.name.includes(n)); if (v) return v; }
    return vs.find((v) => v.localService) || vs[0] || null;
  }

  setVoice(on, from = 0) {
    this.voiceOn = on && !!this.synth;
    this.voiceBtn.textContent = this.voiceOn ? '🔊 Voice on' : '🔇 Voice off';
    this.voiceBtn.setAttribute('aria-pressed', String(this.voiceOn));
    if (this.voiceOn) this.speak(from); else this.stopSpeech();
  }

  highlight(i) {
    for (const s of this.textEl.children) s.classList.toggle('now', +s.dataset.i === i);
  }

  speak(from) {
    this.stopSpeech();
    if (!this.voiceOn || !this.synth) return;
    const token = this.speakToken, page = this.book.pages[this.page], sents = page.text;
    const say = (i) => {
      if (token !== this.speakToken || !this.isOpen) return;
      if (i >= sents.length) { this.highlight(-1); this.pageDone(token); return; }
      const u = this.utter = new SpeechSynthesisUtterance(sents[i]);
      if (this.voice) { u.voice = this.voice; u.lang = this.voice.lang; } else u.lang = 'en-GB';
      u.rate = 0.92;
      u.onstart = () => { if (token === this.speakToken) this.highlight(i); };
      u.onend = () => setTimeout(() => say(i + 1), 280);
      u.onerror = () => { if (token === this.speakToken) this.highlight(-1); };
      this.highlight(i);
      this.synth.speak(u);
    };
    this.speakTimer = setTimeout(() => say(from), 90);
  }

  stopSpeech() {
    this.speakToken++;
    clearTimeout(this.speakTimer); clearTimeout(this.advanceTimer);
    if (this.synth && (this.synth.speaking || this.synth.pending)) this.synth.cancel();
    this.highlight(-1);
  }

  pageDone(token) {
    if (this.page >= this.book.pages.length - 1) { this.nextBtn.classList.add('pulse'); return; }
    this.advanceTimer = setTimeout(() => {
      if (token === this.speakToken && this.isOpen && this.voiceOn) this.goto(this.page + 1);
    }, 1500);
  }
}

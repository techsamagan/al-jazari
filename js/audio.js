// Synthesized, spatialised sound — no audio files.
import * as THREE from 'three';

const _v = new THREE.Vector3();

export class Sound {
  constructor() {
    this.ctx = null;
    this.listener = new THREE.Vector3();
    this.inv = new THREE.Matrix4();
  }

  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    this.master = ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(comp);
    this.wet = ctx.createGain(); this.wet.gain.value = 0.3;
    const verb = ctx.createConvolver(); verb.buffer = this.impulse(3.4, 2.4);
    this.wet.connect(verb); verb.connect(this.master);

    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // room tone
    const rt = this.loop(), lp = ctx.createBiquadFilter(), rg = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 280; rg.gain.value = 0.03;
    rt.connect(lp).connect(rg).connect(this.master);
    // water ambience (level set from proximity to fountains)
    const wn = this.loop(), bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.5;
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = 0.35; lg.gain.value = 500; lfo.connect(lg).connect(bp.frequency); lfo.start();
    this.waterGain = ctx.createGain(); this.waterGain.gain.value = 0;
    wn.connect(bp).connect(this.waterGain); this.waterGain.connect(this.master); this.waterGain.connect(this.wet);
  }

  loop() { const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true; s.start(); return s; }

  impulse(sec, decay) {
    const ctx = this.ctx, n = (ctx.sampleRate * sec) | 0, b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }

  setListener(cam) { cam.getWorldPosition(this.listener); this.inv.copy(cam.matrixWorld).invert(); }

  setWater(level) { if (this.ctx) this.waterGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.4); }

  // A gain node routed through distance attenuation + stereo pan, or null if inaudible.
  out(pos, vol) {
    if (!this.ctx || this.ctx.state !== 'running') return null;
    let g = vol, pan = 0;
    if (pos) {
      const d = pos.distanceTo(this.listener);
      g *= Math.pow(Math.max(0, 1 - d / 15), 1.6);
      if (g < 0.002) return null;
      _v.copy(pos).applyMatrix4(this.inv);
      pan = THREE.MathUtils.clamp(_v.x / Math.max(1.5, d), -1, 1) * 0.8;
    }
    const gain = this.ctx.createGain(); gain.gain.value = g;
    let node = gain;
    if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = pan; gain.connect(p); node = p; }
    node.connect(this.master); node.connect(this.wet);
    return gain;
  }

  env(param, t, a, peak, dec) {
    param.setValueAtTime(0.0001, t);
    param.exponentialRampToValueAtTime(peak, t + a);
    param.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  osc(type, f, t, dur, out, peak, a = 0.005) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    this.env(g.gain, t, a, peak, dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + a + dur + 0.05);
    return o;
  }
  noiseHit(t, dur, out, peak, type, freq, q = 1) {
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq; f.Q.value = q;
    this.env(g.gain, t, 0.002, peak, dur);
    s.connect(f).connect(g).connect(out); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }

  drum(pos, vol = 1, pitch = 1, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const t = this.ctx.currentTime + delay;
    const o = this.osc('sine', 165 * pitch, t, 0.5, out, 0.9);
    o.frequency.exponentialRampToValueAtTime(50 * pitch, t + 0.28);
    this.noiseHit(t, 0.09, out, 0.25, 'bandpass', 1000 * pitch, 0.9);
  }
  tek(pos, vol = 1, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const t = this.ctx.currentTime + delay;
    this.osc('sine', 520, t, 0.08, out, 0.4);
    this.noiseHit(t, 0.06, out, 0.35, 'highpass', 2600, 0.7);
  }
  flute(pos, freq, dur = 0.35, vol = 0.5, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = freq;
    lfo.frequency.value = 5.2; lg.gain.value = freq * 0.012; lfo.connect(lg).connect(o.frequency);
    lp.type = 'lowpass'; lp.frequency.value = freq * 4;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.06);
    g.gain.setValueAtTime(0.32, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(lp).connect(g).connect(out);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.3); lfo.stop(t + dur + 0.3);
    this.noiseHit(t, dur * 0.8, out, 0.035, 'bandpass', freq * 2, 2);
  }
  pluck(pos, freq, vol = 0.5, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const t = this.ctx.currentTime + delay;
    this.osc('triangle', freq, t, 1.3, out, 0.45, 0.003);
    this.osc('sine', freq * 2, t, 0.6, out, 0.15, 0.003);
  }
  bell(pos, freq, vol = 0.6, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const t = this.ctx.currentTime + delay;
    for (const [k, a, d] of [[1, 1, 2.6], [2.76, 0.45, 1.6], [5.4, 0.25, 0.9], [8.93, 0.12, 0.5]]) this.osc('sine', freq * k, t, d, out, 0.35 * a, 0.002);
  }
  cymbal(pos, vol = 0.5, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const t = this.ctx.currentTime + delay;
    this.noiseHit(t, 1.4, out, 0.35, 'highpass', 6000, 0.7);
    this.noiseHit(t, 0.5, out, 0.2, 'bandpass', 3500, 1.5);
  }
  trumpet(pos, freq, dur = 0.5, vol = 0.35, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = freq;
    f.type = 'lowpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2200, t + 0.08);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.04);
    g.gain.setValueAtTime(0.25, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    o.connect(f).connect(g).connect(out); o.start(t); o.stop(t + dur + 0.2);
  }
  clack(pos, vol = 0.5, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const t = this.ctx.currentTime + delay;
    this.noiseHit(t, 0.05, out, 0.6, 'bandpass', 2400, 4);
    this.osc('sine', 900, t, 0.04, out, 0.2);
  }
  pour(pos, dur = 3, vol = 0.4, delay = 0) {
    const out = this.out(pos, vol); if (!out) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = this.noise; s.loop = true;
    f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 0.6;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.3);
    g.gain.setValueAtTime(0.5, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.6);
    s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + dur + 0.7);
  }
}

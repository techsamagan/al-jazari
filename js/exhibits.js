// Al-Jazari's machines, modeled procedurally after the drawings in his 1206 Book of Knowledge
// of Ingenious Mechanical Devices. These are interpretive reconstructions, not measured replicas.
import * as THREE from 'three';
import {
  M, V, mesh, box, cyl, sph, tube, lathe, flat, octo, archPoints, archRingShape,
  stretch, streamMesh, figure, bake, shadows, seg, lerp,
} from './parts.js';
import { makePlaque } from './plaques.js';
import { INFO } from './info.js';

const TAU = Math.PI * 2;
const _w = new THREE.Vector3(), _w2 = new THREE.Vector3();

function toLocal(obj, local, target, out) {
  obj.updateWorldMatrix(true, false);
  out.copy(local);
  obj.localToWorld(out);
  return target.worldToLocal(out);
}

function archMat(span) {
  const m = M.archStripe.clone();
  m.map = M.archStripe.map.clone();
  m.map.repeat.set(1 / span, 1 / span);
  m.map.offset.set(0.5, 0);
  m.map.needsUpdate = true;
  return m;
}

function pedestal(P, r = 2.2) {
  octo(r, 0.45, M.marble, P, 0, 0.225, 0);
  octo(r + 0.03, 0.04, M.gold, P, 0, 0.45, 0);
  octo(r + 0.1, 0.1, M.darkStone, P, 0, 0.05, 0);
}

// =====================================================================================
// 1. Elephant clock
// =====================================================================================
function elephantClock(ctx, S, D, pos) {
  const E = M.elephant;
  for (const [x, z] of [[-0.42, 0.62], [0.42, 0.62], [-0.42, -0.62], [0.42, -0.62]]) {
    cyl(0.19, 0.23, 1.15, E, S, x, 0.575, z, 18);
    cyl(0.25, 0.25, 0.07, M.gold, S, x, 0.1, z);
    cyl(0.236, 0.236, 0.05, M.gold, S, x, 0.24, z);
  }
  sph(1, E, S, 0, 1.52, 0, 36).scale.set(0.8, 0.64, 1.15);
  sph(0.5, E, S, 0, 1.82, 1.12, 30).scale.set(0.95, 1.05, 0.9);
  tube([V(0, 1.62, 1.46), V(0, 1.3, 1.72), V(0, 0.9, 1.8), V(0, 0.55, 1.72), V(0, 0.38, 1.56), V(0, 0.42, 1.42)], 0.1, E, S, 48, 14);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.CircleGeometry(0.5, 28), M.elephantDS, S, s * 0.44, 1.86, 0.9);
    ear.rotation.y = s * 1.2; ear.scale.set(0.85, 1.1, 1);
    const tusk = mesh(new THREE.ConeGeometry(0.055, 0.6, 12), M.ivory, S, s * 0.2, 1.45, 1.55); tusk.rotation.x = 1.2;
    sph(0.035, M.black, S, s * 0.3, 1.95, 1.43, 10);
  }
  tube([V(0, 1.6, -1.12), V(0, 1.3, -1.26), V(0, 0.95, -1.2)], 0.035, E, S, 12, 6);
  // caparison
  box(1.34, 0.05, 1.6, M.red, S, 0, 2.17, -0.05);
  for (const s of [-1, 1]) {
    box(0.04, 0.42, 1.45, M.red, S, s * 0.82, 1.97, -0.05);
    box(0.05, 0.05, 1.47, M.gold, S, s * 0.83, 1.76, -0.05);
    for (let k = 0; k < 9; k++) sph(0.025, M.gold, S, s * 0.83, 1.71, -0.7 + k * 0.163, 6);
  }
  // howdah platform and pavilion
  box(1.3, 0.1, 1.5, M.darkWood, S, 0, 2.24, -0.05);
  box(1.36, 0.04, 1.56, M.gold, S, 0, 2.3, -0.05);
  const tw = new THREE.Group(); tw.position.set(0, 2.32, -0.25); S.add(tw);
  mesh(flat(new THREE.CylinderGeometry(0.48, 0.52, 0.8, 8)), M.tile, tw, 0, 0.4, 0);
  octo(0.55, 0.07, M.gold, tw, 0, 0.83, 0);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + Math.PI / 8;
    cyl(0.035, 0.035, 0.62, M.gold, tw, Math.cos(a) * 0.43, 1.17, Math.sin(a) * 0.43, 10);
  }
  octo(0.53, 0.07, M.gold, tw, 0, 1.5, 0);
  mesh(new THREE.SphereGeometry(0.46, 32, 16, 0, TAU, 0, Math.PI / 2), M.lapis, tw, 0, 1.53, 0).scale.y = 1.15;
  cyl(0.03, 0.05, 0.25, M.gold, tw, 0, 2.15, 0);
  // falcons on the pavilion ring
  for (const s of [-1, 1]) {
    const f = new THREE.Group(); f.position.set(s * 0.6, 3.2, -0.25); f.rotation.y = s * Math.PI / 2; S.add(f);
    sph(0.07, M.bronze, f, 0, 0.06, 0, 12).scale.set(0.8, 0.9, 1.3);
    sph(0.045, M.bronze, f, 0, 0.13, 0.07, 10);
    const bk = mesh(new THREE.ConeGeometry(0.014, 0.05, 6), M.saffron, f, 0, 0.12, 0.12); bk.rotation.x = Math.PI / 2 + 0.4;
  }
  // vases that catch the balls
  for (const s of [-1, 1]) lathe([[0, 0], [0.1, 0], [0.14, 0.1], [0.1, 0.25], [0.06, 0.32], [0.09, 0.38]], M.brass, S, s * 1.65, 0, -0.25, 20);

  // ---- moving parts ----
  const phoenix = new THREE.Group(); phoenix.position.set(0, 4.62, -0.25); D.add(phoenix);
  sph(0.07, M.gold, phoenix, 0, 0.06, 0, 12).scale.set(0.8, 0.8, 1.5);
  sph(0.045, M.gold, phoenix, 0, 0.13, 0.09, 10);
  mesh(new THREE.ConeGeometry(0.015, 0.06, 6), M.saffron, phoenix, 0, 0.13, 0.15).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) box(0.24, 0.012, 0.1, M.gold, phoenix, s * 0.14, 0.1, 0).rotation.z = s * 0.45;
  mesh(new THREE.ConeGeometry(0.05, 0.22, 8), M.red, phoenix, 0, 0.12, -0.17).rotation.x = -Math.PI / 2 + 0.4;

  const serps = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * 0.84, 1.95, -0.25); D.add(g);
    tube([V(0, 0, 0), V(s * 0.15, 0.25, 0.05), V(s * 0.04, 0.52, -0.04), V(s * 0.16, 0.78, 0.03), V(s * 0.2, 0.93, 0)], 0.05, M.green, g, 30, 10);
    sph(0.08, M.green, g, s * 0.2, 0.98, 0, 12).scale.set(1.3, 0.8, 0.9);
    for (const z of [-0.05, 0.05]) sph(0.014, M.gold, g, s * 0.24, 1.03, z, 6);
    mesh(new THREE.ConeGeometry(0.04, 0.1, 8), M.red, g, s * 0.29, 0.97, 0).rotation.z = -s * Math.PI / 2;
    serps.push(g);
  }

  const mahout = figure({ robe: M.lapis, turban: M.white, scale: 0.62, seated: true });
  mahout.group.position.set(0, 2.2, 0.95); D.add(mahout.group);
  const hammer = mahout.hand(mahout.armR);
  cyl(0.01, 0.01, 0.18, M.darkWood, hammer, 0, -0.06, 0.04, 6).rotation.x = Math.PI / 2;
  box(0.04, 0.05, 0.08, M.gold, hammer, 0, -0.06, 0.14);

  const scribe = figure({ robe: M.white, turban: M.saffron, scale: 0.5, seated: true });
  scribe.group.position.set(0, 3.19, -0.25); D.add(scribe.group);
  scribe.armR.rotation.x = -0.9;
  cyl(0.005, 0.005, 0.1, M.black, scribe.hand(scribe.armR), 0, -0.03, 0.02, 4);

  const ball = sph(0.045, M.gold, D, 0, -10, 0, 12); ball.visible = false;
  const hit = box(2.2, 4.8, 3.6, M.hit, D, 0, 2.4, 0);

  let start = 0, lastT = 0, cyc = -1, fired = {};
  const trigger = () => { start = lastT; cyc = -1; };
  ctx.addInteractable(hit, 'Elephant Clock — release the next ball', trigger);
  const P = 12;
  return {
    trigger,
    update(t) {
      lastT = t;
      const el = t - start, n = Math.floor(el / P), p = (el % P) / P;
      if (n !== cyc) { cyc = n; fired = {}; }
      const s = n % 2 ? 1 : -1, si = s > 0 ? 1 : 0;
      phoenix.rotation.y = seg(p, 0, 0.14) * TAU;
      const tilt = p < 0.4 ? seg(p, 0.14, 0.3) : 1 - seg(p, 0.42, 0.6);
      serps.forEach((g, i) => { g.rotation.z = i === si ? -s * 0.9 * tilt : Math.sin(t * 1.1 + i) * 0.03; });
      const sp = serps[si];
      if (p < 0.05 || p >= 0.38) ball.visible = false;
      else if (p < 0.14) {
        const k = (p - 0.05) / 0.09;
        ball.visible = true;
        ball.position.set(s * lerp(0.72, 1.06, k), 3.25 + 0.06 * k - 0.27 * k * k, -0.25);
      } else if (p < 0.3) {
        toLocal(sp, _w2.set(s * 0.24, 1.02, 0), D, ball.position);
      } else {
        const k = (p - 0.3) / 0.08;
        toLocal(sp, _w2.set(s * 0.24, 1.02, 0), D, _w);
        ball.position.set(lerp(_w.x, s * 1.65, k), lerp(_w.y, 0.4, k * k), -0.25);
      }
      if (p > 0.05 && !fired.a) { fired.a = 1; ctx.sound.clack(pos, 0.5); ctx.sound.flute(pos, 1180, 0.12, 0.2); ctx.sound.flute(pos, 1400, 0.1, 0.2, 0.15); }
      if (p > 0.38 && !fired.b) { fired.b = 1; ctx.sound.bell(pos, 660, 0.7); }
      if (p > 0.47 && !fired.c) { fired.c = 1; ctx.sound.drum(pos, 0.9, 0.8); ctx.sound.cymbal(pos, 0.45, 0.02); }
      mahout.armR.rotation.x = -0.6 - 2.2 * seg(p, 0.38, 0.44) + 1.6 * seg(p, 0.45, 0.48) + 0.6 * seg(p, 0.55, 0.7);
      scribe.group.rotation.y = t * TAU / 40;
      scribe.armR.rotation.z = Math.sin(t * 3) * 0.08;
    },
  };
}

// =====================================================================================
// 2. Musical boat with programmable peg drum
// =====================================================================================
const HIJAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33];
const MELODY = [0, 1, 2, 3, 4, 3, 2, 1, 4, 5, 6, 7, 6, 4, 2, 1];
const PRESETS = [
  { name: 'Maqsum', d: [0, 2, 6, 8, 12], f: [0, 3, 4, 7, 8, 11, 12, 14] },
  { name: 'Saidi', d: [0, 2, 6, 8, 9, 12], f: [0, 2, 4, 6, 8, 10, 12, 14] },
  { name: 'Ayyub', d: [0, 3, 4, 6, 8, 11, 12, 14], f: [0, 4, 8, 12] },
  { name: 'Random', d: null, f: null },
];

function musicalBoat(ctx, S, D, pos) {
  mesh(flat(new THREE.CylinderGeometry(2.12, 2.12, 0.34, 8, 1, true)), M.marbleDS, S, 0, 0.17, 0);
  mesh(new THREE.RingGeometry(1.98, 2.24, 8), M.marble, S, 0, 0.345, 0).rotation.x = -Math.PI / 2;
  mesh(new THREE.CircleGeometry(2.1, 8), M.tile, S, 0, 0.01, 0).rotation.x = -Math.PI / 2;
  mesh(new THREE.CircleGeometry(2.1, 8), M.water, D, 0, 0.26, 0).rotation.x = -Math.PI / 2;

  // boat
  const boat = new THREE.Group(); boat.scale.setScalar(1.35); D.add(boat);
  mesh(new THREE.SphereGeometry(1, 28, 12, 0, TAU, Math.PI / 2, Math.PI / 2), M.woodDS, boat).scale.set(0.42, 0.26, 1.0);
  const gw = mesh(new THREE.TorusGeometry(1, 0.025, 8, 48), M.gold, boat); gw.rotation.x = Math.PI / 2; gw.scale.set(0.42, 1, 1);
  box(0.66, 0.03, 1.5, M.wood, boat, 0, -0.04, 0);
  for (const s of [-1, 1]) tube([V(0, 0, s * 0.95), V(0, 0.15, s * 1.1), V(0, 0.38, s * 1.12), V(0, 0.48, s * 1.02)], 0.03, M.gold, boat, 16, 8);
  for (const sx of [-0.28, 0.28]) for (const sz of [-0.6, 0.6]) cyl(0.012, 0.012, 0.66, M.gold, boat, sx, 0.29, sz, 6);
  box(0.66, 0.025, 1.3, M.red, boat, 0, 0.62, 0);
  box(0.68, 0.05, 1.32, M.gold, boat, 0, 0.6, 0);
  mesh(new THREE.SphereGeometry(0.16, 16, 8, 0, TAU, 0, Math.PI / 2), M.gold, boat, 0, 0.63, 0);

  const mk = (z, robe, turban) => { const f = figure({ robe, turban, scale: 0.5, seated: true }); f.group.position.set(-0.05, -0.02, z); f.group.rotation.y = Math.PI / 2; boat.add(f.group); return f; };
  const drummer = mk(0.42, M.red, M.white);
  cyl(0.07, 0.07, 0.08, M.saffron, drummer.body, 0, 0.18, 0.2, 14);
  const harpist = mk(0.14, M.lapis, M.white);
  tube([V(0, 0.15, 0.17), V(0.02, 0.45, 0.18), V(0.1, 0.42, 0.24), V(0, 0.15, 0.17)], 0.008, M.gold, harpist.body, 20, 5);
  harpist.armR.rotation.x = -0.9;
  const flutists = [mk(-0.14, M.green, M.saffron), mk(-0.42, M.violet, M.white)];
  for (const f of flutists) {
    f.armL.rotation.x = f.armR.rotation.x = -1.35;
    f.armL.rotation.z = 0.5; f.armR.rotation.z = -0.2;
    cyl(0.007, 0.007, 0.3, M.ivory, f.head, 0.1, -0.04, 0.08, 6).rotation.z = Math.PI / 2 - 0.3;
  }

  // peg drum (camshaft)
  for (const s of [-1, 1]) {
    cyl(0.035, 0.04, 0.82, M.bronze, S, s * 0.72, 0.41, 1.72, 10);
    cyl(0.05, 0.05, 0.06, M.gold, S, s * 0.72, 0.82, 1.72, 10);
  }
  const drum = new THREE.Group(); drum.position.set(0, 0.8, 1.72); D.add(drum);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.15, 40).rotateZ(Math.PI / 2), M.brass, drum);
  mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8).rotateZ(Math.PI / 2), M.iron, drum);
  for (const x of [-0.3, 0.3]) mesh(new THREE.TorusGeometry(0.302, 0.008, 6, 48), M.iron, drum, x, 0, 0).rotation.y = Math.PI / 2;
  const pegGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.07, 10);
  const hitGeo = new THREE.BoxGeometry(0.11, 0.11, 0.1);
  const tracks = [{ x: -0.3, on: Array(16).fill(false), pegs: [], kind: 'drum' }, { x: 0.3, on: Array(16).fill(false), pegs: [], kind: 'flute' }];
  const setPeg = (tr, k, v) => {
    tr.on[k] = v;
    const p = tr.pegs[k];
    p.scale.y = v ? 1 : 0.22;
    p.material.color.set(v ? 0xf0c869 : 0x3a332c);
    p.material.metalness = v ? 1 : 0.6;
  };
  for (const tr of tracks) {
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * TAU;
      const mat = new THREE.MeshStandardMaterial({ color: 0xf0c869, metalness: 1, roughness: 0.2, emissive: 0x2fd0c0, emissiveIntensity: 0 });
      const p = mesh(pegGeo, mat, drum, tr.x, Math.cos(a) * 0.33, Math.sin(a) * 0.33); p.rotation.x = a;
      tr.pegs.push(p);
      const h = mesh(hitGeo, M.hit, drum, tr.x, Math.cos(a) * 0.34, Math.sin(a) * 0.34); h.rotation.x = a;
      ctx.addInteractable(h, `Peg ${k + 1} · ${tr.kind} track — toggle`, () => { setPeg(tr, k, !tr.on[k]); ctx.sound.clack(pos, 0.4); }, mat);
    }
  }
  // follower levers riding on the pegs
  const levers = tracks.map((tr) => {
    cyl(0.02, 0.02, 0.4, M.bronze, S, tr.x, 0.98, 1.37, 8);
    const l = new THREE.Group(); l.position.set(tr.x, 1.18, 1.37); D.add(l);
    box(0.035, 0.025, 0.5, M.bronze, l, 0, 0, 0.24);
    sph(0.025, M.gold, l, 0, 0, 0.5, 8);
    return l;
  });

  let preset = 0;
  const applyPreset = (i) => {
    preset = i;
    const pr = PRESETS[i];
    for (let k = 0; k < 16; k++) {
      setPeg(tracks[0], k, pr.d ? pr.d.includes(k) : Math.random() < 0.38);
      setPeg(tracks[1], k, pr.f ? pr.f.includes(k) : Math.random() < 0.4);
    }
  };
  applyPreset(0);

  const stepDur = 0.21;
  let stepF = 0, lastStep = -1, drumHit = 0, fluteHit = 0;
  const trigger = () => { applyPreset((preset + 1) % PRESETS.length); ctx.toast(`Rhythm: ${PRESETS[preset].name}`); ctx.sound.clack(pos, 0.5); };
  ctx.waterSpots.push(pos);
  return {
    trigger,
    update(t, dt) {
      stepF = (stepF + dt / stepDur) % 16;
      drum.rotation.x = -stepF / 16 * TAU;
      const st = Math.floor(stepF);
      if (st !== lastStep) {
        lastStep = st;
        if (tracks[0].on[st]) { ctx.sound.drum(pos, 0.85, st % 8 === 0 ? 0.8 : 1.2); if (st % 4 !== 0) ctx.sound.tek(pos, 0.25); drumHit = 1; }
        if (tracks[1].on[st]) { ctx.sound.flute(pos, HIJAZ[MELODY[st]], 0.17, 0.42); if (st % 4 === 0) ctx.sound.pluck(pos, HIJAZ[MELODY[st]] / 2, 0.3); fluteHit = 1; }
      }
      const near = Math.round(stepF) % 16, d = stepF - Math.round(stepF);
      tracks.forEach((tr, i) => { levers[i].rotation.x = tr.on[near] ? -0.28 * Math.max(0, 1 - Math.abs(d) * 3.5) : 0; });
      drumHit *= Math.exp(-dt * 12); fluteHit *= Math.exp(-dt * 8);
      drummer.armR.rotation.x = -0.6 - 0.9 * drumHit;
      drummer.armL.rotation.x = -0.6 - 0.4 * Math.max(0, Math.sin(t * 9));
      for (const f of flutists) f.head.rotation.x = 0.08 * fluteHit;
      harpist.armR.rotation.z = Math.sin(t * 4) * 0.25;
      const a = t * 0.12;
      boat.position.set(Math.cos(a) * 0.5, 0.3 + Math.sin(t * 1.3) * 0.012, -0.5 + Math.sin(a) * 0.5);
      boat.rotation.set(Math.sin(t * 0.9) * 0.015, -a, Math.sin(t * 1.1) * 0.03);
    },
  };
}

// =====================================================================================
// 3. Peacock hand-washing basin
// =====================================================================================
function peacockBasin(ctx, S, D, pos) {
  const brassDS = M.brass.clone(); brassDS.side = THREE.DoubleSide;
  lathe([[0, 0], [0.34, 0], [0.36, 0.05], [0.2, 0.12], [0.13, 0.3], [0.11, 0.55], [0.16, 0.66], [0.12, 0.72], [0, 0.72]], M.brass, S);
  const prof = [[0.3, 0.73], [0.58, 0.79], [0.78, 0.9], [0.86, 1.03]];
  lathe([[0, 0.72], ...prof, [0.9, 1.06], [0.87, 1.075]], brassDS, S, 0, 0, 0, 48);
  const rAt = (y) => { for (let i = 1; i < prof.length; i++) if (y <= prof[i][1]) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; return lerp(r0, r1, (y - y0) / (y1 - y0)); } return 0.86; };
  const water = mesh(new THREE.CircleGeometry(1, 40), M.water, D); water.rotation.x = -Math.PI / 2;

  // cabinet with two doors
  box(1.4, 1.9, 0.5, M.tile, S, 0, 0.95, -0.95);
  box(1.5, 0.08, 0.6, M.gold, S, 0, 1.92, -0.95);
  box(1.48, 0.12, 0.58, M.darkWood, S, 0, 0.06, -0.95);
  for (const s of [-1, 1]) box(0.32, 0.44, 0.02, M.black, S, s * 0.35, 1.35, -0.69);
  box(1.0, 0.03, 0.3, M.darkWood, S, 0, 1.115, -0.6);
  const doors = [-1, 1].map((s) => {
    const pv = new THREE.Group(); pv.position.set(s * 0.51, 1.35, -0.68); D.add(pv);
    box(0.32, 0.44, 0.025, M.wood, pv, -s * 0.16, 0, 0);
    box(0.3, 0.42, 0.01, M.gold, pv, -s * 0.16, 0, 0.012).scale.set(0.9, 0.9, 1);
    sph(0.018, M.black, pv, -s * 0.28, 0, 0.025, 8);
    return pv;
  });
  const servants = [-1, 1].map((s, i) => {
    const f = figure({ robe: i ? M.saffron : M.turq, turban: M.white, scale: 0.4 });
    f.group.position.set(s * 0.35, 1.13, -0.86); D.add(f.group);
    f.armR.rotation.x = f.armL.rotation.x = -1.2;
    f.armR.rotation.z = -0.3; f.armL.rotation.z = 0.3;
    const h = f.hand(f.armR);
    if (i === 0) box(0.07, 0.045, 0.05, M.white, h, -0.04, -0.02, 0);
    else mesh(new THREE.PlaneGeometry(0.12, 0.22), M.whiteDS, h, -0.04, -0.1, 0);
    return f;
  });

  // peacock
  sph(0.2, M.peacock, S, 0, 2.12, -0.95, 24).scale.set(0.75, 0.8, 1.25);
  tube([V(0, 2.2, -0.8), V(0, 2.38, -0.7), V(0, 2.52, -0.62)], 0.045, M.peacock, S, 16, 10);
  sph(0.065, M.peacock, S, 0, 2.58, -0.58, 16);
  mesh(new THREE.ConeGeometry(0.02, 0.08, 8), M.gold, S, 0, 2.555, -0.5).rotation.x = 2.04;
  for (const s of [-1, 1]) {
    sph(0.012, M.white, S, s * 0.05, 2.6, -0.55, 6);
    cyl(0.012, 0.012, 0.18, M.gold, S, s * 0.06, 1.98, -0.95, 6);
  }
  for (let i = -1; i <= 1; i++) {
    cyl(0.004, 0.004, 0.1, M.peacock, S, i * 0.02, 2.69, -0.6, 4);
    sph(0.014, M.peacock, S, i * 0.02, 2.74, -0.6, 6);
  }
  const tail = new THREE.Group(); tail.position.set(0, 2.1, -1.12); D.add(tail);
  const fGeo = new THREE.PlaneGeometry(0.17, 0.95).translate(0, 0.475, 0);
  const feathers = [];
  for (let i = 0; i < 17; i++) {
    const f = mesh(fGeo, M.feather, tail, 0, 0, -i * 0.003);
    f.userData.a = (i / 16 - 0.5) * 2.7;
    feathers.push(f);
  }
  const stream = streamMesh(D);
  const hit = box(1.8, 2.8, 2.0, M.hit, D, 0, 1.4, -0.4);
  ctx.waterSpots.push(pos);

  let start = -6, lastT = 0, cyc = -1, fired = {};
  const trigger = () => { start = lastT; cyc = -1; };
  ctx.addInteractable(hit, 'Peacock Basin — wash your hands', trigger);
  const P = 16, a = V(0, 2.53, -0.45), b = V(0, 0, -0.08);
  return {
    trigger,
    update(t) {
      lastT = t;
      const el = t - start, n = Math.floor(el / P), p = (el % P) / P;
      if (n !== cyc) { cyc = n; fired = {}; }
      const fan = p < 0.9 ? seg(p, 0, 0.08) : 1 - seg(p, 0.9, 0.98);
      tail.rotation.x = lerp(-1.25, -0.2, fan);
      for (const f of feathers) f.rotation.z = f.userData.a * lerp(0.1, 1, fan) + Math.sin(t * 2 + f.userData.a) * 0.01 * fan;
      const level = 0.74 + 0.25 * seg(p, 0.08, 0.42) - 0.22 * seg(p, 0.45, 0.62);
      water.visible = level > 0.745;
      water.position.y = level;
      water.scale.setScalar(rAt(level));
      const pouring = p > 0.08 && p < 0.42;
      stream.visible = pouring;
      if (pouring) { b.y = level; stretch(stream, a, b); }
      const d1 = seg(p, 0.5, 0.56) - seg(p, 0.7, 0.76), d2 = seg(p, 0.68, 0.74) - seg(p, 0.88, 0.94);
      doors[0].rotation.y = -1.7 * d1; doors[1].rotation.y = 1.7 * d2;
      servants[0].group.position.z = -0.86 + 0.32 * (seg(p, 0.54, 0.6) - seg(p, 0.66, 0.71));
      servants[1].group.position.z = -0.86 + 0.32 * (seg(p, 0.72, 0.78) - seg(p, 0.84, 0.89));
      if (p > 0.08 && !fired.a) { fired.a = 1; ctx.sound.pour(pos, 5, 0.5); ctx.sound.flute(pos, 880, 0.2, 0.15); }
      if (p > 0.5 && !fired.b) { fired.b = 1; ctx.sound.clack(pos, 0.5); ctx.sound.bell(pos, 1046, 0.25, 0.3); }
      if (p > 0.68 && !fired.c) { fired.c = 1; ctx.sound.clack(pos, 0.5); ctx.sound.bell(pos, 1318, 0.25, 0.3); }
    },
  };
}

// =====================================================================================
// 4. Drink-serving automaton
// =====================================================================================
function drinkServer(ctx, S, D, pos) {
  box(1.9, 0.14, 1.5, M.darkStone, S, 0, 0.07, -0.1);
  box(1.9, 3.5, 0.14, M.tile, S, 0, 1.89, -0.8);
  for (const s of [-1, 1]) {
    box(0.12, 3.5, 1.15, M.wall, S, s * 0.89, 1.89, -0.25);
    cyl(0.07, 0.08, 2.26, M.marble, S, s * 0.78, 1.27, 0.45, 14);
    box(0.2, 0.08, 0.2, M.gold, S, s * 0.78, 2.4, 0.45);
  }
  const sp = [new THREE.Vector2(-0.95, 0), ...archPoints(0.7, 0.35), new THREE.Vector2(0.95, 0), new THREE.Vector2(0.95, 1.24), new THREE.Vector2(-0.95, 1.24)];
  mesh(new THREE.ExtrudeGeometry(new THREE.Shape(sp), { depth: 0.12, bevelEnabled: false }).translate(0, 0, -0.06), M.wall, S, 0, 2.44, 0.45);
  mesh(new THREE.ExtrudeGeometry(archRingShape(0.7, 0.86, 0.35), { depth: 0.16, bevelEnabled: false }).translate(0, 0, -0.08), archMat(1.9), S, 0, 2.44, 0.45);
  box(2.0, 0.12, 1.5, M.darkWood, S, 0, 3.7, -0.15);
  box(2.04, 0.04, 1.54, M.gold, S, 0, 3.78, -0.15);
  mesh(new THREE.SphereGeometry(0.42, 28, 14, 0, TAU, 0, Math.PI / 2), M.lapis, S, -0.25, 3.8, -0.2).scale.y = 1.2;
  cyl(0.02, 0.04, 0.25, M.gold, S, -0.25, 4.4, -0.2, 8);
  // reservoir (glass so the level is visible)
  mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 24, 1, true), M.glass, D, 0.5, 4.08, -0.35);
  for (const y of [3.8, 4.36]) mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 24), M.copper, S, 0.5, y, -0.35).rotation.x = Math.PI / 2;
  const tankWater = cyl(0.185, 0.185, 1, M.water, D, 0.5, 4.0, -0.35, 20);
  tube([V(0.5, 3.8, -0.5), V(0.6, 3.4, -0.68), V(0.6, 2.6, -0.7)], 0.02, M.copper, S, 12, 6);

  const fig = figure({ robe: M.violet, sash: M.gold, turban: M.saffron, beard: false, scale: 1.15 });
  fig.group.position.set(0, 0.14, -0.3); D.add(fig.group);
  const jug = new THREE.Group(); fig.hand(fig.armR).add(jug);
  lathe([[0, 0], [0.045, 0], [0.06, 0.04], [0.055, 0.09], [0.025, 0.13], [0.02, 0.16], [0.03, 0.17]], M.copper, jug, 0, -0.05, 0.03, 16);
  const spout = new THREE.Object3D(); spout.position.set(-0.03, 0.12, 0.03); jug.add(spout);
  const cup = new THREE.Group(); fig.hand(fig.armL).add(cup);
  const goldDS = M.gold.clone(); goldDS.side = THREE.DoubleSide;
  lathe([[0, 0], [0.025, 0], [0.03, 0.01], [0.05, 0.06], [0.052, 0.065]], goldDS, cup, 0, -0.02, 0.03, 16);
  const sherbet = new THREE.MeshStandardMaterial({ color: 0xb0451a, roughness: 0.1, metalness: 0.1 });
  const fill = mesh(new THREE.CircleGeometry(1, 16), sherbet, cup, 0, 0, 0.03); fill.rotation.x = -Math.PI / 2;
  const cupMark = new THREE.Object3D(); cupMark.position.set(0, 0.03, 0.03); cup.add(cupMark);
  const stream = streamMesh(D, 0.006, 0.01);
  const hit = box(1.8, 3.6, 1.6, M.hit, D, 0, 1.8, -0.1);

  let start = -3, lastT = 0, cyc = -1, fired = {};
  const trigger = () => { start = lastT; cyc = -1; };
  ctx.addInteractable(hit, 'Drink Server — request a drink', trigger);
  const P = 13;
  return {
    trigger,
    update(t) {
      lastT = t;
      const el = t - start, n = Math.floor(el / P), p = (el % P) / P;
      if (n !== cyc) { cyc = n; fired = {}; }
      fig.group.position.z = -0.3 + 0.55 * (seg(p, 0, 0.1) - seg(p, 0.84, 0.96));
      const raise = seg(p, 0.1, 0.2) - seg(p, 0.5, 0.58);
      const cupUp = seg(p, 0.1, 0.2) - seg(p, 0.84, 0.92);
      const offer = seg(p, 0.58, 0.68) - seg(p, 0.76, 0.84);
      fig.armR.rotation.set(-1.0 * raise, 0, -0.55 * raise);
      fig.armL.rotation.set(-0.85 * cupUp - 0.55 * offer, 0, 0.32 * cupUp * (1 - offer));
      const tilt = seg(p, 0.22, 0.28) - seg(p, 0.44, 0.5);
      jug.rotation.set(-fig.armR.rotation.x, 0, 1.7 * tilt - fig.armR.rotation.z);
      cup.rotation.set(-fig.armL.rotation.x, 0, -fig.armL.rotation.z);
      const f = seg(p, 0.26, 0.47) - seg(p, 0.92, 0.97);
      fill.visible = f > 0.02;
      fill.position.y = 0.0 + 0.04 * f;
      fill.scale.setScalar(0.03 + 0.018 * f);
      const pouring = p > 0.27 && p < 0.46;
      stream.visible = pouring;
      if (pouring) {
        spout.getWorldPosition(_w); D.worldToLocal(_w);
        cupMark.getWorldPosition(_w2); D.worldToLocal(_w2);
        stretch(stream, _w, _w2);
      }
      const lvl = 0.85 - 0.3 * seg(p, 0.27, 0.46) + 0.3 * seg(p, 0.86, 1);
      tankWater.scale.y = 0.5 * lvl; tankWater.position.y = 3.81 + 0.25 * lvl;
      if (p > 0.01 && !fired.a) { fired.a = 1; ctx.sound.clack(pos, 0.4); }
      if (p > 0.27 && !fired.b) { fired.b = 1; ctx.sound.pour(pos, 2.2, 0.3); }
      if (p > 0.64 && !fired.c) { fired.c = 1; ctx.sound.bell(pos, 784, 0.35); ctx.sound.bell(pos, 1175, 0.2, 0.12); }
    },
  };
}

// =====================================================================================
// 5. Double-acting piston pump (crank + slot-rod)
// =====================================================================================
function waterPump(ctx, S, D, pos) {
  // trough with flowing water
  box(2.6, 0.06, 0.62, M.darkWood, S, 0, 0.03, 0.3);
  for (const s of [-1, 1]) box(2.6, 0.32, 0.05, M.darkWood, S, 0, 0.19, 0.3 + s * 0.3);
  mesh(new THREE.PlaneGeometry(2.6, 0.55), M.water, D, 0, 0.27, 0.3).rotation.x = -Math.PI / 2;

  // water wheel with the vertical gear on its axle
  const wheel = new THREE.Group(); wheel.position.set(0, 0.78, 0.3); D.add(wheel);
  for (const z of [-0.12, 0.12]) mesh(new THREE.TorusGeometry(0.62, 0.025, 8, 40), M.wood, wheel, 0, 0, z);
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU;
    box(0.05, 0.22, 0.3, M.wood, wheel, Math.cos(a) * 0.66, Math.sin(a) * 0.66, 0).rotation.z = a;
    if (i < 5) for (const z of [-0.12, 0.12]) box(0.03, 1.24, 0.03, M.wood, wheel, 0, 0, z).rotation.z = a;
  }
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 10).rotateX(Math.PI / 2), M.iron, wheel, 0, 0, -0.35);
  const vg = new THREE.Group(); vg.position.z = -0.75; wheel.add(vg);
  mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 32).rotateX(Math.PI / 2), M.darkWood, vg);
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; box(0.05, 0.08, 0.06, M.wood, vg, Math.cos(a) * 0.43, Math.sin(a) * 0.43, 0).rotation.z = a; }
  // supports
  for (const z of [0.68, -0.62]) {
    box(0.08, 0.82, 0.08, M.darkWood, S, 0.0, 0.41, z);
    box(0.14, 0.06, 0.14, M.iron, S, 0, 0.8, z);
  }
  // horizontal gear on a vertical shaft
  cyl(0.035, 0.035, 1.3, M.iron, S, 0, 0.65, -0.9, 10);
  for (const s of [-1, 1]) box(0.08, 1.24, 0.08, M.darkWood, S, s * 0.62, 0.62, -0.9);
  box(1.32, 0.07, 0.1, M.darkWood, S, 0, 1.0, -0.9);
  const hg = new THREE.Group(); hg.position.set(0, 1.28, -0.9); D.add(hg);
  cyl(0.45, 0.45, 0.05, M.darkWood, hg, 0, 0, 0, 36);
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; cyl(0.02, 0.02, 0.1, M.wood, hg, Math.cos(a) * 0.42, -0.07, Math.sin(a) * 0.42, 6); }
  cyl(0.03, 0.03, 0.36, M.brass, hg, 0.3, 0.18, 0, 10);
  // slot-rod lever (pivot O)
  const O = { x: 0, z: 0.1 }, LY = 1.6, LL = 1.5;
  cyl(0.04, 0.05, LY, M.darkWood, S, O.x, LY / 2, O.z, 10);
  const lever = new THREE.Group(); lever.position.set(O.x, LY, O.z); D.add(lever);
  for (const s of [-1, 1]) box(0.025, 0.05, LL, M.bronze, lever, s * 0.035, 0, -LL / 2);
  box(0.1, 0.05, 0.06, M.bronze, lever, 0, 0, 0);
  box(0.1, 0.05, 0.06, M.bronze, lever, 0, 0, -LL);
  const slider = box(0.06, 0.06, 0.1, M.brass, D, 0, LY, 0);
  // opposed cylinders, piston rod, delivery pipes
  const zc = O.z - LL;
  const rod = new THREE.Group(); rod.position.set(0, LY, zc); D.add(rod);
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.0, 8).rotateZ(Math.PI / 2), M.iron, rod);
  for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.08, 20).rotateZ(Math.PI / 2), M.copper, rod, s * 1.0, 0, 0);
  for (const s of [-1, 1]) {
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.0, 24, 1, true).rotateZ(Math.PI / 2), M.glass, D, s * 1.05, LY, zc);
    for (const x of [0.55, 1.55]) mesh(new THREE.TorusGeometry(0.12, 0.018, 8, 20), M.copper, S, s * x, LY, zc).rotation.y = Math.PI / 2;
    mesh(new THREE.CircleGeometry(0.12, 20), M.copper, S, s * 1.555, LY, zc).rotation.y = -s * Math.PI / 2;
    tube([V(s * 1.56, LY, zc), V(s * 1.7, LY + 0.1, zc), V(s * 1.7, 2.45, zc), V(s * 1.3, 2.55, zc), V(s * 0.1, 2.55, zc)], 0.035, M.copper, S, 30, 8);
    tube([V(s * 1.3, LY - 0.1, zc), V(s * 1.3, 0.8, zc), V(s * 1.3, 0.02, zc - 0.2)], 0.03, M.copper, S, 12, 8);
    box(0.08, LY - 0.12, 0.08, M.darkWood, S, s * 1.05, (LY - 0.12) / 2, zc);
  }
  tube([V(-0.1, 2.55, zc), V(0, 2.55, zc), V(0, 2.5, zc - 0.2), V(0, 2.42, zc - 0.28)], 0.04, M.copper, S, 12, 8);
  box(0.9, 0.5, 0.45, M.wall, S, 0, 0.25, zc - 0.35);
  mesh(new THREE.PlaneGeometry(0.8, 0.35), M.water, D, 0, 0.47, zc - 0.35).rotation.x = -Math.PI / 2;
  const outflow = streamMesh(D, 0.02, 0.03);
  const oa = V(0, 2.4, zc - 0.3), ob = V(0, 0.47, zc - 0.36);
  const hit = box(3.4, 2.8, 3.2, M.hit, D, 0, 1.4, -0.5);
  ctx.waterSpots.push(pos);

  let theta = 0, speed = 0.9, boostUntil = -1, lastT = 0, prevX = 0, lastStroke = 0;
  const trigger = () => { boostUntil = lastT + 6; ctx.toast('Flood surge — the wheel speeds up'); ctx.sound.pour(pos, 4, 0.45); };
  ctx.addInteractable(hit, 'Double-acting pump — send a surge of water', trigger);
  return {
    trigger,
    update(t, dt) {
      lastT = t;
      speed = lerp(speed, t < boostUntil ? 3.2 : 0.9, 1 - Math.exp(-dt * 1.5));
      theta += speed * dt;
      wheel.rotation.z = -theta;
      hg.rotation.y = theta;
      const px = 0.3 * Math.cos(theta), pz = -0.9 - 0.3 * Math.sin(theta);
      const dx = px - O.x, dz = pz - O.z, len = Math.hypot(dx, dz);
      const beta = Math.atan2(-dx, -dz);
      lever.rotation.y = beta;
      slider.position.set(px, LY, pz); slider.rotation.y = beta;
      const tx = O.x + (dx / len) * LL;
      rod.position.x = tx;
      const v = Math.abs(tx - prevX) / Math.max(dt, 1e-3); prevX = tx;
      outflow.visible = v > 0.05;
      if (outflow.visible) { stretch(outflow, oa, ob); outflow.scale.x = outflow.scale.z = Math.min(1.6, 0.4 + v * 1.2); }
      const stroke = Math.sign(Math.sin(theta));
      if (stroke !== lastStroke) { lastStroke = stroke; ctx.sound.clack(pos, 0.25); }
    },
  };
}

// =====================================================================================
// 6. Saqiya — chain-of-pots water raiser with an ox
// =====================================================================================
function saqiya(ctx, S, D, pos) {
  const wellZ = -1.1, AY = 1.3, R = 0.45, botY = 0.25;
  const wallDS = M.wall.clone(); wallDS.side = THREE.DoubleSide;
  mesh(new THREE.CylinderGeometry(0.6, 0.62, 0.5, 28, 1, true), wallDS, S, 0, 0.25, wellZ);
  mesh(new THREE.TorusGeometry(0.61, 0.05, 8, 28), M.wall, S, 0, 0.5, wellZ).rotation.x = Math.PI / 2;
  mesh(new THREE.CircleGeometry(0.6, 28), M.waterDark, S, 0, 0.2, wellZ).rotation.x = -Math.PI / 2;
  // gantries carrying the horizontal axle
  for (const z of [-0.5, -1.78]) {
    for (const s of [-1, 1]) box(0.09, 1.26, 0.09, M.darkWood, S, s * 0.7, 0.63, z);
    box(1.5, 0.08, 0.12, M.darkWood, S, 0, 1.22, z);
  }
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.15, 10).rotateX(Math.PI / 2), M.iron, S, 0, AY, -0.8);
  // chain ropes (static loop)
  const arc = (cy, a0, a1) => new THREE.CatmullRomCurve3(new THREE.EllipseCurve(0, cy, R, R, a0, a1, false).getPoints(16).map((p) => V(p.x, p.y, 0)));
  const path = new THREE.CurvePath();
  path.add(new THREE.LineCurve3(V(R, botY, 0), V(R, AY, 0)));
  path.add(arc(AY, 0, Math.PI));
  path.add(new THREE.LineCurve3(V(-R, AY, 0), V(-R, botY, 0)));
  path.add(arc(botY, Math.PI, TAU));
  for (const z of [-0.07, 0.07]) mesh(new THREE.TubeGeometry(path, 120, 0.01, 5, true), M.darkWood, S, 0, 0, wellZ + z);
  // pot wheel
  const pw = new THREE.Group(); pw.position.set(0, AY, wellZ); D.add(pw);
  for (const z of [-0.08, 0.08]) mesh(new THREE.TorusGeometry(R - 0.02, 0.02, 8, 36), M.wood, pw, 0, 0, z);
  for (let i = 0; i < 4; i++) box(0.03, (R - 0.02) * 2, 0.03, M.wood, pw).rotation.z = i / 4 * Math.PI;
  // vertical gear + horizontal gear + shaft
  const vg = new THREE.Group(); vg.position.set(0, AY, 0.2); D.add(vg);
  mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 32).rotateX(Math.PI / 2), M.darkWood, vg);
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; box(0.05, 0.08, 0.06, M.wood, vg, Math.cos(a) * 0.43, Math.sin(a) * 0.43, 0).rotation.z = a; }
  const shaft = new THREE.Group(); shaft.position.set(0, 0, 0.7); D.add(shaft);
  cyl(0.05, 0.06, 1.05, M.darkWood, shaft, 0, 0.525, 0, 10);
  cyl(0.5, 0.5, 0.05, M.darkWood, shaft, 0, 0.85, 0, 36);
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; cyl(0.018, 0.018, 0.09, M.wood, shaft, Math.cos(a) * 0.46, 0.91, Math.sin(a) * 0.46, 6); }
  octo(0.12, 0.1, M.iron, S, 0, 0.05, 0.7);
  // draw-bar and ox
  const RO = 1.1;
  box(RO, 0.06, 0.06, M.darkWood, shaft, RO / 2, 0.72, 0);
  const ox = new THREE.Group(); ox.position.set(RO, 0, 0); ox.rotation.y = Math.PI; shaft.add(ox);
  sph(1, M.ox, ox, 0, 0.55, 0, 24).scale.set(0.2, 0.22, 0.42);
  sph(0.12, M.ox, ox, 0, 0.72, 0.18, 14).scale.set(1, 0.7, 1.2);
  const legs = [];
  for (const [x, z] of [[-0.11, 0.26], [0.11, 0.26], [-0.11, -0.28], [0.11, -0.28]]) {
    const l = new THREE.Group(); l.position.set(x, 0.48, z); ox.add(l);
    cyl(0.04, 0.032, 0.46, M.ox, l, 0, -0.23, 0, 8);
    cyl(0.036, 0.036, 0.04, M.black, l, 0, -0.46, 0, 8);
    legs.push(l);
  }
  const head = new THREE.Group(); head.position.set(0, 0.62, 0.44); ox.add(head);
  sph(0.11, M.ox, head, 0, 0, 0.06, 14).scale.set(0.85, 0.9, 1.3);
  sph(0.07, M.black, head, 0, -0.04, 0.2, 10).scale.set(1, 0.8, 0.8);
  for (const s of [-1, 1]) {
    tube([V(s * 0.07, 0.07, 0.02), V(s * 0.18, 0.1, 0), V(s * 0.2, 0.2, 0.04)], 0.015, M.ivory, head, 8, 5);
    sph(0.014, M.black, head, s * 0.07, 0.03, 0.15, 6);
  }
  box(0.36, 0.05, 0.06, M.darkWood, ox, 0, 0.74, 0.32);
  tube([V(0, 0.6, -0.42), V(0, 0.45, -0.48), V(0, 0.3, -0.46)], 0.015, M.ox, ox, 8, 5);
  box(0.42, 0.04, 0.5, M.red, ox, 0, 0.77, -0.02);
  // pots on the chain
  const potProf = [[0, 0], [0.04, 0], [0.06, 0.05], [0.055, 0.1], [0.035, 0.13], [0.04, 0.15]];
  const pots = [];
  for (let i = 0; i < 16; i++) { const g = new THREE.Group(); D.add(g); lathe(potProf, M.clay, g, 0, -0.075, 0, 12); pots.push(g); }
  const Ls = AY - botY, Lp = 2 * Ls + TAU * R;
  const place = (s, g) => {
    s = ((s % Lp) + Lp) % Lp;
    let x, y, ang;
    if (s < Ls) { x = R; y = botY + s; ang = Math.PI / 2; }
    else if ((s -= Ls) < Math.PI * R) { const a = s / R; x = R * Math.cos(a); y = AY + R * Math.sin(a); ang = a + Math.PI / 2; }
    else if ((s -= Math.PI * R) < Ls) { x = -R; y = AY - s; ang = -Math.PI / 2; }
    else { s -= Ls; const a = Math.PI + s / R; x = R * Math.cos(a); y = botY + R * Math.sin(a); ang = a + Math.PI / 2; }
    const nrm = ang - Math.PI / 2; // outward normal of the loop
    g.position.set(x + Math.cos(nrm) * 0.08, y + Math.sin(nrm) * 0.08, wellZ);
    g.rotation.z = nrm;
  };
  // trough fed by the tipping pots
  box(0.32, 0.05, 1.2, M.darkWood, S, -0.05, 1.45, wellZ);
  mesh(new THREE.PlaneGeometry(0.26, 1.15), M.water, D, -0.05, 1.48, wellZ).rotation.x = -Math.PI / 2;
  box(0.3, 0.06, 0.4, M.wall, S, -0.05, 0.3, wellZ - 0.8);
  const s1 = streamMesh(D, 0.012, 0.016), s2 = streamMesh(D, 0.018, 0.022);
  s1.visible = s2.visible = true;
  stretch(s1, V(-0.2, 1.75, wellZ), V(-0.1, 1.48, wellZ));
  stretch(s2, V(-0.05, 1.45, wellZ - 0.62), V(-0.05, 0.33, wellZ - 0.75));
  const hit = box(3.2, 2.4, 3.6, M.hit, D, 0, 1.2, 0);
  ctx.waterSpots.push(pos);

  let psi = 0, w = 0.35, boostUntil = -1, lastT = 0, step = 0;
  const trigger = () => { boostUntil = lastT + 6; ctx.toast('The ox quickens its pace'); ctx.sound.bell(pos, 392, 0.5); };
  ctx.addInteractable(hit, 'Saqiya — urge the ox on', trigger);
  return {
    trigger,
    update(t, dt) {
      lastT = t;
      w = lerp(w, t < boostUntil ? 0.9 : 0.35, 1 - Math.exp(-dt * 1.5));
      psi += w * dt;
      shaft.rotation.y = psi;
      const vang = psi * 1.25;
      vg.rotation.z = vang; pw.rotation.z = vang;
      const chainS = vang * R;
      pots.forEach((g, i) => place(chainS + i * Lp / pots.length, g));
      const gait = psi * 18;
      legs.forEach((l, i) => { l.rotation.x = Math.sin(gait + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.35; });
      head.rotation.x = Math.sin(gait * 2) * 0.04;
      ox.position.y = Math.abs(Math.sin(gait)) * 0.015;
      const st = Math.floor(gait / Math.PI);
      if (st !== step) { step = st; ctx.sound.clack(pos, 0.12); }
    },
  };
}

// =====================================================================================
// 7. Castle clock
// =====================================================================================
function castleClock(ctx, S, D, pos) {
  box(7.0, 0.6, 2.4, M.marble, S, 0, 0.3, -0.2);
  box(6.0, 5.6, 1.1, M.wall, S, 0, 3.4, -0.45);
  box(6.04, 0.6, 1.14, M.tile, S, 0, 0.9, -0.45);
  box(6.1, 0.1, 1.2, M.gold, S, 0, 6.24, -0.45);
  for (const s of [-1, 1]) {
    cyl(0.5, 0.55, 6.2, M.wall, S, s * 3.15, 3.7, -0.3, 24);
    cyl(0.56, 0.56, 0.6, M.tile, S, s * 3.15, 1.2, -0.3, 24);
    cyl(0.56, 0.56, 0.08, M.gold, S, s * 3.15, 6.8, -0.3, 24);
    mesh(new THREE.SphereGeometry(0.5, 24, 12, 0, TAU, 0, Math.PI / 2), M.lapis, S, s * 3.15, 6.84, -0.3).scale.y = 1.25;
    cyl(0.02, 0.05, 0.4, M.gold, S, s * 3.15, 7.65, -0.3, 8);
  }
  for (let i = -6; i <= 6; i++) box(0.26, 0.32, 0.3, M.wall, S, i * 0.44, 6.45, -0.05);
  // gate
  const gate = [new THREE.Vector2(-0.6, 0), new THREE.Vector2(-0.6, 0.8), ...archPoints(0.6, 0.3).map((p) => new THREE.Vector2(p.x, p.y + 0.8)), new THREE.Vector2(0.6, 0.8), new THREE.Vector2(0.6, 0)];
  mesh(new THREE.ShapeGeometry(new THREE.Shape(gate)), M.black, S, 0, 0.6, 0.106);
  mesh(new THREE.ExtrudeGeometry(archRingShape(0.6, 0.76, 0.3), { depth: 0.08, bevelEnabled: false }), archMat(1.6), S, 0, 1.4, 0.1);
  // musicians' balcony
  box(4.4, 0.12, 0.6, M.darkWood, S, 0, 2.38, 0.35);
  box(4.4, 0.04, 0.04, M.gold, S, 0, 2.62, 0.64);
  for (let i = -10; i <= 10; i++) cyl(0.012, 0.012, 0.18, M.gold, S, i * 0.21, 2.53, 0.64, 6);
  // lamps, doors, crescent track, zodiac
  const xs = Array.from({ length: 12 }, (_, i) => -2.2 + i * 0.4);
  const lamps = xs.map((x) => {
    const m = new THREE.MeshStandardMaterial({ color: 0x2a1a0c, emissive: 0xffb347, emissiveIntensity: 0, roughness: 0.3 });
    mesh(new THREE.CircleGeometry(0.1, 20), m, D, x, 3.3, 0.112);
    mesh(new THREE.TorusGeometry(0.1, 0.014, 6, 20), M.gold, S, x, 3.3, 0.112);
    return m;
  });
  box(4.95, 0.62, 0.02, M.black, S, 0, 3.9, 0.11);
  box(5.0, 0.04, 0.2, M.gold, S, 0, 3.58, 0.2);
  box(5.0, 0.04, 0.2, M.gold, S, 0, 4.22, 0.2);
  const doors = xs.map((x, i) => {
    const f = figure({ robe: M.gold, sash: M.lapis, turban: M.white, scale: 0.28 });
    f.group.position.set(x, 3.62, 0.17); f.armR.rotation.x = -1.4 + (i % 3) * 0.3; S.add(f.group);
    const pv = new THREE.Group(); pv.position.set(x - 0.17, 3.9, 0.27); D.add(pv);
    box(0.34, 0.52, 0.025, M.wood, pv, 0.17, 0, 0);
    sph(0.025, M.gold, pv, 0.17, 0, 0.015, 8);
    pv.userData.target = 0;
    return pv;
  });
  box(5.2, 0.03, 0.03, M.gold, S, 0, 4.3, 0.18);
  const crescent = mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 24, Math.PI * 1.25), M.gold, D, -2.6, 4.48, 0.2);
  crescent.rotation.z = -Math.PI * 1.125;
  const zodiac = mesh(new THREE.CircleGeometry(0.78, 64), M.zodiac, D, 0, 5.25, 0.115);
  mesh(new THREE.TorusGeometry(0.8, 0.045, 10, 64), M.gold, S, 0, 5.25, 0.12);
  mesh(new THREE.ConeGeometry(0.05, 0.12, 4), M.gold, S, 0, 6.1, 0.15).rotation.z = Math.PI;
  // falcons and vases
  const falcons = [-1, 1].map((s) => {
    box(0.34, 0.05, 0.4, M.darkWood, S, s * 2.75, 3.68, 0.25);
    box(0.34, 0.05, 0.4, M.darkWood, S, s * 2.75, 2.6, 0.25);
    lathe([[0, 0], [0.09, 0], [0.13, 0.1], [0.09, 0.24], [0.06, 0.3], [0.08, 0.34]], M.brass, S, s * 2.75, 2.62, 0.3, 18);
    const f = new THREE.Group(); f.position.set(s * 2.75, 3.7, 0.25); D.add(f);
    sph(0.11, M.bronze, f, 0, 0.12, 0, 14).scale.set(0.8, 1, 1.2);
    sph(0.07, M.bronze, f, 0, 0.26, 0.08, 12);
    mesh(new THREE.ConeGeometry(0.02, 0.07, 6), M.saffron, f, 0, 0.24, 0.16).rotation.x = Math.PI / 2 + 0.4;
    for (const w of [-1, 1]) box(0.03, 0.16, 0.22, M.bronze, f, w * 0.09, 0.13, -0.02);
    return f;
  });
  const ball = sph(0.05, M.gold, D, 0, -10, 0, 12); ball.visible = false;
  // musicians
  const kinds = ['trumpet', 'drum', 'cymbal', 'drum', 'trumpet'];
  const robes = [M.red, M.lapis, M.saffron, M.green, M.violet];
  const band = kinds.map((k, i) => {
    const f = figure({ robe: robes[i], turban: M.white, scale: 0.55 });
    f.group.position.set(-1.6 + i * 0.8, 2.44, 0.34); D.add(f.group);
    if (k === 'trumpet') {
      mesh(new THREE.ConeGeometry(0.05, 0.45, 12, 1, true).rotateX(-Math.PI / 2), M.gold, f.head, 0, -0.02, 0.28);
      f.armR.rotation.x = f.armL.rotation.x = -1.3;
      f.armR.rotation.z = -0.35; f.armL.rotation.z = 0.35;
    } else if (k === 'drum') {
      cyl(0.11, 0.11, 0.12, M.red, f.body, 0, 0.5, 0.18, 16).rotation.x = Math.PI / 2;
    } else {
      for (const arm of [f.armL, f.armR]) mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.01, 16).rotateZ(Math.PI / 2), M.gold, f.hand(arm));
    }
    return { f, k };
  });
  const hit = box(6.2, 6.4, 0.3, M.hit, D, 0, 3.2, 0.55);

  const H = 5;
  let clk = 0, hour = 0, dropStart = -99, playStart = -99, side = 0;
  const trigger = () => { clk = (Math.floor(clk / H) + 1) * H - 0.001; };
  ctx.addInteractable(hit, 'Castle Clock — advance one hour', trigger);
  return {
    trigger,
    update(t, dt) {
      clk += dt;
      const h = Math.floor(clk / H) % 13;
      if (h !== hour) {
        hour = h;
        if (h === 0) { doors.forEach((d) => (d.userData.target = 0)); ctx.sound.clack(pos, 0.5); }
        else {
          doors[h - 1].userData.target = -1.45;
          side = h % 2; dropStart = clk; playStart = clk + 1.0;
          ctx.sound.clack(pos, 0.5);
          ctx.sound.bell(pos, 523.25, 0.7, 0.75); ctx.sound.cymbal(pos, 0.35, 0.78);
          ctx.sound.trumpet(pos, 293.66, 0.45, 0.32, 1.1); ctx.sound.trumpet(pos, 440, 0.45, 0.28, 1.65); ctx.sound.trumpet(pos, 392, 0.8, 0.3, 2.2);
          for (let k = 0; k < 7; k++) ctx.sound.drum(pos, 0.7, k % 2 ? 1.25 : 0.85, 1.1 + k * 0.28);
          ctx.sound.cymbal(pos, 0.3, 3.1);
        }
      }
      doors.forEach((d) => { d.rotation.y += (d.userData.target - d.rotation.y) * Math.min(1, dt * 3); });
      lamps.forEach((m, i) => { const on = hour > i ? 2.6 + Math.sin(t * 6 + i) * 0.15 : 0; m.emissiveIntensity += (on - m.emissiveIntensity) * Math.min(1, dt * 3); });
      const cx = hour === 0 ? -2.6 : xs[hour - 1];
      crescent.position.x += (cx - crescent.position.x) * Math.min(1, dt * 2);
      zodiac.rotation.z = -clk * 0.02;
      const f = clk - dropStart;
      falcons.forEach((fa, i) => { fa.rotation.x = i === side && f < 1.4 ? 0.55 * Math.sin(Math.min(1, f / 1.4) * Math.PI) : 0; });
      if (f > 0.3 && f < 0.78) {
        const k = (f - 0.3) / 0.48, sx = side ? 2.75 : -2.75;
        ball.visible = true;
        ball.position.set(sx, lerp(3.95, 2.95, k * k), lerp(0.42, 0.3, k));
      } else ball.visible = false;
      const m = clk - playStart, playing = m > 0 && m < 2.4;
      band.forEach(({ f: fig, k }, i) => {
        if (k === 'trumpet') fig.head.rotation.x = playing ? -0.35 - Math.sin(m * 6 + i) * 0.05 : 0;
        else if (k === 'drum') { fig.armR.rotation.x = playing ? -0.9 - Math.max(0, Math.sin(m * 22)) * 0.7 : -0.4; fig.armL.rotation.x = playing ? -0.9 - Math.max(0, Math.sin(m * 22 + Math.PI)) * 0.7 : -0.4; }
        else { const c = playing ? Math.abs(Math.sin(m * 3)) : 0; fig.armL.rotation.set(-1.2, 0, 0.6 * c); fig.armR.rotation.set(-1.2, 0, -0.6 * c); }
      });
    },
  };
}

// =====================================================================================
export function buildExhibits(ctx) {
  const L = Math.PI / 2;
  const defs = [
    { key: 'elephant', fn: elephantClock, x: -5.5, z: -6, rot: L, scale: 1.15 },
    { key: 'boat', fn: musicalBoat, x: 5.5, z: -6, rot: -L },
    { key: 'peacock', fn: peacockBasin, x: -5.5, z: -18, rot: L, scale: 1.4 },
    { key: 'drink', fn: drinkServer, x: 5.5, z: -18, rot: -L, scale: 1.15 },
    { key: 'pump', fn: waterPump, x: -5.5, z: -30, rot: L, scale: 1.1 },
    { key: 'saqiya', fn: saqiya, x: 5.5, z: -30, rot: -L },
    { key: 'castle', fn: castleClock, x: 0, z: -46.8, rot: 0, noPed: true },
  ];
  const items = [], colliders = [], plaques = [];
  const target = new THREE.Object3D();
  for (const d of defs) {
    const info = INFO[d.key];
    const root = new THREE.Group(); root.position.set(d.x, 0, d.z); root.rotation.y = d.rot; ctx.scene.add(root);
    const h = d.noPed ? 0 : 0.45;
    if (!d.noPed) { const P = new THREE.Group(); root.add(P); pedestal(P); bake(P); colliders.push({ x: d.x, z: d.z, r: 2.25 }); }
    const S = new THREE.Group(), D = new THREE.Group();
    S.position.y = D.position.y = h;
    S.scale.setScalar(d.scale || 1); D.scale.setScalar(d.scale || 1);
    root.add(S, D);
    root.updateMatrixWorld(true);
    const pos = new THREE.Vector3(d.x, 1.6, d.z);
    const ex = d.fn(ctx, S, D, pos);
    bake(S); shadows(D);

    const spot = new THREE.SpotLight(0xffe2b8, d.noPed ? 130 : 70, 18, d.noPed ? 0.55 : 0.42, 0.75, 2);
    spot.position.set(d.noPed ? 0 : d.x * 0.55, 9.4, d.noPed ? -40 : d.z + 2);
    const tg = target.clone(); tg.position.set(d.x, d.noPed ? 3.2 : 1.4, d.z);
    spot.target = tg;
    ctx.scene.add(spot, tg);

    const side = Math.sign(d.x);
    const pl = d.noPed
      ? { x: 3.7, z: -42.4, rotY: -0.35 }
      : { x: side * 2.7, z: d.z + 3.6, rotY: -side * 0.45 };
    plaques.push(makePlaque(ctx, info, { ...pl, onActivate: ex.trigger, activateLabel: info.activate }));
    colliders.push({ x: pl.x, z: pl.z, r: 0.45 });
    items.push({ name: info.title, x: d.x, z: d.z, update: ex.update });
  }
  // welcome plaques near the entrance
  for (const [k, x, r] of [['intro', -3.2, 0.6], ['book', 3.2, -0.6]]) {
    plaques.push(makePlaque(ctx, INFO[k], { x, z: 3.6, rotY: r }));
    colliders.push({ x, z: 3.6, r: 0.45 });
  }
  return {
    items, colliders,
    update(t, dt) {
      for (const it of items) it.update(t, dt);
      for (const p of plaques) p.update(t);
    },
  };
}

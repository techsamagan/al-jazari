// Shared materials, modeling helpers and a static-geometry baker.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';

export const M = {};
export const animated = []; // { tex, speed: [u, v] } scrolled every frame

export function initMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  M.brass = std({ color: 0xc9a14f, metalness: 1, roughness: 0.3 });
  M.gold = std({ color: 0xf0c869, metalness: 1, roughness: 0.2 });
  M.copper = std({ color: 0xc0703f, metalness: 1, roughness: 0.33 });
  M.bronze = std({ color: 0x7d5a32, metalness: 0.9, roughness: 0.42 });
  M.iron = std({ color: 0x4a443e, metalness: 0.85, roughness: 0.5 });
  const wood = TX.tex(TX.woodCanvas());
  M.wood = std({ map: wood, color: 0xd0a070, roughness: 0.62 });
  M.woodDS = std({ map: wood, color: 0xd0a070, roughness: 0.62, side: THREE.DoubleSide });
  M.darkWood = std({ map: wood, color: 0x7a5032, roughness: 0.55 });
  M.ivory = std({ color: 0xefe4cc, roughness: 0.45 });
  M.lapis = std({ color: 0x1c3f8f, roughness: 0.22, metalness: 0.05 });
  M.turq = std({ color: 0x1fa3a0, roughness: 0.28 });
  M.red = std({ color: 0x9a2219, roughness: 0.85 });
  M.green = std({ color: 0x2e7a40, roughness: 0.4, metalness: 0.25 });
  M.skin = std({ color: 0xbf8a62, roughness: 0.6 });
  M.white = std({ color: 0xf2ece0, roughness: 0.8 });
  M.whiteDS = std({ color: 0xf2ece0, roughness: 0.8, side: THREE.DoubleSide });
  M.black = std({ color: 0x15110e, roughness: 0.5 });
  M.clay = std({ color: 0xa55b33, roughness: 0.8 });
  M.saffron = std({ color: 0xd08a1e, roughness: 0.7 });
  M.violet = std({ color: 0x5b2c6f, roughness: 0.75 });
  const skinBump = TX.tex(TX.rippleCanvas(), { color: false, repeat: [3, 3] });
  M.elephant = std({ color: 0x5f5955, roughness: 0.8, bumpMap: skinBump, bumpScale: 0.12 });
  M.elephantDS = std({ color: 0x5f5955, roughness: 0.85, side: THREE.DoubleSide });
  M.ox = std({ color: 0x6b4426, roughness: 0.78, bumpMap: skinBump, bumpScale: 0.08 });
  M.marble = std({ map: TX.tex(TX.marbleCanvas(512)), roughness: 0.22 });
  M.marbleDS = std({ map: TX.tex(TX.marbleCanvas(512)), roughness: 0.22, side: THREE.DoubleSide });
  M.darkStone = std({ map: TX.tex(TX.marbleCanvas(256, [60, 52, 48], [120, 110, 100], 2)), roughness: 0.3 });
  M.tile = std({ map: TX.tex(TX.starTileCanvas(), { repeat: [2, 1] }), roughness: 0.25 });
  M.wall = std({ map: TX.tex(TX.ashlarCanvas(), { repeat: [2, 2] }), roughness: 0.85 });
  M.peacock = new THREE.MeshPhysicalMaterial({
    color: 0x1a4fa8, metalness: 0.35, roughness: 0.28,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 700],
  });
  M.feather = std({ map: TX.tex(TX.featherCanvas(), { wrap: false }), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.25 });
  const ripple = TX.tex(TX.rippleCanvas(), { color: false, repeat: [2, 2] });
  animated.push({ tex: ripple, speed: [0.015, 0.01] });
  M.water = std({ color: 0x2c7486, transparent: true, opacity: 0.84, roughness: 0.05, metalness: 0.2, bumpMap: ripple, bumpScale: 1.5 });
  M.waterDark = std({ color: 0x0f2f38, roughness: 0.05, metalness: 0.3, bumpMap: ripple, bumpScale: 1.2 });
  const stream = TX.tex(TX.streamCanvas(), { repeat: [1, 2] });
  animated.push({ tex: stream, speed: [0, 1.6] });
  M.stream = std({ map: stream, color: 0xd8f2ff, transparent: true, opacity: 0.65, roughness: 0.05, emissive: 0x16404d, depthWrite: false });
  M.glass = new THREE.MeshPhysicalMaterial({ color: 0xcfe6e2, roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
  M.hit = new THREE.MeshBasicMaterial({ visible: false });
  M.zodiac = std({ map: TX.tex(TX.zodiacCanvas(), { wrap: false }), roughness: 0.35, metalness: 0.2, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 });
  M.archStripe = std({ map: TX.tex(TX.archStripeCanvas(), { repeat: [1 / 6.4, 1 / 6.4] }), roughness: 0.5 });
  M.archStripe.map.offset.set(0.5, 0);
}

export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
export const box = (w, h, d, mat, p, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, p, x, y, z);
export const cyl = (rt, rb, h, mat, p, x, y, z, seg = 20) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, p, x, y, z);
export const sph = (r, mat, p, x, y, z, seg = 20) => mesh(new THREE.SphereGeometry(r, seg, Math.max(8, (seg * 0.6) | 0)), mat, p, x, y, z);
export function tube(points, r, mat, p, seg = 24, rs = 10) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), seg, r, rs), mat, p);
}
export function lathe(profile, mat, p, x = 0, y = 0, z = 0, seg = 32) {
  return mesh(new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), seg), mat, p, x, y, z);
}
export function flat(geo) {
  const g = geo.toNonIndexed();
  g.computeVertexNormals();
  return g;
}
export function octo(r, h, mat, p, x, y, z) {
  return mesh(flat(new THREE.CylinderGeometry(r, r, h, 8)), mat, p, x, y, z);
}

// Pointed (two-centred) arch outline from (-a,0) to (a,0); arc centres at ±c.
export function archPoints(a, c, n = 20) {
  const r = a + c, th = Math.acos(c / r), pts = [];
  for (let i = 0; i <= n; i++) { const f = Math.PI - th * i / n; pts.push(new THREE.Vector2(c + r * Math.cos(f), r * Math.sin(f))); }
  for (let i = 1; i <= n; i++) { const f = th - th * i / n; pts.push(new THREE.Vector2(-c + r * Math.cos(f), r * Math.sin(f))); }
  return pts;
}
export function archRingShape(aIn, aOut, c) {
  const outer = archPoints(aOut, c), inner = archPoints(aIn, c).reverse();
  return new THREE.Shape([...outer, ...inner]);
}

// Places a unit-height cylinder (centered) between two points in its parent's space.
const _d = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
export function stretch(m, a, b) {
  _d.subVectors(b, a);
  const len = _d.length();
  m.position.copy(a).addScaledVector(_d, 0.5);
  if (len > 1e-5) m.quaternion.setFromUnitVectors(_up, _d.divideScalar(len));
  m.scale.set(1, Math.max(len, 1e-4), 1);
}
export function streamMesh(parent, r0 = 0.012, r1 = 0.02) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, 1, 10, 1, true), M.stream);
  m.visible = false;
  parent.add(m);
  return m;
}

// A turbaned figure facing +z. Arms pivot at the shoulder; rotation.x = -PI/2 raises an arm forward.
export function figure({ robe = M.red, sash = M.gold, turban = M.white, skin = M.skin, scale = 1, seated = false, beard = true } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  let torsoY;
  if (seated) {
    const legs = sph(0.2, robe, body, 0, 0.08, 0.05); legs.scale.set(1, 0.45, 0.85);
    torsoY = 0.16;
  } else {
    cyl(0.11, 0.21, 0.56, robe, body, 0, 0.28, 0, 16);
    torsoY = 0.54;
  }
  cyl(0.085, 0.112, 0.32, robe, body, 0, torsoY + 0.16, 0, 16);
  cyl(0.114, 0.114, 0.045, sash, body, 0, torsoY + 0.05, 0, 16);
  const head = new THREE.Group(); head.position.y = torsoY + 0.4; body.add(head);
  sph(0.075, skin, head, 0, 0, 0, 16);
  const tb = sph(0.088, turban, head, 0, 0.055, -0.005, 16); tb.scale.set(1, 0.78, 1);
  const tr = mesh(new THREE.TorusGeometry(0.072, 0.024, 8, 18), turban, head, 0, 0.025, 0); tr.rotation.x = Math.PI / 2;
  if (beard) { const b = sph(0.05, M.black, head, 0, -0.05, 0.035, 10); b.scale.set(1, 1.1, 0.7); }
  for (const s of [-1, 1]) sph(0.011, M.black, head, s * 0.028, 0.012, 0.066, 6);
  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.125, torsoY + 0.28, 0); body.add(a);
    cyl(0.032, 0.027, 0.27, robe, a, 0, -0.135, 0, 10);
    sph(0.03, skin, a, 0, -0.285, 0, 10);
    arms.push(a);
  }
  g.scale.setScalar(scale);
  return { group: g, body, head, armL: arms[0], armR: arms[1], hand: (arm) => { const o = new THREE.Object3D(); o.position.y = -0.29; arm.add(o); return o; } };
}

// Merge every mesh under `root` into one mesh per material (huge draw-call saving).
export function bake(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const buckets = new Map(), remove = [];
  root.traverse((o) => {
    if (!o.isMesh || o.material.transparent || o.userData.keep) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    g.morphAttributes = {};
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!buckets.has(o.material)) buckets.set(o.material, []);
    buckets.get(o.material).push(g);
    remove.push(o);
  });
  for (const o of remove) o.parent && o.parent.remove(o);
  for (const [mat, gs] of buckets) {
    const m = new THREE.Mesh(mergeGeometries(gs), mat);
    m.castShadow = m.receiveShadow = true;
    root.add(m);
  }
}

// Only reasonably large moving parts cast shadows; tiny ones would just add draw calls.
export function shadows(root) {
  root.traverse((o) => {
    if (!o.isMesh || o.material.transparent || !o.material.visible) return;
    o.receiveShadow = true;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const s = o.getWorldScale(new THREE.Vector3()).x;
    o.castShadow = o.geometry.boundingSphere.radius * s > 0.12;
  });
}

export const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (p, a, b) => ease((p - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;

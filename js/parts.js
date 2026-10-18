// Shared PBR materials, modeling helpers and a static-geometry baker.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as TX from './textures.js';
import { A, texSet } from './assets.js';

export const M = {};
export const animated = []; // { tex, speed: [u, v] } scrolled every frame

const V2 = (x, y = x) => new THREE.Vector2(x, y);

// Materials flagged with userData.uv get box-projected UVs (meters / uv) so photo textures keep
// a real-world scale whatever the size of the primitive they're on.
function uvm(m, metersPerTile) { m.userData.uv = metersPerTile; return m; }

export function initMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const phys = (o) => new THREE.MeshPhysicalMaterial(o);
  const ds = (m) => { const c = m.clone(); c.side = THREE.DoubleSide; c.userData = { ...m.userData }; return c; };

  // metals — brushed / worn via a scratched-plate roughness + normal map
  const mp = texSet('metal_plate');
  const metal = (color, rough, metalness = 1) => uvm(std({ color, metalness, roughness: rough, roughnessMap: mp.rough, normalMap: mp.nor, normalScale: V2(0.12) }), 0.5);
  M.brass = metal(0xb08d48, 0.6);
  M.gold = metal(0xd0aa5c, 0.42);
  M.copper = metal(0xb06842, 0.65);
  M.bronze = metal(0x6e5232, 0.85);
  M.iron = metal(0x45413d, 1.0, 0.85);
  M.brassDS = ds(M.brass); M.goldDS = ds(M.gold);

  // woods
  const mw = texSet('medieval_wood'), dw = texSet('dark_wood'), fw = texSet('fine_grained_wood');
  M.wood = uvm(std({ map: mw.diff, normalMap: mw.nor, roughnessMap: mw.rough }), 0.9);
  M.woodDS = ds(M.wood);
  M.darkWood = uvm(std({ map: dw.diff, normalMap: dw.nor, roughnessMap: dw.rough, color: 0xcfc2b4 }), 1.2);

  // painted wood (automaton figures, small parts)
  const paint = (color, rough = 0.62) => uvm(std({ color, roughness: rough, normalMap: fw.nor, normalScale: V2(0.35), roughnessMap: fw.rough }), 0.3);
  M.ivory = paint(0xd8cbaf, 0.45);
  M.lapis = paint(0x27406c, 0.5);
  M.turq = paint(0x2f6b67);
  M.red = paint(0x76291f);
  M.green = paint(0x34563a);
  M.skin = paint(0xb08064, 0.55);
  M.white = paint(0xd4ccbc);
  M.whiteDS = ds(M.white);
  M.black = paint(0x1c1815, 0.4);
  M.saffron = paint(0xa4742d);
  M.violet = paint(0x4b3356);

  const pl = texSet('plastered_wall_04');
  M.clay = uvm(std({ color: 0xa0613f, roughness: 0.92, normalMap: pl.nor, normalScale: V2(0.6) }), 0.4);

  // textiles — sheen gives the velvety falloff real cloth has
  const fab = texSet('quatrefoil_jacquard_fabric');
  M.cloth = uvm(phys({ color: 0x5e1a15, roughness: 0.85, sheen: 1, sheenColor: 0xa8503c, sheenRoughness: 0.45, normalMap: fab.nor, normalScale: V2(0.7) }), 0.22);
  M.clothBlue = uvm(phys({ color: 0x1d2a47, roughness: 0.85, sheen: 1, sheenColor: 0x56709a, sheenRoughness: 0.45, normalMap: fab.nor, normalScale: V2(0.7) }), 0.22);

  // hides
  const hide = TX.tex(TX.heightToNormal(TX.hideHeight(), 3), { color: false });
  M.elephant = uvm(std({ color: 0x6b645f, roughness: 0.8, normalMap: hide }), 0.7);
  M.elephantDS = ds(M.elephant);
  M.ox = uvm(std({ color: 0x5a3b26, roughness: 0.75, normalMap: hide, normalScale: V2(0.5) }), 0.5);

  // stone
  const mb = texSet('marble_01');
  M.marble = uvm(std({ map: mb.diff, normalMap: mb.nor, roughnessMap: mb.rough }), 1.4);
  M.marbleDS = ds(M.marble);
  M.darkStone = uvm(std({ map: mb.diff, normalMap: mb.nor, roughnessMap: mb.rough, color: 0x4d4642 }), 1.4);
  const ss = texSet('large_sandstone_blocks');
  M.wall = uvm(std({ map: ss.diff, normalMap: ss.nor, roughnessMap: ss.rough, aoMap: ss.ao }), 2.6);
  M.wallDS = ds(M.wall);

  // glazed tiles: painted pattern + grout normal map
  M.tile = uvm(std({
    map: TX.tex(TX.starTileCanvas()),
    normalMap: TX.tex(TX.heightToNormal(TX.starTileCanvas('height'), 6), { color: false }),
    roughness: 0.16,
  }), 0.75);

  M.peacock = new THREE.MeshPhysicalMaterial({
    color: 0x173f86, metalness: 0.3, roughness: 0.32,
    iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 700],
    sheen: 0.6, sheenColor: 0x2a8a7a,
  });
  M.feather = std({ map: TX.tex(TX.featherCanvas(), { wrap: false }), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.2 });

  // water
  const wn = A.waterNormals.clone(); wn.repeat.set(3, 3); wn.needsUpdate = true;
  animated.push({ tex: wn, speed: [0.018, 0.012] });
  M.water = phys({ color: 0x1b4650, roughness: 0.03, transparent: true, opacity: 0.9, normalMap: wn, normalScale: V2(0.35), ior: 1.33 });
  M.waterDark = phys({ color: 0x0a1f24, roughness: 0.04, normalMap: wn, normalScale: V2(0.3) });
  const stream = TX.tex(TX.streamCanvas(), { repeat: [1, 2] });
  animated.push({ tex: stream, speed: [0, 1.6] });
  M.stream = std({ map: stream, color: 0xd8f2ff, transparent: true, opacity: 0.55, roughness: 0.03, emissive: 0x0c2a33, depthWrite: false });
  M.glass = phys({ color: 0xffffff, roughness: 0.02, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
  M.glass.envMapIntensity = 2.5;
  M.hit = new THREE.MeshBasicMaterial({ visible: false });

  M.zodiac = std({ map: TX.tex(TX.zodiacCanvas(), { wrap: false }), roughness: 0.4, metalness: 0.35 });
  const ssA = texSet('large_sandstone_blocks', 0.4);
  M.archStripe = std({ map: TX.tex(TX.archStripeCanvas(), { repeat: [1 / 6.4, 1 / 6.4] }), normalMap: ssA.nor, roughnessMap: ssA.rough });
  M.archStripe.map.offset.set(0.5, 0);
}

export const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Box-projected UVs from object-space position and normal.
export function boxUV(geo, meters) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  if (!p || !n) return geo;
  const uv = new Float32Array(p.count * 2), k = 1 / meters;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az) { u = p.getZ(i); v = p.getY(i); }
    else if (ay >= az) { u = p.getX(i); v = p.getZ(i); }
    else { u = p.getX(i); v = p.getY(i); }
    uv[i * 2] = u * k; uv[i * 2 + 1] = v * k;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

export function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
  if (mat && mat.userData && mat.userData.uv && !geo.userData.boxUV) { boxUV(geo, mat.userData.uv); geo.userData.boxUV = true; }
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
export function box(w, h, d, mat, p, x, y, z) {
  const r = Math.min(0.02, Math.min(w, h, d) * 0.25);
  const geo = r < 0.003 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 2, r);
  return mesh(geo, mat, p, x, y, z);
}
export const cyl = (rt, rb, h, mat, p, x, y, z, seg = 24) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, p, x, y, z);
export const sph = (r, mat, p, x, y, z, seg = 24) => mesh(new THREE.SphereGeometry(r, seg, Math.max(10, (seg * 0.65) | 0)), mat, p, x, y, z);
export function tube(points, r, mat, p, seg = 24, rs = 12) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), seg, r, rs), mat, p);
}
export function lathe(profile, mat, p, x = 0, y = 0, z = 0, seg = 36) {
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
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, 1, 12, 1, true), M.stream);
  m.visible = false;
  parent.add(m);
  return m;
}

// A lathe-turned, painted-wood automaton figure facing +z, like a museum reconstruction.
// Arms pivot at the shoulder; rotation.x = -PI/2 raises an arm forward.
export function figure({ robe = M.red, sash = M.gold, turban = M.white, skin = M.skin, scale = 1, seated = false, beard = true } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  let torsoY;
  if (seated) {
    lathe([[0, 0], [0.2, 0], [0.215, 0.03], [0.2, 0.09], [0.15, 0.15], [0.1, 0.17], [0, 0.17]], robe, body, 0, 0, 0.03, 28).scale.set(1, 1, 0.85);
    torsoY = 0.15;
  } else {
    lathe([[0, 0], [0.2, 0], [0.212, 0.02], [0.19, 0.12], [0.15, 0.3], [0.118, 0.48], [0.108, 0.56], [0, 0.56]], robe, body, 0, 0, 0, 28);
    torsoY = 0.54;
  }
  lathe([[0, 0], [0.108, 0], [0.118, 0.08], [0.112, 0.2], [0.095, 0.29], [0.06, 0.335], [0.03, 0.35], [0, 0.35]], robe, body, 0, torsoY, 0, 28);
  mesh(new THREE.TorusGeometry(0.114, 0.016, 10, 28), sash, body, 0, torsoY + 0.06, 0).rotation.x = Math.PI / 2;
  cyl(0.028, 0.032, 0.06, skin, body, 0, torsoY + 0.36, 0, 12);
  const head = new THREE.Group(); head.position.y = torsoY + 0.43; body.add(head);
  sph(0.07, skin, head, 0, 0, 0, 24).scale.set(0.9, 1.06, 0.95);
  mesh(new THREE.ConeGeometry(0.012, 0.03, 8), skin, head, 0, -0.005, 0.072).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) {
    const e = sph(0.009, M.black, head, s * 0.025, 0.014, 0.058, 8); e.scale.set(1.3, 0.7, 0.5);
    const b = box(0.026, 0.005, 0.006, M.black, head, s * 0.026, 0.03, 0.06); b.rotation.z = -s * 0.15;
  }
  if (beard) { const b = sph(0.048, M.black, head, 0, -0.05, 0.028, 14); b.scale.set(0.95, 1.15, 0.7); }
  mesh(new THREE.TorusGeometry(0.068, 0.027, 12, 28), turban, head, 0, 0.035, -0.004).rotation.x = Math.PI / 2;
  const t2 = mesh(new THREE.TorusGeometry(0.058, 0.023, 12, 28), turban, head, 0, 0.062, -0.006); t2.rotation.set(Math.PI / 2 + 0.12, 0, 0);
  sph(0.06, turban, head, 0, 0.07, -0.006, 18).scale.set(1, 0.7, 1);
  sph(0.012, M.gold, head, 0, 0.066, 0.075, 8);
  const arms = [];
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * 0.122, torsoY + 0.28, 0); body.add(a);
    mesh(new THREE.CapsuleGeometry(0.03, 0.2, 4, 12), robe, a, 0, -0.13, 0);
    sph(0.027, skin, a, 0, -0.275, 0, 12).scale.set(0.9, 1.1, 0.8);
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
    if (!o.isMesh || o.material.transparent || o.userData.keep || Array.isArray(o.material)) return;
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
    o.castShadow = o.geometry.boundingSphere.radius * s > 0.1;
  });
}

export const ease = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
export const seg = (p, a, b) => ease((p - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;

// The museum hall: an arcaded sandstone nave in the style of 12th-century Jaziran architecture,
// lit by low sun through carved window screens plus museum spotlights.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { texSet, model } from './assets.js';
import { M, archPoints, archRingShape, mesh, box, cyl, sph, bake, boxUV } from './parts.js';

export const HALL = { X: 10, Z0: 10, Z1: -50, H: 10 };
export const SUN_DIR = new THREE.Vector3(-0.74, -0.56, -0.37).normalize();

export function buildHall(scene) {
  const { X, Z0, Z1, H } = HALL;
  const W = X * 2, L = Z0 - Z1, mid = (Z0 + Z1) / 2;
  const root = new THREE.Group(); scene.add(root);
  const S = new THREE.Group(); root.add(S); // static, gets baked
  const V2 = (x, y = x) => new THREE.Vector2(x, y);

  // ---------- floor: polished marble ----------
  const mf = texSet('marble_01', 1);
  for (const t of Object.values(mf)) t.repeat.set(W / 2.4, L / 2.4);
  const floorMat = new THREE.MeshStandardMaterial({ map: mf.diff, normalMap: mf.nor, roughnessMap: mf.rough, roughness: 0.55, normalScale: V2(0.6) });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, L), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, mid); floor.receiveShadow = true;
  root.add(floor);

  // carpet runner (a thin slab so its edge catches light)
  const runnerLen = 48;
  const fab = texSet('quatrefoil_jacquard_fabric', 1);
  fab.nor.repeat.set(10, 220);
  const carpetMat = new THREE.MeshPhysicalMaterial({
    map: TX.tex(TX.carpetCanvas(), { repeat: [1, runnerLen / 4.4] }),
    normalMap: fab.nor, normalScale: V2(0.8), roughness: 0.95, sheen: 1, sheenColor: 0x8a3a2c, sheenRoughness: 0.5,
  });
  const runner = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.014, runnerLen), carpetMat);
  runner.position.set(0, 0.007, 8.5 - runnerLen / 2); runner.receiveShadow = true;
  // box UVs: top face maps 0..1 across the full slab, which is what the carpet canvas expects
  root.add(runner);

  // ---------- outer walls with pointed-arch window openings ----------
  const winZ = [4, -8, -20, -32, -44];
  const winHalf = 0.8, sill = 3.6, spring = 5.5;
  const windowHole = (u) => new THREE.Path([
    new THREE.Vector2(u - winHalf, sill), new THREE.Vector2(u + winHalf, sill),
    ...archPoints(winHalf, 0.35).reverse().map((p) => new THREE.Vector2(u + p.x, p.y + spring)),
  ]);
  const wallThick = 0.7;
  for (const s of [-1, 1]) {
    // local x runs along the wall; s=-1: local x = world z, s=+1: local x = -world z
    const u0 = s < 0 ? Z1 : -Z0, u1 = s < 0 ? Z0 : -Z1;
    const shape = new THREE.Shape([V2(u0, 0), V2(u1, 0), V2(u1, H), V2(u0, H)]);
    for (const z of winZ) shape.holes.push(windowHole(s < 0 ? z : -z));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: wallThick, bevelEnabled: false, curveSegments: 16 });
    const w = mesh(geo, M.wall, root, s * X, 0, 0);
    w.rotation.y = s * Math.PI / 2;
    w.castShadow = w.receiveShadow = true;
  }
  for (const z of [Z1, Z0]) {
    const w = box(W + 2 * wallThick, H, wallThick, M.wall, root, 0, H / 2, z + (z < 0 ? -wallThick / 2 : wallThick / 2));
    w.castShadow = w.receiveShadow = true;
  }

  // carved lattice screens (cast patterned sunlight) + bright sky beyond
  const B = new THREE.Group(); root.add(B); // static props, baked at the end
  const SKY = new THREE.Group(); root.add(SKY); // must never cast shadows (it sits in the sun's path)
  const latticeMat = new THREE.MeshStandardMaterial({ map: TX.tex(TX.windowLatticeCanvas(), { wrap: false }), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 });
  const skyMat = new THREE.MeshBasicMaterial({ map: TX.tex(TX.skyCanvas(), { wrap: false }), fog: false });
  skyMat.color.setScalar(4.5);
  const winH = spring + Math.sqrt((winHalf + 0.35) ** 2 - 0.35 ** 2) - sill;
  const glows = [];
  for (const s of [-1, 1]) for (const z of winZ) {
    const lat = mesh(new THREE.PlaneGeometry(winHalf * 2, winH), latticeMat, B, s * (X + 0.35), sill + winH / 2, z);
    lat.rotation.y = -s * Math.PI / 2; lat.castShadow = true;
    const sky = mesh(new THREE.PlaneGeometry(3, 5), skyMat, SKY, s * (X + 2.5), sill + winH / 2, z);
    sky.rotation.y = -s * Math.PI / 2;
    box(winHalf * 2 + 0.3, 0.12, wallThick + 0.16, M.marble, S, s * (X + wallThick / 2), sill - 0.06, z).rotation.y = Math.PI / 2;
    glows.push(lat);
  }

  // ---------- skirting, dado tiles, cornice ----------
  for (const s of [-1, 1]) {
    const d = mesh(new THREE.PlaneGeometry(L, 1.3), M.tile, root, s * (X - 0.005), 0.8, mid);
    d.rotation.y = -s * Math.PI / 2; d.receiveShadow = true;
    box(0.06, 0.16, L, M.darkStone, S, s * (X - 0.03), 0.08, mid);
    box(0.08, 0.06, L, M.gold, S, s * (X - 0.03), 1.48, mid);
    box(0.3, 0.22, L, M.marble, S, s * (X - 0.15), H - 0.11, mid);
  }

  // ---------- ceiling: painted & gilded timber with beams ----------
  const ceilMask = TX.ceilingCanvas(true);
  const ceilMat = new THREE.MeshStandardMaterial({
    map: TX.tex(TX.ceilingCanvas(), { repeat: [W / 4, L / 4] }),
    metalnessMap: TX.tex(ceilMask, { color: false, repeat: [W / 4, L / 4] }),
    normalMap: TX.tex(TX.heightToNormal(ceilMask, 3), { color: false, repeat: [W / 4, L / 4] }),
    metalness: 1, roughness: 0.55,
  });
  const ceil = mesh(new THREE.PlaneGeometry(W, L), ceilMat, root, 0, H, mid);
  ceil.rotation.x = Math.PI / 2; ceil.castShadow = true;
  for (let z = 7; z >= -47; z -= 6) box(W, 0.35, 0.3, M.darkWood, S, 0, H - 0.175, z);

  // ---------- arcades (instanced) ----------
  const colX = 8.6, springA = 4.6;
  const colZ = []; for (let z = 7; z >= -47; z -= 6) colZ.push(z);
  const colGeo = boxUV(mergeGeometries([
    new THREE.BoxGeometry(0.9, 0.3, 0.9).translate(0, 0.15, 0),
    new THREE.CylinderGeometry(0.42, 0.46, 0.2, 28).translate(0, 0.4, 0),
    new THREE.TorusGeometry(0.35, 0.04, 8, 28).rotateX(Math.PI / 2).translate(0, 0.52, 0),
    new THREE.CylinderGeometry(0.3, 0.34, 3.6, 28).translate(0, 2.3, 0),
    new THREE.TorusGeometry(0.31, 0.035, 8, 28).rotateX(Math.PI / 2).translate(0, 4.1, 0),
    new THREE.CylinderGeometry(0.46, 0.3, 0.36, 28).translate(0, 4.28, 0),
    new THREE.BoxGeometry(0.95, 0.14, 0.95).translate(0, 4.53, 0),
  ].map((g) => g.index ? g.toNonIndexed() : g)), 1.4);
  const cols = new THREE.InstancedMesh(colGeo, M.marble, colZ.length * 2);
  const spanZ = colZ.slice(0, -1).map((z) => z - 3);
  const spandrelPts = [V2(-3, 0), ...archPoints(2.65, 1.2), V2(3, 0), V2(3, H - springA), V2(-3, H - springA)];
  const spGeo = boxUV(new THREE.ExtrudeGeometry(new THREE.Shape(spandrelPts), { depth: 0.5, bevelEnabled: false }).translate(0, 0, -0.25), 2.6).rotateY(Math.PI / 2);
  const spandrels = new THREE.InstancedMesh(spGeo, M.wall, spanZ.length * 2);
  const ringGeo = new THREE.ExtrudeGeometry(archRingShape(2.65, 2.97, 1.2), { depth: 0.58, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }).translate(0, 0, -0.29).rotateY(Math.PI / 2);
  const rings = new THREE.InstancedMesh(ringGeo, M.archStripe, spanZ.length * 2);
  const m4 = new THREE.Matrix4();
  let i = 0;
  for (const s of [-1, 1]) for (const z of colZ) cols.setMatrixAt(i++, m4.makeTranslation(s * colX, 0, z));
  i = 0;
  for (const s of [-1, 1]) for (const z of spanZ) {
    m4.makeTranslation(s * colX, springA, z);
    spandrels.setMatrixAt(i, m4); rings.setMatrixAt(i, m4); i++;
  }
  for (const im of [cols, spandrels, rings]) { im.castShadow = true; im.receiveShadow = true; root.add(im); }

  // gilded calligraphy frieze above the arcades
  const fMask = TX.friezeCanvas(true), rep = [54 / 7.7, 1];
  const frieze = new THREE.MeshStandardMaterial({
    map: TX.tex(TX.friezeCanvas(), { repeat: rep }),
    metalnessMap: TX.tex(fMask, { color: false, repeat: rep }),
    normalMap: TX.tex(TX.heightToNormal(fMask, 2.5), { color: false, repeat: rep }),
    metalness: 1, roughness: 0.45,
  });
  for (const s of [-1, 1]) {
    const f = mesh(new THREE.PlaneGeometry(54, 0.6), frieze, root, s * (colX - 0.27), 9.35, -20);
    f.rotation.y = -s * Math.PI / 2;
    box(0.1, 0.08, 54, M.gold, S, s * (colX - 0.3), 9.0, -20);
    box(0.1, 0.08, 54, M.gold, S, s * (colX - 0.3), 9.7, -20);
  }

  // ---------- volumetric hint: faint shafts along the sun direction ----------
  const shaftMat = new THREE.MeshBasicMaterial({ map: TX.tex(TX.shaftCanvas(), { wrap: false }), color: 0xffdcae, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const SH = new THREE.Group(); root.add(SH);
  for (const z of winZ) {
    const o = new THREE.Vector3(X + 0.3, sill + winH * 0.45, z), len = 8.5;
    const midP = o.clone().addScaledVector(SUN_DIR, len / 2);
    for (let k = 0; k < 2; k++) {
      const sh = mesh(new THREE.PlaneGeometry(1.5, len), shaftMat, SH, midP.x, midP.y, midP.z);
      sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), SUN_DIR);
      sh.rotateY(k * Math.PI / 2);
    }
  }

  // ---------- hanging brass lanterns (real light sources) ----------
  // Emissive core + soft halo instead of point lights: every extra light costs every pixel.
  const lanternGlow = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffa24a, emissiveIntensity: 6 });
  const haloMat = new THREE.SpriteMaterial({ map: TX.tex(TX.glowCanvas(), { wrap: false }), color: 0xffa860, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const z of [3, -9, -21, -33]) {
    const g = new THREE.Group(); g.position.set(0, 7.0, z); B.add(g);
    cyl(0.008, 0.008, H - 7.0, M.iron, g, 0, (H - 7.0) / 2, 0, 6);
    const lan = model('brass_diya_lantern', 0.9); lan.position.y = -0.9; g.add(lan);
    sph(0.06, lanternGlow, g, 0, -0.55, 0, 12);
    const halo = new THREE.Sprite(haloMat); halo.position.y = -0.55; halo.scale.setScalar(0.9); g.add(halo);
  }

  // ---------- museum benches & display vases ----------
  const colliders = [];
  for (const z of [-12, -24, -36]) {
    const b = model('painted_wooden_bench', 0.89); b.position.set(0, 0, z); b.rotation.y = Math.PI / 2; B.add(b);
    colliders.push({ x: 0, z, r: 0.75 });
  }
  for (const s of [-1, 1]) for (const z of [-2, -14, -26, -38]) {
    box(0.6, 0.9, 0.6, M.marble, S, s * 9.2, 0.45, z);
    const v = model('brass_vase_03', 0.85); v.position.set(s * 9.2, 0.9, z); B.add(v);
  }

  // ---------- entrance doorway ----------
  const door = mesh(new THREE.ShapeGeometry(new THREE.Shape([V2(-1.6, 0), ...archPoints(1.6, 0.7).map((p) => V2(p.x, p.y + 2.6)), V2(1.6, 0)])), new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 1 }), root, 0, 0, Z0 - 0.01);
  door.rotation.y = Math.PI;
  const dRing = mesh(new THREE.ExtrudeGeometry(archRingShape(1.6, 1.85, 0.7), { depth: 0.12, bevelEnabled: false }), M.archStripe, S, 0, 2.6, Z0 - 0.02);
  dRing.rotation.y = Math.PI;
  for (const s of [-1, 1]) box(0.25, 2.6, 0.12, M.marble, S, s * 1.72, 1.3, Z0 - 0.08);

  // ---------- banner ----------
  const bannerMat = new THREE.MeshPhysicalMaterial({ map: TX.tex(TX.bannerCanvas(), { wrap: false }), roughness: 0.85, side: THREE.DoubleSide, sheen: 1, sheenColor: 0x9a4a3a, normalMap: fab.nor.clone(), normalScale: V2(0.5) });
  bannerMat.normalMap.repeat.set(6, 2); bannerMat.normalMap.needsUpdate = true;
  const banner = mesh(new THREE.PlaneGeometry(6.4, 1.875, 32, 2), bannerMat, root, 0, 7.3, -2);
  banner.castShadow = true;
  cyl(0.04, 0.04, 6.8, M.gold, S, 0, 8.27, -2).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) cyl(0.008, 0.008, 1.73, M.brass, S, s * 3, 9.13, -2, 6);
  const bannerPos = banner.geometry.attributes.position, bannerBase = Float32Array.from(bannerPos.array);

  bake(S);
  bake(B);
  bake(SKY); SKY.children.forEach((m) => { m.castShadow = false; m.receiveShadow = false; });
  bake(SH, { transparent: true }); SH.children.forEach((m) => { m.castShadow = m.receiveShadow = false; m.renderOrder = 2; });

  // ---------- dust motes ----------
  const N = 500, dpos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    dpos[k * 3] = (Math.random() * 2 - 1) * 8.5;
    dpos[k * 3 + 1] = 0.3 + Math.random() * 8;
    dpos[k * 3 + 2] = Z1 + 4 + Math.random() * (L - 6);
    seeds[k] = Math.random() * 100;
  }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.012, map: TX.tex(TX.glowCanvas(), { wrap: false }), color: 0xfff0d0, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
  dust.frustumCulled = false;
  root.add(dust);

  // ---------- light ----------
  scene.add(new THREE.HemisphereLight(0xffeedd, 0x3a2a1c, 0.55));
  const sun = new THREE.DirectionalLight(0xffdcb0, 7.5);
  sun.target.position.set(0, 0, -20);
  sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, -45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -36, right: 36, top: 26, bottom: -26, near: 1, far: 100 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
  sun.shadow.autoUpdate = false; // main.js refreshes it a few times a second
  sun.shadow.needsUpdate = true;
  scene.add(sun, sun.target);

  return {
    floor, colliders, sun,
    bounds: { minX: -7.9, maxX: 7.9, minZ: -44.0, maxZ: 8.6 },
    update(t) {
      for (let k = 0; k < N; k++) {
        dpos[k * 3 + 1] += Math.sin(t * 0.3 + seeds[k]) * 0.0012;
        dpos[k * 3] += Math.cos(t * 0.2 + seeds[k] * 1.3) * 0.001;
      }
      dustGeo.attributes.position.needsUpdate = true;
      for (let k = 0; k < bannerPos.count; k++) {
        const x = bannerBase[k * 3], y = bannerBase[k * 3 + 1];
        bannerPos.array[k * 3 + 2] = bannerBase[k * 3 + 2] + Math.sin(x * 1.3 + t * 0.7) * 0.035 * (1 - (y + 0.94) / 1.9);
      }
      bannerPos.needsUpdate = true;
      lanternGlow.emissiveIntensity = 6 + Math.sin(t * 7) * 0.3 + Math.sin(t * 13.1) * 0.2;
    },
  };
}

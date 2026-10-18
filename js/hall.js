// The museum hall: an arcaded stone nave in the style of 12th-century Anatolian/Jaziran architecture.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as TX from './textures.js';
import { M, archPoints, archRingShape, mesh, box, cyl, sph, bake } from './parts.js';

export const HALL = { X: 10, Z0: 10, Z1: -50, H: 10 };

export function buildHall(scene) {
  const { X, Z0, Z1, H } = HALL;
  const W = X * 2, L = Z0 - Z1, mid = (Z0 + Z1) / 2;
  const root = new THREE.Group(); scene.add(root);
  const S = new THREE.Group(); root.add(S); // static, gets baked

  // ---------- floor ----------
  const floorMat = new THREE.MeshStandardMaterial({ map: TX.tex(TX.floorCanvas(), { repeat: [W / 4, L / 4] }), roughness: 0.2, envMapIntensity: 0.7 });
  const floor = mesh(new THREE.PlaneGeometry(W, L), floorMat, root, 0, 0, mid);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;

  const runnerLen = 50;
  const runner = mesh(new THREE.PlaneGeometry(2.2, runnerLen), new THREE.MeshStandardMaterial({ map: TX.tex(TX.carpetCanvas(), { repeat: [1, runnerLen / 4.4] }), roughness: 0.95 }), root, 0, 0.006, 9 - runnerLen / 2);
  runner.rotation.x = -Math.PI / 2; runner.receiveShadow = true;

  // ---------- walls ----------
  const ashlar = TX.ashlarCanvas();
  const wallMat = (rx, ry) => new THREE.MeshStandardMaterial({ map: TX.tex(ashlar, { repeat: [rx, ry] }), roughness: 0.9 });
  const sideMat = wallMat(L / 2, H / 2);
  for (const s of [-1, 1]) {
    const w = mesh(new THREE.PlaneGeometry(L, H), sideMat, root, s * X, H / 2, mid);
    w.rotation.y = -s * Math.PI / 2; w.receiveShadow = true;
  }
  const endMat = wallMat(W / 2, H / 2);
  const back = mesh(new THREE.PlaneGeometry(W, H), endMat, root, 0, H / 2, Z1);
  const front = mesh(new THREE.PlaneGeometry(W, H), endMat, root, 0, H / 2, Z0); front.rotation.y = Math.PI;
  back.receiveShadow = true;

  // tiled dado
  const tileTex = TX.starTileCanvas();
  const dadoSide = new THREE.MeshStandardMaterial({ map: TX.tex(tileTex, { repeat: [L / 1.4, 1] }), roughness: 0.25 });
  for (const s of [-1, 1]) {
    const d = mesh(new THREE.PlaneGeometry(L, 1.4), dadoSide, root, s * (X - 0.01), 0.7, mid);
    d.rotation.y = -s * Math.PI / 2;
  }
  const dadoEnd = new THREE.MeshStandardMaterial({ map: TX.tex(tileTex, { repeat: [W / 1.4, 1] }), roughness: 0.25 });
  mesh(new THREE.PlaneGeometry(W, 1.4), dadoEnd, root, 0, 0.7, Z1 + 0.01);
  mesh(new THREE.PlaneGeometry(W, 1.4), dadoEnd, root, 0, 0.7, Z0 - 0.01).rotation.y = Math.PI;

  // ---------- ceiling ----------
  const ceil = mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ map: TX.tex(TX.ceilingCanvas(), { repeat: [W / 4, L / 4] }), roughness: 0.6, metalness: 0.1 }), root, 0, H, mid);
  ceil.rotation.x = Math.PI / 2;

  // ---------- arcades (instanced) ----------
  const colX = 8.6, spring = 4.6;
  const colZ = []; for (let z = 7; z >= -47; z -= 6) colZ.push(z);
  const colGeo = mergeGeometries([
    new THREE.BoxGeometry(0.9, 0.3, 0.9).translate(0, 0.15, 0),
    new THREE.CylinderGeometry(0.42, 0.46, 0.2, 20).translate(0, 0.4, 0),
    new THREE.CylinderGeometry(0.3, 0.34, 3.6, 20).translate(0, 2.3, 0),
    new THREE.CylinderGeometry(0.46, 0.3, 0.36, 20).translate(0, 4.28, 0),
    new THREE.BoxGeometry(0.95, 0.14, 0.95).translate(0, 4.53, 0),
  ]);
  const cols = new THREE.InstancedMesh(colGeo, M.marble, colZ.length * 2);
  const spanZ = colZ.slice(0, -1).map((z) => z - 3);
  const spandrelPts = [new THREE.Vector2(-3, 0), ...archPoints(2.65, 1.2), new THREE.Vector2(3, 0), new THREE.Vector2(3, H - spring), new THREE.Vector2(-3, H - spring)];
  const spGeo = new THREE.ExtrudeGeometry(new THREE.Shape(spandrelPts), { depth: 0.5, bevelEnabled: false }).translate(0, 0, -0.25).rotateY(Math.PI / 2);
  const spandrelMat = new THREE.MeshStandardMaterial({ map: TX.tex(ashlar, { repeat: [0.5, 0.5] }), roughness: 0.9 });
  const spandrels = new THREE.InstancedMesh(spGeo, spandrelMat, spanZ.length * 2);
  const ringGeo = new THREE.ExtrudeGeometry(archRingShape(2.65, 2.97, 1.2), { depth: 0.58, bevelEnabled: false }).translate(0, 0, -0.29).rotateY(Math.PI / 2);
  const rings = new THREE.InstancedMesh(ringGeo, M.archStripe, spanZ.length * 2);
  const m4 = new THREE.Matrix4();
  let i = 0;
  for (const s of [-1, 1]) for (const z of colZ) cols.setMatrixAt(i++, m4.makeTranslation(s * colX, 0, z));
  i = 0;
  for (const s of [-1, 1]) for (const z of spanZ) {
    m4.makeTranslation(s * colX, spring, z);
    spandrels.setMatrixAt(i, m4); rings.setMatrixAt(i, m4); i++;
  }
  for (const im of [cols, spandrels, rings]) { im.castShadow = true; im.receiveShadow = true; root.add(im); }

  // calligraphy frieze above the arcades
  const frieze = new THREE.MeshStandardMaterial({ map: TX.tex(TX.friezeCanvas(), { repeat: [54 / 7.7, 1] }), roughness: 0.4, metalness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.08 });
  frieze.emissiveMap = frieze.map;
  for (const s of [-1, 1]) {
    const f = mesh(new THREE.PlaneGeometry(54, 0.6), frieze, root, s * (colX - 0.27), 9.35, -20);
    f.rotation.y = -s * Math.PI / 2;
  }
  // gold cornice
  for (const s of [-1, 1]) box(0.12, 0.1, 54, M.gold, S, s * (colX - 0.3), 9.0, -20);

  // ---------- windows + light shafts ----------
  const winMat = new THREE.MeshBasicMaterial({ map: TX.tex(TX.windowCanvas(), { wrap: false }), alphaTest: 0.5, side: THREE.DoubleSide });
  winMat.color.setScalar(2.4);
  const shaftMat = new THREE.MeshBasicMaterial({ map: TX.tex(TX.shaftCanvas(), { wrap: false }), color: 0xffd9a0, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const poolMat = new THREE.MeshBasicMaterial({ map: TX.tex(TX.glowCanvas(), { wrap: false }), color: 0xffcf90, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
  const sunDir = new THREE.Vector3(-0.58, -0.79, -0.21).normalize();
  const shafts = [];
  const winZ = [4, -8, -20, -32, -44];
  for (const s of [-1, 1]) for (const z of winZ) {
    const w = mesh(new THREE.PlaneGeometry(1.8, 3.6), winMat, root, s * (X - 0.02), 5.4, z);
    w.rotation.y = -s * Math.PI / 2;
    box(0.25, 0.15, 2.1, M.darkWood, S, s * (X - 0.1), 3.55, z);
    if (s > 0) {
      const len = 7.4, o = new THREE.Vector3(X - 0.1, 5.4, z);
      const midP = o.clone().addScaledVector(sunDir, len / 2);
      for (let k = 0; k < 2; k++) {
        const sh = mesh(new THREE.PlaneGeometry(1.7, len), shaftMat, root, midP.x, midP.y, midP.z);
        sh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), sunDir);
        sh.rotateY(k * Math.PI / 2);
        sh.renderOrder = 2;
        shafts.push(sh);
      }
      const hitP = o.clone().addScaledVector(sunDir, 5.4 / -sunDir.y);
      const pool = mesh(new THREE.PlaneGeometry(2.4, 3.6), poolMat, root, hitP.x, 0.015, hitP.z);
      pool.rotation.x = -Math.PI / 2; pool.rotation.z = 0.35;
    }
  }

  // ---------- lanterns ----------
  const latticeMat = new THREE.MeshStandardMaterial({ map: TX.tex(TX.latticeCanvas(), { repeat: [3, 2] }), color: 0xffffff, metalness: 1, roughness: 0.35, alphaTest: 0.5, side: THREE.DoubleSide });
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x221000, emissive: 0xffa040, emissiveIntensity: 3 });
  const haloMat = new THREE.SpriteMaterial({ map: TX.tex(TX.glowCanvas(), { wrap: false }), color: 0xffb060, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const lanterns = [];
  for (const z of [3, -9, -21, -33]) {
    const g = new THREE.Group(); g.position.set(0, 7.3, z); root.add(g);
    cyl(0.012, 0.012, H - 7.3 - 0.5, M.brass, g, 0, (H - 7.3) / 2 + 0.5, 0, 6);
    mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.55, 8, 1, true), latticeMat, g, 0, 0, 0);
    cyl(0.08, 0.2, 0.18, M.brass, g, 0, 0.36, 0, 8);
    cyl(0.27, 0.12, 0.12, M.brass, g, 0, -0.33, 0, 8);
    sph(0.05, M.gold, g, 0, -0.42, 0, 10);
    sph(0.11, coreMat, g, 0, 0, 0, 12);
    const halo = new THREE.Sprite(haloMat); halo.scale.setScalar(1.6); g.add(halo);
    lanterns.push(g);
  }

  // ---------- banner ----------
  const bannerMat = new THREE.MeshStandardMaterial({ map: TX.tex(TX.bannerCanvas(), { wrap: false }), roughness: 0.85, side: THREE.DoubleSide, emissive: 0xffffff, emissiveIntensity: 0.12 });
  bannerMat.emissiveMap = bannerMat.map;
  const banner = mesh(new THREE.PlaneGeometry(6.4, 1.875, 24, 1), bannerMat, root, 0, 7.3, -2);
  cyl(0.04, 0.04, 6.8, M.gold, S, 0, 8.27, -2).rotation.z = Math.PI / 2;
  for (const s of [-1, 1]) cyl(0.008, 0.008, 1.73, M.brass, S, s * 3, 9.13, -2, 6);
  const bannerPos = banner.geometry.attributes.position, bannerBase = Float32Array.from(bannerPos.array);

  // ---------- entrance arch ----------
  const door = mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-1.6, 0), ...archPoints(1.6, 0.7).map((p) => new THREE.Vector2(p.x, p.y + 2.6)), new THREE.Vector2(1.6, 0)])), M.black, root, 0, 0, Z0 - 0.03);
  door.rotation.y = Math.PI;
  const dRing = mesh(new THREE.ExtrudeGeometry(archRingShape(1.6, 1.85, 0.7), { depth: 0.12, bevelEnabled: false }), M.archStripe, S, 0, 2.6, Z0 - 0.1);
  dRing.rotation.y = Math.PI;
  for (const s of [-1, 1]) box(0.25, 2.6, 0.12, M.marble, S, s * 1.72, 1.3, Z0 - 0.06);

  bake(S);

  // ---------- dust motes ----------
  const N = 700, dpos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    dpos[k * 3] = (Math.random() * 2 - 1) * 8.5;
    dpos[k * 3 + 1] = 0.3 + Math.random() * 9;
    dpos[k * 3 + 2] = Z1 + 2 + Math.random() * (L - 4);
    seeds[k] = Math.random() * 100;
  }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.03, map: TX.tex(TX.glowCanvas(), { wrap: false }), color: 0xffe2b0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
  dust.frustumCulled = false;
  root.add(dust);

  // ---------- lights ----------
  scene.add(new THREE.HemisphereLight(0xfff0dc, 0x3a2716, 0.55));
  const sun = new THREE.DirectionalLight(0xffe2b8, 1.3);
  sun.position.set(8, 24, -12); sun.target.position.set(0, 0, -20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 36, bottom: -36, near: 1, far: 70 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  return {
    floor,
    bounds: { minX: -7.9, maxX: 7.9, minZ: -44.0, maxZ: 8.8 },
    update(t, dt) {
      for (let k = 0; k < N; k++) {
        dpos[k * 3 + 1] += Math.sin(t * 0.3 + seeds[k]) * 0.0015;
        dpos[k * 3] += Math.cos(t * 0.2 + seeds[k] * 1.3) * 0.0012;
      }
      dustGeo.attributes.position.needsUpdate = true;
      for (let k = 0; k < bannerPos.count; k++) {
        const x = bannerBase[k * 3], y = bannerBase[k * 3 + 1];
        bannerPos.array[k * 3 + 2] = bannerBase[k * 3 + 2] + Math.sin(x * 1.3 + t * 0.9) * 0.05 * (1 - (y + 0.94) / 1.9);
      }
      bannerPos.needsUpdate = true;
      for (let k = 0; k < shafts.length; k++) shafts[k].material.opacity = 0.14 + Math.sin(t * 0.4) * 0.025;
      coreMat.emissiveIntensity = 2.8 + Math.sin(t * 7) * 0.15 + Math.sin(t * 13.1) * 0.1;
    },
  };
}

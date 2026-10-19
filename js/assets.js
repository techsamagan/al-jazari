// Loads the CC0 Poly Haven assets (photographed PBR textures, scanned/modeled props, a museum HDRI).
// Fetch them once with:  python3 tools/fetch_assets.py
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const A = { tex: {}, models: {}, hdri: null, waterNormals: null };

const TEXTURES = {
  marble_01: ['diff', 'nor', 'rough'],
  large_sandstone_blocks: ['diff', 'nor', 'rough', 'ao'],
  dark_wood: ['diff', 'nor', 'rough'],
  medieval_wood: ['diff', 'nor', 'rough'],
  fine_grained_wood: ['diff', 'nor', 'rough'],
  quatrefoil_jacquard_fabric: ['nor'],
  metal_plate: ['nor', 'rough'],
  plastered_wall_04: ['nor'],
};
const MODELS = ['carved_wooden_elephant', 'brass_vase_03', 'brass_diya_lantern',
  'painted_wooden_bench', 'horse_statue_01'];

// Retry flaky network fetches a couple of times before giving up.
async function retry(fn, tries = 3) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) { if (i >= tries - 1) throw e; await new Promise((r) => setTimeout(r, 400 * (i + 1))); }
  }
}

export async function loadAssets(renderer, onProgress = () => {}) {
  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => onProgress(loaded / total);
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const tl = new THREE.TextureLoader(manager);
  const loadTex = (url, color) => retry(() => tl.loadAsync(url)).then((t) => {
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = aniso;
    return t;
  });

  const jobs = [];
  for (const [name, maps] of Object.entries(TEXTURES)) {
    A.tex[name] = {};
    for (const m of maps) jobs.push(loadTex(`assets/tex/${name}/${m}.jpg`, m === 'diff').then((t) => { A.tex[name][m] = t; }));
  }
  jobs.push(loadTex('assets/tex/waternormals.jpg', false).then((t) => { A.waterNormals = t; }));
  const gl = new GLTFLoader(manager);
  for (const name of MODELS) {
    jobs.push(retry(() => gl.loadAsync(`assets/models/${name}/${name}.gltf`)).then((g) => {
      g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
      A.models[name] = g.scene;
    }));
  }
  jobs.push(retry(() => new RGBELoader(manager).loadAsync('assets/hdri/museum.hdr')).then((t) => { A.hdri = t; }));
  await Promise.all(jobs);
  return A;
}

// A fresh copy of a texture set with its own repeat, so materials can tile independently.
export function texSet(name, repeat = 1) {
  const src = A.tex[name], out = {};
  for (const [k, t] of Object.entries(src)) {
    const c = t.clone();
    c.repeat.set(repeat, repeat);
    c.needsUpdate = true;
    out[k] = c;
  }
  return out;
}

// Clone a loaded model, scaled so its height equals `height` (meters), base on y=0, centered in x/z.
export function model(name, height) {
  const src = A.models[name];
  const m = src.clone(true);
  const box = new THREE.Box3().setFromObject(m);
  const size = box.getSize(new THREE.Vector3());
  const s = height / size.y;
  m.scale.setScalar(s);
  const c = box.getCenter(new THREE.Vector3());
  m.position.set(-c.x * s, -box.min.y * s, -c.z * s);
  const g = new THREE.Group(); g.add(m);
  return g;
}

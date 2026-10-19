import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { initMaterials, animated } from './parts.js';
import { loadAssets, A } from './assets.js';
import { createPost } from './post.js';
import { buildHall } from './hall.js';
import { buildExhibits } from './exhibits.js';
import { Controls } from './controls.js';
import { Sound } from './audio.js';

const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.info.autoReset = false; // count every pass of a frame, not just the last one
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.45;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0907);
scene.fog = new THREE.Fog(0x14100b, 35, 90);
const params = new URLSearchParams(location.search);
let post = null;

// ---------- quality tiers ----------
// high: full effects · medium: no ambient occlusion · low: no post-processing, static spot shadows off.
// The museum starts high on desktop (low on phones) and steps down by itself if the frame rate drops.
const TIERS = {
  high: { pr: 1.5, post: { ao: true, msaa: 4 }, spotShadows: true, sunEvery: 20, sunMap: 4096 },
  medium: { pr: 1.25, post: { ao: false, msaa: 2 }, spotShadows: true, sunEvery: 30, sunMap: 2048 },
  low: { pr: 1.0, post: null, spotShadows: false, sunEvery: 0, sunMap: 2048 },
};
const ORDER = ['high', 'medium', 'low'];
function guessTier() {
  if (isTouch) return 'low';
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    if (/Intel|SwiftShader|llvmpipe|Mali|Adreno/i.test(gpu)) return 'low';
    if (/Apple M\d(?! (Pro|Max|Ultra))/.test(gpu)) return 'medium'; // base M1/M2/M3: smooth without AO
  } catch (e) { /* unknown GPU: assume capable */ }
  return 'high';
}
let tier = params.get('q') || (params.get('fx') === '0' ? 'low' : guessTier());
if (!TIERS[tier]) tier = 'high';
let autoQuality = !params.get('q');

function applyTier(name) {
  tier = name;
  const T = TIERS[name];
  renderer.setPixelRatio(Math.min(devicePixelRatio, T.pr));
  renderer.setSize(innerWidth, innerHeight);
  if (post) { post.dispose(); post = null; }
  if (T.post) post = createPost(renderer, scene, camera, T.post);
  if (exhibits) for (const l of exhibits.spots) { l.castShadow = T.spotShadows; l.shadow.needsUpdate = true; }
  if (hall) {
    const sh = hall.sun.shadow;
    if (sh.mapSize.x !== T.sunMap) { sh.mapSize.set(T.sunMap, T.sunMap); if (sh.map) { sh.map.dispose(); sh.map = null; } }
    sh.needsUpdate = true;
  }
  if (!renderer.xr.isPresenting) renderer.xr.setFramebufferScaleFactor(name === 'low' ? 0.85 : 1);
  if (exhibits) warmUp(); // shadow on/off changes shader variants: compile them now, not mid-walk
}

let statsEl = null;
function toggleStats() {
  if (statsEl) { statsEl.remove(); statsEl = null; return; }
  statsEl = document.createElement('div');
  statsEl.style.cssText = 'position:fixed;left:8px;top:8px;z-index:20;font:12px/1.3 ui-monospace,monospace;color:#e8dcc0;background:rgba(0,0,0,.55);padding:5px 8px;border-radius:4px;pointer-events:none';
  document.body.appendChild(statsEl);
}
if (params.get('stats')) toggleStats();
addEventListener('keydown', (e) => {
  if (e.code === 'KeyF' && !e.repeat) toggleStats();
  if (e.code === 'KeyQ' && !e.repeat && exhibits) {
    autoQuality = false;
    applyTier(ORDER[(ORDER.indexOf(tier) + 1) % ORDER.length]);
    ctx.toast(`Quality: ${tier}`);
  }
});

const perf = { acc: 0, n: 0, fps: 60, ms: 16.7, settle: 0 };
function monitor(rawDt) {
  perf.acc += rawDt; perf.n++;
  if (perf.acc < 1) return;
  perf.fps = perf.n / perf.acc; perf.ms = 1000 * perf.acc / perf.n; perf.acc = 0; perf.n = 0;
  if (autoQuality && started && !renderer.xr.isPresenting && document.visibilityState === 'visible' && ++perf.settle > 3 && perf.fps < 45) {
    perf.settle = 0;
    const i = ORDER.indexOf(tier);
    if (i < ORDER.length - 1) { applyTier(ORDER[i + 1]); ctx.toast(`Quality lowered to ${tier} for smoother motion (Q to change)`); }
    else if (renderer.getPixelRatio() > 0.75) { renderer.setPixelRatio(Math.max(0.75, renderer.getPixelRatio() - 0.15)); renderer.setSize(innerWidth, innerHeight); }
  }
  if (statsEl) statsEl.textContent = `${perf.fps.toFixed(0)} fps · ${perf.ms.toFixed(1)} ms · ${renderer.info.render.calls} draws · ${(renderer.info.render.triangles / 1000).toFixed(0)}k tris · ${tier} @${renderer.getPixelRatio().toFixed(2)}x`;
}

// Shadows are refreshed on a schedule instead of every frame: the sun a few times a second,
// spotlights only near the visitor, one per frame in turn. Far exhibits keep their last shadow.
let frameN = 0;
const _head = new THREE.Vector3();
let spotTurn = 0;
function scheduleShadows() {
  frameN++;
  const T = TIERS[tier];
  if (T.sunEvery && frameN % T.sunEvery === 0) hall.sun.shadow.needsUpdate = true;
  if (!T.spotShadows) return;
  camera.getWorldPosition(_head);
  const spots = exhibits.spots;
  for (let n = 0; n < spots.length; n++) {         // next nearby spotlight in turn, exactly one per frame
    spotTurn = (spotTurn + 1) % spots.length;
    const t = spots[spotTurn].userData.target;
    if (Math.hypot(t.x - _head.x, t.z - _head.z) < 12) { spots[spotTurn].shadow.needsUpdate = true; break; }
  }
}

// Compile every shader and upload every texture up front, including things that are hidden
// until a machine runs (water streams, falling balls…), so nothing stalls the first time it appears.
function warmUp() {
  const hidden = [];
  scene.traverse((o) => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  renderer.compile(scene, camera);
  const seen = new Set();
  scene.traverse((o) => {
    if (!o.material) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      for (const v of Object.values(m)) if (v && v.isTexture && !seen.has(v)) { seen.add(v); renderer.initTexture(v); }
    }
  });
  for (const o of hidden) o.visible = false;
}

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 160);
camera.position.set(0, 1.6, 0);
const rig = new THREE.Group();
rig.position.set(0, 0, 7.5);
rig.add(camera);
scene.add(rig);

const sound = new Sound();
let hall, exhibits, controls;
let toastText = '', toastUntil = 0;

const ctx = {
  scene, sound,
  interactables: [],
  waterSpots: [],
  addInteractable(obj, label, fn, glow = null) {
    obj.userData.label = label;
    obj.userData.onSelect = fn;
    obj.userData.glow = glow;
    this.interactables.push(obj);
  },
  toast(msg) { toastText = msg; toastUntil = performance.now() + 2200; },
};

async function init() {
  const btn = $('enter');
  await loadAssets(renderer, (p) => { btn.textContent = `Loading the collection… ${Math.round(p * 100)}%`; });
  btn.textContent = 'Building the hall…';
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(A.hdri).texture;
  A.hdri.dispose(); pmrem.dispose();
  const fonts = ['700 64px Cinzel', '400 34px "EB Garamond"', 'italic 34px "EB Garamond"', '700 60px Amiri'];
  await Promise.race([
    Promise.all(fonts.map((f) => document.fonts.load(f, f.includes('Amiri') ? 'الجزري' : 'Aa'))).catch(() => {}),
    new Promise((r) => setTimeout(r, 4000)),
  ]);
  initMaterials();
  hall = buildHall(scene);
  exhibits = buildExhibits(ctx);
  controls = new Controls({
    renderer, camera, rig, scene, isTouch,
    floor: hall.floor,
    interactables: ctx.interactables,
    colliders: [...exhibits.colliders, ...hall.colliders],
    bounds: hall.bounds,
  });
  controls.onLockChange = (locked) => {
    $('reticle').style.display = locked ? 'block' : 'none';
    $('hint').style.display = !locked && started && !renderer.xr.isPresenting ? 'block' : 'none';
  };
  // the HDRI is a bright gallery; keep it as subtle bounce light + reflections
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return;
    const m = o.material;
    if (m.userData.envSet) return;
    m.userData.envSet = true;
    m.envMapIntensity = (m.envMapIntensity !== 1 ? m.envMapIntensity : 1) * (m.metalness > 0.5 ? 0.7 : 0.32);
  });
  applyTier(tier);
  warmUp();
  btn.disabled = false;
  btn.textContent = 'Enter the Museum';
  btn.addEventListener('click', start);
  renderer.setAnimationLoop(loop);
  window.__museum = { scene, camera, rig, renderer, ctx, controls };
  // ?cam=x,z,yawDeg,pitchDeg — jump to a viewpoint (handy for screenshots / sharing a spot)
  const cam = new URLSearchParams(location.search).get('cam');
  if (cam) {
    const [x, z, yaw = 0, pitch = 0] = cam.split(',').map(Number);
    rig.position.set(x, 0, z);
    controls.yaw = yaw * Math.PI / 180; controls.pitch = pitch * Math.PI / 180;
    $('intro').classList.add('hidden');
    controls.enabled = true; started = true;
    const wake = () => { sound.start(); removeEventListener('pointerdown', wake); removeEventListener('keydown', wake); };
    addEventListener('pointerdown', wake); addEventListener('keydown', wake);
  }
}

let started = false;
function start() {
  if (started) return;
  started = true;
  $('intro').classList.add('hidden');
  sound.start();
  controls.enabled = true;
  if (!isTouch && !renderer.xr.isPresenting) controls.lock();
  if (isTouch) { $('hint').textContent = 'Left: walk · Right: look · Tap a button'; $('hint').style.display = 'block'; setTimeout(() => ($('hint').style.display = 'none'), 5000); }
}

// ---------- VR ----------
if (navigator.xr) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    if (ok) document.body.appendChild(VRButton.createButton(renderer));
  }).catch(() => {});
}
renderer.xr.addEventListener('sessionstart', () => {
  start();
  for (const l of exhibits.spots) l.castShadow = false; // keep the headset at frame rate
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  $('hint').style.display = 'none';
});
renderer.xr.addEventListener('sessionend', () => {
  for (const l of exhibits.spots) l.castShadow = true;
  renderer.shadowMap.autoUpdate = true;
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (post) post.setSize(innerWidth, innerHeight);
});

// ---------- loop ----------
const clock = new THREE.Clock();
const head = new THREE.Vector3();
let lastLabel = '', lastCursor = '';
function loop() {
  const raw = clock.getDelta(), dt = Math.min(raw, 0.05), t = clock.elapsedTime;
  renderer.info.reset();
  monitor(raw);
  if (!renderer.xr.isPresenting) scheduleShadows();
  controls.update(dt);
  hall.update(t, dt);
  exhibits.update(t, dt);
  for (const a of animated) { a.tex.offset.x += a.speed[0] * dt; a.tex.offset.y += a.speed[1] * dt; }

  camera.getWorldPosition(head);
  sound.setListener(camera);
  let wd = 99;
  for (const p of ctx.waterSpots) wd = Math.min(wd, Math.hypot(p.x - head.x, p.z - head.z));
  sound.setWater(0.09 * Math.max(0, 1 - wd / 9));

  const hov = controls.hovered;
  for (const o of ctx.interactables) {
    const g = o.userData.glow;
    if (g) g.emissiveIntensity = o === hov ? 2.5 : g.userData.pulse ? 0.6 + Math.sin(t * 2.5) * 0.25 : 0;
  }
  $('reticle').classList.toggle('active', !!hov);
  const cur = !isTouch && hov && !controls.locked ? 'pointer' : '';
  if (cur !== lastCursor) { lastCursor = cur; renderer.domElement.style.cursor = cur; }

  let label = '';
  if (performance.now() < toastUntil) label = toastText;
  else if (hov) label = hov.userData.label;
  else {
    let best = 4.8;
    for (const it of exhibits.items) { const d = Math.hypot(it.x - head.x, it.z - head.z); if (d < best) { best = d; label = it.name; } }
  }
  if (label !== lastLabel) { lastLabel = label; const el = $('label'); el.textContent = label; el.classList.toggle('on', !!label); }

  if (post && !renderer.xr.isPresenting) post.render(dt);
  else renderer.render(scene, camera);
}

init().catch((e) => {
  const btn = $('enter');
  btn.textContent = 'Could not load the collection — check that assets/ exists (python3 tools/fetch_assets.py) and reload';
  btn.style.fontSize = '13px';
});

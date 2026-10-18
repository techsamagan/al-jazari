import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { initMaterials, animated } from './parts.js';
import { buildHall } from './hall.js';
import { buildExhibits } from './exhibits.js';
import { Controls } from './controls.js';
import { Sound } from './audio.js';

const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches;

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a120b);
scene.fog = new THREE.Fog(0x1f150c, 30, 80);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

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
    colliders: exhibits.colliders,
    bounds: hall.bounds,
  });
  controls.onLockChange = (locked) => {
    $('reticle').style.display = locked ? 'block' : 'none';
    $('hint').style.display = !locked && started && !renderer.xr.isPresenting ? 'block' : 'none';
  };
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return;
    o.material.envMapIntensity = o.material.metalness > 0.5 ? 1.0 : 0.45;
  });
  renderer.compile(scene, camera);
  const btn = $('enter');
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
    setTimeout(() => console.log('stats calls', renderer.info.render.calls, 'tris', renderer.info.render.triangles), 3000);
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
  if (isTouch) { $('hint').textContent = 'Left: walk · Right: look · Tap a gem'; $('hint').style.display = 'block'; setTimeout(() => ($('hint').style.display = 'none'), 5000); }
}

// ---------- VR ----------
if (navigator.xr) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    if (ok) document.body.appendChild(VRButton.createButton(renderer));
  }).catch(() => {});
}
renderer.xr.addEventListener('sessionstart', () => {
  start();
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  $('hint').style.display = 'none';
});
renderer.xr.addEventListener('sessionend', () => { renderer.shadowMap.autoUpdate = true; });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---------- loop ----------
const clock = new THREE.Clock();
const head = new THREE.Vector3();
let lastLabel = '';
function loop() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
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
    if (g) g.emissiveIntensity = o === hov ? 2.5 : g.userData.pulse ? 0.9 + Math.sin(t * 3) * 0.35 : 0;
  }
  $('reticle').classList.toggle('active', !!hov);

  let label = '';
  if (performance.now() < toastUntil) label = toastText;
  else if (hov) label = hov.userData.label;
  else {
    let best = 4.8;
    for (const it of exhibits.items) { const d = Math.hypot(it.x - head.x, it.z - head.z); if (d < best) { best = d; label = it.name; } }
  }
  if (label !== lastLabel) { lastLabel = label; const el = $('label'); el.textContent = label; el.classList.toggle('on', !!label); }

  renderer.render(scene, camera);
}

init();

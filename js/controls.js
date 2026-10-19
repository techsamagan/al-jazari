// Desktop (pointer lock + WASD), touch (virtual stick + drag look) and WebXR (teleport, smooth move, snap turn).
import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _q = new THREE.Quaternion();
const _center = new THREE.Vector2(0, 0), _tap = new THREE.Vector2(), _hits = [];  // reused every frame: no garbage, no GC pauses
const clamp = THREE.MathUtils.clamp;

export class Controls {
  constructor({ renderer, camera, rig, scene, floor, interactables, colliders, bounds, isTouch }) {
    Object.assign(this, { renderer, camera, rig, scene, floor, interactables, colliders, bounds, isTouch });
    this.dom = renderer.domElement;
    this.keys = {};
    this.yaw = 0; this.pitch = 0;
    this.locked = false; this.enabled = false;
    this.move = new THREE.Vector2();
    this.vel = new THREE.Vector3();
    this.raycaster = new THREE.Raycaster();
    this.hovered = null;
    this.onLockChange = null;
    this.setupDesktop();
    if (isTouch) this.setupTouch();
    this.setupXR();
  }

  // ---------- desktop ----------
  setupDesktop() {
    addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if ((e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') && this.enabled && !e.repeat) this.select(this.hovered);
    });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      this.onLockChange && this.onLockChange(this.locked);
    });
    this.mouse = null; // cursor position (NDC) while the mouse is not captured
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled || this.isTouch) return;
      if (this.locked) { this.look(e.movementX * 0.0022, e.movementY * 0.0022); return; }
      if (e.buttons === 1) { this.look(e.movementX * 0.0022, e.movementY * 0.0022); this.dragged = true; }
      (this.mouse ||= new THREE.Vector2()).set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    });
    this.dom.addEventListener('mousedown', () => { this.dragged = false; });
    this.dom.addEventListener('click', () => {
      if (!this.enabled || this.isTouch || this.renderer.xr.isPresenting) return;
      if (this.locked) { this.select(this.hovered); return; }
      // not captured: a click on a button / peg / machine presses it directly; elsewhere it captures the mouse
      if (this.hovered) { this.select(this.hovered); return; }
      if (!this.dragged) this.lock();
    });
  }
  lock() {
    try { const p = this.dom.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* drag-to-look still works */ }
  }
  look(dx, dy) {
    this.yaw -= dx;
    this.pitch = clamp(this.pitch - dy, -1.35, 1.35);
  }

  // ---------- touch ----------
  setupTouch() {
    const stick = document.getElementById('stick'), knob = document.getElementById('knob');
    const touches = new Map();
    this.dom.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      for (const t of e.changedTouches) {
        const left = t.clientX < innerWidth * 0.4;
        touches.set(t.identifier, { x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY, left, time: performance.now(), moved: false });
        if (left) { stick.style.display = 'block'; stick.style.left = t.clientX + 'px'; stick.style.top = t.clientY + 'px'; knob.style.transform = ''; }
      }
      e.preventDefault();
    }, { passive: false });
    this.dom.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        const s = touches.get(t.identifier); if (!s) continue;
        if (Math.hypot(t.clientX - s.x0, t.clientY - s.y0) > 10) s.moved = true;
        if (s.left) {
          const dx = clamp((t.clientX - s.x0) / 55, -1, 1), dy = clamp((t.clientY - s.y0) / 55, -1, 1);
          this.move.set(dx, dy);
          knob.style.transform = `translate(${dx * 33}px, ${dy * 33}px)`;
        } else {
          this.look((t.clientX - s.x) * 0.005, (t.clientY - s.y) * 0.005);
        }
        s.x = t.clientX; s.y = t.clientY;
      }
      e.preventDefault();
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) {
        const s = touches.get(t.identifier); if (!s) continue;
        if (s.left) { this.move.set(0, 0); stick.style.display = 'none'; }
        else if (!s.moved && performance.now() - s.time < 350) this.tapSelect(t.clientX, t.clientY);
        touches.delete(t.identifier);
      }
    };
    this.dom.addEventListener('touchend', end);
    this.dom.addEventListener('touchcancel', end);
  }
  tapSelect(x, y) {
    this.raycaster.setFromCamera(_tap.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1), this.camera);
    const hit = this.raycaster.intersectObjects(this.interactables, false)[0];
    if (hit && hit.distance < 9) this.select(hit.object);
  }

  // ---------- XR ----------
  setupXR() {
    const r = this.renderer, factory = new XRControllerModelFactory();
    this.ctrls = [];
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    for (let i = 0; i < 2; i++) {
      const c = r.xr.getController(i), grip = r.xr.getControllerGrip(i);
      grip.add(factory.createControllerModel(grip));
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85 }));
      line.scale.z = 5; c.add(line);
      const st = { c, grip, line, hit: null, floorPoint: null, handedness: null, gamepad: null, turnLatch: false, selecting: false };
      c.addEventListener('connected', (e) => { st.handedness = e.data.handedness; st.gamepad = e.data.gamepad; line.visible = e.data.targetRayMode === 'tracked-pointer'; });
      c.addEventListener('disconnected', () => { st.gamepad = null; });
      c.addEventListener('selectstart', () => { st.selecting = true; });
      c.addEventListener('selectend', () => {
        st.selecting = false;
        if (st.hit) this.select(st.hit);
        else if (st.floorPoint) this.teleport(st.floorPoint);
      });
      this.rig.add(c, grip);
      this.ctrls.push(st);
    }
    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5fd3c8, transparent: true, opacity: 0.85 }));
    this.marker.visible = false;
    this.scene.add(this.marker);
    r.xr.addEventListener('sessionstart', () => { this.pitch = 0; this.camera.rotation.set(0, 0, 0); });
    r.xr.addEventListener('sessionend', () => { this.camera.position.set(0, 1.6, 0); this.marker.visible = false; });
  }

  teleport(p) {
    this.camera.getWorldPosition(_v);
    this.rig.position.x += p.x - _v.x;
    this.rig.position.z += p.z - _v.z;
    this.constrain();
  }

  snapTurn(angle) {
    this.camera.getWorldPosition(_v);
    this.yaw += angle;
    this.rig.rotation.y = this.yaw;
    this.rig.updateMatrixWorld(true);
    this.camera.getWorldPosition(_v2);
    this.rig.position.x += _v.x - _v2.x;
    this.rig.position.z += _v.z - _v2.z;
  }

  updateXR(dt) {
    let hovered = null, marker = null;
    for (const s of this.ctrls) {
      if (!s.gamepad && !s.c.visible) continue;
      _m.identity().extractRotation(s.c.matrixWorld);
      this.raycaster.ray.origin.setFromMatrixPosition(s.c.matrixWorld);
      this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(_m);
      s.hit = null; s.floorPoint = null;
      let len = 6;
      _hits.length = 0;
      const hit = this.raycaster.intersectObjects(this.interactables, false, _hits)[0];
      if (hit && hit.distance < 10) { s.hit = hit.object; len = hit.distance; hovered = hovered || hit.object; }
      else {
        _hits.length = 0;
        const fh = this.raycaster.intersectObject(this.floor, false, _hits)[0];
        if (fh && fh.distance < 16) { s.floorPoint = fh.point.clone(); len = fh.distance; if (s.selecting) marker = s.floorPoint; }
      }
      s.line.scale.z = len;
      const gp = s.gamepad;
      if (gp && gp.axes.length >= 4) {
        const ax = gp.axes[2], ay = gp.axes[3];
        if (s.handedness === 'left') {
          if (Math.abs(ax) > 0.15 || Math.abs(ay) > 0.15) {
            this.camera.getWorldQuaternion(_q);
            const fwd = _v.set(0, 0, -1).applyQuaternion(_q); fwd.y = 0; fwd.normalize();
            const right = _v2.set(-fwd.z, 0, fwd.x);
            const sp = 2.0 * dt;
            this.rig.position.addScaledVector(fwd, -ay * sp).addScaledVector(right, ax * sp);
          }
        } else {
          if (!s.turnLatch && Math.abs(ax) > 0.7) { s.turnLatch = true; this.snapTurn(-Math.sign(ax) * Math.PI / 6); }
          if (Math.abs(ax) < 0.3) s.turnLatch = false;
        }
      }
    }
    this.marker.visible = !!marker;
    if (marker) this.marker.position.set(marker.x, 0.02, marker.z);
    this.hovered = hovered;
  }

  // ---------- shared ----------
  select(obj) { if (obj && obj.userData.onSelect) obj.userData.onSelect(); }

  constrain() {
    this.camera.getWorldPosition(_v);
    const x0 = _v.x, z0 = _v.z, b = this.bounds;
    let x = clamp(x0, b.minX, b.maxX), z = clamp(z0, b.minZ, b.maxZ);
    for (const c of this.colliders) {
      const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), r = c.r + 0.3;
      if (d < r && d > 1e-4) { x = c.x + dx / d * r; z = c.z + dz / d * r; }
    }
    this.rig.position.x += x - x0;
    this.rig.position.z += z - z0;
  }

  update(dt) {
    if (this.renderer.xr.isPresenting) { this.updateXR(dt); this.constrain(); return; }
    this.rig.rotation.y = this.yaw;
    this.camera.rotation.set(this.pitch, 0, 0);
    let f = 0, s = 0;
    if (this.enabled) {
      const k = this.keys;
      if (k.KeyW || k.ArrowUp) f += 1;
      if (k.KeyS || k.ArrowDown) f -= 1;
      if (k.KeyA || k.ArrowLeft) s -= 1;
      if (k.KeyD || k.ArrowRight) s += 1;
      f -= this.move.y; s += this.move.x;
    }
    const len = Math.hypot(f, s);
    if (len > 1) { f /= len; s /= len; }
    const speed = this.keys.ShiftLeft || this.keys.ShiftRight ? 4.4 : 2.3;
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    _v.set((-sy * f + cy * s) * speed, 0, (-cy * f - sy * s) * speed);
    this.vel.lerp(_v, 1 - Math.exp(-dt * 10));
    this.rig.position.addScaledVector(this.vel, dt);
    const moving = this.vel.length();
    this.camera.position.y = 1.6 + Math.sin(performance.now() * 0.009) * 0.012 * Math.min(1, moving / 2);
    this.constrain();
    // hover test every other frame is plenty for a cursor and halves the raycasting work
    if (!this.isTouch && (this._frame = (this._frame | 0) + 1) % 2 === 0) {
      this.raycaster.setFromCamera(this.locked || !this.mouse ? _center : this.mouse, this.camera);
      _hits.length = 0;
      const hit = this.raycaster.intersectObjects(this.interactables, false, _hits)[0];
      this.hovered = hit && hit.distance < 9 ? hit.object : null;
    }
  }
}

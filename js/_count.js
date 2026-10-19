// debug helper (?count=1): logs visible mesh counts per scene root once the museum is built
const wait = setInterval(() => {
  if (!window.__museum) return;
  clearInterval(wait);
  const { scene } = window.__museum; const out = {};
  scene.children.forEach((c, i) => { let n = 0; c.traverse((o) => { if ((o.isMesh || o.isPoints || o.isSprite) && o.material && o.material.visible !== false) n++; }); if (n) out[i + ':' + c.type + ':' + (c.name || c.children.length)] = n; });
  let total = 0; for (const v of Object.values(out)) total += v;
  console.log('MESHCOUNT total ' + total + ' ' + JSON.stringify(out));
}, 200);

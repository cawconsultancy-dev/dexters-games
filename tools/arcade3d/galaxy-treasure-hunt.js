/* Galaxy Treasure Hunt 3D: the star map is a 3D solar system you can see the rocket parked in,
   and "Fly" launches the rocket across space to the next world before the mission starts.
   The missions themselves are unchanged. */
(function () {
  if (!window.THREE) return;
  const cvs = document.createElement('canvas'); let R;
  try { R = new THREE.WebGLRenderer({ canvas: cvs, antialias: true }); } catch (e) { return; }
  const T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  R.outputEncoding = T.sRGBEncoding; R.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  cvs.style.cssText = 'display:block;width:100%;height:100%;border-radius:20px';
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(45, 1, 0.1, 800);
  const srgb = t => { t.encoding = T.sRGBEncoding; return t; };
  scene.background = srgb(new T.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#04061a'); gr.addColorStop(1, '#1a1048'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); return c; })()));
  scene.add(new T.AmbientLight(0x8890c0, 0.55));
  const sunLight = new T.PointLight(0xfff0d0, 2.2, 0, 1.2); scene.add(sunLight);
  // stars all round
  (function () { const n = 1500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = 300; pos[i * 3] = Math.cos(a) * s * r; pos[i * 3 + 1] = u * r; pos[i * 3 + 2] = Math.sin(a) * s * r; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); scene.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.3 }))); })();

  const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7 }, o || {}));
  function bandTex(cols, n) { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(0, i * 128 / n, 64, 128 / n + 1); } return srgb(new T.CanvasTexture(c)); }
  function spotTex(base, spots) { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 128); spots.forEach(([col, n, r]) => { g.fillStyle = col; for (let i = 0; i < n; i++) { g.beginPath(); g.ellipse(Math.random() * 256, 10 + Math.random() * 108, r * (0.5 + Math.random()), r * 0.6 * (0.5 + Math.random()), 0, 0, 7); g.fill(); } }); return srgb(new T.CanvasTexture(c)); }
  function textSprite(txt, col) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.font = 'bold 64px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 12; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.strokeText(txt, 256, 64); g.fillStyle = col || '#fff'; g.fillText(txt, 256, 64);
    const s = new T.Sprite(new T.SpriteMaterial({ map: srgb(new T.CanvasTexture(c)), depthWrite: false, transparent: true })); s.scale.set(9, 2.25, 1); return s; }
  const LOOK = {
    mercury: { r: 0.8, map: () => spotTex('#a8a29e', [['#8a8580', 40, 6], ['#c9c3be', 20, 4]]) },
    venus: { r: 1.2, map: () => bandTex(['#f4d58d', '#e8c06a', '#f7e2a8', '#dcae58'], 9) },
    earth: { r: 1.3, map: () => spotTex('#2f7de1', [['#3fa34d', 14, 22], ['#ffffff', 18, 10]]) },
    mars: { r: 1.0, map: () => spotTex('#d4623a', [['#a8452a', 20, 10], ['#f0c0a0', 6, 6]]) },
    jupiter: { r: 3.0, map: () => bandTex(['#d9b38c', '#b5835a', '#f0dcc0', '#c99a6a', '#e8c9a0'], 14) },
    saturn: { r: 2.5, map: () => bandTex(['#f0d9a0', '#d9bd78', '#f7e6bc', '#c9a860'], 12), ring: true },
    zognar: { r: 1.6, map: () => spotTex('#8a4cd8', [['#ff6fb5', 18, 12], ['#7ad7ff', 12, 8]]), glow: '#c58bff' }
  };
  let built = false, stopsRef = null, nodes = [], orbits = [], rocket, flameM, belt, marker, ticks = [], positions = [];
  function build(STOPS) {
    stopsRef = STOPS; built = true;
    const sun = new T.Mesh(new T.SphereGeometry(4, 32, 22), new T.MeshBasicMaterial({ color: '#ffcf40' })); scene.add(sun);
    const glowC = document.createElement('canvas'); glowC.width = glowC.height = 128; const gg = glowC.getContext('2d'), gr = gg.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,210,90,0.9)'); gr.addColorStop(1, 'rgba(255,140,0,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: srgb(new T.CanvasTexture(glowC)), transparent: true, depthWrite: false })); glow.scale.set(16, 16, 1); scene.add(glow);
    STOPS.forEach((st, i) => {
      const dist = 9 + i * 5.2 + (st.id === 'jupiter' || st.id === 'saturn' ? 2 : 0) + (st.id === 'zognar' ? 4 : 0), ang = i * 0.95 + 0.3;
      const pos = new T.Vector3(Math.cos(ang) * dist, 0, Math.sin(ang) * dist); positions.push(pos);
      const ring = new T.Mesh(new T.RingGeometry(dist - 0.04, dist + 0.04, 128), new T.MeshBasicMaterial({ color: '#3a4a9a', side: T.DoubleSide, transparent: true, opacity: 0.6 })); ring.rotation.x = -Math.PI / 2; scene.add(ring); orbits.push(ring);
      let node;
      if (st.id === 'belt') {
        node = new T.Group(); const rm = mat('#8a8580', { flatShading: true });
        for (let k = 0; k < 26; k++) { const a = ang - 0.35 + k / 26 * 0.7, d = dist + (Math.random() - 0.5) * 1.6, r = new T.Mesh(new T.DodecahedronGeometry(0.2 + Math.random() * 0.35, 0), rm); r.position.set(Math.cos(a) * d - pos.x, (Math.random() - 0.5) * 0.6, Math.sin(a) * d - pos.z); node.add(r); }
        node.userData.r = 1.4;
      } else {
        const L = LOOK[st.id] || LOOK.mercury; node = new T.Mesh(new T.SphereGeometry(L.r, 32, 22), mat('#ffffff', { map: L.map() })); node.userData.r = L.r;
        if (L.ring) { const rg = new T.Mesh(new T.RingGeometry(L.r * 1.3, L.r * 2.1, 64), new T.MeshStandardMaterial({ color: '#e8d4a0', side: T.DoubleSide, transparent: true, opacity: 0.85 })); rg.rotation.x = -Math.PI / 2 + 0.4; node.add(rg); }
        if (L.glow) { const s = glow.clone(); s.material = glow.material.clone(); s.material.color = new T.Color(L.glow); s.scale.set(L.r * 5, L.r * 5, 1); node.add(s); }
      }
      node.position.copy(pos); scene.add(node);
      const label = textSprite(st.name); label.position.set(pos.x, node.userData.r + 1.6, pos.z); scene.add(label);
      const tick = textSprite('✓', '#7dff8a'); tick.scale.set(3, 0.75, 1); tick.position.set(pos.x, node.userData.r + 2.9, pos.z); scene.add(tick); ticks.push(tick);
      nodes.push({ node, label, st });
    });
    // the rocket
    rocket = new T.Group(); const inner = new T.Group(); rocket.add(inner);
    const body = new T.Mesh(new T.CylinderGeometry(0.35, 0.4, 1.3, 18), mat('#f4f6ff', { roughness: 0.35 })); inner.add(body);
    const nose = new T.Mesh(new T.ConeGeometry(0.35, 0.6, 18), mat('#e63946')); nose.position.y = 0.95; inner.add(nose);
    const win = new T.Mesh(new T.SphereGeometry(0.15, 12, 8), mat('#5ec8ff', { emissive: '#1d6aa8', emissiveIntensity: 0.6 })); win.position.set(0, 0.25, 0.34); inner.add(win);
    for (let i = 0; i < 3; i++) { const f = new T.Mesh(new T.BoxGeometry(0.05, 0.45, 0.4), mat('#e63946')); const a = i * Math.PI * 2 / 3; f.position.set(Math.sin(a) * 0.4, -0.5, Math.cos(a) * 0.4); f.rotation.y = a; inner.add(f); }
    flameM = new T.Mesh(new T.ConeGeometry(0.25, 0.9, 14), new T.MeshBasicMaterial({ color: '#ffb347' })); flameM.rotation.x = Math.PI; flameM.position.y = -1.05; inner.add(flameM);
    inner.rotation.x = Math.PI / 2; // nose points along the way it is flying
    rocket.scale.setScalar(0.9); scene.add(rocket);
    marker = new T.Mesh(new T.TorusGeometry(1, 0.08, 8, 48), new T.MeshBasicMaterial({ color: '#ffd166' })); marker.rotation.x = -Math.PI / 2; scene.add(marker);
  }
  function startPos(i) { return i <= 0 ? new T.Vector3(6, 2, 4) : positions[i - 1].clone().add(new T.Vector3(0, nodes[i - 1].node.userData.r + 1.2, 0)); }
  let mode = 'none', idx = 0, fly = null, host = null;
  function attach(el) { host = el; if (cvs.parentNode !== el) el.appendChild(cvs); size(); }
  function size() { if (!host) return; const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  addEventListener('resize', size);
  window.GTH3D = {
    map(STOPS, state) {
      if (!built) build(STOPS); mode = 'map'; idx = state.stopIndex; fly = null; nodes.forEach(n => n.label.visible = true);
      const box = document.getElementById('map3d'); box.style.cssText = 'width:100%;height:min(58vh,520px);border-radius:20px;overflow:hidden;margin:6px 0 10px';
      document.getElementById('trail').style.display = 'none';
      attach(box);
      ticks.forEach((t, i) => t.visible = i < idx);
      nodes.forEach((n, i) => { const lock = i > idx; n.label.material.opacity = lock ? 0.45 : 1; });
      rocket.position.copy(startPos(Math.min(idx, STOPS.length)));
    },
    travel(STOPS, i, done) {
      if (!built) build(STOPS); mode = 'travel'; idx = i;
      const tb = document.getElementById('travel3d'); tb.style.display = 'block'; attach(tb); document.getElementById('rocket-fly').style.visibility = 'hidden';
      const a = startPos(i), b = positions[i].clone().add(new T.Vector3(0, nodes[i].node.userData.r + 1.2, 0));
      fly = { a, b, t: 0, t0: performance.now(), dur: 2.6, done, mid: a.clone().lerp(b, 0.5).add(new T.Vector3(0, 6, 0)) };
    }
  };
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const time = now / 1000;
    if (built && host && document.body.contains(cvs) && host.getClientRects().length) {
      nodes.forEach((n, i) => { n.node.rotation.y += dt * (n.st.id === 'belt' ? 0.1 : 0.4); });
      flameM.scale.y = 0.7 + Math.random() * 0.5;
      if (mode === 'map') {
        const cur = positions[Math.min(idx, positions.length - 1)];
        marker.visible = idx < positions.length; if (marker.visible) { const r = nodes[idx].node.userData.r * 1.7 + Math.sin(time * 4) * 0.15; marker.position.copy(cur); marker.scale.setScalar(r); }
        rocket.position.y += Math.sin(time * 3) * 0.004; rocket.lookAt(cur.x, rocket.position.y, cur.z); rocket.rotateX(0);
        const far = Math.max(...positions.map(p => p.length())) + 6, ca = time * 0.05;
        cam.position.set(Math.cos(ca) * far * 0.5, far * 0.62, Math.sin(ca) * far * 0.5 + far * 0.3); cam.lookAt(0, 0, 0);
      } else if (mode === 'travel' && fly) {
        fly.t = Math.min(1, (now - fly.t0) / 1000 / fly.dur); /* by the clock, so it lands on time even on a slow tablet */ const k = fly.t, e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        const p = new T.Vector3().copy(fly.a).multiplyScalar((1 - e) * (1 - e)).add(fly.mid.clone().multiplyScalar(2 * (1 - e) * e)).add(fly.b.clone().multiplyScalar(e * e));
        const ahead = new T.Vector3().copy(fly.a).multiplyScalar((1 - Math.min(1, e + 0.02)) ** 2).add(fly.mid.clone().multiplyScalar(2 * (1 - Math.min(1, e + 0.02)) * Math.min(1, e + 0.02))).add(fly.b.clone().multiplyScalar(Math.min(1, e + 0.02) ** 2));
        rocket.position.copy(p); if (ahead.distanceTo(p) > 1e-4) rocket.lookAt(ahead);
        const back = p.clone().sub(ahead).normalize().multiplyScalar(13).add(new T.Vector3(0, 6, 0));
        cam.position.lerp(p.clone().add(back), k < 0.05 ? 1 : Math.min(1, dt * 4)); cam.lookAt(fly.b.clone().lerp(p, 0.4));
        marker.visible = false; nodes.forEach(n => n.label.visible = false);
        if (k >= 1) { const d = fly.done; fly = null; mode = 'none'; document.getElementById('rocket-fly').style.visibility = ''; document.getElementById('travel3d').style.display = 'none'; setTimeout(d, 300); }
      }
      sunLight.position.set(0, 0, 0);
      R.render(scene, cam);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

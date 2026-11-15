/* Crazy Snake 3D: the snakes slither across a 3D space floor, seen from above and behind.
   The rules, sizes and number badges are the same; only the drawing is 3D. You steer by pointing
   at the spot on the floor where you want your snake to go. */
(function () {
  if (!window.THREE) return;
  const gl = document.createElement('canvas'); let R;
  try { R = new THREE.WebGLRenderer({ canvas: gl, antialias: true }); } catch (e) { return; }
  const T = THREE, KS = 1 / 40; // world units per game unit
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  R.outputEncoding = T.sRGBEncoding; R.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  gl.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:0;display:block';
  document.body.insertBefore(gl, document.body.firstChild);
  cv.style.position = 'fixed'; cv.style.left = '0'; cv.style.top = '0'; cv.style.zIndex = '1';
  const srgb = t => { t.encoding = T.sRGBEncoding; return t; };
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(50, 1, 0.1, 500);
  scene.background = srgb(new T.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#05041a'); gr.addColorStop(1, '#1c1245'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); return c; })()));
  scene.fog = new T.Fog('#120d33', 40, 110);
  scene.add(new T.HemisphereLight(0xffffff, 0x221a55, 0.8)); const sun = new T.DirectionalLight(0xffffff, 0.8); sun.position.set(10, 30, 15); scene.add(sun);
  // the floor: a dark disc with faint dots, edged with a glowing pink ring
  const dotT = srgb(new T.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#16123a'; g.fillRect(0, 0, 64, 64); g.fillStyle = 'rgba(160,180,255,0.35)'; g.fillRect(30, 30, 4, 4); return c; })()));
  dotT.wrapS = dotT.wrapT = T.RepeatWrapping; dotT.repeat.set(WORLD * KS / 2.75 * 2, WORLD * KS / 2.75 * 2);
  const floor = new T.Mesh(new T.CircleGeometry(WORLD * KS, 96), new T.MeshStandardMaterial({ map: dotT, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const edge = new T.Mesh(new T.TorusGeometry(WORLD * KS, 0.25, 10, 160), new T.MeshStandardMaterial({ color: '#ff5a8c', emissive: '#ff5a8c', emissiveIntensity: 0.8 })); edge.rotation.x = Math.PI / 2; scene.add(edge);
  (function () { const n = 1200, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 0.9 + 0.05, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = 220; pos[i * 3] = Math.cos(a) * s * r; pos[i * 3 + 1] = u * r - 30; pos[i * 3 + 2] = Math.sin(a) * s * r; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); scene.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: 1.2, fog: false }))); })();

  /* pictures of the planets, stars and galaxies, drawn by the game's own artwork */
  const texCache = new Map();
  function planetTex(k) {
    let t = texCache.get(k); if (t) return t;
    const c = document.createElement('canvas'); c.width = c.height = 256; const keep = cx; cx = c.getContext('2d');
    try { drawPlanet(128, 128, Math.pow(2, k), 70, 'plain', 1, 1, 0); } finally { cx = keep; }
    t = srgb(new T.CanvasTexture(c)); texCache.set(k, t); return t;
  }
  const segGeo = new T.SphereGeometry(1, 14, 10), segMats = new Map();
  function segMat(col) { let m = segMats.get(col); if (!m) { m = new T.MeshStandardMaterial({ color: col, roughness: 0.45 }); segMats.set(col, m); } return m; }
  const eyeW = new T.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }), eyeB = new T.MeshStandardMaterial({ color: '#111111' }), eyeG = new T.SphereGeometry(1, 12, 10);
  const halo = new T.MeshBasicMaterial({ color: '#ffd400', transparent: true, opacity: 0.85, side: T.DoubleSide });
  const snake3 = new Map(), food3 = new Map();
  function snakeObj(s) {
    let o = snake3.get(s); if (o) return o;
    o = { segs: [], head: new T.Sprite(new T.SpriteMaterial({ transparent: true, depthWrite: false })), eyes: [], k: -1, ring: null };
    scene.add(o.head); o.head.renderOrder = 2;
    for (let i = 0; i < 2; i++) { const w = new T.Mesh(eyeG, eyeW), b = new T.Mesh(eyeG, eyeB); scene.add(w); scene.add(b); o.eyes.push([w, b]); }
    if (s === me) { o.ring = new T.Mesh(new T.RingGeometry(0.92, 1, 40), halo); o.ring.rotation.x = -Math.PI / 2; scene.add(o.ring); }
    snake3.set(s, o); return o;
  }
  function dropSnake(s, o) { o.segs.forEach(m => scene.remove(m)); scene.remove(o.head); o.eyes.forEach(([w, b]) => { scene.remove(w); scene.remove(b); }); if (o.ring) scene.remove(o.ring); o.head.material.dispose(); snake3.delete(s); }
  const v3 = new T.Vector3();
  function proj(x, y, z) { v3.set(x, y, z).project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H, v3.z]; }
  let lw = 0, lh = 0;

  function render3d() {
    if (W !== lw || H !== lh) { lw = W; lh = H; R.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    const playing = me && state !== 'title';
    const fx = me ? me.x : Math.sin(dist * 0.002) * 300, fy = me ? me.y : Math.cos(dist * 0.002) * 300;
    // camera above and a little behind, higher as you grow (the flat game zooms out the same way)
    const h = 15 / Math.max(0.35, zoom) * Math.max(1, Math.min(1.5, 0.85 / Math.min(1, W / H)));
    camera.position.set(fx * KS, h * 0.9, fy * KS + h * 0.85); camera.lookAt(fx * KS, 0, fy * KS - h * 0.12);
    sun.position.set(fx * KS + 10, 30, fy * KS + 15); sun.target.position.set(fx * KS, 0, fy * KS); sun.target.updateMatrixWorld();
    const viewR = h * 2.6 / KS;
    // food
    const seenF = new Set();
    if (playing) for (const f of food) {
      if (Math.abs(f.x - fx) > viewR || Math.abs(f.y - fy) > viewR) continue;
      let s = food3.get(f); if (!s) { s = new T.Sprite(new T.SpriteMaterial({ map: planetTex(f.k), transparent: true, depthWrite: false })); scene.add(s); food3.set(f, s); }
      seenF.add(f); const r = fr(f) * (1 + 0.06 * Math.sin(dist * 0.08 + f.wob)) * KS, sz = r * 256 / 70; s.scale.set(sz, sz, 1); s.position.set(f.x * KS, r, f.y * KS);
    }
    food3.forEach((s, f) => { if (!seenF.has(f)) { scene.remove(s); s.material.dispose(); food3.delete(f); } });
    // snakes
    const seenS = new Set();
    if (playing) for (const s of snakes) {
      if (s.dead) continue; if (Math.abs(s.x - fx) > viewR * 1.5 || Math.abs(s.y - fy) > viewR * 1.5) continue;
      const o = snakeObj(s); seenS.add(s);
      const k = lev(s.score), r = rad(k) * KS, n = s.segs.length, c1 = bodyCol(k), c2 = shade(c1, -0.3);
      while (o.segs.length < n) { const m = new T.Mesh(segGeo, segMat(c1)); scene.add(m); o.segs.push(m); }
      while (o.segs.length > n) scene.remove(o.segs.pop());
      const blink = s.shield > 0 && Math.floor(dist / 6) % 2 === 0;
      for (let i = 1; i < n; i++) { const q = s.segs[i], ri = r * (1 - 0.45 * i / n), m = o.segs[i]; m.visible = !blink; m.material = segMat((Math.floor(i / 2) % 2) ? c1 : c2); m.scale.setScalar(ri); m.position.set(q.x * KS, ri, q.y * KS); }
      if (o.segs[0]) o.segs[0].visible = false;
      if (o.k !== k) { o.k = k; o.head.material.map = planetTex(k); o.head.material.needsUpdate = true; }
      const hr = r * 1.18, hs = hr * 256 / 70; o.head.scale.set(hs, hs, 1); o.head.position.set(s.x * KS, hr * 1.05, s.y * KS); o.head.material.opacity = blink ? 0.45 : 1;
      const ex = Math.cos(s.ang), ey = Math.sin(s.ang), px = -ey, py = ex;
      o.eyes.forEach(([w, b], j) => { const sd = j ? 1 : -1, X = s.x * KS + (ex * 0.32 + px * sd * 0.4) * hr, Z = s.y * KS + (ey * 0.32 + py * sd * 0.4) * hr;
        w.scale.setScalar(hr * 0.3); w.position.set(X, hr * 1.9, Z); b.scale.setScalar(hr * 0.15); b.position.set(X + ex * hr * 0.15, hr * 1.9 + hr * 0.15, Z + ey * hr * 0.15); });
      if (o.ring) { o.ring.scale.setScalar(hr * 1.3); o.ring.position.set(s.x * KS, 0.03, s.y * KS); }
    }
    snake3.forEach((o, s) => { if (!seenS.has(s)) dropSnake(s, o); });
    R.render(scene, camera);
  }
  /* number badges over each snake: yellow is you, green you can eat, red run away */
  function badges() {
    for (const s of snakes) {
      if (s.dead || !snake3.has(s)) continue; const k = lev(s.score), hr = rad(k) * 1.18 * KS, p = proj(s.x * KS, hr * 2.3, s.y * KS); if (p[2] > 1) continue;
      const top = proj(s.x * KS, hr * 3.3, s.y * KS), px = Math.abs(p[1] - top[1]);
      const t = fmt(Math.round(s.score)), L = t.length, bf = Math.max(14, Math.min(40, px * 0.75 * (L > 9 ? 0.55 : L > 6 ? 0.65 : L > 4 ? 0.78 : 1)));
      cx.font = 'bold ' + bf + 'px Arial'; const bw = cx.measureText(t).width + bf * 0.9, bh = bf * 1.3, by = p[1] - bh;
      const col = s === me ? '#ffd400' : s.score < me.score ? '#4fe07a' : '#ff5a5a';
      rr(p[0] - bw / 2, by, bw, bh, bh / 2); cx.fillStyle = col; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = 'rgba(0,0,0,0.4)'; cx.stroke();
      cx.fillStyle = '#111'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(t, p[0], by + bh / 2 + 1);
    }
  }
  window.drawBg = function () { cx.clearRect(0, 0, W, H); render3d(); };
  window.drawWorldBits = function () {};
  window.drawFood = function () {};
  window.drawSnake = function (s) { if (s === me) badges(); };
  window.drawParts = function () {
    for (const p of parts) { cx.globalAlpha = Math.min(1, p.life);
      if (p.kind === 'conf') { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.col; cx.fillRect(-6, -3, 12, 6); cx.restore(); continue; }
      const q = proj(p.x * KS, 1, p.y * KS); if (q[2] > 1) continue;
      if (p.kind === 'dot') { cx.fillStyle = p.col; cx.beginPath(); cx.arc(q[0], q[1], Math.max(1.5, p.r * zoom * 0.8), 0, 7); cx.fill(); }
      else if (p.kind === 'text') tag(q[0], q[1], p.t, uiFs() * 0.8, p.col); }
    cx.globalAlpha = 1;
  };
  /* steering: aim at the spot on the floor under your finger */
  const rc = new T.Raycaster(), nd = new T.Vector2(), pl = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  window.SNK3D = { aim(p) { nd.set(p.x / W * 2 - 1, -(p.y / H) * 2 + 1); rc.setFromCamera(nd, camera); if (!rc.ray.intersectPlane(pl, hit)) return me.tgt; return Math.atan2(hit.z / KS - me.y, hit.x / KS - me.x); } };
})();

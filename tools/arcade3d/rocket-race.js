/* Rocket Race 3D: the same counting-on race, on a 3D number board with a rocket and a flying saucer
   that hop square to square. The squares keep the same order as the flat game (1 to 10 along the
   first row, 11 to 20 along the next) so the counting stays the same. Tap a square to answer. */
(function () {
  if (!window.THREE) return;
  const cvs = document.createElement('canvas'); let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true }); } catch (e) { return; }
  const T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  renderer.outputEncoding = T.sRGBEncoding; renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  cvs.style.cssText = 'display:block;width:100%;height:100%;touch-action:manipulation;border-radius:18px';
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, 0.1, 200);
  scene.add(new T.HemisphereLight(0xffffff, 0x2a2a66, 0.8));
  const sun = new T.DirectionalLight(0xffffff, 1.0); sun.position.set(4, 14, 9); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); scene.add(sun);
  const SP = 1.12; // space between squares
  let built = '', tiles = [], tileMap = new Map(), slab, pad, me3, al3, rows = 1, nSq = 0, hints = new Map(), wrongT = new Map(), shakeT = new Map();
  const tok = { me: { at: 0, from: 0, to: 0, t: 1 }, al: { at: 0, from: 0, to: 0, t: 1 } };
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const srgb = t => { t.encoding = T.sRGBEncoding; return t; };
  const mat = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.5 }, o || {}));

  function tilePos(i) {
    if (i <= 0) return new T.Vector3(-5.5 * SP - 0.4, 0, (0 - (rows - 1) / 2) * SP); // the launch pad, just before square 1
    const r = Math.floor((i - 1) / 10), c = (i - 1) % 10;
    return new T.Vector3((c - 4.5) * SP, 0, (r - (rows - 1) / 2) * SP);
  }
  function faceTex(i, kind) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = kind === 'goal' ? '#ffd400' : kind === 'star' ? '#fff3b0' : kind === 'alt' ? '#e8f0ff' : '#ffffff'; g.fillRect(0, 0, 128, 128);
    if (kind === 'goal') { for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if ((a + b) % 2) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(a * 32, b * 32, 32, 32); } }
    g.fillStyle = '#1a1a2e'; g.font = 'bold ' + (i >= 100 ? 52 : 64) + 'px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i), 64, kind === 'plain' || kind === 'alt' ? 68 : 76);
    if (kind === 'star' || kind === 'goal') { g.font = '34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillText(kind === 'star' ? '⭐' : '🏁', 64, 24); }
    return srgb(new T.CanvasTexture(c));
  }
  function makeRocket() {
    const g = new T.Group();
    const b = new T.Mesh(new T.CylinderGeometry(0.17, 0.2, 0.55, 16), mat('#f4f6ff')); b.position.y = 0.42; g.add(b);
    const n = new T.Mesh(new T.ConeGeometry(0.17, 0.3, 16), mat('#e63946')); n.position.y = 0.84; g.add(n);
    const w = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), mat('#5ec8ff', { emissive: '#1d6aa8', emissiveIntensity: 0.4 })); w.position.set(0, 0.5, 0.16); g.add(w);
    for (let i = 0; i < 3; i++) { const f = new T.Mesh(new T.BoxGeometry(0.03, 0.22, 0.2), mat('#e63946')); const a = i * Math.PI * 2 / 3; f.position.set(Math.sin(a) * 0.2, 0.23, Math.cos(a) * 0.2); f.rotation.y = a; g.add(f); }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
  }
  function makeUfo() {
    const g = new T.Group();
    const d = new T.Mesh(new T.SphereGeometry(0.34, 20, 12), mat('#b9c3d6', { metalness: 0.5, roughness: 0.3 })); d.scale.y = 0.32; d.position.y = 0.32; g.add(d);
    const dome = new T.Mesh(new T.SphereGeometry(0.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat('#9be7ff', { transparent: true, opacity: 0.75, roughness: 0.1 })); dome.position.y = 0.4; g.add(dome);
    const alien = new T.Mesh(new T.SphereGeometry(0.09, 12, 8), mat('#7ee081')); alien.position.y = 0.45; g.add(alien);
    for (let i = 0; i < 6; i++) { const l = new T.Mesh(new T.SphereGeometry(0.035, 6, 4), mat('#ffd400', { emissive: '#ffb000', emissiveIntensity: 0.8 })); const a = i * Math.PI / 3; l.position.set(Math.cos(a) * 0.3, 0.3, Math.sin(a) * 0.3); g.add(l); }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
  }
  function build(m) {
    tiles.forEach(t => scene.remove(t)); tiles = []; tileMap.clear(); if (slab) scene.remove(slab); if (pad) scene.remove(pad);
    rows = Math.ceil(m.n / 10); nSq = m.n;
    slab = new T.Mesh(new T.BoxGeometry(10 * SP + 2.2, 0.3, rows * SP + 0.7), mat('#3a2f7a')); slab.position.set(-0.6, -0.17, 0); slab.receiveShadow = true; scene.add(slab);
    pad = new T.Mesh(new T.CylinderGeometry(0.45, 0.5, 0.12, 24), mat('#ff8c42')); pad.position.copy(tilePos(0)); pad.position.y = 0.06; pad.receiveShadow = true; scene.add(pad);
    for (let i = 1; i <= m.n; i++) {
      const row = Math.floor((i - 1) / 10), kind = i === m.n ? 'goal' : G.stars.has(i) ? 'star' : row % 2 ? 'alt' : 'plain';
      const top = new T.MeshStandardMaterial({ map: faceTex(i, kind), roughness: 0.6 }), side = mat(kind === 'goal' ? '#e0b800' : kind === 'star' ? '#e8cf6a' : '#c9d3ee');
      const t = new T.Mesh(new T.BoxGeometry(SP * 0.9, 0.2, SP * 0.9), [side, side, top, side, side, side]); t.position.copy(tilePos(i)); t.position.y = 0.1; t.receiveShadow = true; t.castShadow = true;
      t.userData = { n: i, top, base: top.color.clone() }; scene.add(t); tiles.push(t); tileMap.set(i, t);
    }
    if (!me3) { me3 = makeRocket(); al3 = makeUfo(); me3.scale.setScalar(1.6); al3.scale.setScalar(1.6); scene.add(me3, al3); }
    tok.me = { at: G.me, from: G.me, to: G.me, t: 1 }; tok.al = { at: G.al, from: G.al, to: G.al, t: 1 };
    hints.clear(); wrongT.clear(); shakeT.clear();
    built = m.id + '|' + [...G.stars].join(',');
  }
  function fit(box) {
    const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    const bw = 10 * SP + 2.4, bd = rows * SP + 1, el = 0.95 + clamp01((rows - 2) / 8) * 0.3; // camera tilt: more from above on the big boards
    const dw = (bw / 2) / Math.tan(Math.atan(Math.tan(cam.fov * Math.PI / 360) * cam.aspect)), dh = (bd / 2 + 0.6) / Math.tan(cam.fov * Math.PI / 360) / Math.sin(el) * 1.05;
    const d = Math.max(dw, dh) * 1.04;
    cam.position.set(-0.6, Math.sin(el) * d, Math.cos(el) * d + 0.2); cam.lookAt(-0.6, 0, 0.25); cam.updateProjectionMatrix();
  }

  /* the screen, with the 3D board where the grid of squares was */
  window.draw = function () {
    const m = G.m; let h = topBar('🚀 ' + (G.me || 'Start'), '🛸 ' + (G.al || 'Start'));
    const r = Math.ceil(m.n / 10);
    h += '<div id="b3" style="width:100%;height:' + Math.round(Math.min(innerHeight * 0.66, Math.min(innerWidth - 28, 760) * (0.45 + r * 0.075))) + 'px"></div>';
    h += '<div class="row"><div class="spin" id="spin">' + (G.waiting ? G.waiting.roll : '?') + '</div><div class="msg" id="msg" style="flex:1;text-align:left">' + (G.turn === 'me' ? (G.waiting ? 'Tap the square you will land on!' : 'Your turn: tap the wheel!') : 'Alien is having a go...') + '</div></div>';
    app.innerHTML = h; wireHome();
    const box = $('b3'); box.appendChild(cvs);
    if (built !== m.id + '|' + [...G.stars].join(',')) build(m);
    for (const who of ['me', 'al']) { const t = tok[who]; if (G[who] !== t.to) { t.from = t.at; t.to = G[who]; t.t = 0; } }
    fit(box);
    $('spin').onclick = () => { if (G.turn !== 'me' || G.busy || G.waiting) return; spin('me'); };
  };
  /* tapping a square: right answer moves on; wrong answer shakes it and lights the hops to count */
  window.pick = function (n) {
    if (!G || !G.waiting || G.busy) return; const w = G.waiting;
    if (n === w.target) { sGood(); G.waiting = null; move('me', w.roll); return; }
    sBad(); wrongT.set(n, 1.2); shakeT.set(n, 0.4); const from = G.me;
    for (let k = 1; k <= w.roll; k++) { const q = Math.min(G.m.n, from + k); after(() => hints.set(q, 1), k * 250); }
    $('msg').textContent = 'Count on ' + w.roll + ' from ' + (from || 'the start') + '. Follow the green squares!'; say('Count on ' + w.roll + ' from ' + (from || 'the start'));
  };
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  cvs.addEventListener('pointerdown', e => {
    audioInit(); const r = cvs.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, cam); const hit = ray.intersectObjects(tiles, false)[0]; if (hit) window.pick(hit.object.userData.n);
  });
  addEventListener('resize', () => { const b = document.getElementById('b3'); if (b && G) window.draw(); });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (G && document.body.contains(cvs)) {
      const time = now / 1000;
      for (const [who, obj, off] of [['me', me3, -0.2], ['al', al3, 0.2]]) {
        const t = tok[who]; t.t = Math.min(1, t.t + dt / 0.32);
        const a = tilePos(t.from), b = tilePos(t.to), k = t.t, e = k * k * (3 - 2 * k);
        obj.position.set(a.x + (b.x - a.x) * e + off * 0.6, 0.2 + Math.sin(k * Math.PI) * (t.from !== t.to ? 0.7 : 0) + (who === 'al' ? 0.12 + Math.sin(time * 3) * 0.05 : 0), a.z + (b.z - a.z) * e + off);
        if (k >= 1) { t.at = t.to; t.from = t.to; }
        obj.rotation.y = who === 'al' ? time * 1.5 : Math.sin(time * 2) * 0.2;
      }
      tiles.forEach(tl => {
        const n = tl.userData.n, wr = wrongT.get(n) || 0, hi = hints.has(n), sh = shakeT.get(n) || 0;
        tl.userData.top.color.copy(tl.userData.base); if (hi) tl.userData.top.color.setRGB(0.35, 0.95, 0.45); if (wr > 0) tl.userData.top.color.setRGB(1, 0.4, 0.4);
        tl.position.y = 0.1 + (hi ? 0.14 + Math.sin(time * 6 + n) * 0.04 : 0); tl.position.x = tilePos(n).x + (sh > 0 ? Math.sin(sh * 60) * 0.08 : 0);
        if (wr > 0) wrongT.set(n, wr - dt); if (sh > 0) shakeT.set(n, sh - dt);
      });
      if (!G.waiting && hints.size) hints.clear();
      renderer.render(scene, cam);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

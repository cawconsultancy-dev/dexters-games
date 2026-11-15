/* Run3D: draws the number run games in 3D.
   The game rules, levels, voice and menus stay in each game's own code. This file only swaps the
   flat track for a 3D one: the 2D canvas becomes a see-through layer on top for the menus, score and
   messages, and the track, planets, animals, flags and obstacles are drawn underneath with three.js.
   If 3D cannot start (no WebGL), nothing is changed and the flat game carries on as normal. */
(function () {
  'use strict';
  const LW = 3;      // width of one lane in 3D units
  const ZK = 2.2;    // how much longer the track is in 3D than on the flat screen (matches the game's collision tweak)
  const TEX = 512, TR = 100, TCY = 300; // sprite textures: 512 square, ball radius 100, ball centre 300 down

  function install(cfg) {
    if (!window.THREE) return;
    let renderer;
    const gl = document.createElement('canvas');
    try { renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true }); } catch (e) { return; }
    const T = cfg.theme;
    gl.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:0;display:block';
    document.body.insertBefore(gl, document.body.firstChild);
    cv.style.position = 'fixed'; cv.style.left = '0'; cv.style.top = '0'; cv.style.zIndex = '1';
    document.documentElement.style.background = T.sky[1];
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false; // true colours, as in Popper Maker
    renderer.outputEncoding = THREE.sRGBEncoding;
    const srgb = t => { t.encoding = THREE.sRGBEncoding; return t; };
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    window.R3ZK = ZK; // the game's hit test reads this

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(T.fog || T.sky[1], 26, 52);
    const cam = new THREE.PerspectiveCamera(55, 1, 0.1, 300);
    scene.add(new THREE.HemisphereLight(0xffffff, T.ground || 0x222244, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75); sun.position.set(4, 10, 6); scene.add(sun);

    /* sky */
    const skyC = document.createElement('canvas'); skyC.width = 4; skyC.height = 512;
    (function () {
      const g = skyC.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
      gr.addColorStop(0, T.sky[0]); gr.addColorStop(1, T.sky[1]); g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
    })();
    scene.background = srgb(new THREE.CanvasTexture(skyC));
    if (T.stars) {
      const n = 900, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, e = Math.random() * 0.9 + 0.05, r = 150;
        pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r - 10; pos[i * 3 + 2] = -Math.abs(Math.sin(a) * Math.cos(e) * r) - 20;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.9, fog: false, transparent: true, opacity: 0.85 })));
    }

    /* track with lane lines that scroll */
    const LEN = 420, TILE = 6;
    const trC = document.createElement('canvas'); trC.width = 192; trC.height = 128;
    (function () {
      const g = trC.getContext('2d');
      g.fillStyle = T.track; g.fillRect(0, 0, 192, 128);
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, 0, 192, 64);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      for (const x of [64, 128]) g.fillRect(x - 2, 8, 4, 48);
    })();
    const trT = srgb(new THREE.CanvasTexture(trC)); trT.wrapS = trT.wrapT = THREE.RepeatWrapping; trT.repeat.set(1, LEN / TILE);
    trT.anisotropy = renderer.capabilities.getMaxAnisotropy ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 1;
    const track = new THREE.Mesh(new THREE.PlaneGeometry(LW * 3, LEN), new THREE.MeshLambertMaterial({ map: trT }));
    track.rotation.x = -Math.PI / 2; track.position.set(0, 0, -LEN / 2 + 30); scene.add(track);
    const edgeM = new THREE.MeshLambertMaterial({ color: T.edge, emissive: T.edge, emissiveIntensity: 0.35 });
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, LEN), edgeM);
      e.position.set(s * (LW * 1.5 + 0.15), 0.12, -LEN / 2 + 30); scene.add(e);
    }
    if (T.ground) {
      const gr = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ color: T.ground }));
      gr.rotation.x = -Math.PI / 2; gr.position.set(0, -0.06, -150); scene.add(gr);
    } else {
      const under = new THREE.Mesh(new THREE.BoxGeometry(LW * 3 + 0.6, 0.6, LEN), new THREE.MeshLambertMaterial({ color: T.under || 0x1a1440 }));
      under.position.set(0, -0.31, -LEN / 2 + 30); scene.add(under);
    }

    /* finish line */
    const fC = document.createElement('canvas'); fC.width = 96; fC.height = 16;
    (function () { const g = fC.getContext('2d'); for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#222'; g.fillRect(i * 8, j * 8, 8, 8); } })();
    const fT = srgb(new THREE.CanvasTexture(fC)); fT.magFilter = THREE.NearestFilter;
    const finish = new THREE.Mesh(new THREE.PlaneGeometry(LW * 3, 1.2), new THREE.MeshBasicMaterial({ map: fT }));
    finish.rotation.x = -Math.PI / 2; finish.position.y = 0.02; finish.visible = false; scene.add(finish);
    const archM = new THREE.MeshLambertMaterial({ color: 0xffd400, emissive: 0xffd400, emissiveIntensity: 0.3 });
    const arch = new THREE.Group();
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.4, 10), archM); p.position.set(s * (LW * 1.5 + 0.3), 1.7, 0); arch.add(p); }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(LW * 3 + 0.9, 0.5, 0.2), archM); bar.position.y = 3.4; arch.add(bar);
    arch.visible = false; scene.add(arch);

    /* scenery down both sides, recycled as the track scrolls */
    const scen = [];
    const rnd = (a, b) => a + Math.random() * (b - a);
    function makeScenery(kind) {
      const g = new THREE.Group();
      if (kind === 'trees') {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.2, 7), new THREE.MeshLambertMaterial({ color: 0x8a5a2b })); t.position.y = 0.6; g.add(t);
        const c = new THREE.Mesh(new THREE.ConeGeometry(rnd(0.9, 1.3), rnd(2, 3), 8), new THREE.MeshLambertMaterial({ color: [0x2e8b3a, 0x3fa34d, 0x1f7a33][Math.floor(Math.random() * 3)] })); c.position.y = 2.3; g.add(c);
      } else if (kind === 'houses') {
        const w = rnd(1.4, 2.2), h = rnd(1.2, 2.4);
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshLambertMaterial({ color: [0xf2e3c6, 0xd9a07a, 0xc7d6e8, 0xf4c2c2, 0xe8e8e8][Math.floor(Math.random() * 5)] })); b.position.y = h / 2; g.add(b);
        const r = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, 1, 4), new THREE.MeshLambertMaterial({ color: [0xb5402a, 0x6b4a3a, 0x50606e][Math.floor(Math.random() * 3)] })); r.position.y = h + 0.5; r.rotation.y = Math.PI / 4; g.add(r);
      } else {
        const col = [0x8a7bb8, 0x6f6a8e, 0x9b8a7a, 0x5e7fa8, 0xb07acc][Math.floor(Math.random() * 5)];
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(0.5, 1.4), 0), new THREE.MeshLambertMaterial({ color: col, flatShading: true }));
        m.userData.spin = rnd(-1, 1); g.add(m); g.userData.float = rnd(0.8, 5);
      }
      return g;
    }
    const kinds = T.scenery === 'mixed' ? ['trees', 'houses'] : [T.scenery || 'space'];
    for (let i = 0; i < 34; i++) {
      const g = makeScenery(kinds[i % kinds.length]);
      const side = i % 2 ? 1 : -1;
      g.position.set(side * rnd(LW * 1.5 + 1.8, LW * 1.5 + 9), g.userData.float || 0, 20 - i * 4.4);
      g.rotation.y = rnd(0, Math.PI * 2);
      scene.add(g); scen.push(g);
    }

    /* sprites made from the game's own pictures */
    const texCache = new Map();
    const blobT = (function () {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
    })();
    const blobGeo = new THREE.PlaneGeometry(2, 2);
    const blobMat = new THREE.MeshBasicMaterial({ map: blobT, transparent: true, depthWrite: false });
    function offDraw(fn) {
      const c = document.createElement('canvas'); c.width = c.height = TEX;
      const g = c.getContext('2d'), keep = cx;
      cx = g; // the game's drawing functions draw on cx
      try { fn(); } finally { cx = keep; }
      return c;
    }
    function texFor(key, fn) {
      let t = texCache.get(key);
      if (!t) {
        const c = offDraw(fn);
        const tex = new THREE.CanvasTexture(c); if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
        t = { tex, c }; texCache.set(key, t);
      }
      return t;
    }
    const ballTex = (v, isP) => texFor((isP ? 'P' : 'B') + v, () => window[cfg.draw](TEX / 2, TCY, v, TR, isP, 1));
    const obsTex = () => texFor('obs', () => { const k = baseR; baseR = TR / cfg.obsK; try { window[cfg.obsDraw](TEX / 2, TCY); } finally { baseR = k; } });

    function newSprite() {
      const m = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, fog: true });
      const s = new THREE.Sprite(m); s.center.set(0.5, (TEX - TCY) / TEX);
      const sh = new THREE.Mesh(blobGeo, blobMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03;
      scene.add(s); scene.add(sh); return { s, sh, key: '' };
    }
    const live = new Map();
    function spriteFor(o) { let e = live.get(o); if (!e) { e = newSprite(); live.set(o, e); } e.seen = true; return e; }
    function setSprite(e, key, t, x, y, z, worldR, scale) {
      if (e.key !== key) { e.s.material.map = t.tex; e.s.material.needsUpdate = true; e.key = key; }
      const size = TEX / TR * worldR * scale;
      e.s.scale.set(size, size, 1); e.s.position.set(x, y, z);
      e.sh.position.set(x, 0.03, z); e.sh.scale.setScalar(worldR * 1.1);
    }

    /* spikes for Number Ball Run, made as real 3D cones */
    const spikeM = new THREE.MeshLambertMaterial({ color: 0x9aa5b1 }), tipM = new THREE.MeshLambertMaterial({ color: 0xe63946 });
    const spikes = new Map();
    function spikeFor(o) {
      let g = spikes.get(o);
      if (!g) {
        g = new THREE.Group();
        for (const k of [-1, 0, 1]) {
          const c = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 10), spikeM); c.position.set(k * 0.78, 0.62, 0); g.add(c);
          const t = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), tipM); t.position.set(k * 0.78, 1.12, 0); g.add(t);
        }
        scene.add(g); spikes.set(o, g);
      }
      g.userData.seen = true; return g;
    }

    /* screen to 3D mapping */
    let s = 1;
    const X = x => (x - (trackX + trackW / 2)) * s;
    const Zd = d => -(d - dist) * s * ZK;
    const Zy = y => -(playerY - y) * s * ZK;
    const v3 = new THREE.Vector3();
    function project(x, y, z) { v3.set(x, y, z).project(cam); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H, v3.z]; }
    function pxPerUnit(x, y, z) { const a = project(x, y, z), b = project(x + 1, y, z); return Math.abs(b[0] - a[0]); }

    let lastW = 0, lastH = 0, worldDist = 0, lastDist = null, t0 = performance.now();
    function fit() {
      if (W === lastW && H === lastH) return;
      lastW = W; lastH = H; renderer.setSize(W, H, false);
      cam.aspect = W / H;
      cam.position.set(0, 6.2, 10); cam.lookAt(0, 0.4, -10);
      // pick the field of view so the track at the player is as wide on screen as the flat game's track
      const dir = new THREE.Vector3(0, 0.4 - 6.2, -20).normalize(), d = -cam.position.clone().dot(dir);
      const tanH = (LW * 1.5) * W / (trackW * d);
      cam.fov = 2 * Math.atan(tanH / cam.aspect) * 180 / Math.PI;
      cam.clearViewOffset(); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      // slide the view so the player sits where it does in the flat game (low on the screen), on any screen shape
      const py = project(0, 0, 0)[1], want = Math.min(H * 0.84, playerY + radius(player.v || 1) * 1.6);
      cam.setViewOffset(W, H, 0, Math.round(py - want), W, H);
      cam.updateProjectionMatrix();
    }

    function render3d() {
      s = LW / laneW; fit();
      const t = (performance.now() - t0) / 1000;
      if (lastDist === null || dist < lastDist) lastDist = dist;
      const dW = (dist - lastDist) * s * ZK; lastDist = dist; worldDist += dW;
      trT.offset.y = (worldDist / TILE) % 1;
      scen.forEach(g => {
        g.position.z += dW; if (g.position.z > 22) g.position.z -= 34 * 4.4;
        if (g.userData.float) { g.children[0].rotation.x += 0.01 * g.children[0].userData.spin; g.children[0].rotation.y += 0.013; }
      });
      const playing = state !== 'title';
      // objects
      live.forEach(e => e.seen = false); spikes.forEach(g => g.userData.seen = false);
      if (playing) for (const o of objs) {
        if (o.dead) continue;
        const z = Zd(o.d); if (z < -70 || z > 14) continue;
        const x = X(o.x);
        if (o.type === 'spike') { const g = spikeFor(o); g.position.set(x, 0, z); g.scale.setScalar(baseR * 1.7 * s / 2.3); continue; }
        if (o.type === cfg.obstacle) { const e = spriteFor(o), r = baseR * cfg.obsK * s; setSprite(e, 'obs', obsTex(), x, r + Math.sin(t * 3 + o.d) * 0.15, z, r, 1); continue; }
        const e = spriteFor(o), r = radius(o.v) * s; setSprite(e, 'B' + o.v, ballTex(o.v, false), x, r, z, r, 1);
      }
      // player
      const pe = spriteFor(player), pr = radius(player.v) * s;
      const hop = state === 'play' ? Math.abs(Math.sin(t * 7)) * 0.12 : 0;
      setSprite(pe, 'P' + player.v, ballTex(player.v, true), X(player.x), pr + hop, 0, pr, 1 + player.pop * 0.35);
      pe.s.material.rotation = state === 'play' ? (player.tx - player.x) * -0.0015 : 0;
      live.forEach((e, k) => { if (!e.seen) { scene.remove(e.s); scene.remove(e.sh); e.s.material.dispose(); live.delete(k); } });
      spikes.forEach((g, k) => { if (!g.userData.seen) { scene.remove(g); spikes.delete(k); } });
      // finish
      if (playing && finishD !== null) { const z = Zd(finishD); finish.visible = arch.visible = true; finish.position.z = z; arch.position.z = z - 0.6; }
      else finish.visible = arch.visible = false;
      // camera shake when hit
      const sh = player.shake > 0 ? (Math.random() - 0.5) * player.shake * 0.8 : 0;
      cam.position.x = sh;
      renderer.render(scene, cam);
      cam.position.x = 0;
    }

    /* swap the game's flat drawing for the 3D one */
    window.drawBg = function () { cx.save(); cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.clearRect(0, 0, W, H); cx.restore(); render3d(); };
    window.drawTrack = function () {};
    window.drawWorld = function () {
      if (!cfg.tags) return;
      const p = PL[kOf(player.v)], fs = uiFs(), pr = radius(player.v) * s;
      const base = project(X(player.x), 0, 0);
      const top = project(X(player.x), pr * 2, 0);
      const below = base[1] + fs * 0.55, size = Math.abs(base[1] - top[1]);
      nameTag(base[0], below + Math.max(0, size * 0.05), p.short, fs * 0.8);
      nameTag(base[0], below + fs * 0.95, p.cat, fs * 0.55, '#cfe0ff');
    };
    window.drawParts = function () {
      for (const p of parts) {
        cx.globalAlpha = Math.min(1, p.life);
        if (p.kind === 'conf') { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.col; cx.fillRect(-6, -3, 12, 6); cx.restore(); continue; }
        if (!p.w) p.w = { y0: p.y, z: Zy(p.y), h: p.kind === 'ball' ? p.r * s : radius(player.v) * s };
        const wx = X(p.x), wy = p.w.h - (p.y - p.w.y0) * s, wz = p.w.z;
        const [sx, sy, sz] = project(wx, wy, wz); if (sz > 1) continue;
        const k = pxPerUnit(wx, wy, wz) * s;
        if (p.kind === 'dot') { cx.fillStyle = p.col; cx.beginPath(); cx.arc(sx, sy, Math.max(1, p.r * k), 0, 7); cx.fill(); }
        else if (p.kind === 'ball') { const t = ballTex(p.v, false), size = TEX / TR * p.r * k; cx.drawImage(t.c, sx - size / 2, sy - size * TCY / TEX, size, size); }
      }
      cx.globalAlpha = 1;
    };
  }
  window.Run3D = { install, ZK };
})();

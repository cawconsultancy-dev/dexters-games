/* Shell3D: turns one of the arcade games (the ones built on the shared game shell, with G.update and
   G.draw) into a 3D game. The game's rules, score, lives, menus and sounds all stay in the game's own
   code. This file swaps the flat drawing for a three.js scene drawn underneath, and keeps the flat
   canvas on top (see-through) for the sparkles and the floating "+3" and "Bump!" messages, which are
   moved to where things are in 3D. Each game passes in how to build and update its own 3D world.
   If 3D cannot start, nothing is changed and the flat game carries on. */
(function () {
  'use strict';
  function install(cfg) {
    if (!window.THREE) return;
    let renderer;
    const gl = document.createElement('canvas');
    try { renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true }); } catch (e) { return; }
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    if (cfg.shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
    gl.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:0;display:block;pointer-events:none';
    document.body.insertBefore(gl, document.body.firstChild);
    cv.style.position = 'fixed'; cv.style.left = '0'; cv.style.top = '0'; cv.style.zIndex = '1'; cv.style.background = 'transparent';
    document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent';

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(cfg.fov || 50, 1, 0.1, 600);
    const srgb = t => { t.encoding = THREE.sRGBEncoding; return t; };
    const matCache = new Map();
    const K = {
      THREE, scene, cam, renderer, srgb,
      /* a shiny-plastic material in a colour, shared so it is only made once */
      mat(c, opts) { const k = c + JSON.stringify(opts || {}); let m = matCache.get(k); if (!m) { m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.05 }, opts || {})); matCache.set(k, m); } return m; },
      mesh(geo, c, opts) { const m = new THREE.Mesh(geo, typeof c === 'string' || typeof c === 'number' ? K.mat(c, opts) : c); m.castShadow = !!cfg.shadows; m.receiveShadow = !!cfg.shadows; return m; },
      canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return srgb(new THREE.CanvasTexture(c)); },
      sky(top, bottom) { scene.background = K.canvasTex(4, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); }); },
      stars(n, r, opts) {
        const pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u); pos[i * 3] = Math.cos(a) * s * r; pos[i * 3 + 1] = u * r; pos[i * 3 + 2] = Math.sin(a) * s * r; }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const p = new THREE.Points(g, new THREE.PointsMaterial(Object.assign({ color: 0xffffff, size: 1.2, fog: false, sizeAttenuation: true }, opts || {}))); scene.add(p); return p;
      },
      v3: new THREE.Vector3(),
      project(x, y, z) { K.v3.set(x, y, z).project(cam); return [(K.v3.x + 1) / 2 * W, (1 - K.v3.y) / 2 * H, K.v3.z]; },
      /* screen pixels for one 3D unit at a point, for sizing sparkles */
      ppu(x, y, z) { const a = K.project(x, y, z), b = K.project(x + 1, y, z); return Math.abs(b[0] - a[0]); },
      emojiTex(e, size) { size = size || 128; return K.canvasTex(size, size, (g) => { g.font = (size * 0.8) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, size / 2, size * 0.55); }); },
      time: 0
    };
    const hemi = new THREE.HemisphereLight(0xffffff, cfg.groundLight || 0x8a7a66, cfg.hemi === undefined ? 0.75 : cfg.hemi); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, cfg.sun === undefined ? 0.95 : cfg.sun); sun.position.set(6, 14, 8); scene.add(sun); scene.add(sun.target);
    if (cfg.shadows) { sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 }); sun.shadow.bias = -0.0008; }
    K.sunLight = sun; K.hemi = hemi;
    cfg.build(K);
    window.__k3 = K; // handy for testing

    let lw = 0, lh = 0;
    function fitGL() { if (W === lw && H === lh) return; lw = W; lh = H; renderer.setSize(W, H, false); cam.aspect = W / H; cam.updateProjectionMatrix(); if (cfg.resize) cfg.resize(K); }

    G.draw = function (c, dt) {
      ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H); ctx.restore();
      fitGL(); K.time += dt || 0;
      cfg.draw(K, dt || 0);
      const m = shakeT > 0 ? shakeM * Math.max(0, Math.min(1, shakeT / 0.3)) : 0;
      const ox = (Math.random() - 0.5) * m * 0.03, oy = (Math.random() - 0.5) * m * 0.03;
      cam.position.x += ox; cam.position.y += oy;
      renderer.render(scene, cam);
      cam.position.x -= ox; cam.position.y -= oy;
      // the shell moved the flat canvas for the shake; the sparkles drawn next should not shake twice
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    /* sparkles and floating text, moved to where the action is in 3D */
    window.drawFx = function (dt) {
      parts.forEach(p => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.985; p.l -= dt;
        const w = cfg.map(p.x, p.y, p), s = K.project(w[0], w[1], w[2]); if (s[2] > 1) return;
        const k = Math.max(0.35, Math.min(2.2, K.ppu(w[0], w[1], w[2]) * (cfg.unit || 1)));
        ctx.globalAlpha = clamp(p.l / p.L * 1.4, 0, 1);
        if (p.star) star(s[0], s[1], p.r * 1.4 * k, p.c); else circ(s[0], s[1], p.r * k, p.c);
      });
      ctx.globalAlpha = 1; parts = parts.filter(p => p.l > 0);
      floats.forEach(f => {
        f.y -= 60 * dt; f.l -= dt * 0.9;
        const w = cfg.map(f.x, f.y, f), s = K.project(w[0], w[1], w[2]);
        const sx = clamp(s[0], f.s * 2, W - f.s * 2), sy = clamp(s[1], f.s + 70, H - f.s);
        ctx.globalAlpha = clamp(f.l * 1.5, 0, 1); text(f.t, sx, sy, f.s * (1 + 0.2 * (1 - f.l)), f.c, 'center', '#0008');
      });
      ctx.globalAlpha = 1; floats = floats.filter(f => f.l > 0);
    };
    /* taps: puzzles that check where you tapped get the spot on their own board, found by pointing into the 3D scene */
    const rc = new THREE.Raycaster(), nd = new THREE.Vector2(), hitP = new THREE.Vector3();
    K.rayPlane = function (sx, sy, normal, constant) { nd.set(sx / W * 2 - 1, -(sy / H) * 2 + 1); rc.setFromCamera(nd, cam); const pl = new THREE.Plane(normal, constant); return rc.ray.intersectPlane(pl, hitP) ? hitP.clone() : null; };
    K.raycast = function (sx, sy, objs) { nd.set(sx / W * 2 - 1, -(sy / H) * 2 + 1); rc.setFromCamera(nd, cam); return rc.intersectObjects(objs, true)[0] || null; };
    if (cfg.unmap) { const orig = window.pos; window.pos = function (e) { const r = cfg.unmap(K, e.clientX, e.clientY); return r || orig(e); }; }
    window.addEventListener('resize', () => { lw = 0; });
    return K;
  }
  window.Shell3D = { install };
})();

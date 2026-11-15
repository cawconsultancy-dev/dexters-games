/* Comet Flyer 3D: a 3D rocket flies through glowing space towers, seen from the side and a little in front. */
(function () {
  let k = 0.01, rocket, flameM, gPool = new Map(), cPool = new Map(), planetG, starsA, floorM, ceilM;
  const X = x => (x - R.x) * k, Y = y => (H / 2 - y) * k;

  function makeRocket(K) {
    const T = K.THREE, g = new T.Group(), inner = new T.Group(); g.add(inner);
    const body = K.mesh(new T.CylinderGeometry(0.42, 0.42, 1.5, 20), '#f4f6ff', { roughness: 0.35 }); body.rotation.z = -Math.PI / 2; inner.add(body);
    const nose = K.mesh(new T.ConeGeometry(0.42, 0.75, 20), '#e63946'); nose.rotation.z = -Math.PI / 2; nose.position.x = 1.12; inner.add(nose);
    const win = K.mesh(new T.SphereGeometry(0.2, 14, 10), '#5ec8ff', { roughness: 0.1, emissive: '#1d6aa8', emissiveIntensity: 0.4 }); win.position.set(0.25, 0.08, 0.36); inner.add(win);
    const rim = K.mesh(new T.TorusGeometry(0.2, 0.05, 8, 18), '#1d3a8a'); rim.position.set(0.25, 0.08, 0.37); inner.add(rim);
    for (let i = 0; i < 3; i++) { const f = K.mesh(new T.BoxGeometry(0.5, 0.06, 0.5), '#e63946'); const a = i * Math.PI * 2 / 3; f.position.set(-0.6, Math.cos(a) * 0.45, Math.sin(a) * 0.45); f.rotation.x = -a; inner.add(f); }
    const noz = K.mesh(new T.CylinderGeometry(0.28, 0.36, 0.25, 16), '#555a6b'); noz.rotation.z = -Math.PI / 2; noz.position.x = -0.85; inner.add(noz);
    flameM = new T.Mesh(new T.ConeGeometry(0.3, 1, 14), new T.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.9 })); flameM.rotation.z = Math.PI / 2; flameM.position.x = -1.4; inner.add(flameM);
    const core = new T.Mesh(new T.ConeGeometry(0.16, 0.6, 12), new T.MeshBasicMaterial({ color: '#fff3b0' })); core.position.y = 0.15; flameM.add(core);
    return g;
  }
  function makeGate(K, gt) {
    const T = K.THREE, g = new T.Group(), w = gt.w * k;
    const col = new T.Color().setHSL(gt.hue / 360, 0.75, 0.5), glow = new T.Color().setHSL(gt.hue / 360, 1, 0.75);
    const mat = new T.MeshStandardMaterial({ color: col, roughness: 0.4, emissive: col, emissiveIntensity: 0.25 });
    const capM = new T.MeshStandardMaterial({ color: glow, emissive: glow, emissiveIntensity: 0.9 });
    const top = new T.Mesh(new T.CylinderGeometry(w / 2, w / 2, 1, 6), mat), bot = top.clone();
    const capT = new T.Mesh(new T.CylinderGeometry(w / 2 + 0.12, w / 2 + 0.12, 16 * S * k, 6), capM), capB = capT.clone();
    g.add(top, bot, capT, capB); g.userData = { top, bot, capT, capB };
    for (const m of [top, bot]) for (let i = 0; i < 6; i++) { const r = new T.Mesh(new T.TorusGeometry(w / 2 + 0.02, 0.04, 6, 6), capM); r.rotation.x = Math.PI / 2; r.userData.f = i / 6; m.add(r); }
    return g;
  }

  Shell3D.install({
    shadows: false, fov: 46, hemi: 0.6, sun: 1.0, groundLight: 0x3a2a6a,
    build(K) {
      const T = K.THREE;
      K.sky('#070b2e', '#2a1b5e');
      starsA = K.stars(1400, 160, { size: 1.1 });
      const neb = new T.Mesh(new T.SphereGeometry(60, 20, 14), new T.MeshBasicMaterial({ map: K.canvasTex(256, 128, (g, w, h) => { const r = g.createRadialGradient(w * 0.3, h * 0.6, 4, w * 0.3, h * 0.6, w * 0.5); r.addColorStop(0, 'rgba(224,86,160,0.35)'); r.addColorStop(1, 'rgba(224,86,160,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }), transparent: true, side: T.BackSide, depthWrite: false, fog: false }));
      K.scene.add(neb);
      planetG = new T.Group(); const pl = K.mesh(new T.SphereGeometry(6, 32, 22), '#ff9f5a', { roughness: 0.8 }); planetG.add(pl);
      const ring = new T.Mesh(new T.RingGeometry(8, 11, 64), new T.MeshBasicMaterial({ color: '#ffdcaa', transparent: true, opacity: 0.55, side: T.DoubleSide })); ring.rotation.x = 1.25; ring.rotation.y = -0.3; planetG.add(ring);
      planetG.position.set(24, 9, -45); K.scene.add(planetG);
      const lineM = new T.MeshBasicMaterial({ color: '#7a5ae0', transparent: true, opacity: 0.35 });
      floorM = new T.Mesh(new T.BoxGeometry(400, 0.08, 0.4), lineM); ceilM = floorM.clone(); K.scene.add(floorM, ceilM);
      rocket = makeRocket(K); K.scene.add(rocket);
      K.sunLight.position.set(-4, 8, 10);
    },
    draw(K, dt) {
      if (!R) return;
      k = 9 / H;
      const t = K.time;
      floorM.position.set(0, Y(H - 20 * S) - 0.5, 0); ceilM.position.set(0, Y(20 * S) + 0.5, 0);
      // rocket
      rocket.position.set(0, Y(R.y), 0); rocket.rotation.z = -R.rot; rocket.children[0].rotation.x += (dt || 0) * 1.5;
      rocket.scale.setScalar(26 * S * k / 0.9);
      rocket.visible = !(inv > 0 && Math.floor(inv * 10) % 2);
      const fl = 0.7 + Math.random() * 0.3 + flame * 2.2; flameM.scale.set(1, fl, 1); flameM.position.x = -1.0 - fl * 0.45;
      // towers
      const seen = new Set();
      if (gates) gates.forEach(gt => {
        let m = gPool.get(gt); if (!m) { m = makeGate(K, gt); K.scene.add(m); gPool.set(gt, m); }
        seen.add(gt); const u = m.userData, cx = X(gt.x + gt.w / 2), topLen = (gt.top + 400) * k, botLen = (H - gt.top - gt.gp + 400) * k, capH = 16 * S * k;
        u.top.scale.y = topLen; u.top.position.set(0, Y(gt.top) + topLen / 2, 0);
        u.bot.scale.y = botLen; u.bot.position.set(0, Y(gt.top + gt.gp) - botLen / 2, 0);
        u.top.children.forEach(r => { r.position.y = -0.5 + r.userData.f; r.scale.set(1, 1, 1 / topLen); });
        u.bot.children.forEach(r => { r.position.y = -0.5 + r.userData.f; r.scale.set(1, 1, 1 / botLen); });
        u.capT.position.set(0, Y(gt.top) + capH / 2, 0); u.capB.position.set(0, Y(gt.top + gt.gp) - capH / 2, 0);
        m.position.x = cx; m.rotation.y = t * 0.2;
      });
      gPool.forEach((m, gt) => { if (!seen.has(gt)) { K.scene.remove(m); gPool.delete(gt); } });
      // coins
      const T = K.THREE, cs = new Set();
      if (coins) coins.forEach(c => { let m = cPool.get(c); if (!m) { const g = new T.CylinderGeometry(0.5, 0.5, 0.14, 20); g.rotateX(Math.PI / 2); m = K.mesh(g, '#ffd23f', { metalness: 0.5, roughness: 0.3, emissive: '#7a5a00', emissiveIntensity: 0.5 }); K.scene.add(m); cPool.set(c, m); }
        cs.add(c); m.position.set(X(c.x), Y(c.y), 0); m.rotation.y = c.t; m.scale.setScalar(12 * S * k / 0.5); });
      cPool.forEach((m, c) => { if (!cs.has(c)) { K.scene.remove(m); cPool.delete(c); } });
      // planet drifts slowly; the stars turn a little as you fly
      planetG.rotation.y += (dt || 0) * 0.05; starsA.rotation.y -= (dt || 0) * 0.01;
      // camera: the whole height of the game fits, seen a little from the front
      const half = H * k / 2, d = half / Math.tan(K.cam.fov * Math.PI / 360) * 1.04, cx = (W / 2 - R.x) * k;
      K.cam.position.set(cx - d * 0.18, 0.3, d); K.cam.lookAt(cx, 0, 0);
      // glowing trail, drawn flat on top
      if (trail) trail.forEach(p => { const s = K.project(X(p.x), Y(p.y), 0); ctx.fillStyle = 'rgba(255,200,120,' + p.l * 0.5 + ')'; circ(s[0], s[1], p.l * 14 * S, ctx.fillStyle); });
    },
    map(x, y) { return [X(x), Y(y), 0.3]; },
    unit: 0.011
  });
})();

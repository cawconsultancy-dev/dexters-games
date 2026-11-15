/* Sky Hopper 3D: Bobo bounces up 3D cloud platforms; the camera follows from slightly below. */
(function () {
  let k = 0.01, bobo, body, eyes = [], pPool = new Map(), sPool = new Map(), bgClouds = [], spaceStars, planet, skyKey = '';
  const X = x => (x - W / 2) * k, Y = y => -y * k;

  function cloudPlat(K, p) {
    const T = K.THREE, g = new T.Group(), w = p.w * k, top = p.type === 'm' ? '#9be7ff' : p.type === 'b' ? '#b97a45' : '#ffffff', under = p.type === 'm' ? '#4cc9f0' : p.type === 'b' ? '#7a4a22' : '#cfe3ff';
    if (p.type === 'b') {
      for (const s of [-1, 1]) { const half = K.mesh(new T.BoxGeometry(w / 2 - 0.02, 0.22, 0.9), top); half.position.set(s * w / 4, 0, 0); half.userData.s = s; g.add(half); }
      const crack = K.mesh(new T.BoxGeometry(0.04, 0.24, 0.92), under); g.add(crack);
    } else {
      const cap = new T.CapsuleGeometry(0.13, Math.max(0.05, w - 0.26), 6, 14); cap.rotateZ(Math.PI / 2);
      const base = K.mesh(cap, under, { emissive: under, emissiveIntensity: 0.25 }); base.scale.z = 2.6; base.position.y = -0.05; g.add(base);
      for (let i = 0; i <= 4; i++) { const b = K.mesh(new T.SphereGeometry(i % 2 ? 0.2 : 0.16, 14, 10), top, { emissive: top, emissiveIntensity: 0.2 }); b.scale.set(1, 0.75, 1.3); b.position.set(-w * 0.4 + i * w * 0.2, 0.06, 0); g.add(b); }
      if (p.spring) { const pad = K.mesh(new T.CylinderGeometry(0.22, 0.22, 0.08, 14), '#ff6b6b'); pad.position.y = 0.45; g.add(pad);
        const coil = K.mesh(new T.TorusGeometry(0.15, 0.03, 6, 14), '#888', { metalness: 0.6 }); coil.rotation.x = Math.PI / 2; for (let i = 0; i < 3; i++) { const c = coil.clone(); c.position.y = 0.2 + i * 0.08; g.add(c); } g.add(pad); }
    }
    return g;
  }
  function makeBobo(K) {
    const T = K.THREE, g = new T.Group();
    body = K.mesh(new T.SphereGeometry(0.5, 24, 18), '#ff7fb8', { roughness: 0.4 }); g.add(body);
    for (const s of [-1, 1]) {
      const foot = K.mesh(new T.SphereGeometry(0.18, 12, 10), '#ff5fa2'); foot.position.set(s * 0.33, -0.42, 0.05); g.add(foot);
      const eye = K.mesh(new T.SphereGeometry(0.13, 12, 10), '#ffffff'); eye.scale.set(1, 1.2, 0.6); eye.position.set(s * 0.17, 0.08, 0.43); g.add(eye); eyes.push(eye);
      const pup = K.mesh(new T.SphereGeometry(0.07, 10, 8), '#1d1b3a'); pup.position.set(s * 0.17, 0.08, 0.51); g.add(pup); eyes.push(pup);
      const cheek = K.mesh(new T.SphereGeometry(0.07, 8, 6), '#ff9cc8'); cheek.position.set(s * 0.3, -0.07, 0.4); g.add(cheek);
      const ant = K.mesh(new T.CylinderGeometry(0.025, 0.025, 0.42, 6), '#7a5ae0'); ant.position.set(s * 0.12, 0.62, 0); ant.rotation.z = -s * 0.25; g.add(ant);
      const tip = K.mesh(new T.SphereGeometry(0.09, 10, 8), '#ffd27a', { emissive: '#ffb000', emissiveIntensity: 0.4 }); tip.position.set(s * 0.18, 0.84, 0); g.add(tip);
    }
    const smile = K.mesh(new T.TorusGeometry(0.11, 0.025, 6, 16, Math.PI), '#8a1e52'); smile.rotation.z = Math.PI; smile.position.set(0, -0.1, 0.47); g.add(smile);
    return g;
  }
  function starMesh(K) {
    const T = K.THREE, sh = new T.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.16 : 0.38; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    return K.mesh(new T.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 }), '#ffd23f', { emissive: '#ffb000', emissiveIntensity: 0.7 });
  }

  Shell3D.install({
    shadows: false, fov: 40,
    build(K) {
      const T = K.THREE;
      for (let i = 0; i < 14; i++) { const c = new T.Group(); for (let j = 0; j < 3; j++) { const p = K.mesh(new T.SphereGeometry(0.6 + Math.random() * 0.4, 10, 8), '#ffffff', { roughness: 1, transparent: true, opacity: 0.35, depthWrite: false }); p.position.set(j * 0.8, Math.random() * 0.3, 0); c.add(p); } c.userData = { x: Math.random(), y: Math.random(), p: 0.3 + Math.random() * 0.3, z: -12 - Math.random() * 10 }; K.scene.add(c); bgClouds.push(c); }
      spaceStars = K.stars(700, 120, { size: 0.9, transparent: true, opacity: 0 });
      planet = new T.Group(); const pl = K.mesh(new T.SphereGeometry(4, 32, 20), '#c58bff'); planet.add(pl); const ring = K.mesh(new T.TorusGeometry(6, 0.35, 8, 60), '#ffd27a'); ring.rotation.x = 1.2; planet.add(ring); planet.visible = false; K.scene.add(planet);
      bobo = makeBobo(K); K.scene.add(bobo);
      K.sunLight.position.set(3, 6, 10);
    },
    draw(K, dt) {
      if (!P) return;
      k = 10 / W;
      const hf = clamp(-camY / (9000 * (S || 1)), 0, 1), sky = skyAt(hf), key = sky.join() + (Math.round(hf * 40));
      if (key !== skyKey) { skyKey = key; if (K.scene.background && K.scene.background.dispose) K.scene.background.dispose(); K.sky(sky[0], sky[1]); }
      spaceStars.material.opacity = clamp((hf - 0.45) * 2.5, 0, 1); spaceStars.position.y = Y(camY + H / 2);
      planet.visible = hf > 0.55; planet.position.set(X(W * 0.8), Y(camY + H * 0.25) - (camY * 0.02) * k, -30); planet.rotation.y += (dt || 0) * 0.2;
      bgClouds.forEach(c => { const u = c.userData, sy = ((u.y * (H + 200) - camY * u.p) % (H + 200) + H + 200) % (H + 200) - 100;
        c.position.set(X(u.x * W) * 2.6, Y(camY + sy) * 1, u.z); c.children.forEach(m => m.material.opacity = 0.35 * (1 - hf * 0.95)); });
      // platforms
      const seen = new Set();
      plats.forEach(p => { const sy = p.y - camY; if (sy < -80 || sy > H + 80) return;
        let m = pPool.get(p); if (!m) { m = cloudPlat(K, p); K.scene.add(m); pPool.set(p, m); }
        seen.add(p); m.position.set(X(p.x + p.w / 2), Y(p.y) - 0.12, 0);
        if (p.gone) { m.position.y -= p.gone * 300 * k; m.children.forEach(c => { if (c.userData.s) { c.rotation.z = c.userData.s * p.gone * 3; c.position.x = c.userData.s * (p.w * k / 4 + p.gone * 2); } }); } });
      pPool.forEach((m, p) => { if (!seen.has(p)) { K.scene.remove(m); pPool.delete(p); } });
      const ss = new Set();
      stars.forEach(s => { let m = sPool.get(s); if (!m) { m = starMesh(K); K.scene.add(m); sPool.set(s, m); } ss.add(s); m.position.set(X(s.x), Y(s.y + Math.sin(s.t * 3) * 5), 0); m.rotation.y = s.t * 2; m.scale.setScalar(15 * S * k / 0.38); });
      sPool.forEach((m, s) => { if (!ss.has(s)) { K.scene.remove(m); sPool.delete(s); } });
      // Bobo
      const sq = P.sq * 0.25, tilt = clamp(P.vx / (800 * S), -0.35, 0.35);
      bobo.position.set(X(P.x), Y(P.y) + 0.1, 0.2); const bs = 18 * S * k / 0.5; bobo.scale.set(bs * (1 + sq), bs * (1 - sq), bs * (1 + sq)); bobo.rotation.z = -tilt; bobo.rotation.y = P.face * 0.35;
      eyes.forEach(e => e.scale.y = P.blink > 0 ? 0.15 : (e.geometry.parameters.radius > 0.1 ? 1.2 : 1));
      // camera: square on to the game, a touch below so the clouds look solid
      const cy = Y(camY + H / 2), viewH = H * k, d = viewH / 2 / Math.tan(K.cam.fov * Math.PI / 360);
      K.cam.position.set(0, cy + 1.6, d); K.cam.lookAt(0, cy + 0.2, 0);
      K.sunLight.position.set(3, cy + 6, 10); K.sunLight.target.position.set(0, cy, 0);
    },
    map(x, y) { return [X(x), Y(y), 0.4]; },
    unit: 0.012
  });
})();

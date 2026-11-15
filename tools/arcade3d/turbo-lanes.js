/* Turbo Lanes 3D: a chase camera behind a little red race car on a 3D road. */
(function () {
  const ZK = 1.25, LANE = 3;
  let k = 0.016, road3, lines, kerbs, grass, carP, sceneryA = [], pool = new Map(), coinPool = new Map(), starPool = new Map(), dW = 0, lastScroll = null;
  const X = x => (x - W / 2) * k, Z = y => (y - P.y) * k * ZK;

  function carModel(K, col, kind, player) {
    const T = K.THREE, g = new T.Group(), len = kind === 'truck' ? 4.4 : 2.9, wid = 1.7;
    const body = K.mesh(new T.BoxGeometry(wid, 0.55, len), col); body.position.y = 0.55; g.add(body);
    if (kind === 'truck') {
      const box = K.mesh(new T.BoxGeometry(wid * 0.98, 1.3, len * 0.66), '#f1f3f5'); box.position.set(0, 1.45, len * 0.15); g.add(box);
      const cab = K.mesh(new T.BoxGeometry(wid * 0.9, 0.7, len * 0.26), col); cab.position.set(0, 1.15, -len * 0.33); g.add(cab);
      const win = K.mesh(new T.BoxGeometry(wid * 0.8, 0.35, 0.05), '#9fd8ff', { roughness: 0.1 }); win.position.set(0, 1.25, -len * 0.46 - 0.01); g.add(win);
    } else {
      const cab = K.mesh(new T.BoxGeometry(wid * 0.82, 0.5, len * 0.5), col); cab.position.set(0, 1.05, player ? 0.25 : 0.1); g.add(cab);
      const win = K.mesh(new T.BoxGeometry(wid * 0.74, 0.36, len * 0.44), '#2b3a5c', { roughness: 0.15 }); win.position.set(0, 1.07, player ? 0.25 : 0.1); win.scale.set(1.08, 1, 1.02); g.add(win);
      cab.position.y = 1.0;
    }
    const wheelG = new T.CylinderGeometry(0.36, 0.36, 0.3, 14); wheelG.rotateZ(Math.PI / 2);
    for (const a of [-1, 1]) for (const b of [-1, 1]) { const w = K.mesh(wheelG, '#222'); w.position.set(a * (wid / 2 + 0.05), 0.36, b * len * 0.32); g.add(w); }
    if (player) {
      const stripe = K.mesh(new T.BoxGeometry(0.3, 0.02, len * 1.01), '#ffffff'); stripe.position.y = 0.835; g.add(stripe);
      for (const a of [-1, 1]) { const l = K.mesh(new T.SphereGeometry(0.14, 10, 8), '#fff3b0', { emissive: '#fff3b0', emissiveIntensity: 0.8 }); l.position.set(a * 0.55, 0.62, -len / 2); g.add(l); }
      const spoiler = K.mesh(new T.BoxGeometry(wid * 1.05, 0.08, 0.4), '#7a0c12'); spoiler.position.set(0, 1.0, len / 2 - 0.15); g.add(spoiler);
    } else {
      for (const a of [-1, 1]) { const l = K.mesh(new T.SphereGeometry(0.13, 8, 6), '#ff4040', { emissive: '#ff2020', emissiveIntensity: 0.6 }); l.position.set(a * 0.6, 0.62, len / 2); g.add(l); }
    }
    g.userData.len = len; return g;
  }

  Shell3D.install({
    shadows: true, fov: 52,
    build(K) {
      const T = K.THREE;
      K.sky('#5fb6ff', '#d8f1ff'); K.scene.fog = new T.Fog('#d8f1ff', 30, 70);
      grass = K.mesh(new T.PlaneGeometry(300, 300), new T.MeshStandardMaterial({ map: K.canvasTex(64, 64, (g) => { g.fillStyle = '#4caf50'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#43a047'; g.fillRect(0, 0, 64, 32); }), roughness: 1 }));
      grass.material.map.wrapS = grass.material.map.wrapT = T.RepeatWrapping; grass.material.map.repeat.set(1, 50);
      grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.02, -120); K.scene.add(grass);
      const roadTex = K.canvasTex(192, 128, (g) => { g.fillStyle = '#5b5f6b'; g.fillRect(0, 0, 192, 128); g.fillStyle = 'rgba(255,255,255,0.9)'; for (const x of [64, 128]) g.fillRect(x - 3, 10, 6, 60); });
      roadTex.wrapS = roadTex.wrapT = T.RepeatWrapping; roadTex.repeat.set(1, 300 / 7); roadTex.anisotropy = 8;
      road3 = K.mesh(new T.PlaneGeometry(LANE * 3, 300), new T.MeshStandardMaterial({ map: roadTex, roughness: 0.9 }));
      road3.rotation.x = -Math.PI / 2; road3.position.set(0, 0, -120); K.scene.add(road3); lines = roadTex;
      const kerbTex = K.canvasTex(16, 64, (g) => { g.fillStyle = '#e63946'; g.fillRect(0, 0, 16, 32); g.fillStyle = '#fff'; g.fillRect(0, 32, 16, 32); });
      kerbTex.wrapS = kerbTex.wrapT = T.RepeatWrapping; kerbTex.repeat.set(1, 300 / 2.4); kerbs = kerbTex;
      for (const s of [-1, 1]) { const kb = K.mesh(new T.BoxGeometry(0.5, 0.18, 300), new T.MeshStandardMaterial({ map: kerbTex })); kb.position.set(s * (LANE * 1.5 + 0.25), 0.09, -120); K.scene.add(kb); }
      // trees, bushes and little houses along both sides
      for (let i = 0; i < 40; i++) {
        const g = new T.Group(), side = i % 2 ? 1 : -1, r = Math.random();
        if (r < 0.6) { const t = K.mesh(new T.CylinderGeometry(0.2, 0.28, 1.4, 7), '#8a5a2b'); t.position.y = 0.7; g.add(t); const c = K.mesh(new T.SphereGeometry(1.1 + Math.random() * 0.5, 10, 8), ['#2e8b3a', '#3fa34d', '#56b85e'][i % 3]); c.position.y = 2.1; g.add(c); }
        else if (r < 0.8) { const h = K.mesh(new T.BoxGeometry(2, 1.6, 2), ['#f2e3c6', '#ffd6a5', '#cfe3ff'][i % 3]); h.position.y = 0.8; g.add(h); const rf = K.mesh(new T.ConeGeometry(1.6, 1.1, 4), '#c0392b'); rf.position.y = 2.15; rf.rotation.y = Math.PI / 4; g.add(rf); }
        else { for (let j = 0; j < 4; j++) { const f = K.mesh(new T.SphereGeometry(0.18, 8, 6), ['#ff6fb5', '#ffd23f', '#ffffff', '#ff8a1f'][j]); f.position.set((Math.random() - 0.5) * 1.2, 0.25, (Math.random() - 0.5) * 1.2); g.add(f); } }
        g.position.set(side * (LANE * 1.5 + 2.2 + Math.random() * 7), 0, 10 - i * 3.6); g.rotation.y = Math.random() * 6; K.scene.add(g); sceneryA.push(g);
      }
      carP = carModel(K, '#ff3b3b', 'car', true); K.scene.add(carP);
      K.sunLight.position.set(5, 14, 6);
    },
    draw(K, dt) {
      if (!road || !P) return;
      k = LANE / road.lw; AH = H * 0.9; // see further down the road than the flat game did
      if (lastScroll === null || scroll < lastScroll) lastScroll = scroll;
      dW = (scroll - lastScroll) * k * ZK; lastScroll = scroll;
      lines.offset.y = (lines.offset.y + dW / 7) % 1; kerbs.offset.y = (kerbs.offset.y + dW / 2.4) % 1; grass.material.map.offset.y = (grass.material.map.offset.y + dW / 6) % 1;
      sceneryA.forEach(g => { g.position.z += dW; if (g.position.z > 14) g.position.z -= 40 * 3.6; });
      // player
      const px = X(P.x); carP.position.set(px, 0, 0); carP.rotation.y = P.tilt * 0.9; carP.rotation.z = -P.tilt * 0.15;
      carP.visible = !(inv > 0 && Math.floor(inv * 10) % 2);
      const glow = power > 0 && state === 'play';
      carP.children[0].material.emissive && carP.children[0].material.emissive.setHSL(glow ? (K.time * 0.6) % 1 : 0, 1, glow ? 0.35 : 0);
      // traffic
      const seen = new Set();
      traffic.forEach(c => {
        let m = pool.get(c); if (!m) { m = carModel(K, c.c, c.kind, false); K.scene.add(m); pool.set(c, m); }
        seen.add(c); const z = Z(c.y);
        m.position.set(X(laneX(c.lane)) + (c.fly ? c.vx * 0.1 * c.rot * k : 0), c.fly ? c.rot * 0.6 : 0, z);
        m.rotation.set(c.fly ? c.rot * 0.7 : 0, Math.PI + (c.rot || 0) * 0.5, c.fly ? c.rot : 0);
      });
      pool.forEach((m, c) => { if (!seen.has(c)) { K.scene.remove(m); pool.delete(c); } });
      // coins and stars
      const T = K.THREE, cs = new Set();
      coins.forEach(c => {
        let m = coinPool.get(c); if (!m) { const g = new T.CylinderGeometry(0.5, 0.5, 0.14, 20); g.rotateX(Math.PI / 2); m = K.mesh(g, '#ffd23f', { metalness: 0.5, roughness: 0.3, emissive: '#7a5a00', emissiveIntensity: 0.4 }); K.scene.add(m); coinPool.set(c, m); }
        cs.add(c); m.position.set(X(laneX(c.lane)), 0.9, Z(c.y)); m.rotation.y = c.t;
      });
      coinPool.forEach((m, c) => { if (!cs.has(c)) { K.scene.remove(m); coinPool.delete(c); } });
      const ss = new Set();
      stars.forEach(s => {
        let m = starPool.get(s);
        if (!m) { const sh = new T.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.36 : 0.85; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
          m = K.mesh(new T.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06 }), '#ffd23f', { emissive: '#ffb000', emissiveIntensity: 0.7 }); K.scene.add(m); starPool.set(s, m); }
        ss.add(s); m.position.set(X(laneX(s.lane)), 1.2 + Math.sin(s.t * 3) * 0.15, Z(s.y)); m.rotation.y = s.t * 2;
      });
      starPool.forEach((m, s) => { if (!ss.has(s)) { K.scene.remove(m); starPool.delete(s); } });
      // camera: low behind the car, looking down the road
      const cx = px * 0.35;
      K.cam.position.set(cx, 6.2 + (glow ? -0.3 : 0), 11.5); K.cam.lookAt(cx, 0.4, -12);
      K.cam.fov = W > H ? 52 : 70; K.cam.updateProjectionMatrix();
      K.sunLight.position.set(cx + 5, 14, 6); K.sunLight.target.position.set(cx, 0, -6);
    },
    map(x, y, o) { if (!o.w) o.w = { y0: y }; return [X(x), 0.8 + (o.w.y0 - y) * k, Z(o.w.y0)]; },
    unit: 0.016
  });
})();

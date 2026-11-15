/* Dino Dash 3D: Rexy runs along a 3D desert track, seen from the side and a little in front. */
(function () {
  let k = 0.016, dino, legs = [], tail, obsPool = new Map(), eggPool = new Map(), ground, groundTex, scen = [], lastD = null;
  const X = x => (x - D.x) * k, Y = y => (groundY - y) * k;

  function makeDino(K) {
    const T = K.THREE, g = new T.Group(), body = '#5cc96b', dark = '#3a9d4a';
    const b = K.mesh(new T.SphereGeometry(0.62, 18, 14), body); b.scale.set(1.15, 0.95, 0.85); b.position.set(0, 1.05, 0); g.add(b);
    const belly = K.mesh(new T.SphereGeometry(0.42, 14, 10), '#c9f2b0'); belly.scale.set(0.9, 0.95, 0.75); belly.position.set(0.2, 0.95, 0.22); g.add(belly);
    const neck = K.mesh(new T.CylinderGeometry(0.28, 0.36, 0.6, 12), body); neck.position.set(0.42, 1.6, 0); neck.rotation.z = -0.45; g.add(neck);
    const head = K.mesh(new T.BoxGeometry(0.95, 0.62, 0.62), body); head.position.set(0.85, 2.0, 0); g.add(head);
    const jaw = K.mesh(new T.BoxGeometry(0.75, 0.22, 0.55), body); jaw.position.set(0.95, 1.68, 0); g.add(jaw);
    for (const s of [-1, 1]) {
      const eye = K.mesh(new T.SphereGeometry(0.13, 10, 8), '#ffffff'); eye.position.set(1.05, 2.12, s * 0.3); g.add(eye);
      const pup = K.mesh(new T.SphereGeometry(0.07, 8, 6), '#1d1b3a'); pup.position.set(1.12, 2.12, s * 0.38); g.add(pup);
      const cheek = K.mesh(new T.SphereGeometry(0.08, 8, 6), '#ff8296'); cheek.position.set(1.05, 1.88, s * 0.31); g.add(cheek);
    }
    tail = new T.Group(); const tl = K.mesh(new T.ConeGeometry(0.34, 1.3, 12), body); tl.rotation.z = Math.PI / 2; tl.position.x = -0.6; tail.add(tl); tail.position.set(-0.55, 1.1, 0); g.add(tail);
    for (let i = 0; i < 4; i++) { const sp = K.mesh(new T.ConeGeometry(0.12, 0.3, 6), '#f2b33d'); sp.position.set(-0.45 + i * 0.32, 1.62 - Math.abs(i - 1.5) * 0.05, 0); g.add(sp); }
    for (const s of [-1, 1]) {
      const leg = new T.Group(); const l = K.mesh(new T.CylinderGeometry(0.14, 0.12, 0.62, 10), dark); l.position.y = -0.31; leg.add(l);
      const foot = K.mesh(new T.BoxGeometry(0.36, 0.12, 0.24), '#2f7d3a'); foot.position.set(0.08, -0.62, 0); leg.add(foot);
      leg.position.set(0.05, 0.68, s * 0.3); g.add(leg); legs.push(leg);
      const arm = K.mesh(new T.CylinderGeometry(0.06, 0.05, 0.3, 6), dark); arm.position.set(0.45, 1.15, s * 0.42); arm.rotation.z = 0.8; g.add(arm);
    }
    return g;
  }
  function makeObs(K, o) {
    const T = K.THREE, g = new T.Group(), w = o.w * k, h = o.h * k;
    if (o.type === 'rock') { const r = K.mesh(new T.DodecahedronGeometry(0.5, 0), '#9a938e', { flatShading: true }); r.scale.set(w, h * 1.6, w * 0.9); r.position.set(w / 2, h * 0.5, 0); g.add(r); }
    else if (o.type === 'log') { const l = K.mesh(new T.CylinderGeometry(h / 2, h / 2, w, 14), '#8a5a2b'); l.rotation.z = Math.PI / 2; l.position.set(w / 2, h / 2, 0); g.add(l);
      for (const s of [-1, 1]) { const e = K.mesh(new T.CircleGeometry(h / 2 * 0.92, 16), '#c58b54'); e.rotation.y = s * Math.PI / 2; e.position.set(w / 2 + s * w / 2 * 1.001, h / 2, 0); g.add(e); } }
    else { const n = o.type === 'cactus2' ? 2 : 1; for (let i = 0; i < n; i++) { const cw = (o.type === 'cactus2' ? o.w * 0.3 : o.w * 0.5) * k, ch = (o.h * (i ? 0.8 : 1)) * k, cx = (o.w / (n * 2) + i * o.w / 2) * k;
      const t = K.mesh(new T.CylinderGeometry(cw / 2, cw / 2, ch, 12), '#3a9d4a'); t.position.set(cx, ch / 2, 0); g.add(t);
      const top = K.mesh(new T.SphereGeometry(cw / 2, 12, 8), '#3a9d4a'); top.position.set(cx, ch, 0); g.add(top);
      const fl = K.mesh(new T.SphereGeometry(cw * 0.22, 8, 6), '#ff8fb1'); fl.position.set(cx, ch + cw * 0.4, 0); g.add(fl);
      for (const s of [-1, 1]) { const a = K.mesh(new T.CylinderGeometry(cw * 0.22, cw * 0.22, ch * 0.35, 8), '#3a9d4a'); a.position.set(cx + s * cw * 0.75, ch * (s < 0 ? 0.55 : 0.65), 0); g.add(a);
        const j = K.mesh(new T.CylinderGeometry(cw * 0.2, cw * 0.2, cw * 0.6, 8), '#3a9d4a'); j.rotation.z = Math.PI / 2; j.position.set(cx + s * cw * 0.5, ch * (s < 0 ? 0.4 : 0.5), 0); g.add(j); } } }
    return g;
  }

  Shell3D.install({
    shadows: true, fov: 45,
    build(K) {
      const T = K.THREE;
      K.sky('#ffb978', '#ffe7c2'); K.scene.fog = new T.Fog('#ffe7c2', 50, 120);
      groundTex = K.canvasTex(128, 128, (g) => { g.fillStyle = '#e9c99a'; g.fillRect(0, 0, 128, 128); g.fillStyle = 'rgba(160,110,60,0.25)'; g.fillRect(10, 30, 40, 8); g.fillRect(70, 90, 30, 6); g.fillStyle = '#d9b07a'; g.fillRect(0, 0, 128, 4); });
      groundTex.wrapS = groundTex.wrapT = T.RepeatWrapping; groundTex.repeat.set(60, 6);
      ground = K.mesh(new T.PlaneGeometry(240, 24), new T.MeshStandardMaterial({ map: groundTex, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set(40, 0, -4); K.scene.add(ground);
      const pathTex = K.canvasTex(128, 32, (g) => { g.fillStyle = '#d9b07a'; g.fillRect(0, 0, 128, 32); g.fillStyle = 'rgba(140,90,45,0.35)'; for (let i = 0; i < 6; i++) g.fillRect(i * 22 + 4, 6 + (i % 3) * 8, 10, 4); });
      pathTex.wrapS = pathTex.wrapT = T.RepeatWrapping; pathTex.repeat.set(60, 1); K.pathTex = pathTex;
      const path = K.mesh(new T.PlaneGeometry(240, 2.6), new T.MeshStandardMaterial({ map: pathTex, roughness: 1 })); path.rotation.x = -Math.PI / 2; path.position.set(40, 0.01, 0); K.scene.add(path);
      const far = K.mesh(new T.PlaneGeometry(400, 120), '#9fd6a0'); far.rotation.x = -Math.PI / 2; far.position.set(40, -0.05, -70); K.scene.add(far);
      // hills, a volcano and cacti in the distance, moving slower than the track
      for (let i = 0; i < 18; i++) { const h = K.mesh(new T.SphereGeometry(4 + Math.random() * 5, 16, 10), i % 2 ? '#6cc070' : '#8fd08f'); h.scale.y = 0.45; h.position.set(-20 + i * 9, 0, -38 - Math.random() * 16); h.userData.p = 0.35; K.scene.add(h); scen.push(h); }
      const vol = new T.Group(); const vc = K.mesh(new T.CylinderGeometry(2.2, 8, 9, 20, 1, true), '#c97b63'); vc.position.y = 4.5; vol.add(vc);
      const lava = K.mesh(new T.CircleGeometry(2.2, 20), '#ff7a45', { emissive: '#ff5a1f', emissiveIntensity: 0.8 }); lava.rotation.x = -Math.PI / 2; lava.position.y = 8.98; vol.add(lava);
      vol.position.set(30, 0, -70); vol.userData.p = 0.1; K.scene.add(vol); scen.push(vol);
      for (let i = 0; i < 6; i++) { const c = new T.Group(); for (let j = 0; j < 3; j++) { const p = K.mesh(new T.SphereGeometry(1.2 + Math.random(), 10, 8), '#ffffff', { roughness: 1 }); p.position.set(j * 1.4, Math.random() * 0.6, 0); c.add(p); } c.position.set(-10 + i * 14, 12 + Math.random() * 6, -60); c.userData.p = 0.03; K.scene.add(c); scen.push(c); }
      const sunM = K.mesh(new T.SphereGeometry(3, 20, 14), '#fff2b3', { emissive: '#fff2b3', emissiveIntensity: 1 }); sunM.position.set(55, 22, -80); K.scene.add(sunM);
      dino = makeDino(K); K.scene.add(dino);
    },
    draw(K, dt) {
      if (!D) return;
      k = 1 / (36 * S);
      if (lastD === null || dist2 < lastD) lastD = dist2;
      const moved = (state === 'play' ? (dist2 - lastD) : 120 * (dt || 0) * S) * k; lastD = dist2;
      groundTex.offset.x = (groundTex.offset.x + moved / 4) % 1; K.pathTex.offset.x = (K.pathTex.offset.x + moved / 4) % 1;
      scen.forEach(o => { o.position.x -= moved * o.userData.p; if (o.position.x < -30) o.position.x += 170; });
      // Rexy
      const air = D.y < groundY - 1;
      dino.position.set(0, Y(D.y), 0); dino.scale.set(1 + D.squash * 0.4, 1 - D.squash * 0.5, 1);
      legs[0].rotation.z = air ? 0.5 : Math.sin(legT) * 0.7; legs[1].rotation.z = air ? -0.3 : Math.sin(legT + Math.PI) * 0.7;
      tail.rotation.y = Math.sin(legT) * 0.25; dino.rotation.z = air ? -0.12 : 0;
      dino.visible = !(inv > 0 && Math.floor(inv * 10) % 2);
      // rocks, logs and cacti
      const seen = new Set();
      obs.forEach(o => { let m = obsPool.get(o); if (!m) { m = makeObs(K, o); K.scene.add(m); obsPool.set(o, m); } seen.add(o); m.position.set(X(o.x), 0, 0); });
      obsPool.forEach((m, o) => { if (!seen.has(o)) { K.scene.remove(m); obsPool.delete(o); } });
      // eggs
      const T = K.THREE, es = new Set();
      eggs.forEach(e => { let m = eggPool.get(e);
        if (!m) { m = new T.Group(); const egg = K.mesh(new T.SphereGeometry(0.3, 16, 12), e.gold ? '#ffcf3f' : '#fffaf0', e.gold ? { metalness: 0.4, roughness: 0.25, emissive: '#b37a00', emissiveIntensity: 0.4 } : {}); egg.scale.set(1, 1.3, 1); m.add(egg);
          if (!e.gold) [['#8fd3ff', 0.2, 0.1, 0.22], ['#ff9ecb', -0.15, -0.1, 0.24], ['#9be15d', 0.05, 0.25, 0.2]].forEach(([c, a, b, z]) => { const sp = K.mesh(new T.SphereGeometry(0.07, 8, 6), c); sp.position.set(a, b, z); m.add(sp); });
          K.scene.add(m); eggPool.set(e, m); }
        es.add(e); m.position.set(X(e.x), Y(e.y + Math.sin(e.t) * 4), 0); m.rotation.y = e.t * 0.8; m.rotation.z = Math.sin(e.t * 0.7) * 0.2; });
      eggPool.forEach((m, e) => { if (!es.has(e)) { K.scene.remove(m); eggPool.delete(e); } });
      // camera: from the side and a bit in front, with room to see what is coming
      // on a tall, narrow screen pull back a little less and aim nearer Rexy, so he stays a good size
      const narrow = Math.pow(Math.max(1, 1.45 / K.cam.aspect), 0.6), lx = K.cam.aspect >= 1.2 ? 6 : 4.6;
      K.cam.position.set(lx, 4.6, 16 * narrow); K.cam.lookAt(lx, 3.9, 0);
      K.sunLight.position.set(8, 14, 10); K.sunLight.target.position.set(4, 0, 0);
    },
    map(x, y) { return [X(x), Y(y), 0.4]; },
    unit: 0.03
  });
})();

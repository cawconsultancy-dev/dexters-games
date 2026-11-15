/* Sky Tower 3D: real 3D floors stacked on a grassy base, seen from a slanted corner view. */
(function () {
  let k = 0.01, FH = 0.5, DEP = 2.2, pool = new Map(), curM = null, curKey = '', fallPool = new Map(), winTex, ground, skyKey = '', stars3, camYW = 0, baseSlab;
  const X = x => (x - W / 2) * k;
  const Yl = y => (H * 0.72 + bh - y) * k; // logic y (before scrolling) to height

  function floorMesh(K, w, hue, alpha) {
    const T = K.THREE, t = winTex.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(w / 0.55)), 1);
    const m = new T.MeshStandardMaterial({ color: new T.Color().setHSL(hue / 360, 0.7, 0.6), map: t, roughness: 0.5, transparent: alpha < 1, opacity: alpha });
    const side = new T.MeshStandardMaterial({ color: new T.Color().setHSL(hue / 360, 0.6, 0.5), roughness: 0.6, transparent: alpha < 1, opacity: alpha });
    const roof = new T.MeshStandardMaterial({ color: new T.Color().setHSL(hue / 360, 0.55, 0.78), roughness: 0.6, transparent: alpha < 1, opacity: alpha });
    const b = new T.Mesh(new T.BoxGeometry(w, FH, DEP), [side, side, roof, side, m, m]); b.castShadow = b.receiveShadow = true;
    b.userData.w = w; return b;
  }

  Shell3D.install({
    shadows: true, fov: 42,
    build(K) {
      const T = K.THREE;
      winTex = K.canvasTex(64, 32, (g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 32); g.fillStyle = '#bfe6ff'; g.fillRect(14, 8, 36, 16); g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 28, 64, 4); });
      winTex.wrapS = T.RepeatWrapping;
      K.scene.fog = new T.Fog('#cfeaff', 40, 120);
      ground = K.mesh(new T.CircleGeometry(160, 48), '#7bc96f', { roughness: 1 }); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; K.scene.add(ground);
      for (let i = 0; i < 26; i++) { const a = Math.PI + Math.random() * Math.PI, r = 6 + Math.random() * 18, t = new T.Group(); // behind and to the sides, never between the camera and the tower
        const tr = K.mesh(new T.CylinderGeometry(0.12, 0.16, 0.7, 6), '#8a5a2b'); tr.position.y = 0.35; t.add(tr);
        const c = K.mesh(new T.SphereGeometry(0.55 + Math.random() * 0.3, 10, 8), ['#4c9a4a', '#5bb85a', '#3f8a3f'][i % 3]); c.position.y = 1.0; t.add(c);
        t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 2); K.scene.add(t); }
      for (let i = 0; i < 10; i++) { const c = new T.Group(); for (let j = 0; j < 3; j++) { const p = K.mesh(new T.SphereGeometry(1 + Math.random() * 0.5, 10, 8), '#ffffff', { roughness: 1, transparent: true, opacity: 0.8 }); p.position.set(j * 1.3, Math.random() * 0.5, 0); c.add(p); }
        c.position.set(-16 + Math.random() * 32, 3 + i * 4.5, -10 - Math.random() * 12); K.scene.add(c); }
      stars3 = K.stars(800, 140, { size: 1, transparent: true, opacity: 0 });
      baseSlab = K.mesh(new T.BoxGeometry(1, 0.2, DEP + 0.6), '#d9a066'); K.scene.add(baseSlab);
    },
    draw(K, dt) {
      if (!stack) return;
      k = 11 / Math.max(W, 1); FH = bh * k; DEP = Math.max(1.6, base.w * k);
      const hf = clamp(camY / (bh * 60 || 1), 0, 1), key = Math.round(hf * 30);
      if (key !== skyKey) { skyKey = key; K.sky('hsl(' + lerp(205, 250, hf) + ',' + lerp(80, 60, hf) + '%,' + lerp(70, 22, hf) + '%)', 'hsl(' + lerp(190, 280, hf) + ',70%,' + lerp(88, 40, hf) + '%)'); }
      stars3.material.opacity = clamp((hf - 0.4) * 1.6, 0, 1);
      baseSlab.scale.x = base.w * k + 0.6; baseSlab.position.set(X(base.x + base.w / 2), 0.1, 0);
      // floors already built
      const seen = new Set();
      stack.forEach((b, i) => {
        let m = pool.get(b); if (!m || Math.abs(m.userData.w - b.w * k) > 1e-6) { if (m) K.scene.remove(m); m = floorMesh(K, b.w * k, b.hue, 1); K.scene.add(m); pool.set(b, m); }
        seen.add(b); m.position.set(X(b.x + b.w / 2), 0.2 + i * FH + FH / 2, 0);
      });
      pool.forEach((m, b) => { if (!seen.has(b)) { K.scene.remove(m); pool.delete(b); } });
      // the floor sliding in
      if (cur) {
        const key2 = cur.w + '|' + cur.hue;
        if (!curM || curKey !== key2) { if (curM) K.scene.remove(curM); curM = floorMesh(K, cur.w * k, cur.hue, 1); curKey = key2; K.scene.add(curM); }
        curM.visible = true; curM.position.set(X(cur.x + cur.w / 2), 0.2 + stack.length * FH + FH / 2, 0);
      } else if (curM) curM.visible = false;
      // pieces that were cut off and fall
      const fs = new Set();
      fall.forEach(f => { let m = fallPool.get(f); if (!m) { m = floorMesh(K, f.w * k, f.hue, 0.9); K.scene.add(m); fallPool.set(f, m); }
        fs.add(f); m.position.set(X(f.x + f.w / 2), 0.2 + Yl(f.y + bh) + FH / 2, 0); m.rotation.z = -f.rot; });
      fallPool.forEach((m, f) => { if (!fs.has(f)) { K.scene.remove(m); fallPool.delete(f); } });
      // camera: a slanted corner view that rises with the tower
      const want = Math.max(0, stack.length - 4) * FH; camYW = lerp(camYW, want, Math.min(1, (dt || 0) * 5));
      const span = 12.5, d = span / 2 / Math.tan(K.cam.fov * Math.PI / 360) / Math.min(1, K.cam.aspect);
      K.cam.position.set(d * 0.3, camYW + 2.6 + d * 0.13, d * 0.95); K.cam.lookAt(0, camYW + 2.4, 0);
      K.sunLight.position.set(6, camYW + 14, 8); K.sunLight.target.position.set(0, camYW, 0);
      if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + flash * 0.5 + ')'; ctx.fillRect(0, 0, W, H); }
    },
    /* sparkles and messages float up from the top of the tower */
    map(x, y, o) { if (!o.w) o.w = { y0: y, top: 0.2 + stack.length * FH }; return [X(x), o.w.top + (o.w.y0 - y) * k, DEP / 2 + 0.2]; },
    unit: 0.011
  });
})();

/* Balance Scales 3D: a wooden balance with hanging pans; animals on one side, chunky number blocks on the other. */
(function () {
  let k = 0.01, stand, beam, pivot, pans = [], strings = [], leftItems = new Map(), rightItems = [], trayItems = [], texCache = {};
  const X = x => (x - cx) * k, Y = y => (cy - y) * k;

  function dotsCanvas(g, x, y, n, r, col) { const rows = Math.ceil(n / 4); g.fillStyle = col; for (let i = 0; i < n; i++) { const row = Math.floor(i / 4), c = i % 4, kk = row < rows - 1 ? 4 : n - row * 4; g.beginPath(); g.arc(x + (c - (kk - 1) / 2) * r * 2.6, y + (row - (rows - 1) / 2) * r * 2.6, r, 0, 7); g.fill(); } }
  function blockMat(K, v) { const key = 'b' + v; if (texCache[key]) return texCache[key];
    const t = K.canvasTex(128, 128, (g) => { g.fillStyle = BC[v]; g.fillRect(0, 0, 128, 128); dotsCanvas(g, 64, 64, v, 9, '#ffffff'); });
    return texCache[key] = new K.THREE.MeshStandardMaterial({ map: t, roughness: 0.45 }); }
  function animalTex(K, v) { const key = 'a' + v; if (texCache[key]) return texCache[key];
    return texCache[key] = K.canvasTex(256, 320, (g) => { g.font = '200px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ANI[v] || '🐾', 128, 120);
      const rows = Math.ceil(v / 4), bw = 40 + Math.min(v, 4) * 40, bh = 34 + rows * 30; g.fillStyle = '#ffffffee'; g.beginPath(); g.roundRect ? g.roundRect(128 - bw / 2, 238, bw, bh, 16) : g.rect(128 - bw / 2, 238, bw, bh); g.fill(); dotsCanvas(g, 128, 238 + bh / 2, v, 11, '#1d1b3a'); }); }
  function cube(K, v, s) { const T = K.THREE, m = new T.Mesh(new T.BoxGeometry(s, s, s), blockMat(K, v)); m.castShadow = true; return m; }

  Shell3D.install({
    shadows: true, fov: 36,
    build(K) {
      const T = K.THREE;
      K.sky('#b9a6ff', '#6b4fbf');
      const floor = K.mesh(new T.PlaneGeometry(60, 30), '#5a43a8', { roughness: 1 }); floor.rotation.x = -Math.PI / 2; K.scene.add(floor); K.floor = floor;
      stand = new T.Group(); const post = K.mesh(new T.CylinderGeometry(0.12, 0.5, 1, 4), '#7a5434'); post.rotation.y = Math.PI / 4; stand.add(post); const foot = K.mesh(new T.BoxGeometry(1.8, 0.2, 1.0), '#5a3e24'); stand.add(foot); const plinth = K.mesh(new T.CylinderGeometry(0.45, 0.6, 1, 20), '#6a4a2c'); stand.add(plinth); stand.userData = { post, foot, plinth }; K.scene.add(stand);
      beam = K.mesh(new T.BoxGeometry(1, 0.16, 0.22), '#8a5a2a'); K.scene.add(beam);
      pivot = K.mesh(new T.SphereGeometry(0.16, 16, 12), '#ffd23f', { metalness: 0.4 }); K.scene.add(pivot);
      for (let i = 0; i < 2; i++) { const p = new T.Group(); const dish = K.mesh(new T.CylinderGeometry(1, 0.82, 0.14, 32), '#c9a24a', { metalness: 0.4, roughness: 0.35 }); p.add(dish); K.scene.add(p); pans.push(p);
        const sm = new T.LineBasicMaterial({ color: '#5a4a3a' }); const sg = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3(), new T.Vector3(), new T.Vector3()]); const ln = new T.LineSegments(sg, sm); K.scene.add(ln); strings.push(ln); }
    },
    draw(K, dt) {
      if (!left) return;
      const T = K.THREE; k = 9 / Math.max(H, W * 0.75);
      const pw = panW * k;
      // stand and beam
      const sh = 260 * k; stand.userData.post.scale.set(1, sh, 1); stand.userData.post.position.y = sh / 2; stand.position.set(0, Y(cy + 260), 0); stand.userData.foot.position.y = 0.05;
      const below = Y(H + 30) - Y(cy + 260); stand.userData.plinth.scale.y = Math.max(0.01, -below); stand.userData.plinth.position.y = below / 2 - 0.0; K.floor.position.y = Y(H + 30);
      beam.scale.x = (arm * 2 + 20) * k; beam.position.set(0, 0, 0); beam.rotation.z = -ang; pivot.position.set(0, 0, 0.15);
      // pans hang from the ends of the beam
      hits = []; trayHits = [];
      const panAt = side => { const ex = cx + side * arm * Math.cos(ang), ey = cy + side * arm * Math.sin(ang); return [ex, ey, ey + 120]; };
      [-1, 1].forEach((side, i) => { const [ex, ey, py] = panAt(side); pans[i].position.set(X(ex), Y(py), 0); pans[i].scale.set(pw / 2, 1, pw / 2.6);
        const a = strings[i].geometry.attributes.position; a.setXYZ(0, X(ex), Y(ey), 0); a.setXYZ(1, X(ex - panW * 0.45), Y(py), 0); a.setXYZ(2, X(ex), Y(ey), 0); a.setXYZ(3, X(ex + panW * 0.45), Y(py), 0); a.needsUpdate = true; });
      // animals on the left pan, as standing pictures with their weight dots
      const [lx, , lpy] = panAt(-1), ls = Math.min(78, panW / Math.max(1, left.length) * 0.9);
      const seenL = new Set();
      left.forEach((v, i) => { const key = i + ':' + v; let s = leftItems.get(key); if (!s) { s = new T.Sprite(new T.SpriteMaterial({ map: animalTex(K, v), transparent: true })); K.scene.add(s); leftItems.set(key, s); }
        seenL.add(key); const x = lx + (i - (left.length - 1) / 2) * ls * 1.05, w = ls * 1.1 * k; s.scale.set(w, w * 1.25, 1); s.center.set(0.5, 0); s.position.set(X(x), Y(lpy) + 0.07, 0.1); });
      leftItems.forEach((s, key) => { if (!seenL.has(key)) { K.scene.remove(s); leftItems.delete(key); } });
      // blocks on the right pan
      const [rx, , rpy] = panAt(1), bs = Math.min(54, panW / 5.2);
      while (rightItems.length > right.length) K.scene.remove(rightItems.pop().m);
      right.forEach((v, i) => { if (!rightItems[i] || rightItems[i].v !== v) { if (rightItems[i]) K.scene.remove(rightItems[i].m); rightItems[i] = { v, m: cube(K, v, bs * k * 0.95) }; K.scene.add(rightItems[i].m); }
        const row = Math.floor(i / 5), col = i % 5, kk = Math.min(5, right.length - row * 5), x = rx + (col - (kk - 1) / 2) * bs * 1.05, y = rpy - bs / 2 - 4 - row * bs * 1.02;
        const m = rightItems[i].m; m.position.set(X(x), Y(y), 0); m.rotation.y = 0.35;
        const p = K.project(X(x), Y(y), 0), ps = K.project(X(x) + bs * k / 2, Y(y), 0); hits.push({ x: p[0], y: p[1], s: Math.abs(ps[0] - p[0]) * 2, i }); });
      // the tray of blocks to tap
      const ty = H - 80, n = tray.length, r = Math.min(46, W / (n * 3));
      while (trayItems.length > n) K.scene.remove(trayItems.pop().m);
      tray.forEach((v, i) => { if (!trayItems[i] || trayItems[i].v !== v) { if (trayItems[i]) K.scene.remove(trayItems[i].m); trayItems[i] = { v, m: cube(K, v, r * 1.55 * k) }; K.scene.add(trayItems[i].m); }
        const x = cx + (i - (n - 1) / 2) * r * 2.8, m = trayItems[i].m; m.position.set(X(x), Y(ty), 0.3); m.rotation.y = 0.35 + Math.sin(K.time * 2 + i) * 0.15;
        const p = K.project(X(x), Y(ty), 0.3), pr = K.project(X(x) + r * k, Y(ty), 0.3); trayHits.push({ x: p[0], y: p[1], r: Math.abs(pr[0] - p[0]) * 1.25, v }); });
      // camera: in front, so the 3D scales line up with where the flat game had them
      const viewH = H * k, d = viewH / 2 / Math.tan(K.cam.fov * Math.PI / 360), yc = Y(H / 2);
      K.cam.position.set(0, yc + 0.5, d); K.cam.lookAt(0, yc + 0.1, 0);
      K.sunLight.position.set(3, 10, 8);
      const dd = sum(right) - sum(left), tp = K.project(0, Y(cy - 52), 0);
      text(dd === 0 && right.length ? '⚖️ Balanced!' : dd < 0 ? 'Needs more blocks' : 'Too heavy! Take some off', W / 2, tp[1], 22, '#fff', 'center', '#0007');
      const tt = K.project(0, Y(ty - r - 26), 0.3); text('Tap a block:', W / 2, tt[1] - 6, 20, '#fff', 'center', '#0007');
      lvLabel();
    },
    map(x, y) { return [X(x), Y(y), 0.3]; },
    unit: 0.012
  });
})();

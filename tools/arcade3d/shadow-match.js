/* Shadow Match 3D: thick picture cards you drag up into 3D frames on the wall that hold their shadows.
   Every card and frame is placed exactly where the flat game puts it on screen, so dragging works the same. */
(function () {
  let cards = new Map(), frames = new Map(), slots = new Map(), texC = {};
  const ZW = -1.2, ZC = 0.4; // depth of the wall frames and of the cards
  let KK = null;
  const at = (sx, sy, z) => KK.rayPlane(sx, sy, new KK.THREE.Vector3(0, 0, 1), -z) || new KK.THREE.Vector3();
  const worldSize = (px, sx, sy, z) => at(sx + px, sy, z).x - at(sx, sy, z).x;

  function emojiCanvas(e) { if (texC[e]) return texC[e]; const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d');
    g.font = '120px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 80, 88); return texC[e] = c; }
  function card(K, e) {
    const T = K.THREE, tex = K.srgb(new T.CanvasTexture(emojiCanvas(e)));
    const face = new T.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.05, roughness: 0.5 });
    const g = new T.Group();
    const back = K.mesh(new T.CylinderGeometry(0.62, 0.62, 0.14, 40), '#ffffff', { roughness: 0.4 }); back.rotation.x = Math.PI / 2; g.add(back);
    const rim = K.mesh(new T.TorusGeometry(0.62, 0.05, 10, 40), '#ffd27a', { metalness: 0.3 }); g.add(rim);
    const pic = new T.Mesh(new T.PlaneGeometry(1.0, 1.0), face); pic.position.z = 0.08; g.add(pic);
    return g;
  }
  function frame(K, s) {
    const T = K.THREE, g = new T.Group();
    const f = K.mesh(new T.BoxGeometry(1.2, 1.2, 0.18), '#ffffff', { transparent: true, opacity: 0.75, roughness: 0.6 }); g.add(f);
    const inset = K.mesh(new T.BoxGeometry(1.04, 1.04, 0.05), '#f3ead0'); inset.position.z = 0.08; g.add(inset);
    const sc = document.createElement('canvas'); sc.width = sc.height = 160; const x = sc.getContext('2d'); x.translate(80, 80); x.rotate(s.rot); if (s.flip) x.scale(-1, 1); x.drawImage(shadowOf(s.e), -80, -80, 160, 160);
    const sil = new T.Mesh(new T.PlaneGeometry(1.0, 1.0), new T.MeshBasicMaterial({ map: K.srgb(new T.CanvasTexture(sc)), transparent: true, depthWrite: false })); sil.position.z = 0.115; g.add(sil); g.userData.sil = sil;
    return g;
  }

  Shell3D.install({
    shadows: true, fov: 38,
    build(K) {
      KK = K; const T = K.THREE;
      K.scene.background = K.canvasTex(4, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#fff6d8'); gr.addColorStop(0.55, '#ffe08a'); gr.addColorStop(0.551, '#8fd36a'); gr.addColorStop(1, '#5aa63c'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); });
      const lamp = new T.SpotLight(0xfff3d0, 0.6, 40, 0.6, 0.5); lamp.position.set(0, 3, 10); K.scene.add(lamp); K.scene.add(lamp.target);
    },
    draw(K, dt) {
      if (!items) return;
      K.cam.position.set(0, 1.2, 10); K.cam.lookAt(0, 0, 0);
      // frames with shadows on the wall
      const seenF = new Set();
      shadows.forEach(s => { let f = frames.get(s); if (!f) { f = frame(K, s); K.scene.add(f); frames.set(s, f); } seenF.add(s);
        const p = at(s.x, s.y, ZW), size = worldSize(sz, s.x, s.y, ZW); f.position.copy(p); f.scale.setScalar(size); f.userData.sil.visible = !s.done; });
      frames.forEach((f, s) => { if (!seenF.has(s)) { K.scene.remove(f); frames.delete(s); } });
      // places the cards wait in
      const seenS = new Set();
      items.forEach(it => { let sl = slots.get(it); if (!sl) { sl = K.mesh(new K.THREE.CylinderGeometry(0.6, 0.6, 0.04, 36), '#ffffff', { transparent: true, opacity: 0.35 }); sl.rotation.x = Math.PI / 2; K.scene.add(sl); slots.set(it, sl); }
        seenS.add(it); const p = at(it.hx, it.hy, 0); sl.position.copy(p); sl.scale.setScalar(worldSize(sz * 1.1, it.hx, it.hy, 0)); sl.visible = !it.done && it !== drag; });
      slots.forEach((sl, it) => { if (!seenS.has(it)) { K.scene.remove(sl); slots.delete(it); } });
      // the picture cards
      const seenC = new Set();
      items.forEach(it => { let c = cards.get(it); if (!c) { c = card(K, it.e); K.scene.add(c); cards.set(it, c); } seenC.add(it);
        const z = it.done ? ZW + 0.2 : it === drag ? ZC + 1.2 : ZC, p = at(it.x, it.y, z), size = worldSize(sz * 0.8 * (it === drag ? 1.12 : 1), it.x, it.y, z);
        c.position.copy(p); c.scale.setScalar(size);
        c.rotation.y = it === drag ? Math.sin(K.time * 6) * 0.15 : it.done ? 0 : Math.sin(K.time * 1.5 + it.hx * 0.01) * 0.25; c.rotation.x = it === drag ? -0.15 : 0; });
      cards.forEach((c, it) => { if (!seenC.has(it)) { K.scene.remove(c); cards.delete(it); } });
      lvLabel(); if (state === 'play') text('Match the shadows', W / 2, W < 560 ? 118 : 78, 22, '#3a2a00', 'center', '#ffffffcc');
    },
    /* sparkles appear where they were in the flat game */
    map(x, y) { return at(x, y, 0.8).toArray(); },
    unit: 0.015
  });
})();

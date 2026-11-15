/* Tower Stack 3D: chunky stacking rings on three wooden poles. */
(function () {
  let k = 0.01, base, poles = [], flag, rings = new Map(), lastN = -1;
  const X = x => (x - W / 2) * k, Y = y => (baseY - y) * k;

  Shell3D.install({
    shadows: true, fov: 40,
    build(K) {
      const T = K.THREE;
      K.sky('#9be7c8', '#2b6a5a');
      const floor = K.mesh(new T.PlaneGeometry(80, 80), '#3d8a74', { roughness: 1 }); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.3; K.scene.add(floor);
      base = K.mesh(new T.BoxGeometry(1, 0.3, 2.2), '#7a5434', { roughness: 0.8 }); K.scene.add(base);
      for (let i = 0; i < 3; i++) { const p = K.mesh(new T.CylinderGeometry(0.11, 0.11, 1, 16), '#a8784e'); K.scene.add(p); poles.push(p);
        const cap = K.mesh(new T.SphereGeometry(0.15, 14, 10), '#c99a6a'); p.add(cap); p.userData.cap = cap; }
      flag = new T.Group(); const st = K.mesh(new T.CylinderGeometry(0.03, 0.03, 0.9, 8), '#555'); st.position.y = 0.45; flag.add(st);
      const fl = K.mesh(new T.BoxGeometry(0.5, 0.32, 0.02), '#e5243b'); fl.position.set(0.25, 0.75, 0); flag.add(fl); K.scene.add(flag); K.flagCloth = fl;
    },
    draw(K, dt) {
      if (!pegs) return;
      k = 9 / Math.max(W, H * 1.1);
      const ph = (n + 1.6) * ringH * k, T = K.THREE;
      base.scale.x = pw * 3.1 * k; base.position.set(0, -0.15, 0);
      poles.forEach((p, i) => { const x = X(pegX(i)) + (wobP === i && wobT ? Math.sin(wobT * 50) * 6 * k : 0); p.scale.y = ph; p.position.set(x, ph / 2, 0); p.userData.cap.scale.y = 1 / ph; p.userData.cap.position.y = 0.5; });
      flag.position.set(X(pegX(goalP)) + 0.25, ph, 0); K.flagCloth.rotation.y = Math.sin(K.time * 3) * 0.3;
      // rings: chunky donuts, sized like the flat game's rings
      const seen = new Set();
      pegs.forEach((st, i) => st.forEach((s, j) => {
        let m = rings.get(s);
        const w = ringW(s) * k, th = Math.max(0.12, (ringH - 4) * k / 2);
        if (!m || m.userData.w !== w || m.userData.th !== th) { if (m) K.scene.remove(m); m = K.mesh(new T.TorusGeometry(w / 2 - th, th, 16, 40), COL[(s - 1) % COL.length], { roughness: 0.35 }); m.rotation.x = Math.PI / 2; m.userData = { w, th }; K.scene.add(m); rings.set(s, m); }
        seen.add(s);
        let y = (j + 0.5) * ringH * k; if (held === i && j === st.length - 1) y = lerp(y, ph + ringH * k * 0.8, lift);
        const x = X(pegX(i)) + (wobP === i && wobT ? Math.sin(wobT * 50) * 6 * k : 0);
        m.position.set(x, y, 0); m.rotation.z = held === i && j === st.length - 1 ? Math.sin(K.time * 4) * 0.08 : 0;
      }));
      rings.forEach((m, s) => { if (!seen.has(s)) { K.scene.remove(m); rings.delete(s); } });
      // camera: in front and a little above, so the poles and rings look solid
      const span = pw * 3.4 * k, d = Math.max(span / 2 / Math.tan(Math.atan(Math.tan(K.cam.fov * Math.PI / 360) * K.cam.aspect)), (ph + 1.5) / 2 / Math.tan(K.cam.fov * Math.PI / 360)) * 1.05;
      K.cam.position.set(0, ph * 0.5 + d * 0.38, d); K.cam.lookAt(0, ph * 0.42, 0);
      K.sunLight.position.set(3, 10, 8);
      // the flat game's words on top
      if (held !== null) text('Now tap where it goes', W / 2, H - 60, 22, '#fff', 'center', '#0007');
      lvLabel(); if (state === 'play') text('Moves: ' + moves + '   Best: ' + bestM, W / 2, W < 560 ? 130 : 80, 20, '#fff', 'center', '#0007');
    },
    map(x, y) { return [X(x), Y(y), 0.6]; },
    /* a tap picks the pole nearest to where you pointed */
    unmap(K, sx, sy) { const p = K.rayPlane(sx, sy, new K.THREE.Vector3(0, 0, 1), 0); return p ? [p.x / k + W / 2, sy] : null; },
    unit: 0.01
  });
})();

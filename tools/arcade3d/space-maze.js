/* Space Maze 3D: a little astronaut walks a glowing 3D maze floating in space to reach the rocket. */
(function () {
  let maze = null, mazeKey = '', astro, rocket, keyMeshes = [], doorMeshes = [], trailG, trailN = -1;
  const toW = (gx, gy) => [gx - mc / 2 + 0.5, gy - mr / 2 + 0.5];

  function makeAstro(K) {
    const T = K.THREE, g = new T.Group();
    const body = K.mesh(new T.CapsuleGeometry(0.17, 0.2, 6, 12), '#f4f6ff'); body.position.y = 0.32; g.add(body);
    const pack = K.mesh(new T.BoxGeometry(0.26, 0.26, 0.12), '#c9d3ee'); pack.position.set(0, 0.36, -0.17); g.add(pack);
    const head = K.mesh(new T.SphereGeometry(0.17, 16, 12), '#f4f6ff'); head.position.y = 0.66; g.add(head);
    const visor = K.mesh(new T.SphereGeometry(0.12, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), '#ffb347', { metalness: 0.6, roughness: 0.15, emissive: '#7a4a00', emissiveIntensity: 0.3 }); visor.rotation.x = Math.PI / 2; visor.position.set(0, 0.67, 0.08); g.add(visor);
    for (const s of [-1, 1]) { const leg = K.mesh(new T.CylinderGeometry(0.06, 0.06, 0.16, 8), '#f4f6ff'); leg.position.set(s * 0.08, 0.08, 0); g.add(leg); }
    return g;
  }
  function makeRocket(K) {
    const T = K.THREE, g = new T.Group();
    const b = K.mesh(new T.CylinderGeometry(0.2, 0.24, 0.6, 16), '#f4f6ff'); b.position.y = 0.4; g.add(b);
    const n = K.mesh(new T.ConeGeometry(0.2, 0.35, 16), '#e63946'); n.position.y = 0.88; g.add(n);
    const w = K.mesh(new T.SphereGeometry(0.08, 10, 8), '#5ec8ff', { emissive: '#1d6aa8', emissiveIntensity: 0.5 }); w.position.set(0, 0.5, 0.19); g.add(w);
    for (let i = 0; i < 3; i++) { const f = K.mesh(new T.BoxGeometry(0.04, 0.26, 0.24), '#e63946'); const a = i * Math.PI * 2 / 3; f.position.set(Math.sin(a) * 0.24, 0.2, Math.cos(a) * 0.24); f.rotation.y = a; g.add(f); }
    const fl = new T.Mesh(new T.ConeGeometry(0.13, 0.3, 10), new T.MeshBasicMaterial({ color: '#ffb347' })); fl.rotation.x = Math.PI; fl.position.y = -0.02; g.add(fl); g.userData.flame = fl;
    return g;
  }
  function sprite(K, e, size) { const m = new K.THREE.Sprite(new K.THREE.SpriteMaterial({ map: K.emojiTex(e, 128), transparent: true, depthWrite: false })); m.scale.set(size, size, 1); return m; }
  function buildMaze(K) {
    const T = K.THREE; if (maze) K.scene.remove(maze); maze = new T.Group(); K.scene.add(maze);
    const plat = K.mesh(new T.BoxGeometry(mc + 0.4, 0.16, mr + 0.4), '#1b2a6b', { roughness: 0.6, emissive: '#0b1240', emissiveIntensity: 0.4 }); plat.position.y = -0.08; maze.add(plat);
    const grid = new T.GridHelper(Math.max(mc, mr), Math.max(mc, mr), 0x3a5bd9, 0x2a3b8a); grid.scale.set(mc / Math.max(mc, mr), 1, mr / Math.max(mc, mr)); grid.position.y = 0.002; maze.add(grid);
    const wm = new T.MeshStandardMaterial({ color: '#7ad7ff', emissive: '#2a9ad8', emissiveIntensity: 0.6, transparent: true, opacity: 0.85, roughness: 0.3 });
    const add = (x, z, w, d) => { const b = new T.Mesh(new T.BoxGeometry(w, 0.42, d), wm); b.position.set(x, 0.21, z); b.castShadow = true; maze.add(b); };
    const t = 0.1;
    for (let y = 0; y < mr; y++) for (let x = 0; x < mc; x++) {
      const w = walls[y][x], [cx, cz] = toW(x, y);
      if (w.n) add(cx, cz - 0.5, 1 + t, t); if (w.w) add(cx - 0.5, cz, t, 1 + t);
      if (x === mc - 1 && w.e) add(cx + 0.5, cz, t, 1 + t); if (y === mr - 1 && w.s) add(cx, cz + 0.5, 1 + t, t);
    }
    keyMeshes = keys.map((k, i) => { const g = new T.Group(); const disc = K.mesh(new T.CylinderGeometry(0.3, 0.3, 0.04, 20), KC[i], { emissive: KC[i], emissiveIntensity: 0.4, transparent: true, opacity: 0.7 }); g.add(disc); const s = sprite(K, '🔑', 0.55); s.position.y = 0.35; g.add(s); const [x, z] = toW(k[0], k[1]); g.position.set(x, 0.02, z); maze.add(g); return g; });
    doorMeshes = doors.map((d, i) => { const g = new T.Group(); const b = K.mesh(new T.BoxGeometry(0.78, 0.5, 0.78), KC[i], { roughness: 0.4 }); b.position.y = 0.25; g.add(b); const s = sprite(K, '🔒', 0.5); s.position.y = 0.75; g.add(s); const [x, z] = toW(d[0], d[1]); g.position.set(x, 0, z); maze.add(g); return g; });
    const [gx, gz] = toW(goal[0], goal[1]); rocket.position.set(gx, 0.05, gz);
    trailN = -1;
  }

  Shell3D.install({
    shadows: true, fov: 40, hemi: 0.55, sun: 1.0, groundLight: 0x1b2a6b,
    build(K) {
      K.sky('#05081f', '#0b1240'); K.stars(1200, 120, { size: 1 });
      const T = K.THREE, p = K.mesh(new T.SphereGeometry(5, 32, 20), '#8a5cd8', { roughness: 0.8 }); p.position.set(-16, -6, -22); K.scene.add(p);
      astro = makeAstro(K); K.scene.add(astro); rocket = makeRocket(K); K.scene.add(rocket);
      trailG = new T.Group(); K.scene.add(trailG);
    },
    draw(K, dt) {
      if (!walls) return;
      const key = lvl + '|' + mc + 'x' + mr + '|' + JSON.stringify(goal) + JSON.stringify(doors) + walls.map(r => r.map(w => '' + w.n + w.e + w.s + w.w).join('')).join('');
      if (key !== mazeKey) { mazeKey = key; buildMaze(K); }
      keyMeshes.forEach((g, i) => { g.visible = !have.includes(i); g.children[1].position.y = 0.35 + Math.sin(K.time * 4 + i) * 0.06; });
      doorMeshes.forEach((g, i) => { g.visible = !have.includes(i); });
      // golden footprints along the way you came
      if (trail.length !== trailN) { trailN = trail.length; trailG.clear(); const T = K.THREE; const dm = K.mat('#ffd27a', { emissive: '#ffb000', emissiveIntensity: 0.6 });
        trail.forEach(([x, y]) => { const [wx, wz] = toW(x, y); const d = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.02, 12), dm); d.position.set(wx, 0.01, wz); trailG.add(d); }); }
      const [ax, az] = toW(me.px, me.py); astro.position.set(ax, Math.abs(Math.sin(K.time * 6)) * 0.04, az);
      const dx = me.x - me.px, dy = me.y - me.py; if (Math.abs(dx) + Math.abs(dy) > 0.05) astro.rotation.y = Math.atan2(dx, dy);
      rocket.rotation.y += (dt || 0) * 0.5; rocket.userData.flame.scale.y = 0.7 + Math.random() * 0.5;
      const span = Math.max(mc, mr * 1.1) + 1.2, d = span / 2 / Math.tan(Math.min(K.cam.fov, Math.atan(Math.tan(K.cam.fov * Math.PI / 360) * K.cam.aspect) * 360 / Math.PI) * Math.PI / 360) * 1.05;
      K.cam.position.set(0, d * 0.92, d * 0.42 + 0.3); K.cam.lookAt(0, 0, 0.25);
      K.sunLight.position.set(3, 12, 6);
      if (have.length) have.forEach((i, j) => { circ(W - 40 - j * 44, H - 36, 18, KC[i]); emoji('🔑', W - 40 - j * 44, H - 36, 22); });
      lvLabel('#1d1b3a');
    },
    map(x, y) { return [(x - ox) / cell - mc / 2, 0.5, (y - oy) / cell - mr / 2]; },
    unmap(K, sx, sy) { if (!walls) return null; const p = K.rayPlane(sx, sy, new K.THREE.Vector3(0, 1, 0), 0); return p ? [ox + (p.x + mc / 2) * cell, oy + (p.z + mr / 2) * cell] : null; },
    unit: 0.02
  });
})();

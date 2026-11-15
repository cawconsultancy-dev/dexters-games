/* Robot Code 3D: the robot follows the arrows across a 3D board of tiles, round rocks, to the battery. */
(function () {
  let board = null, boardKey = '', robot, battery, pathG, pathKey = '';
  const toW = (gx, gy) => [gx - cols / 2 + 0.5, gy - rows / 2 + 0.5];

  function makeRobot(K) {
    const T = K.THREE, g = new T.Group();
    const body = K.mesh(new T.BoxGeometry(0.5, 0.42, 0.42), '#7ad7ff', { metalness: 0.3, roughness: 0.35 }); body.position.y = 0.36; g.add(body);
    const head = K.mesh(new T.BoxGeometry(0.42, 0.3, 0.36), '#b8ecff', { metalness: 0.3, roughness: 0.3 }); head.position.y = 0.74; g.add(head);
    for (const s of [-1, 1]) {
      const eye = K.mesh(new T.SphereGeometry(0.055, 10, 8), '#1d1b3a'); eye.position.set(s * 0.1, 0.76, 0.185); g.add(eye);
      const wh = K.mesh(new T.CylinderGeometry(0.12, 0.12, 0.08, 14), '#333'); wh.rotation.z = Math.PI / 2; wh.position.set(s * 0.27, 0.12, 0); g.add(wh);
    }
    const ant = K.mesh(new T.CylinderGeometry(0.015, 0.015, 0.18, 6), '#555'); ant.position.y = 0.98; g.add(ant);
    const bulb = K.mesh(new T.SphereGeometry(0.05, 10, 8), '#ff5f5f', { emissive: '#ff2020', emissiveIntensity: 0.8 }); bulb.position.y = 1.08; g.add(bulb);
    return g;
  }
  function makeBattery(K) {
    const T = K.THREE, g = new T.Group();
    const b = K.mesh(new T.CylinderGeometry(0.18, 0.18, 0.5, 18), '#3fcf6a', { emissive: '#1f9a4a', emissiveIntensity: 0.4 }); b.position.y = 0.3; g.add(b);
    const top = K.mesh(new T.CylinderGeometry(0.18, 0.18, 0.12, 18), '#2a2a33'); top.position.y = 0.61; g.add(top);
    const nub = K.mesh(new T.CylinderGeometry(0.07, 0.07, 0.08, 12), '#c0c0c8', { metalness: 0.7 }); nub.position.y = 0.71; g.add(nub);
    const bolt = K.mesh(new T.BoxGeometry(0.06, 0.22, 0.02), '#fff3b0', { emissive: '#ffd23f', emissiveIntensity: 0.8 }); bolt.position.set(0, 0.32, 0.18); bolt.rotation.z = 0.4; g.add(bolt);
    return g;
  }
  function buildBoard(K) {
    const T = K.THREE; if (board) K.scene.remove(board); board = new T.Group(); K.scene.add(board);
    const base = K.mesh(new T.BoxGeometry(cols + 0.3, 0.2, rows + 0.3), '#5a6bb8'); base.position.y = -0.12; board.add(base);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const [wx, wz] = toW(x, y), t = K.mesh(new T.BoxGeometry(0.92, 0.08, 0.92), (x + y) % 2 ? '#c9d4ff' : '#dfe6ff'); t.position.set(wx, 0.0, wz); board.add(t);
      if (map[y][x] === '#') { const r = K.mesh(new T.DodecahedronGeometry(0.36, 0), '#8a8580', { flatShading: true }); r.scale.y = 0.75; r.position.set(wx, 0.28, wz); r.rotation.y = x + y; board.add(r); }
    }
    const [gx, gz] = toW(goal[0], goal[1]); battery.position.set(gx, 0.04, gz);
    pathKey = '';
  }

  Shell3D.install({
    shadows: true, fov: 38, groundLight: 0x141c42,
    build(K) {
      K.sky('#2a3f8a', '#141c42'); K.stars(500, 120, { size: 0.9 });
      robot = makeRobot(K); K.scene.add(robot); battery = makeBattery(K); K.scene.add(battery);
      pathG = new K.THREE.Group(); K.scene.add(pathG);
    },
    draw(K, dt) {
      if (!map) return;
      const key = lvl + '|' + map.join('/'); if (key !== boardKey) { boardKey = key; buildBoard(K); }
      battery.rotation.y += (dt || 0) * 1.2; battery.position.y = 0.04 + Math.sin(K.time * 4) * 0.05;
      // the planned path, shown as purple dots once the robot runs
      const pk = (running || bad >= 0) ? prog.join('') + home : '';
      if (pk !== pathKey) { pathKey = pk; pathG.clear(); if (pk) { let px = home[0], py = home[1]; const T = K.THREE, m = K.mat('#6a4cff', { emissive: '#4a2cdf', emissiveIntensity: 0.6 });
        for (let i = 0; i < prog.length; i++) { const d = DIR[prog[i]]; for (let s = 1; s <= 3; s++) { const [wx, wz] = toW(px + d[0] * s / 4, py + d[1] * s / 4); const dot = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), m); dot.position.set(wx, 0.08, wz); pathG.add(dot); } px += d[0]; py += d[1]; if (!free(px, py)) break; } } }
      const [rx, rz] = toW(rob.px, rob.py), bx = bump ? Math.sin(bump * 30) * 0.06 : 0;
      robot.position.set(rx + bx, running ? Math.abs(Math.sin(K.time * 10)) * 0.04 : 0, rz);
      const dx = rob.x - rob.px, dy = rob.y - rob.py; if (Math.abs(dx) + Math.abs(dy) > 0.05) robot.userData.yaw = Math.atan2(dx, dy);
      robot.rotation.y = lerp(robot.rotation.y, robot.userData.yaw === undefined ? 0 : robot.userData.yaw, Math.min(1, (dt || 0) * 12));
      // camera: fit the 3D board into the same space the flat board used, above the arrow panel
      const Rw = cols * cell, Rh = rows * cell, el = 1.0;
      const tv = Math.tan(K.cam.fov * Math.PI / 360), th = tv * K.cam.aspect;
      const d = Math.max((cols / 2 + 0.4) / th * (W / Rw), (rows / 2 + 0.6) * Math.sin(el) / tv * (H / Rh)) * 1.02;
      K.cam.position.set(0, Math.sin(el) * d, Math.cos(el) * d); K.cam.lookAt(0, 0, 0);
      K.cam.setViewOffset(W, H, -Math.round(ox + Rw / 2 - W / 2), -Math.round(oy + Rh / 2 - H / 2), W, H); K.cam.updateProjectionMatrix();
      K.sunLight.position.set(3, 12, 6);
      lvLabel('#1d1b3a'); if (state === 'play') text('Shortest: ' + shortest + ' arrows', W / 2, oy - 26, 18, '#fff', 'center', '#0006');
    },
    map(x, y) { return [(x - ox) / cell - cols / 2, 0.6, (y - oy) / cell - rows / 2]; },
    unit: 0.02
  });
})();

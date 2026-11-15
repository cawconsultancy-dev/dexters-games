/* Push the Crate 3D: a little robot pushes wooden crates round a 3D warehouse floor. */
(function () {
  let grid = null, gridKey = '', robot, crates = [], stars = [], tiles = [], robotArm;
  const toW = (gx, gy) => [gx - cols / 2 + 0.5, gy - rows / 2 + 0.5]; // grid square to 3D spot

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
    robotArm = K.mesh(new T.BoxGeometry(0.36, 0.08, 0.22), '#5fb8e6'); robotArm.position.set(0, 0.38, 0.28); g.add(robotArm);
    return g;
  }
  function crateMesh(K) {
    const T = K.THREE, tex = K.canvasTex(64, 64, (g) => { g.fillStyle = '#c9822a'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#8a5a1c'; g.lineWidth = 6; g.strokeRect(3, 3, 58, 58); g.beginPath(); g.moveTo(6, 6); g.lineTo(58, 58); g.moveTo(58, 6); g.lineTo(6, 58); g.stroke(); });
    const m = new T.MeshStandardMaterial({ map: tex, roughness: 0.7 });
    const b = new T.Mesh(new T.BoxGeometry(0.82, 0.82, 0.82), m); b.castShadow = b.receiveShadow = true; b.userData.mat = m; return b;
  }
  function starShape(K, r) {
    const T = K.THREE, sh = new T.Shape();
    for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; i ? sh.lineTo(Math.cos(a) * q, Math.sin(a) * q) : sh.moveTo(Math.cos(a) * q, Math.sin(a) * q); }
    const m = K.mesh(new T.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: false }), '#ffcf3a', { emissive: '#ffb000', emissiveIntensity: 0.5 }); m.rotation.x = -Math.PI / 2; return m;
  }
  function buildGrid(K) {
    const T = K.THREE; if (grid) K.scene.remove(grid); grid = new T.Group(); K.scene.add(grid); crates.forEach(c => K.scene.remove(c)); crates = []; stars = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = map[y][x]; if (c === undefined) continue; const [wx, wz] = toW(x, y);
      if (c === '#') { const w = K.mesh(new T.BoxGeometry(1, 0.5, 1), '#6b6f7a', { roughness: 0.8 }); w.position.set(wx, 0.25, wz); grid.add(w);
        const top = K.mesh(new T.BoxGeometry(0.9, 0.06, 0.9), '#868b97'); top.position.set(wx, 0.52, wz); grid.add(top); continue; }
      const f = K.mesh(new T.BoxGeometry(1, 0.1, 1), (x + y) % 2 ? '#e9dcc4' : '#f3e8d2', { roughness: 0.9 }); f.position.set(wx, -0.05, wz); grid.add(f);
      if (onT(x, y)) { const s = starShape(K, 0.32); s.position.set(wx, 0.01, wz); grid.add(s); stars.push(s); }
    }
    boxes.forEach(() => { const c = crateMesh(K); K.scene.add(c); crates.push(c); });
  }

  Shell3D.install({
    shadows: true, fov: 40,
    build(K) {
      K.sky('#8a6a4a', '#4a3220');
      const T = K.THREE, floor = K.mesh(new T.PlaneGeometry(80, 80), '#5a4030', { roughness: 1 }); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.11; K.scene.add(floor);
      robot = makeRobot(K); K.scene.add(robot);
    },
    draw(K, dt) {
      if (!map) return;
      const key = lvl + '|' + boxes.length; if (key !== gridKey) { gridKey = key; buildGrid(K); }
      boxes.forEach((b, i) => { const c = crates[i]; if (!c) return; const [x, z] = toW(b.px, b.py), on = onT(b.x, b.y); c.position.set(x, 0.41, z); c.userData.mat.color.set(on ? '#8ee68f' : '#ffffff'); });
      stars.forEach(s => s.rotation.z += (dt || 0) * 0.6);
      const [rx, rz] = toW(me.px, me.py), bx = bumpT ? Math.sin(bumpT * 60) * 0.05 : 0;
      robot.position.set(rx + bx, 0, rz);
      // face the way it last moved
      const dx = me.x - me.px, dy = me.y - me.py; if (Math.abs(dx) + Math.abs(dy) > 0.05) robot.userData.yaw = Math.atan2(dx, dy);
      if (robot.userData.yaw === undefined) robot.userData.yaw = face > 0 ? Math.PI / 2 : -Math.PI / 2;
      robot.rotation.y = lerp(robot.rotation.y, robot.userData.yaw, Math.min(1, (dt || 0) * 12));
      robot.position.y = Math.abs(Math.sin(K.time * 8)) * 0.03;
      // camera: looking down at the room from the front, tilted so the walls stand up
      const span = Math.max(cols, rows * 1.15) + 1, d = span / 2 / Math.tan(Math.min(K.cam.fov, Math.atan(Math.tan(K.cam.fov * Math.PI / 360) * K.cam.aspect) * 360 / Math.PI) * Math.PI / 360) * 1.05;
      K.cam.position.set(0, d * 0.9, d * 0.46 + 0.3); K.cam.lookAt(0, 0, 0.2);
      K.sunLight.position.set(4, 12, 6);
      lvLabel(); if (state === 'play') text('Moves: ' + moves + '   Stars: ' + boxes.filter(b => onT(b.x, b.y)).length + ' of ' + tg.length, W / 2, W < 560 ? 92 : 62, 19, '#fff', 'center', '#0007');
    },
    map(x, y) { return [(x - ox) / cell - cols / 2, 0.6, (y - oy) / cell - rows / 2]; },
    /* a tap or swipe on the 3D floor becomes the same spot on the flat game's grid */
    unmap(K, sx, sy) { if (!map) return null; const p = K.rayPlane(sx, sy, new K.THREE.Vector3(0, 1, 0), 0); return p ? [ox + (p.x + cols / 2) * cell, oy + (p.z + rows / 2) * cell] : null; },
    unit: 0.02
  });
})();

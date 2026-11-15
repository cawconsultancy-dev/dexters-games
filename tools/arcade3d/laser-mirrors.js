/* Laser Mirrors 3D: standing mirrors on a space-station floor bounce a glowing laser to a crystal. */
(function () {
  let board = null, boardKey = '', mirrors = new Map(), beamG, beamKey = '', gem, emitter;
  const toW = (gx, gy) => [gx - cols / 2 + 0.5, gy - rows / 2 + 0.5], BH = 0.38;

  function buildBoard(K) {
    const T = K.THREE; if (board) K.scene.remove(board); board = new T.Group(); K.scene.add(board); mirrors.clear();
    const base = K.mesh(new T.BoxGeometry(cols + 0.3, 0.2, rows + 0.3), '#1a1238'); base.position.y = -0.12; board.add(base);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const [wx, wz] = toW(x, y), t = K.mesh(new T.BoxGeometry(0.94, 0.06, 0.94), (x + y) % 2 ? '#241a4a' : '#2c2056', { roughness: 0.5 }); t.position.set(wx, -0.01, wz); board.add(t);
      const g = grid[y][x]; if (!g) continue;
      if (g.rock) { const r = K.mesh(new T.DodecahedronGeometry(0.34, 0), '#8a8580', { flatShading: true }); r.scale.y = 0.8; r.position.set(wx, 0.26, wz); r.rotation.y = x * 2 + y; board.add(r); continue; }
      const m = new T.Group(); const ped = K.mesh(new T.CylinderGeometry(0.12, 0.16, 0.12, 14), '#6b7088'); ped.position.y = 0.06; m.add(ped);
      const frame = K.mesh(new T.BoxGeometry(0.86, 0.62, 0.08), '#bfe9ff', { metalness: 0.3, roughness: 0.3 }); frame.position.y = 0.42; m.add(frame);
      const glass = K.mesh(new T.BoxGeometry(0.78, 0.54, 0.09), '#ffffff', { metalness: 0.9, roughness: 0.05, emissive: '#9fdcff', emissiveIntensity: 0.25 }); glass.position.y = 0.42; m.add(glass);
      m.position.set(wx, 0, wz); board.add(m); mirrors.set(x + ',' + y, m);
    }
    const [ex, ez] = toW(-1, r0); emitter.position.set(ex + 0.1, 0, ez);
    beamKey = '';
  }

  Shell3D.install({
    shadows: true, fov: 38, groundLight: 0x120a2a, hemi: 0.6,
    build(K) {
      const T = K.THREE;
      K.sky('#0a0620', '#120a2a'); K.stars(900, 120, { size: 1 });
      emitter = new T.Group(); const box = K.mesh(new T.BoxGeometry(0.6, 0.42, 0.44), '#8a93a3', { metalness: 0.4 }); box.position.y = 0.3; emitter.add(box);
      const lens = K.mesh(new T.CylinderGeometry(0.12, 0.12, 0.08, 16), '#ff3c78', { emissive: '#ff3c78', emissiveIntensity: 1 }); lens.rotation.z = Math.PI / 2; lens.position.set(0.32, BH, 0); emitter.add(lens); K.scene.add(emitter);
      gem = K.mesh(new T.OctahedronGeometry(0.3, 0), '#7ad7ff', { metalness: 0.3, roughness: 0.1, emissive: '#2a9ad8', emissiveIntensity: 0.5, flatShading: true }); K.scene.add(gem);
      beamG = new T.Group(); K.scene.add(beamG);
    },
    draw(K, dt) {
      if (!grid) return;
      const key = lvl + '|' + JSON.stringify(startGrid) + r0; if (key !== boardKey) { boardKey = key; buildBoard(K); }
      mirrors.forEach((m, k2) => { const [x, y] = k2.split(',').map(Number), g = grid[y][x]; if (!g || !g.m) return;
        const a = (g.m === '/' ? -Math.PI / 4 : Math.PI / 4) + (flipA[k2] || 0) * Math.PI / 2 * (g.m === '/' ? 1 : -1); m.rotation.y = -a; });
      // the laser: glowing tubes between the bounce points
      const bk = JSON.stringify(beam); if (bk !== beamKey) { beamKey = bk; beamG.clear(); const T = K.THREE;
        const core = new T.MeshBasicMaterial({ color: '#ffffff' }), glow = new T.MeshBasicMaterial({ color: '#ff5090', transparent: true, opacity: 0.45, depthWrite: false });
        for (let i = 1; i < beam.length; i++) { const [ax, az] = toW(beam[i - 1][0], beam[i - 1][1]), [bx, bz] = toW(beam[i][0], beam[i][1]), len = Math.hypot(bx - ax, bz - az); if (len < 0.01) continue;
          for (const [r, m] of [[0.035, core], [0.1, glow]]) { const c = new T.Mesh(new T.CylinderGeometry(r, r, len, 10, 1, true), m); c.position.set((ax + bx) / 2, BH, (az + bz) / 2); c.rotation.z = Math.PI / 2; c.rotation.y = -Math.atan2(bz - az, bx - ax); beamG.add(c); } } }
      const [tx, tz] = toW(target[0], target[1]); gem.position.set(tx, 0.42 + Math.sin(K.time * 3) * 0.05, tz); gem.rotation.y += (dt || 0) * (hit ? 4 : 1);
      gem.scale.setScalar(hit ? 1.25 + Math.sin(K.time * 8) * 0.06 : 1); gem.material.emissiveIntensity = hit ? 1.2 : 0.5;
      const span = Math.max(cols + 1.6, (rows + 0.6) * 1.15), d = span / 2 / Math.tan(Math.min(K.cam.fov, Math.atan(Math.tan(K.cam.fov * Math.PI / 360) * K.cam.aspect) * 360 / Math.PI) * Math.PI / 360) * 1.05;
      K.cam.position.set(-0.3, d * 0.88, d * 0.5 + 0.3); K.cam.lookAt(-0.3, 0, 0.2);
      K.sunLight.position.set(3, 12, 6);
      lvLabel('#1d1b3a'); if (state === 'play') text('Tap mirrors to bounce the laser to the 💎', W / 2, W < 560 ? 92 : 62, 19, '#fff', 'center', '#0008');
    },
    map(x, y) { return [(x - ox) / cell - cols / 2, 0.6, (y - oy) / cell - rows / 2]; },
    /* a tap on a 3D mirror counts as a tap on its square */
    unmap(K, sx, sy) { if (!grid) return null; const p = K.rayPlane(sx, sy, new K.THREE.Vector3(0, 1, 0), -0.35); return p ? [ox + (p.x + cols / 2) * cell, oy + (p.z + rows / 2) * cell] : null; },
    unit: 0.02
  });
})();

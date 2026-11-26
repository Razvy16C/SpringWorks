// Desenarea scenei pe canvas. Lumea are y în sus, în metri.
(() => {
  const cv = document.getElementById('panza'), g = cv.getContext('2d');
  S.panza = cv;
  S.cam = { x: -4, y: 2, z: 38 };
  S.laEcran = p => ({ x: cv.clientWidth / 2 + (p.x - S.cam.x) * S.cam.z, y: cv.clientHeight / 2 - (p.y - S.cam.y) * S.cam.z });
  S.laLume = (sx, sy) => ({ x: S.cam.x + (sx - cv.clientWidth / 2) / S.cam.z, y: S.cam.y - (sy - cv.clientHeight / 2) / S.cam.z });

  const linie = pts => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); };
  const cerc = (p, r) => { g.beginPath(); g.arc(p.x, p.y, r, 0, 7); };

  // Piesele salvate înainte de texturi își primesc textura după culoare.
  const TEXTURI_VECHI = { '#a88661': 'wood_oak_planks', '#8c98a3': 'metal_steel', '#a9d3dd': 'ice_ice', '#7e9987': 'wood_spruce_planks' };

  // Desenează textura blocului. Întoarce false dacă nu se poate (rămâne culoarea simplă).
  function textura(p, w, h) {
    const nume = p.textura || TEXTURI_VECHI[p.culoare];
    if (!BLOCKS[nume] || !blockSheet.complete || !blockSheet.naturalWidth) return false;
    if (w > h * 1.5) drawBeam(g, nume, 0, 0, w, h);                        // bară: textura se repetă
    else if (h > w * 1.5) drawBeam(g, nume, 0, 0, h, w, Math.PI / 2);      // stâlp: la fel, pe verticală
    else drawBlock(g, nume, 0, 0, w, h);
    return true;
  }

  function arc(p) {
    const a = S.laEcran(S.poza(p, 0)), b = S.laEcran(S.poza(p, 1)), z = S.cam.z;
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const raport = L / z / p.L; // sub 1 = comprimat, peste 1 = întins
    g.strokeStyle = '#59615a'; g.lineWidth = 0.09 * z; linie([a, b]); g.stroke();
    const spire = 8, lat = (0.17 + p.k / 90000) * z, pts = [a];
    for (let i = 0; i < spire * 2; i++) {
      const t = 0.1 + 0.8 * (i + 0.5) / (spire * 2), s = i % 2 ? lat : -lat;
      pts.push({ x: a.x + dx * t + nx * s, y: a.y + dy * t + ny * s });
    }
    pts.push(b);
    g.strokeStyle = raport < 0.9 ? '#d9a066' : raport > 1.1 ? '#78b5d1' : '#8fbd9f';
    g.lineWidth = Math.max(1.5, (0.035 + p.k / 250000) * z); linie(pts); g.stroke();
  }

  function parte(p, i, selectat) {
    const poza = S.poza(p, i), c = S.laEcran(poza), z = S.cam.z;
    g.save(); g.translate(c.x, c.y); g.rotate(-poza.a);
    g.lineWidth = selectat ? 2.5 : 1; g.strokeStyle = selectat ? '#fff' : '#0b0c0b';
    if (p.tip === 'roata') {
      g.fillStyle = '#343936'; cerc({ x: 0, y: 0 }, p.r * z); g.fill(); g.stroke();
      g.strokeStyle = p.motor === 'liber' ? '#a4aaa1' : '#8fbd9f'; g.lineWidth = 2;
      cerc({ x: 0, y: 0 }, p.r * z * 0.6); g.stroke();
      for (let s = 0; s < 3; s++) { const u = s * Math.PI / 1.5; linie([{ x: 0, y: 0 }, { x: Math.cos(u) * p.r * z * 0.6, y: Math.sin(u) * p.r * z * 0.6 }]); g.stroke(); }
    } else {
      const w = (p.tip === 'bloc' ? p.w : S.PLACA.w) * z, h = (p.tip === 'bloc' ? p.h : S.PLACA.h) * z;
      const texturat = p.tip === 'bloc' && textura(p, w, h);
      if (!texturat) { g.fillStyle = p.tip === 'bloc' ? p.culoare : '#c3c9c0'; g.fillRect(-w / 2, -h / 2, w, h); }
      g.strokeRect(-w / 2, -h / 2, w, h);
      if (p.tip === 'bloc') {
        if (p.fix) { g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); g.strokeStyle = '#0006'; for (let x = -w / 2 - h; x < w / 2; x += 9) { linie([{ x, y: h / 2 }, { x: x + h, y: -h / 2 }]); g.stroke(); } g.restore(); }
        if (w > 36 && h > 15) {
          const text = p.masa + ' kg';
          g.font = '600 11px "Plus Jakarta Sans",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          // fundal sub text, ca să se citească pe orice textură
          if (texturat) { const l = g.measureText(text).width + 8; g.fillStyle = '#121312b3'; g.fillRect(-l / 2, -7, l, 14); }
          g.fillStyle = texturat ? '#e8e9e4' : '#101210'; g.fillText(text, 0, 0);
        }
      }
    }
    g.restore();
  }

  S.deseneaza = ui => {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#121312'; g.fillRect(0, 0, W, H);
    const z = S.cam.z, st = S.stare;

    // grilă: o linie la 1 m, mai vizibilă la 5 m
    const st0 = S.laLume(0, H), st1 = S.laLume(W, 0);
    g.lineWidth = 1;
    for (let x = Math.floor(st0.x); x <= st1.x; x++) { const s = S.laEcran({ x, y: 0 }).x; g.strokeStyle = x % 5 ? '#1a1c1a' : '#272b26'; linie([{ x: s, y: 0 }, { x: s, y: H }]); g.stroke(); }
    for (let y = Math.floor(st0.y); y <= st1.y; y++) { const s = S.laEcran({ x: 0, y }).y; g.strokeStyle = y % 5 ? '#1a1c1a' : '#272b26'; linie([{ x: 0, y: s }, { x: W, y: s }]); g.stroke(); }

    const { X0, PAS, X1 } = S.TEREN;
    const profil = st.teren.map((y, i) => S.laEcran({ x: X0 + i * PAS, y }));
    linie([...profil, S.laEcran({ x: X1, y: -60 }), S.laEcran({ x: X0, y: -60 })]);
    g.fillStyle = '#222a23'; g.fill();
    g.strokeStyle = '#8fbd9f'; g.lineWidth = 2; linie(profil); g.stroke();
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const pl of [...st.platforme, ...(ui.desen ? [ui.desen] : [])]) { g.lineWidth = 4; linie(pl.map(S.laEcran)); g.stroke(); }

    for (const p of st.piese) if (p.tip === 'susp') arc(p);
    for (const tip of ['susp', 'bloc', 'roata'])
      for (const p of st.piese) if (p.tip === tip) S.parti(p).forEach(i => parte(p, i, ui.selectat === p.id));

    if (!S.sim) {
      for (const c of st.prinderi) {
        const q = S.laEcran(S.punct(c.b));
        g.fillStyle = c.mod === 'rigid' ? '#d9a066' : '#121312'; g.strokeStyle = '#d9a066'; g.lineWidth = 2;
        cerc(q, 4.5); g.fill(); g.stroke();
      }
    }

    if (ui.unealta === 'leaga' && !S.sim) {
      g.fillStyle = '#e8e9e4aa';
      for (const p of st.piese) for (const q of S.puncteDePrindere(p)) { cerc(S.laEcran(q), 2.5); g.fill(); }
      if (ui.primul) {
        const a = S.laEcran(S.punct(ui.primul));
        g.strokeStyle = '#d9a066'; g.lineWidth = 2; cerc(a, 8); g.stroke();
        if (ui.cursor) { g.setLineDash([5, 5]); linie([a, S.laEcran(ui.cursor)]); g.stroke(); g.setLineDash([]); }
      }
      if (ui.tinta) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; cerc(S.laEcran(ui.tinta), 7); g.stroke(); }
    }
    if (ui.unealta === 'teren' && !S.sim && ui.cursor && !['deseneaza', 'sterge'].includes(ui.pensula)) {
      g.strokeStyle = '#e8e9e477'; g.lineWidth = 1; cerc(S.laEcran(ui.cursor), ui.raza * z); g.stroke();
    }
  };

  S.grafic = () => {
    const el = document.getElementById('grafic');
    if (!el || !S.sim) return;
    const c = el.getContext('2d'), W = el.width = el.clientWidth, H = el.height = el.clientHeight;
    const y = r => H - (r - S.CURSA.min) / (S.CURSA.max - S.CURSA.min) * H;
    c.strokeStyle = '#4a5147'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(0, y(1)); c.lineTo(W, y(1)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#8fbd9f'; c.lineWidth = 1.5; c.beginPath();
    S.sim.istoric.forEach((r, i) => c[i ? 'lineTo' : 'moveTo'](i / 239 * W, y(r)));
    c.stroke();
  };
})();

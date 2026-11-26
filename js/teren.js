// Teren: un profil de înălțimi generat procedural, modelabil cu pensula, plus platforme desenate liber.
(() => {
  const X0 = -200, PAS = 0.25, N = 1602;
  S.TEREN = { X0, PAS, N, X1: X0 + (N - 1) * PAS };

  // Generator cu samânță (mulberry32): același număr dă mereu același rezultat.
  const mulberry32 = a => () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  // Straturi de zgomot: dealuri late + denivelări mici.
  // perioada = distanța (în m) dintre valorile aleatoare, amp = înălțimea maximă a stratului.
  const OCTAVE = [
    { perioada: 20, amp: 3.0 },
    { perioada: 16, amp: 1.2 },
    { perioada: 6,  amp: 0.4 },
  ];
  const ZONA_PLATA = 8;    // jumătate din lățimea zonei complet plate în jurul lui x = 0
  const TRANZITIE = 12;    // cât de lin urcă terenul după zona plată

  S.terenImplicit = (samanta = Date.now()) => {
    const rnd = mulberry32(samanta);
    const tabele = OCTAVE.map(o =>
      Array.from({ length: Math.ceil(N * PAS / o.perioada) + 2 }, () => rnd() * 2 - 1));

    const zgomot = (x, k) => {
      const u = (x - X0) / OCTAVE[k].perioada, i = Math.floor(u), f = u - i;
      const s = (1 - Math.cos(Math.PI * f)) / 2;            // interpolare cosinus
      return tabele[k][i] * (1 - s) + tabele[k][i + 1] * s;
    };

    return Array.from({ length: N }, (_, i) => {
      const x = X0 + i * PAS;
      let h = 0;
      for (let k = 0; k < OCTAVE.length; k++) h += zgomot(x, k) * OCTAVE[k].amp;

      // zonă plată în jurul lui x = 0, ca mașina să nu apară într-un deal
      const t = Math.min(1, Math.max(0, (Math.abs(x) - ZONA_PLATA) / TRANZITIE));
      h *= t * t * (3 - 2 * t);                              // smoothstep

      return Math.max(-15, Math.min(20, h));
    });
  };

  S.inaltime = x => {
    const t = Math.min(N - 1.001, Math.max(0, (x - X0) / PAS)), i = Math.floor(t), f = t - i;
    return S.stare.teren[i] * (1 - f) + S.stare.teren[i + 1] * f;
  };

  // dt în secunde; pentru nivelare se folosește înălțimea de la începutul gestului.
  S.pensuleaza = (mod, x, raza, dt, nivel) => {
    const h = S.stare.teren, vechi = h.slice();
    for (let i = 0; i < N; i++) {
      const d = Math.abs(X0 + i * PAS - x);
      if (d > raza) continue;
      const f = (1 + Math.cos(Math.PI * d / raza)) / 2;
      if (mod === 'ridica') h[i] += 4 * f * dt;
      if (mod === 'coboara') h[i] -= 4 * f * dt;
      if (mod === 'niveleaza') h[i] += (nivel - h[i]) * Math.min(1, 8 * f * dt);
      if (mod === 'netezeste') {
        const m = (vechi[Math.max(0, i - 1)] + vechi[i] + vechi[Math.min(N - 1, i + 1)]) / 3;
        h[i] += (m - h[i]) * Math.min(1, 20 * f * dt);
      }
      h[i] = Math.max(-15, Math.min(20, h[i]));
    }
  };

  const peSegment = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
    return { x: a.x + t * dx, y: a.y + t * dy };
  };
  S.distSegment = (p, a, b) => { const q = peSegment(p, a, b); return Math.hypot(p.x - q.x, p.y - q.y); };

  // Cel mai apropiat punct de pe teren sau de pe o platformă.
  S.punctPeTeren = p => {
    let best = null, d = Infinity;
    const incearca = (a, b) => { const q = peSegment(p, a, b), dd = Math.hypot(p.x - q.x, p.y - q.y); if (dd < d) { d = dd; best = q; } };
    for (let i = 0; i < N - 1; i++) incearca({ x: X0 + i * PAS, y: S.stare.teren[i] }, { x: X0 + (i + 1) * PAS, y: S.stare.teren[i + 1] });
    for (const pl of S.stare.platforme) for (let i = 0; i < pl.length - 1; i++) incearca(pl[i], pl[i + 1]);
    return { ...best, d };
  };
})();
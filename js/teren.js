// Teren: un profil de înălțimi modelabil cu pensula, plus platforme desenate liber.
(() => {
  const X0 = -60, PAS = 0.5, N = 241;
  S.TEREN = { X0, PAS, N, X1: X0 + (N - 1) * PAS };

  S.terenImplicit = () => Array.from({ length: N }, (_, i) => {
    const x = X0 + i * PAS;
    const deal = (c, l, h) => Math.abs(x - c) < l ? h * (1 + Math.cos(Math.PI * (x - c) / l)) / 2 : 0;
    return deal(1, 3, 0.8) + deal(18, 7, 1.5) - deal(32, 5, 1.2) + deal(-30, 10, 4);
  });

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

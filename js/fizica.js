// Transformă construcția într-o lume Planck.js și o simulează.
(() => {
  const V = (x, y) => planck.Vec2(x, y);
  S.sim = null;

  S.porneste = () => {
    const world = planck.World({ gravity: V(0, -S.stare.gravitatie), allowSleep: false });
    const sol = world.createBody();
    const frec = { friction: S.stare.frecareTeren };
    S.sunet.asculta(world);
    const { X0, PAS, X1 } = S.TEREN;
    sol.createFixture(planck.Chain(S.stare.teren.map((y, i) => V(X0 + i * PAS, y)), false), frec);
    sol.createFixture(planck.Edge(V(X0, -20), V(X0, 60)), frec);
    sol.createFixture(planck.Edge(V(X1, -20), V(X1, 60)), frec);
    for (const pl of S.stare.platforme)
      for (let i = 0; i < pl.length - 1; i++) sol.createFixture(planck.Edge(V(pl[i].x, pl[i].y), V(pl[i + 1].x, pl[i + 1].y)), frec);

    // Piesele prinse rigid devin un singur corp (union-find), deci nu se "înmoaie".
    const tata = {};
    const gas = k => tata[k] === undefined || tata[k] === k ? k : (tata[k] = gas(tata[k]));
    const uneste = (a, b) => { const x = gas(a), y = gas(b); if (x !== y) tata[x] = y; };
    const cheie = h => h.id === 'teren' ? 'T' : h.id + ':' + h.parte;
    for (const p of S.stare.piese) if (p.fix) S.parti(p).forEach(i => uneste(p.id + ':' + i, 'T'));
    for (const c of S.stare.prinderi) if (c.mod === 'rigid') uneste(cheie(c.a), cheie(c.b));

    // Piesele din același ansamblu nu se ciocnesc între ele.
    const familie = {};
    let nr = 0;
    for (const p of S.stare.piese) if (!familie[p.id]) { nr++; S.ansamblu(p.id).forEach(q => familie[q.id] = -nr); }

    const corpuri = {}, parti = {};
    const radacinaSol = gas('T');
    for (const p of S.stare.piese) for (const i of S.parti(p)) {
      const k = p.id + ':' + i, r = gas(k), poza = S.pozaParte(p, i);
      if (!corpuri[r]) corpuri[r] = world.createBody({ type: r === radacinaSol ? 'static' : 'dynamic', angularDamping: 0.05 });
      const opt = { filterGroupIndex: familie[p.id] };
      let forma;
      if (p.tip === 'roata') {
        forma = planck.Circle(V(poza.x, poza.y), p.r);
        Object.assign(opt, { friction: p.frecare, density: p.masa / (Math.PI * p.r * p.r) });
      } else {
        const w = p.tip === 'bloc' ? p.w : S.PLACA.w, h = p.tip === 'bloc' ? p.h : S.PLACA.h;
        const m = p.tip === 'bloc' ? p.masa : p.masa / 2;
        forma = planck.Box(w / 2, h / 2, V(poza.x, poza.y), poza.a);
        Object.assign(opt, { friction: p.tip === 'bloc' ? p.frecare : 0.4, density: m / (w * h) });
      }
      corpuri[r].createFixture(forma, opt);
      parti[k] = { corp: corpuri[r], local: V(poza.x, poza.y), a0: poza.a };
    }

    const corp = h => h.id === 'teren' ? sol : parti[cheie(h)].corp;
    const motoare = [];
    for (const c of S.stare.prinderi) {
      if (c.mod !== 'pivot') continue;
      const eRoata = h => h.id !== 'teren' && S.piesa(h.id).tip === 'roata';
      const [alt, rotor] = eRoata(c.a) && !eRoata(c.b) ? [c.b, c.a] : [c.a, c.b];
      const A = corp(alt), B = corp(rotor);
      if (A === B || (!A.isDynamic() && !B.isDynamic())) continue;
      const pt = S.punct(c.b);
      const j = world.createJoint(planck.RevoluteJoint({}, A, B, V(pt.x, pt.y)));
      if (eRoata(rotor)) motoare.push({ j, p: S.piesa(rotor.id) });
    }

    const arcuri = [];
    for (const p of S.stare.piese) {
      if (p.tip !== 'susp') continue;
      const e0 = parti[p.id + ':0'], e1 = parti[p.id + ':1'], A = e0.corp, B = e1.corp;
      const arc = { p, forta: 0 };
      arcuri.push(arc);
      if (A === B || (!A.isDynamic() && !B.isDynamic())) continue;
      const a = S.pozaParte(p, 0), b = S.pozaParte(p, 1);
      const u = V((b.x - a.x) / p.L, (b.y - a.y) / p.L);
      world.createJoint(planck.PrismaticJoint({
        enableLimit: true, lowerTranslation: -(1 - S.CURSA.min) * p.L, upperTranslation: (S.CURSA.max - 1) * p.L
      }, A, B, V(a.x, a.y), u));

      // Masa efectivă, calculată ca în solver, ca rigiditatea să fie exact k (N/m) și amortizarea c.
      let inv = 0;
      for (const [corpul, pt] of [[A, a], [B, b]]) {
        if (!corpul.isDynamic()) continue;
        const com = corpul.getWorldCenter(), br = (pt.x - com.x) * u.y - (pt.y - com.y) * u.x;
        const m = corpul.getMass(), lc = corpul.getLocalCenter();
        const I = corpul.getInertia() - m * (lc.x * lc.x + lc.y * lc.y);
        inv += 1 / m + br * br / I;
      }
      const me = 1 / inv, omega = Math.sqrt(p.k / me);
      world.createJoint(planck.DistanceJoint(
        { frequencyHz: omega / (2 * Math.PI), dampingRatio: p.c / (2 * me * omega) },
        A, B, V(a.x, a.y), V(b.x, b.y)));
    }

    S.sim = { world, sol, parti, motoare, arcuri, rest: 0, t: 0, istoric: [], mouse: null };
  };

  S.opreste = () => { S.sim = null; };

  // Poziția unei părți: din simulare dacă rulează, altfel din construcție.
  S.poza = (p, i) => {
    const q = S.sim && S.sim.parti[p.id + ':' + i];
    if (!q) return S.pozaParte(p, i);
    const w = q.corp.getWorldPoint(q.local);
    return { x: w.x, y: w.y, a: q.corp.getAngle() + q.a0 };
  };

  const H = 1 / 240;
  S.avanseaza = (dt, directie, selectat) => {
    const sim = S.sim;
    sim.rest += Math.min(dt, 0.05);
    while (sim.rest >= H) {
      sim.rest -= H; sim.t += H;
      for (const { j, p } of sim.motoare) {
        const activ = p.motor === 'constant' || (p.motor === 'taste' && directie !== 0);
        j.enableMotor(activ);
        if (activ) {
          j.setMotorSpeed(-p.viteza * (p.motor === 'taste' ? directie : 1));
          j.setMaxMotorTorque(p.cuplu);
        }
      }
      sim.world.step(H, 16, 8);
    }
    for (const arc of sim.arcuri) {
      const a = S.poza(arc.p, 0), b = S.poza(arc.p, 1), L = Math.hypot(b.x - a.x, b.y - a.y);
      arc.L = L;
      if (arc.p.id === selectat) {
        sim.istoric.push(L / arc.p.L);
        if (sim.istoric.length > 240) sim.istoric.shift();
      }
    }
  };

  // Tragerea cu mouse-ul în timpul simulării.
  S.apuca = (p, i, punct) => {
    const q = S.sim.parti[p.id + ':' + i];
    if (!q.corp.isDynamic()) return;
    let masa = 0;
    for (const piesa of S.ansamblu(p.id)) masa += piesa.masa;
    S.sim.mouse = S.sim.world.createJoint(planck.MouseJoint(
      { maxForce: 60 * Math.max(masa, 10), frequencyHz: 4, dampingRatio: 0.9 },
      S.sim.sol, q.corp, V(punct.x, punct.y)));
  };
  S.trage = punct => { if (S.sim && S.sim.mouse) S.sim.mouse.setTarget(V(punct.x, punct.y)); };
  S.elibereaza = () => {
    if (S.sim && S.sim.mouse) { S.sim.world.destroyJoint(S.sim.mouse); S.sim.mouse = null; }
  };
  S.rasuceste = (p, semn) => {
    for (const i of S.parti(p)) {
      const q = S.sim.parti[p.id + ':' + i];
      if (q.corp.isDynamic()) q.corp.setAngularVelocity(q.corp.getAngularVelocity() + semn * 1.5);
    }
  };
})();

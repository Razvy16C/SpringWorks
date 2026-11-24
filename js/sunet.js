// Sunete sintetizate cu Web Audio, fără fișiere audio.
(() => {
  let ctx, iesire, zgomot, motor, pensula;
  const pauze = {}, lungimi = new Map();
  const setari = { activ: true, volum: 0.6 };
  try { Object.assign(setari, JSON.parse(localStorage.getItem(S.CHEIE + ':sunet'))); } catch { /* valori implicite */ }

  const aplica = () => {
    if (iesire) iesire.gain.setTargetAtTime(setari.activ ? setari.volum : 0, ctx.currentTime, 0.02);
    try { localStorage.setItem(S.CHEIE + ':sunet', JSON.stringify(setari)); } catch { /* fără salvare */ }
  };

  // Sursă continuă (motor, pensulă) cu volumul inițial zero.
  function continua(sursa, tipFiltru, frecventa) {
    const filtru = ctx.createBiquadFilter(), volum = ctx.createGain();
    filtru.type = tipFiltru; filtru.frequency.value = frecventa; volum.gain.value = 0;
    sursa.connect(filtru).connect(volum).connect(iesire);
    sursa.start();
    return { sursa, filtru, volum };
  }
  const sursaZgomot = () => { const s = ctx.createBufferSource(); s.buffer = zgomot; s.loop = true; return s; };

  // O buclă de V8: 8 explozii pe ciclu, inegale ca tărie și moment (de aici "bolboroseala").
  function buclaV8() {
    const rata = ctx.sampleRate, CICLURI = 4, PE_SECUNDA = 36;
    const tarii = [1, 0.5, 0.75, 0.45, 0.95, 0.6, 0.65, 0.4], decalaj = [0, 0.18, -0.08, 0.12, 0, -0.15, 0.1, -0.05];
    const buf = ctx.createBuffer(1, Math.round(rata * CICLURI * 8 / PE_SECUNDA), rata), d = buf.getChannelData(0);
    for (let n = 0; n < CICLURI * 8; n++) {
      const start = Math.round((n + decalaj[n % 8]) * rata / PE_SECUNDA);
      const tarie = tarii[n % 8] * (0.9 + Math.random() * 0.2);
      let brut = 0;
      for (let i = 0; i < rata * 0.09; i++) {
        const t = i / rata;
        brut += (Math.random() * 2 - 1 - brut) * 0.08; // zgomot grav de eșapament
        const val = Math.sin(2 * Math.PI * 62 * t) + 0.5 * Math.sin(2 * Math.PI * 124 * t) + 1.2 * brut;
        d[(start + i + d.length) % d.length] += tarie * val * Math.exp(-t / 0.024) * Math.min(1, t / 0.002);
      }
    }
    let maxim = 0;
    for (const v of d) maxim = Math.max(maxim, Math.abs(v));
    for (let i = 0; i < d.length; i++) d[i] /= maxim;
    return buf;
  }

  // Browserul permite sunetul doar după o acțiune a utilizatorului.
  function porneste() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) {
      ctx = new AC();
      iesire = ctx.createGain();
      iesire.gain.value = setari.activ ? setari.volum : 0;
      iesire.connect(ctx.destination);
      zgomot = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = zgomot.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // Motor V8: bucla de explozii, ușor saturată ca să sune plin și pe difuzoare mici.
      const sursa = ctx.createBufferSource(); sursa.buffer = buclaV8(); sursa.loop = true;
      const saturare = ctx.createWaveShaper();
      saturare.curve = Float32Array.from({ length: 1024 }, (_, i) => Math.tanh(2.5 * (i / 511.5 - 1)));
      const filtru = ctx.createBiquadFilter(); filtru.type = 'lowpass'; filtru.frequency.value = 350; filtru.Q.value = 0.8;
      const bas = ctx.createBiquadFilter(); bas.type = 'lowshelf'; bas.frequency.value = 140; bas.gain.value = 7;
      const volum = ctx.createGain(); volum.gain.value = 0;
      sursa.connect(saturare).connect(filtru).connect(bas).connect(volum).connect(iesire);
      sursa.playbackRate.value = 0.75;
      sursa.start();
      motor = { sursa, filtru, volum };
      pensula = continua(sursaZgomot(), 'bandpass', 500);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }
  addEventListener('pointerdown', porneste, true);
  addEventListener('keydown', porneste, true);

  const gata = () => ctx && ctx.state === 'running' && setari.activ;

  // Un ton scurt care alunecă de la f1 la f2.
  function ton(f1, f2, durata, tarie, tip = 'sine', intarziere = 0) {
    if (!gata()) return;
    const t = ctx.currentTime + intarziere, o = ctx.createOscillator(), v = ctx.createGain();
    o.type = tip;
    o.frequency.setValueAtTime(f1, t);
    o.frequency.exponentialRampToValueAtTime(f2, t + durata);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(tarie, t + 0.008);
    v.gain.exponentialRampToValueAtTime(0.0001, t + durata);
    o.connect(v).connect(iesire);
    o.start(t); o.stop(t + durata + 0.02);
  }

  function bufnitura(viteza, masa) {
    if (!gata() || ctx.currentTime - (pauze.lovire || 0) < 0.06) return;
    pauze.lovire = ctx.currentTime;
    const t = ctx.currentTime, tarie = Math.min(0.7, viteza / 12), grav = Math.min(1, masa / 120);
    const s = sursaZgomot(), f = ctx.createBiquadFilter(), v = ctx.createGain();
    f.type = 'lowpass'; f.frequency.value = 1400 - 1100 * grav;
    v.gain.setValueAtTime(tarie, t);
    v.gain.exponentialRampToValueAtTime(0.001, t + 0.12 + 0.15 * grav);
    s.connect(f).connect(v).connect(iesire);
    s.start(t); s.stop(t + 0.3);
    ton(140 - 80 * grav, 40, 0.15, tarie * 0.6);
  }

  // Scârțâit discret: impulsuri rare (frecare cu opriri) într-un filtru îngust.
  function scartait(comprimare, tarie, k) {
    if (!gata()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), v = ctx.createGain();
    const baza = 850 + Math.sqrt(k) * 6 + Math.random() * 150;
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(comprimare ? 55 : 80, t);
    o.frequency.linearRampToValueAtTime(comprimare ? 95 : 45, t + 0.2);
    f.type = 'bandpass'; f.Q.value = 14;
    f.frequency.setValueAtTime(baza, t);
    f.frequency.linearRampToValueAtTime(baza * (comprimare ? 1.25 : 0.8), t + 0.2);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(tarie, t + 0.04);
    v.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(f).connect(v).connect(iesire);
    o.start(t); o.stop(t + 0.25);
  }

  const EFECTE = {
    pune: () => ton(300, 520, 0.09, 0.25, 'triangle'),
    prinde: () => { ton(900, 700, 0.05, 0.2, 'square'); ton(1300, 1100, 0.07, 0.15, 'square', 0.06); },
    desprinde: () => ton(600, 250, 0.12, 0.2, 'triangle'),
    sterge: () => ton(260, 60, 0.18, 0.3, 'sawtooth'),
    eroare: () => { ton(180, 170, 0.1, 0.25, 'square'); ton(140, 130, 0.14, 0.25, 'square', 0.12); },
    start: () => { ton(330, 335, 0.1, 0.2, 'triangle'); ton(495, 500, 0.14, 0.2, 'triangle', 0.09); },
    stop: () => { ton(495, 490, 0.1, 0.2, 'triangle'); ton(330, 325, 0.14, 0.2, 'triangle', 0.09); }
  };

  S.sunet = {
    setari,
    efect: nume => { porneste(); if (EFECTE[nume]) EFECTE[nume](); },
    comuta: () => { setari.activ = !setari.activ; porneste(); aplica(); },
    volum: v => { setari.volum = v; aplica(); },

    // Ciocniri: viteza de apropiere în momentul contactului.
    asculta: world => {
      lungimi.clear();
      world.on('begin-contact', contact => {
        const A = contact.getFixtureA().getBody(), B = contact.getFixtureB().getBody();
        const wm = contact.getWorldManifold(null);
        if (!wm || !wm.points.length) return;
        const p = wm.points[0], va = A.getLinearVelocityFromWorldPoint(p), vb = B.getLinearVelocityFromWorldPoint(p);
        const viteza = Math.abs((vb.x - va.x) * wm.normal.x + (vb.y - va.y) * wm.normal.y);
        if (viteza > 1.2) bufnitura(viteza, Math.max(A.getMass(), B.getMass()));
      });
    },

    // Apelat la fiecare cadru pentru sunetele continue și arcuri.
    cadru: dt => {
      if (!ctx) return;
      const t = ctx.currentTime;
      let turatie = 0, activ = false, areMotor = false;
      if (S.sim) {
        for (const { j, p } of S.sim.motoare) {
          if (p.motor !== 'liber') areMotor = true;
          if (p.motor === 'constant' || (p.motor === 'taste' && S.directie)) {
            activ = true;
            turatie = Math.max(turatie, Math.abs(j.getJointSpeed()));
          }
        }
        for (const arc of S.sim.arcuri) {
          if (arc.L === undefined) continue;
          const inainte = lungimi.get(arc.p.id), viteza = inainte === undefined || !dt ? 0 : (arc.L - inainte) / dt;
          lungimi.set(arc.p.id, arc.L);
          if (Math.abs(viteza) > 1 && t - (pauze[arc.p.id] || 0) > 0.35) {
            pauze[arc.p.id] = t;
            scartait(viteza < 0, Math.min(0.22, Math.abs(viteza) / 14), arc.p.k);
          }
        }
      }
      // La ralanti bolborosește rar; accelerat urcă în turație și se deschide.
      const rpm = activ ? Math.min(turatie, 30) : 0;
      motor.volum.gain.setTargetAtTime(activ ? 0.32 : areMotor ? 0.16 : 0, t, 0.15);
      motor.sursa.playbackRate.setTargetAtTime(activ ? 1 + rpm * 0.085 : 0.75, t, 0.35);
      motor.filtru.frequency.setTargetAtTime(activ ? 550 + rpm * 40 : 350, t, 0.25);
      pensula.volum.gain.setTargetAtTime(S.picteaza ? 0.18 : 0, t, 0.05);
    }
  };
})();

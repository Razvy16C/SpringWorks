// Mouse, atingere și tastatură.
(() => {
  const $ = S.$, cv = S.panza, ui = S.ui;
  const degete = new Map();
  let gest = null, ciupire = null;
  S.directie = 0;

  const local = e => { const r = cv.getBoundingClientRect(); return { sx: e.clientX - r.left, sy: e.clientY - r.top }; };
  const lume = e => { const { sx, sy } = local(e); return S.laLume(sx, sy); };

  // Piesa (și partea ei) aflată sub un punct.
  function sub(w) {
    const toleranta = (S.tactil ? 14 : 6) / S.cam.z;
    const ordine = ['roata', 'bloc', 'susp'].flatMap(t => S.stare.piese.filter(p => p.tip === t).reverse());
    for (const p of ordine) for (const i of S.parti(p)) {
      const q = S.poza(p, i), l = S.rot(w.x - q.x, w.y - q.y, -q.a);
      if (p.tip === 'roata') { if (Math.hypot(l.x, l.y) <= p.r) return { p, i }; continue; }
      const hw = (p.tip === 'bloc' ? p.w : S.PLACA.w) / 2, hh = (p.tip === 'bloc' ? p.h : S.PLACA.h) / 2;
      if (Math.abs(l.x) <= hw + toleranta && Math.abs(l.y) <= hh + toleranta) return { p, i };
    }
    for (const p of ordine) if (p.tip === 'susp' && S.distSegment(w, S.poza(p, 0), S.poza(p, 1)) < Math.max(0.25, toleranta)) return { p, i: 1 };
    return null;
  }

  // Ținta uneltei "Leagă": punct de prindere apropiat, apoi piesa, apoi terenul.
  function tintaLegare(w) {
    const prag = (S.tactil ? 26 : 14) / S.cam.z;
    let best = null, d = prag;
    const exclus = ui.primul ? ui.primul.id : null;
    for (const p of S.stare.piese) {
      if (p.id === exclus) continue;
      for (const q of S.puncteDePrindere(p)) {
        const dd = Math.hypot(q.x - w.x, q.y - w.y);
        if (dd < d) { d = dd; best = { p, parte: q.parte, x: q.x, y: q.y }; }
      }
    }
    if (best) return { ancora: S.ancora(best.p, best.parte, best), x: best.x, y: best.y };
    const h = sub(w);
    if (h && h.p.id !== exclus) {
      const punct = h.p.tip === 'susp' ? S.pozaParte(h.p, h.i) : w;
      return { ancora: S.ancora(h.p, h.i, punct), x: punct.x, y: punct.y };
    }
    const t = S.punctPeTeren(w);
    return t.d < prag * 2 ? { ancora: { id: 'teren', x: t.x, y: t.y }, x: t.x, y: t.y } : null;
  }

  function clicLegare(w) {
    const t = tintaLegare(w);
    if (!t) return S.indiciu('Click a part or the terrain.');
    if (!ui.primul) {
      if (t.ancora.id === 'teren') return S.indiciu('Start with the part to move. Select the terrain second.');
      ui.primul = t.ancora;
      return S.indiciu('Now click the destination. Press Esc to cancel.');
    }
    S.memoreaza();
    const eroare = S.leaga(ui.primul, t.ancora, $('tipPrindere').value);
    ui.primul = null;
    S.indiciu(eroare || 'Connected.');
    S.sunet.efect(eroare ? 'eroare' : 'prinde');
    S.salveaza();
  }

  function stergePlatforma(w) {
    S.stare.platforme = S.stare.platforme.filter(pl => !pl.some((q, i) => i && S.distSegment(w, pl[i - 1], q) < 12 / S.cam.z));
  }

  const doua = () => {
    const [a, b] = [...degete.values()];
    return { sx: (a.sx + b.sx) / 2, sy: (a.sy + b.sy) / 2, d: Math.hypot(a.sx - b.sx, a.sy - b.sy), unghi: Math.atan2(b.sy - a.sy, b.sx - a.sx) };
  };

  function zoom(factor, sx = cv.clientWidth / 2, sy = cv.clientHeight / 2) {
    const inainte = S.laLume(sx, sy);
    S.cam.z = Math.max(8, Math.min(140, S.cam.z * factor));
    const dupa = S.laLume(sx, sy);
    S.cam.x += inainte.x - dupa.x; S.cam.y += inainte.y - dupa.y;
  }

  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    degete.set(e.pointerId, local(e));
    if (degete.size === 2) {
      ciupire = doua();
      // cu o piesă ținută, al doilea deget o rotește; altfel mută și mărește vederea
      if (gest && gest.tip === 'muta') gest.tip = 'rotire';
      else { S.elibereaza(); gest = null; ui.desen = null; }
      return;
    }
    if (degete.size > 2) return;
    const w = lume(e), pan = { tip: 'pan', ...local(e) };
    if (e.button === 1 || e.button === 2) { gest = pan; return; }
    if (!S.sim && ui.unealta === 'leaga') {
      gest = { tip: 'atingere', ...local(e) }; // se leagă la ridicare, dacă nu s-a tras
      return;
    }
    if (!S.sim && ui.unealta === 'teren') {
      S.memoreaza();
      if (ui.pensula === 'deseneaza') { ui.desen = [w]; gest = { tip: 'desen' }; }
      else if (ui.pensula === 'sterge') { stergePlatforma(w); gest = { tip: 'sterge' }; }
      else gest = { tip: 'pensula', nivel: S.inaltime(w.x) };
      ui.cursor = w;
      return;
    }
    const h = sub(w);
    if (!h) { gest = pan; if (!S.sim) S.selecteaza(null); return; }
    S.selecteaza(h.p.id);
    if (S.sim) { S.apuca(h.p, h.i, w); gest = { tip: 'trage' }; }
    else { S.memoreaza(); gest = { tip: 'muta', id: h.p.id, ultim: w, mutat: false }; }
  });

  cv.addEventListener('pointermove', e => {
    const w = lume(e);
    ui.cursor = w;
    if (degete.has(e.pointerId)) degete.set(e.pointerId, local(e));
    if (degete.size >= 2) {
      const acum = doua(), vechi = ciupire || acum;
      ciupire = acum;
      if (gest && gest.tip === 'rotire') {
        const p = S.piesa(gest.id);
        let d = acum.unghi - vechi.unghi;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        S.roteste(S.ansamblu(p.id), p.x, p.y, -d);
      } else {
        S.cam.x -= (acum.sx - vechi.sx) / S.cam.z; S.cam.y += (acum.sy - vechi.sy) / S.cam.z;
        if (vechi.d) zoom(acum.d / vechi.d, acum.sx, acum.sy);
      }
      return;
    }
    ui.tinta = !S.sim && ui.unealta === 'leaga' ? tintaLegare(w) : null;
    if (!gest) return;
    if (gest.tip === 'atingere') {
      const { sx, sy } = local(e);
      if (Math.hypot(sx - gest.sx, sy - gest.sy) > 10) gest.tip = 'pan';
    }
    if (gest.tip === 'pan') {
      const { sx, sy } = local(e);
      S.cam.x -= (sx - gest.sx) / S.cam.z; S.cam.y += (sy - gest.sy) / S.cam.z;
      gest.sx = sx; gest.sy = sy;
      gest.manual = true;
    } else if (gest.tip === 'muta') {
      const grup = S.ansamblu(gest.id), dx = w.x - gest.ultim.x, dy = w.y - gest.ultim.y;
      if (!gest.mutat && Math.hypot(dx, dy) < 4 / S.cam.z) return;
      if (S.desprindeDeTeren(grup)) S.indiciu('Assembly disconnected from the terrain.');
      S.muta(grup, dx, dy);
      gest.ultim = w; gest.mutat = true;
    } else if (gest.tip === 'trage') S.trage(w);
    else if (gest.tip === 'desen') {
      const u = ui.desen[ui.desen.length - 1];
      if (Math.hypot(w.x - u.x, w.y - u.y) > 0.4) ui.desen.push(w);
    } else if (gest.tip === 'sterge') stergePlatforma(w);
  });

  const termina = e => {
    degete.delete(e.pointerId);
    ciupire = null;
    if (gest && gest.tip === 'atingere' && e.type === 'pointerup') clicLegare(lume(e));
    if (ui.desen && ui.desen.length > 1) S.stare.platforme.push(ui.desen);
    ui.desen = null;
    S.elibereaza();
    if (gest && gest.tip !== 'pan') S.salveaza();
    gest = null;
  };
  cv.addEventListener('pointerup', termina);
  cv.addEventListener('pointercancel', termina);
  cv.addEventListener('pointerleave', () => { if (!gest) ui.cursor = ui.tinta = null; });
  cv.addEventListener('contextmenu', e => e.preventDefault());

  cv.addEventListener('wheel', e => {
    e.preventDefault();
    if (gest && gest.tip === 'muta') {
      const p = S.piesa(gest.id), grup = S.ansamblu(p.id);
      S.roteste(grup, p.x, p.y, (e.deltaY < 0 ? 1 : -1) * Math.PI / 36);
      return;
    }
    const { sx, sy } = local(e);
    zoom(Math.exp(-e.deltaY * 0.0012), sx, sy);
  }, { passive: false });

  // Apelat la fiecare cadru: pensula lucrează cât timp e apăsată.
  S.gestContinuu = dt => {
    S.picteaza = !!(gest && gest.tip === 'pensula');
    if (gest && gest.tip === 'pensula' && ui.cursor) S.pensuleaza(ui.pensula, ui.cursor.x, ui.raza, dt, gest.nivel);
  };
  S.seTrage = () => !!gest;

  const sageti = {};
  const recalculeaza = () => { S.directie = (sageti.dreapta ? 1 : 0) - (sageti.stanga ? 1 : 0); };
  addEventListener('keydown', e => {
    if (e.target.matches('input,select')) return;
    const k = e.key.toLowerCase(), p = S.piesa(ui.selectat);
    if (k === ' ') { e.preventDefault(); if (!e.repeat) S.comutaSim(); }
    else if (k === 'arrowleft' || k === 'a') { sageti.stanga = true; recalculeaza(); e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd' && !e.ctrlKey && !e.metaKey) { sageti.dreapta = true; recalculeaza(); e.preventDefault(); }
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); $('btnUndo').click(); }
    else if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); S.actiune('copiaza'); }
    else if (k === 'q' || k === 'e') {
      if (S.sim) { if (p) S.rasuceste(p, k === 'q' ? 1 : -1); }
      else S.actiune(k === 'q' ? 'rotesteStanga' : 'rotesteDreapta');
    }
    else if (k === 'delete' || k === 'backspace') S.actiune('sterge');
    else if (k === 'escape') { ui.primul = null; S.indiciu(); }
    else if (!S.sim && ['1', '2', '3'].includes(k)) S.unealta(['muta', 'leaga', 'teren'][k - 1]);
  });
  addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') sageti.stanga = false;
    if (k === 'arrowright' || k === 'd') sageti.dreapta = false;
    recalculeaza();
  });
  addEventListener('blur', () => { sageti.stanga = sageti.dreapta = false; recalculeaza(); });

  for (const [id, cheie] of [['inapoi', 'stanga'], ['inainte', 'dreapta']]) {
    const b = $(id), pune = v => () => { sageti[cheie] = v; recalculeaza(); };
    b.addEventListener('pointerdown', pune(true));
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, pune(false));
  }
  $('btnPlus').onclick = () => zoom(1.25);
  $('btnMinus').onclick = () => zoom(0.8);
})();

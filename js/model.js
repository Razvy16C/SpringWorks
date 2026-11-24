// Starea construcției: piese, prinderi, geometrie, istoric și salvare.
(() => {
  const rot = (x, y, a) => ({ x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a) });
  S.rot = rot;

  S.stare = { piese: [], prinderi: [], teren: null, platforme: [], gravitatie: 9.81, frecareTeren: 0.9, urm: 1 };
  S.piesa = id => S.stare.piese.find(p => p.id === id);

  S.adauga = (date, x, y, angle = 0) => {
    const p = Object.assign({ id: S.stare.urm++, x, y, a: angle, fix: false }, date);
    S.stare.piese.push(p);
    return p;
  };

  // O suspensie are două capete ("părți"); celelalte piese au o singură parte.
  S.parti = p => p.tip === 'susp' ? [0, 1] : [0];
  S.pozaParte = (p, parte) => {
    if (p.tip !== 'susp') return { x: p.x, y: p.y, a: p.a };
    const d = rot(0, (parte ? 0.5 : -0.5) * p.L, p.a);
    return { x: p.x + d.x, y: p.y + d.y, a: p.a };
  };

  // Ancorele se memorează relativ la piesă, ca să urmeze redimensionările.
  S.localDinAncora = (p, h) => p.tip === 'bloc' ? { x: h.u * p.w, y: h.v * p.h }
    : p.tip === 'roata' ? { x: h.u * p.r, y: h.v * p.r } : { x: 0, y: 0 };
  S.punct = h => {
    if (h.id === 'teren') return { x: h.x, y: h.y };
    const p = S.piesa(h.id), poza = S.pozaParte(p, h.parte), l = S.localDinAncora(p, h), d = rot(l.x, l.y, poza.a);
    return { x: poza.x + d.x, y: poza.y + d.y };
  };
  S.ancora = (p, parte, punct) => {
    const poza = S.pozaParte(p, parte), l = rot(punct.x - poza.x, punct.y - poza.y, -poza.a);
    if (p.tip === 'bloc') return { id: p.id, parte, u: l.x / p.w, v: l.y / p.h };
    if (p.tip === 'roata') return { id: p.id, parte, u: l.x / p.r, v: l.y / p.r };
    return { id: p.id, parte };
  };
  S.puncteDePrindere = p => {
    if (p.tip === 'susp') return [0, 1].map(parte => ({ parte, ...S.pozaParte(p, parte) }));
    const uv = p.tip === 'roata' ? [[0, 0]] : [[0, 0], [-.5, 0], [.5, 0], [0, -.5], [0, .5], [-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5], [-.35, -.5], [.35, -.5]];
    return uv.map(([u, v]) => ({ parte: 0, ...S.punct({ id: p.id, parte: 0, u, v }) }));
  };

  // Toate piesele legate (direct sau indirect) de piesa dată.
  S.ansamblu = (id, faraPrindere) => {
    const vazute = new Set([id]), coada = [id];
    while (coada.length) {
      const cur = coada.pop();
      for (const c of S.stare.prinderi) {
        if (c === faraPrindere || c.a.id === 'teren' || c.b.id === 'teren') continue;
        const alt = c.a.id === cur ? c.b.id : c.b.id === cur ? c.a.id : null;
        if (alt !== null && !vazute.has(alt)) { vazute.add(alt); coada.push(alt); }
      }
    }
    return [...vazute].map(S.piesa);
  };

  S.muta = (piese, dx, dy) => piese.forEach(p => { p.x += dx; p.y += dy; });
  S.roteste = (piese, cx, cy, unghi) => piese.forEach(p => {
    const d = rot(p.x - cx, p.y - cy, unghi);
    p.x = cx + d.x; p.y = cy + d.y; p.a += unghi;
  });
  S.desprindeDeTeren = piese => {
    const ids = new Set(piese.map(p => p.id)), inainte = S.stare.prinderi.length;
    S.stare.prinderi = S.stare.prinderi.filter(c => !(c.b.id === 'teren' && ids.has(c.a.id)));
    return inainte !== S.stare.prinderi.length;
  };

  // După o schimbare de dimensiune, trage piesele legate înapoi în ancore.
  S.realiniaza = idRadacina => {
    const gata = new Set([idRadacina]), coada = [idRadacina];
    while (coada.length) {
      const cur = coada.shift();
      for (const c of S.stare.prinderi) {
        if (c.b.id === 'teren') continue;
        const [aici, acolo] = c.a.id === cur ? [c.a, c.b] : c.b.id === cur ? [c.b, c.a] : [];
        if (!aici || gata.has(acolo.id)) continue;
        const q = S.punct(aici), r = S.punct(acolo), alt = S.piesa(acolo.id);
        alt.x += q.x - r.x; alt.y += q.y - r.y;
        gata.add(alt.id); coada.push(alt.id);
      }
    }
  };

  // Leagă ancora A de ancora B, mutând ansamblul lui A. Întoarce un mesaj de eroare sau null.
  S.leaga = (a, b, mod) => {
    if (a.id === b.id) return 'Alege două piese diferite.';
    const pa = S.punct(a), pb = S.punct(b), grupA = S.ansamblu(a.id);
    const acelasi = b.id !== 'teren' && grupA.some(p => p.id === b.id);
    if (acelasi && Math.hypot(pa.x - pb.x, pa.y - pb.y) > 0.3) return 'Piesele sunt deja în același ansamblu. Pentru a doua prindere, alege puncte apropiate.';
    if (!acelasi) {
      S.desprindeDeTeren(b.id === 'teren' ? [] : grupA);
      S.muta(grupA, pb.x - pa.x, pb.y - pa.y);
    }
    const roata = [a, b].some(h => h.id !== 'teren' && S.piesa(h.id).tip === 'roata');
    S.stare.prinderi.push({ a, b, mod: roata ? 'pivot' : mod });
    return null;
  };

  S.sterge = id => {
    S.stare.piese = S.stare.piese.filter(p => p.id !== id);
    S.stare.prinderi = S.stare.prinderi.filter(c => c.a.id !== id && c.b.id !== id);
  };

  const istoric = [];
  S.memoreaza = () => {
    const text = JSON.stringify(S.stare);
    if (istoric[istoric.length - 1] !== text) istoric.push(text);
    if (istoric.length > 60) istoric.shift();
  };
  S.anuleaza = () => {
    const acum = JSON.stringify(S.stare);
    let text = istoric.pop();
    if (text === acum) text = istoric.pop();
    if (text) S.stare = JSON.parse(text);
    return !!text;
  };

  S.salveaza = (loc = 'auto') => {
    try { localStorage.setItem(S.CHEIE + ':' + loc, JSON.stringify(S.stare)); return true; } catch { return false; }
  };
  S.incarca = (loc = 'auto') => {
    try {
      const d = JSON.parse(localStorage.getItem(S.CHEIE + ':' + loc));
      if (d && Array.isArray(d.piese) && Array.isArray(d.teren)) { S.stare = d; return true; }
    } catch { /* fără salvare disponibilă */ }
    return false;
  };

  S.masinaExemplu = () => {
    S.stare.piese = []; S.stare.prinderi = [];
    const item = n => S.INVENTAR.find(i => i.nume === n).date;
    const y = S.inaltime(-8) + 2.4;
    const sasiu = S.adauga(item('Șasiu'), -8, y);
    for (const u of [-0.35, 0.35]) {
      const s = S.adauga(item('Standard'), 0, 0);
      S.leaga(S.ancora(s, 1, S.pozaParte(s, 1)), { id: sasiu.id, parte: 0, u, v: -0.5 }, 'rigid');
      const r = S.adauga(item('Roată'), 0, 0);
      S.leaga(S.ancora(r, 0, r), S.ancora(s, 0, S.pozaParte(s, 0)), 'pivot');
    }
    // S.leaga mută piesa nouă, deci șasiul rămâne pe loc.
    S.adauga(item('Lemn'), -15, S.inaltime(-15) + 0.5);
    S.adauga(item('Lemn'), -15, S.inaltime(-15) + 1.5);
    return sasiu;
  };
})();

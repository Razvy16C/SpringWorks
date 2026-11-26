// Inventarul, panoul de proprietăți, uneltele și mesajele.
(() => {
  const $ = id => document.getElementById(id);
  S.$ = $;
  S.ui = { unealta: 'muta', selectat: null, primul: null, tinta: null, cursor: null, desen: null, pensula: 'ridica', raza: 3 };

const ICO = {
  stanga: '<span class="ico ico-arrow-left" aria-hidden="true"></span>',
  dreapta: '<span class="ico ico-arrow-right" aria-hidden="true"></span>'
};

  const INDICII = {
    muta: 'Trage piesele. Q / E sau rotița (în timp ce ții piesa) le rotesc. Delete șterge, Ctrl+D copiază.',
    leaga: 'Apasă întâi punctul piesei care se mută, apoi punctul de destinație (altă piesă sau terenul).',
    teren: 'Ține apăsat și trage pentru a modela. Rotița mărește, butonul din dreapta mută vederea.',
    sim: `Trage piesele ca să le arunci. ${ICO.stanga} ${ICO.dreapta} conduc roțile. Spațiu oprește și revine la construcție.`,
  };
  const INDICII_TACTIL = {
    muta: 'Trage piesele cu degetul. Cu al doilea deget o rotești pe cea ținută.',
    leaga: 'Atinge punctul piesei care se mută, apoi destinația.',
    teren: 'Trage ca să modelezi. Două degete mută și măresc vederea.',
    sim: `Ține ${ICO.stanga} ${ICO.dreapta} ca să conduci. Trage piesele ca să le arunci.`
  };
  let cronometru;
  S.indiciu = text => {
    clearTimeout(cronometru);
    const mod = S.sim ? 'sim' : S.ui.unealta;
    if (S.tactil && text) text = text.replace('Esc renunță.', 'Apasă din nou „Leagă” ca să renunți.').replace('Apasă destinația', 'Atinge destinația');
    const el = $('indiciu');
    if (text) el.textContent = text;
    else el.innerHTML = (S.tactil ? INDICII_TACTIL : INDICII)[mod];
    // pe ecrane mici indiciul dispare singur, ca să nu acopere scena
    if (text) cronometru = setTimeout(() => S.indiciu(), 4000);
    else if (S.tactil) cronometru = setTimeout(() => { $('indiciu').textContent = ''; }, 6000);
  };

  S.unealta = nume => {
    Object.assign(S.ui, { unealta: nume, primul: null, tinta: null, desen: null });
    document.querySelectorAll('[data-unealta]').forEach(b => b.classList.toggle('activ', b.dataset.unealta === nume));
    if (S.barăActiuni) S.barăActiuni();
    $('tipPrindere').hidden = nume !== 'leaga';
    for (const id of ['pensula', 'marimeLabel', 'btnTerenPlat', 'btnTerenNou']) $(id).hidden = nume !== 'teren';
    S.indiciu();
  };

  const fmt = (v, pas) => v.toFixed(pas >= 1 ? 0 : pas >= 0.1 ? 1 : 2).replace('.', ',');

  S.selecteaza = id => {
    S.ui.selectat = id;
    if (S.barăActiuni) S.barăActiuni();
    if (S.sim) S.sim.istoric = [];
    S.panou();
  };

  S.panou = () => {
    const el = $('panou'), p = S.piesa(S.ui.selectat);
    el.innerHTML = '';
    const adauga = (html) => { el.insertAdjacentHTML('beforeend', html); return el.lastElementChild; };
    if (!p) {
      adauga('<h2>Proprietăți</h2>');
      adauga('<p class="nota">Selectează o piesă din scenă ca să îi schimbi masa, mărimea, frecarea sau arcul.</p>');
      return;
    }
    adauga(`<h2>${S.NUME[p.tip]} #${p.id}</h2>`);
    for (const [k, eticheta, min, max, pas, um] of S.CAMPURI[p.tip]) {
      const lab = adauga(`<label class="camp">${eticheta} <output></output><input id="c_${k}" type="range" min="${min}" max="${max}" step="${pas}"></label>`);
      const inp = lab.querySelector('input'), out = lab.querySelector('output');
      inp.value = p[k]; out.textContent = `${fmt(p[k], pas)} ${um}`; inp.disabled = !!S.sim;
      inp.addEventListener('pointerdown', S.memoreaza);
      inp.addEventListener('keydown', S.memoreaza);
      inp.addEventListener('input', () => {
        const q = S.piesa(p.id);
        q[k] = Number(inp.value); out.textContent = `${fmt(q[k], pas)} ${um}`;
        if (['w', 'h', 'L', 'r'].includes(k)) S.realiniaza(q.id);
        S.salveaza();
      });
    }
    const alege = (eticheta, html) => adauga(`<label class="camp">${eticheta}${html}</label>`);
    if (p.tip === 'roata') {
      const sel = alege('Motor', '<select id="motor"><option value="taste">Condus de tine</option><option value="constant">Mereu pornit</option><option value="liber">Roată liberă</option></select>').querySelector('select');
      sel.value = p.motor; sel.disabled = !!S.sim;
      sel.onchange = () => { S.memoreaza(); S.piesa(p.id).motor = sel.value; S.salveaza(); };
      adauga('<p class="nota">Motorul acționează doar dacă roata e prinsă de ceva.</p>');
    }
    if (p.tip === 'bloc') {
      const lab = adauga('<label class="bifa"><input id="fix" type="checkbox"> Fixat în spațiu</label>'), inp = lab.querySelector('input');
      inp.checked = p.fix; inp.disabled = !!S.sim;
      inp.onchange = () => { S.memoreaza(); S.piesa(p.id).fix = inp.checked; S.salveaza(); };
    }
    if (p.tip === 'susp' && S.sim) {
      adauga('<h3>Lungime în timp real</h3>');
      adauga('<canvas id="grafic"></canvas>');
      adauga('<div class="masuri"><span id="lungimeAcum"></span><span id="fortaAcum"></span></div>');
    }
    const butoane = adauga('<div class="grup" style="margin-top:12px"></div>');
    const buton = (text, fn) => {
      const b = document.createElement('button');
      b.textContent = text; b.disabled = !!S.sim; b.onclick = fn; butoane.append(b);
    };
    buton('-15°', () => S.actiune('rotesteStanga'));
    buton('+15°', () => S.actiune('rotesteDreapta'));
    buton('Copiază', () => S.actiune('copiaza'));
    buton('Desprinde', () => S.actiune('desprinde'));
    buton('Șterge', () => S.actiune('sterge'));
  };

  S.actiune = nume => {
    const p = S.piesa(S.ui.selectat);
    if (!p || S.sim) return;
    S.memoreaza();
    S.sunet.efect({ copiaza: 'pune', desprinde: 'desprinde', sterge: 'sterge' }[nume]);
    if (nume === 'rotesteStanga' || nume === 'rotesteDreapta') {
      const grup = S.ansamblu(p.id);
      S.desprindeDeTeren(grup);
      S.roteste(grup, p.x, p.y, (nume === 'rotesteStanga' ? 1 : -1) * Math.PI / 12);
    }
    if (nume === 'copiaza') {
      const { id, x, y, a, ...date } = p;
      S.selecteaza(S.adauga(date, x + 1, y + 1, a).id);
    }
    if (nume === 'desprinde') {
      S.stare.prinderi = S.stare.prinderi.filter(c => c.a.id !== p.id && c.b.id !== p.id);
      S.indiciu('Piesa a fost desprinsă.');
    }
    if (nume === 'sterge') { S.sterge(p.id); S.selecteaza(null); }
    S.salveaza();
  };

  S.lume = () => {
    $('gravitatie').value = String(S.stare.gravitatie);
    $('frecareTeren').value = S.stare.frecareTeren;
    $('frecareTerenV').textContent = fmt(S.stare.frecareTeren, 0.01);
  };

  S.comutaSim = () => {
    if (S.sim) S.opreste(); else S.porneste();
    S.picteaza = false;
    S.sunet.efect(S.sim ? 'start' : 'stop');
    S.ui.primul = null;
    S.directie = 0;
    const b = $('btnPlay');
    b.textContent = S.sim ? '■ Oprește' : '▶ Simulează';
    b.classList.toggle('rulare', !!S.sim);
    $('condus').hidden = !S.sim;
    document.querySelectorAll('#unelte button, #unelte select, .piesa, #bara [data-unealta], #btnPiese, #btnUndo, #btnIncarca, #btnExemplu, #btnGoleste, #gravitatie, #frecareTeren').forEach(e => e.disabled = !!S.sim);
    S.panou();
    S.foaie('');
    S.barăActiuni();
    S.indiciu();
  };
})();

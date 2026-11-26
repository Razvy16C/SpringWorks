// Pornire, legarea butoanelor și bucla de animație.
(() => {
  const $ = S.$, ui = S.ui;

  const ICO = {
    suneton: '<span class="ico ico-sound-on" aria-hidden="true"></span>',
    sunetoff: '<span class="ico ico-sound-off" aria-hidden="true"></span>'
  };

  // Inventar: clic pune piesa în centru, tragerea o pune unde dai drumul.
  function pune(date, punct) {
    S.memoreaza();
    const p = S.adauga(date, punct.x, punct.y);
    S.selecteaza(p.id);
    S.unealta('muta');
    S.salveaza();
    S.sunet.efect('pune');
    S.foaie('');
  }
  for (const it of S.INVENTAR) {
    if (it.grup) { $('listaInventar').insertAdjacentHTML('beforeend', `<h3 style="grid-column:1/-1">${it.grup}</h3>`); continue; }
    const b = document.createElement('button');
    b.className = 'piesa';
    b.innerHTML = `${it.nume}<small>${it.info}</small>`;
    let tras = false;
    b.addEventListener('pointerdown', e => { tras = false; if (!S.tactil) b.setPointerCapture(e.pointerId); });
    b.addEventListener('pointerup', e => {
      const r = S.panza.getBoundingClientRect();
      if (!S.tactil && !S.sim && e.clientX > r.left && e.clientX < r.right && e.clientY > r.top && e.clientY < r.bottom) {
        tras = true;
        pune(it.date, S.laLume(e.clientX - r.left, e.clientY - r.top));
      }
    });
    b.addEventListener('click', () => { if (!tras && !S.sim) pune(it.date, { x: S.cam.x, y: S.cam.y + 1 }); tras = false; });
    $('listaInventar').append(b);
  }

  const reimprospateaza = () => { S.selecteaza(null); S.lume(); ui.primul = null; };

  document.querySelectorAll('[data-unealta]').forEach(b => b.onclick = () => S.unealta(b.dataset.unealta));
  $('pensula').onchange = e => { ui.pensula = e.target.value; };
  $('marime').oninput = e => { ui.raza = Number(e.target.value); };
  $('btnTerenPlat').onclick = () => { S.memoreaza(); S.stare.teren.fill(0); S.stare.platforme = []; S.salveaza(); };
  $('btnTerenNou').onclick = () => {S.memoreaza(); S.stare.teren = S.terenImplicit(); S.stare.platforme = []; S.salveaza();};
  $('btnPlay').onclick = e => { e.currentTarget.blur(); S.comutaSim(); };
  $('btnUndo').onclick = () => { if (!S.sim && S.anuleaza()) { reimprospateaza(); S.salveaza(); } };
  $('btnSalveaza').onclick = () => S.indiciu(S.salveaza('slot') ? 'Construcția a fost salvată în acest browser.' : 'Browserul nu permite salvarea aici.');
  $('btnIncarca').onclick = () => {
    S.memoreaza();
    if (S.incarca('slot')) { reimprospateaza(); S.salveaza(); S.indiciu('Construcție încărcată.'); }
    else S.indiciu('Nu există încă o salvare. Apasă întâi Salvează.');
  };
  const arataExemplu = () => {
    const sasiu = S.masinaExemplu();
    S.cam.x = sasiu.x + (S.panza.clientWidth < 600 ? 0 : 4); S.cam.y = sasiu.y;
    S.cam.z = Math.max(S.tactil ? 28 : 18, Math.min(48, S.panza.clientWidth / 20));
    S.selecteaza(S.stare.piese.find(p => p.tip === 'susp').id);
  };
  $('btnExemplu').onclick = () => { S.memoreaza(); arataExemplu(); S.salveaza(); };
  $('btnGoleste').onclick = () => { S.memoreaza(); S.stare.piese = []; S.stare.prinderi = []; reimprospateaza(); S.salveaza(); S.indiciu('Piese șterse. „Anulează” le readuce.'); };
  $('btnCentru').onclick = () => {
    const p = S.piesa(ui.selectat) || S.stare.piese[0];
    if (p) { const q = S.poza(p, 0); S.cam.x = q.x; S.cam.y = q.y; } else { S.cam.x = 0; S.cam.y = 2; }
  };
  $('gravitatie').onchange = e => { S.memoreaza(); S.stare.gravitatie = Number(e.target.value); S.salveaza(); };
  $('frecareTeren').oninput = e => { S.stare.frecareTeren = Number(e.target.value); S.lume(); S.salveaza(); };

  const butonSunet = () => { $('btnSunet').innerHTML = S.sunet.setari.activ ? `${ICO.suneton} Sunet` : `${ICO.sunetoff} Mut`; };
  $('btnSunet').onclick = () => { S.sunet.comuta(); butonSunet(); };
  $('volum').value = S.sunet.setari.volum;
  $('volum').oninput = e => S.sunet.volum(Number(e.target.value));
  $('volum').onchange = () => S.sunet.efect('pune');
  butonSunet();

  S.detecteaza();
  if (S.incarca()) {
    if (!Array.isArray(S.stare.teren) || S.stare.teren.length !== S.TEREN.N) {
    S.stare.teren = S.terenImplicit();
    S.stare.platforme = [];
    }
    const p = S.stare.piese[0];
    if (p) { S.cam.x = p.x; S.cam.y = p.y; }
    reimprospateaza();
  } else {
    S.stare.teren = S.terenImplicit();
    arataExemplu();
    S.lume();
  }
  S.unealta('muta');

  let inainte = performance.now();
  function cadru(acum) {
    const dt = Math.min(0.05, Math.max(0, (acum - inainte) / 1000));
    inainte = acum;
    if (S.sim) {
      S.avanseaza(dt, S.directie, ui.selectat);
      const p = S.piesa(ui.selectat);
      // fără selecție, camera urmărește o roată cât timp conduci
      const tinta = p || (S.directie && S.stare.piese.find(x => x.tip === 'roata' && x.motor === 'taste'));
      if (tinta && $('urmareste').checked && !S.seTrage()) {
        const q = S.poza(tinta, 0), f = Math.min(1, dt * 4);
        S.cam.x += (q.x - S.cam.x) * f; S.cam.y += (q.y - S.cam.y) * f;
      }
      if (p && p.tip === 'susp' && $('lungimeAcum')) {
        const L = S.sim.arcuri.find(a => a.p.id === p.id).L;
        $('lungimeAcum').textContent = `L = ${L.toFixed(2)} m`;
        $('fortaAcum').textContent = `F arc = ${Math.round(p.k * (p.L - L))} N`;
        S.grafic();
      }
    } else S.gestContinuu(dt);
    S.sunet.cadru(dt);
    S.deseneaza(ui);
    requestAnimationFrame(cadru);
  }
  requestAnimationFrame(cadru);
})();

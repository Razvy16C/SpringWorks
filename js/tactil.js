// Interfața pentru telefoane, tablete și alte ecrane fără tastatură.
(() => {
  const $ = S.$, radacina = document.documentElement, app = $('app');
  const grosier = matchMedia('(pointer: coarse)'), ingust = matchMedia('(max-width: 820px)');

  // O singură "foaie" deschisă: inventar, proprietati sau meniu.
  S.foaie = nume => {
    if (nume && app.dataset.foaie === nume) nume = '';
    app.dataset.foaie = nume || '';
  };

  const detecteaza = () => {
    S.tactil = grosier.matches || ingust.matches;
    radacina.classList.toggle('tactil', S.tactil);
    if (!S.tactil) S.foaie('');
    S.indiciu();
  };
  grosier.addEventListener('change', detecteaza);
  ingust.addEventListener('change', detecteaza);
  S.detecteaza = detecteaza;

  // Bara de acțiuni apare doar când e selectată o piesă în modul construire.
  S.barăActiuni = () => {
    $('actiuni').hidden = !!S.sim || !S.piesa(S.ui.selectat) || S.ui.unealta !== 'muta';
    $('unelte').classList.toggle('gol', S.ui.unealta === 'muta' || !!S.sim);
  };

  // Deschide reglajele și păstrează piesa vizibilă deasupra foii.
  function reglaje() {
    S.foaie('proprietati');
    const p = S.piesa(S.ui.selectat);
    if (p && app.dataset.foaie && innerWidth < 800 && innerHeight > 500) {
      const q = S.poza(p, 0);
      S.cam.x = q.x; S.cam.y = q.y - S.panza.clientHeight * 0.28 / S.cam.z;
    }
    $('proprietati').scrollTop = 0;
  }

  $('btnPiese').onclick = () => S.foaie('inventar');
  $('btnLume').onclick = reglaje;
  $('btnReglaje').onclick = reglaje;
  $('btnMeniu').onclick = () => S.foaie('meniu');
  $('meniu').addEventListener('click', () => { if (S.tactil) S.foaie(''); });
  document.querySelectorAll('.inchide').forEach(b => b.onclick = () => S.foaie(''));
  document.querySelectorAll('[data-actiune]').forEach(b => b.onclick = () => S.actiune(b.dataset.actiune));
  document.querySelectorAll('#bara [data-unealta]').forEach(b => b.addEventListener('click', () => S.foaie('')));
  S.panza.addEventListener('pointerdown', () => S.foaie(''));
})();

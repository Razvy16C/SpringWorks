# SpringWorks

Deschide `index.html` în browser (dublu clic). Nu are nevoie de server.

| Fișier | Rol |
|---|---|
| `index.html` | structura paginii |
| `css/stil.css` | aspectul |
| `js/config.js` | piesele din inventar și limitele proprietăților |
| `js/model.js` | piese, prinderi, anulare, salvare, mașina exemplu |
| `js/teren.js` | profilul terenului și pensulele |
| `js/fizica.js` | simularea (Planck.js) |
| `js/randare.js` | desenarea pe canvas |
| `js/interfata.js` | panouri și butoane |
| `js/interactiune.js` | mouse, atingere, tastatură |
| `js/sunet.js` | sunete sintetizate cu Web Audio |
| `js/tactil.js` | interfața pentru telefoane și tablete |
| `js/main.js` | pornirea și bucla de animație |
| `vendor/` | Planck.js 1.4.2 și licența lui |

## Comenzi
- `1` Mută, `2` Leagă, `3` Teren, `Spațiu` Simulează/Oprește
- `Q`/`E` rotire, `Delete` ștergere, `Ctrl+D` copiere, `Ctrl+Z` anulare
- `←`/`→` (sau `A`/`D`) conduc roțile în simulare

## Pe telefon și tabletă
- Bara de jos: Mută, Leagă, Teren, Piese, Reglaje.
- Ții o piesă cu un deget și o rotești cu al doilea; două degete pe fundal mută și măresc vederea.

## De știut
- Piesele din același ansamblu nu se ciocnesc între ele.
- Frecarea dintre două suprafețe este media geometrică a coeficienților lor.
- O prindere rigidă unește piesele într-un singur corp; roțile se prind mereu cu pivot.

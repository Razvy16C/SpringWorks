# SpringWorks

Open `index.html` in a browser (double-click). No server is needed.

| File | Purpose |
|---|---|
| `index.html` | structura paginii |
| `css/stil.css` | styling |
| `js/config.js` | inventory parts and property limits |
| `js/model.js` | parts, joints, undo, saving, example car |
| `js/teren.js` | terrain profile and brushes |
| `js/fizica.js` | simulation (Planck.js) |
| `js/randare.js` | canvas rendering |
| `js/interfata.js` | panels and buttons |
| `js/interactiune.js` | mouse, touch, keyboard |
| `js/sunet.js` | sounds generated with Web Audio |
| `js/tactil.js` | phone and tablet interface |
| `js/main.js` | startup and animation loop |
| `vendor/` | Planck.js 1.4.2 and its license |

## Controls
- `1` Move, `2` Connect, `3` Terrain, `Space` Simulate/Stop
- `Q`/`E` rotate, `Delete` delete, `Ctrl+D` copy, `Ctrl+Z` undo
- `←`/`→` (or `A`/`D`) drive the wheels during simulation

## On phones and tablets
- Bottom bar: Move, Connect, Terrain, Parts, Settings.
- Hold a part with one finger and rotate it with a second; use two fingers on the background to pan and zoom.

## Notes
- Parts in the same assembly do not collide with each other.
- Friction between two surfaces is the geometric mean of their coefficients.
- A rigid joint combines parts into one body; wheels always use pivot joints.

// Constante, cataloage de piese și limitele fiecărei proprietăți.
window.S = {};

S.INVENTAR = [
  { grup: 'Blocuri' },
  { nume: 'Lemn', info: '10 kg · frecare 0,5', date: { tip: 'bloc', w: 1, h: 1, masa: 10, frecare: 0.5, culoare: '#a88661' } },
  { nume: 'Metal', info: '60 kg · frecare 0,35', date: { tip: 'bloc', w: 1, h: 1, masa: 60, frecare: 0.35, culoare: '#8c98a3' } },
  { nume: 'Gheață', info: '9 kg · frecare 0,02', date: { tip: 'bloc', w: 1.2, h: 0.8, masa: 9, frecare: 0.02, culoare: '#a9d3dd' } },
  { nume: 'Șasiu', info: 'bară lungă, 40 kg', date: { tip: 'bloc', w: 4, h: 0.5, masa: 40, frecare: 0.4, culoare: '#7e9987' } },
  { grup: 'Suspensii' },
  { nume: 'Moale', info: '800 N/m', date: { tip: 'susp', L: 1.4, k: 800, c: 80, masa: 4 } },
  { nume: 'Standard', info: '2500 N/m', date: { tip: 'susp', L: 1.2, k: 2500, c: 220, masa: 6 } },
  { nume: 'Tare', info: '8000 N/m', date: { tip: 'susp', L: 1, k: 8000, c: 600, masa: 8 } },
  { grup: 'Roți' },
  { nume: 'Roată', info: 'motor condus de tine', date: { tip: 'roata', r: 0.55, masa: 8, frecare: 1.2, motor: 'taste', viteza: 9, cuplu: 130 } }
];

// [cheie, etichetă, min, max, pas, unitate]
S.CAMPURI = {
  bloc: [['w', 'Lățime', 0.3, 12, 0.1, 'm'], ['h', 'Înălțime', 0.2, 8, 0.1, 'm'], ['masa', 'Masă', 1, 300, 1, 'kg'], ['frecare', 'Coeficient de frecare', 0, 2, 0.01, '']],
  susp: [['k', 'Forța arcului (rigiditate)', 100, 15000, 100, 'N/m'], ['c', 'Amortizare', 0, 1500, 10, 'N·s/m'], ['masa', 'Masă', 1, 40, 1, 'kg'], ['L', 'Lungime de repaus', 0.6, 4, 0.1, 'm']],
  roata: [['r', 'Rază', 0.2, 2, 0.05, 'm'], ['masa', 'Masă', 1, 80, 1, 'kg'], ['frecare', 'Coeficient de frecare', 0, 2, 0.01, ''], ['viteza', 'Turație motor', -30, 30, 1, 'rad/s'], ['cuplu', 'Cuplu maxim', 10, 1500, 10, 'N·m']]
};
S.NUME = { bloc: 'Bloc', susp: 'Suspensie', roata: 'Roată' };
S.PLACA = { w: 0.7, h: 0.18 };
S.CURSA = { min: 0.35, max: 1.65 }; // fracțiuni din lungimea de repaus
S.CHEIE = 'atelier-suspensii';

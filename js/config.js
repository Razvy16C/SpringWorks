// Constante, cataloage de piese și limitele fiecărei proprietăți.
window.S = {};

// Totul din acest bloc este local, ca să nu se ciocnească cu alte scripturi.
(() => {
// Un bloc texturat de 1 × 1 m. `textura` este numele din blocks.js.
const bloc = (nume, textura, masa, frecare, culoare, w = 1, h = 1, info) => ({
  nume,
  info: info || `${masa} kg · frecare ${String(frecare).replace('.', ',')}`,
  date: { tip: 'bloc', w, h, masa, frecare, culoare, textura }
});

// Grup de blocuri cu aceleași proprietăți fizice.
// lista: "textura|Nume|culoare; ..."
const grup = (titlu, masa, frecare, lista) => [
  { grup: titlu },
  ...lista.split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const [textura, nume, culoare] = s.split('|');
    return bloc(nume, textura, masa, frecare, culoare);
  })
];

S.INVENTAR = [
  { grup: 'Construcție' },
  bloc('Șasiu', 'wood_spruce_planks', 40, 0.4, '#7e9987', 4, 0.5, 'bară lungă, 40 kg'),

  ...grup('Lemn', 10, 0.5, `
    wood_oak_planks|Stejar|#a98762; wood_birch_planks|Mesteacăn|#cdb58c; wood_spruce_planks|Molid|#7a5c42;
    wood_mahogany_planks|Mahon|#8c4c40; wood_walnut_planks|Nuc|#62483a; wood_oak_vertical|Stejar vertical|#a98762;
    wood_birch_vertical|Mesteacăn vertical|#cdb58c; wood_log_end|Buștean|#b89468; wood_bark|Scoarță|#6c503c;
    wood_crate|Ladă|#a98762`),

  ...grup('Piatră', 40, 0.7, `
    stone_stone|Piatră|#8b8e8c; stone_slate|Ardezie|#646a73; stone_limestone|Calcar|#aca392;
    stone_cobblestone|Piatră cubică|#8d908f; stone_dark_cobble|Piatră cubică închisă|#5d5b62;
    stone_mossy_cobble|Piatră cu mușchi|#858a82; stone_smooth_stone|Piatră netedă|#9a9c9d;
    stone_stone_tiles|Lespezi|#8e9195; stone_chiseled_stone|Piatră cioplită|#94979c;
    marble_granite|Granit|#9a7e74; marble_black_granite|Granit negru|#45464b`),

  ...grup('Metal', 60, 0.35, `
    metal_iron|Fier|#a6aaad; metal_steel|Oțel|#7c8a99; metal_copper|Cupru|#bd7d5e; metal_gold|Aur|#d5ae4c;
    metal_bronze|Bronz|#9c7a4e; metal_titanium|Titan|#c0c5ca; metal_diamond_plate|Tablă striată|#8b9096;
    metal_corrugated|Tablă ondulată|#969ca3; metal_rusty|Metal ruginit|#7e7b78; metal_grate|Grătar|#5b6167`),

  ...grup('Pământ', 18, 0.8, `
    dirt_dirt|Pământ|#85644b; dirt_dark_dirt|Pământ închis|#5f473a; dirt_red_clay|Argilă roșie|#a0644e;
    dirt_dry_dirt|Pământ uscat|#a58765; dirt_mud|Noroi|#55463a; dirt_rocky_dirt|Pământ pietros|#85644b;
    dirt_clumped_soil|Bulgări de pământ|#775a45`),

  ...grup('Iarbă', 15, 0.7, `
    grass_grass_side|Iarbă (lateral)|#78a863; grass_forest_side|Pădure (lateral)|#4f805a;
    grass_savanna_side|Savană (lateral)|#b0a25c; grass_snow_side|Zăpadă pe pământ|#e4ebee;
    grass_autumn_side|Toamnă (lateral)|#bd7c46; grass_grass_top|Iarbă|#78a863; grass_forest_top|Iarbă de pădure|#4f805a;
    grass_savanna_top|Iarbă de savană|#b0a25c; grass_snow_top|Câmp înzăpezit|#e4ebee; grass_autumn_top|Iarbă de toamnă|#bd7c46`),

  ...grup('Sticlă', 20, 0.2, `
    glass_clear|Sticlă clară|#bcdce4; glass_blue|Sticlă albastră|#5d93cf; glass_green|Sticlă verde|#6fb58a;
    glass_red|Sticlă roșie|#cc6a66; glass_yellow|Sticlă galbenă|#d9bb55; glass_purple|Sticlă mov|#9a76bd;
    glass_frosted|Sticlă mată|#dbe6ea; glass_tinted|Sticlă fumurie|#3d4853; glass_reinforced|Sticlă armată|#a9c9d1;
    glass_stained|Vitraliu|#888888`),

  ...grup('Cărămidă', 30, 0.65, `
    brick_red|Cărămidă roșie|#a95f4e; brick_brown|Cărămidă maro|#84604b; brick_yellow|Cărămidă galbenă|#c2a26c;
    brick_gray|Cărămidă gri|#8a8c90; brick_white|Cărămidă albă|#d2cec5; brick_black|Cărămidă neagră|#4b4a50;
    brick_blue|Cărămidă albastră|#5b7292; brick_mossy|Cărămidă cu mușchi|#98644f; brick_small_red|Cărămidă mică|#ab6450`),

  ...grup('Nisip', 25, 0.6, `
    sand_sand|Nisip|#d3bd88; sand_red_sand|Nisip roșu|#bd764e; sand_white_sand|Nisip alb|#e3dcc5;
    sand_black_sand|Nisip negru|#47454a; sand_wet_sand|Nisip ud|#9d8763; sand_gravel|Pietriș|#8a857c;
    sand_sandstone|Gresie|#c7ac78; sand_sandstone_bricks|Cărămidă din gresie|#c7ac78`),

  { grup: 'Gheață și zăpadă' },
  bloc('Gheață', 'ice_ice', 9, 0.02, '#a9d3dd', 1.2, 0.8),
  ...grup('', 9, 0.05, `
    ice_snow|Zăpadă|#e9eff2; ice_packed_snow|Zăpadă bătătorită|#cfdde7; ice_blue_ice|Gheață albastră|#78a8d6;
    ice_snow_bricks|Cărămidă din zăpadă|#dfe9f0; ice_ice_bricks|Cărămidă din gheață|#94c0da;
    ice_icy_stone|Piatră înghețată|#7e8791; ice_slush|Zloată|#aabfca; ice_frost_crystal|Cristal de gheață|#8fc3dc`).slice(1),

  ...grup('Beton', 45, 0.75, `
    concrete_white|Beton alb|#d3d3cf; concrete_gray|Beton gri|#939592; concrete_black|Beton negru|#3e4043;
    concrete_red|Beton roșu|#a75b55; concrete_orange|Beton portocaliu|#cb844a; concrete_yellow|Beton galben|#d2af52;
    concrete_green|Beton verde|#689167; concrete_blue|Beton albastru|#52749f; concrete_purple|Beton mov|#7e6195;
    concrete_hazard|Dungi de avertizare|#d4ad3f`),

  ...grup('Material textil', 4, 0.9, `
    fabric_white|Pânză albă|#dedcd6; fabric_black|Pânză neagră|#38383e; fabric_red|Pânză roșie|#a94d4d;
    fabric_orange|Pânză portocalie|#cf8044; fabric_yellow|Pânză galbenă|#d8b94f; fabric_green|Pânză verde|#649660;
    fabric_cyan|Pânză turcoaz|#4d9ea6; fabric_blue|Pânză albastră|#4e66a0; fabric_purple|Pânză mov|#80589c;
    fabric_pink|Pânză roz|#ce85a2`),

  ...grup('Plăci', 25, 0.4, `
    tile_checker_bw|Șah alb-negru|#dcdad4; tile_checker_red|Șah roșu|#a85650; tile_checker_blue|Șah albastru|#53779f;
    tile_checker_green|Șah verde|#5e8c6c; tile_terracotta|Teracotă|#b4765a; tile_white_ceramic|Ceramică albă|#dfe3e3;
    tile_blue_ceramic|Ceramică albastră|#5289ac; tile_marble_checker|Șah de marmură|#d9d6d0;
    tile_mosaic|Mozaic|#888888; tile_parquet|Parchet|#a07c58`),

  ...grup('Natură', 8, 0.6, `
    nature_oak_leaves|Frunze de stejar|#6a9755; nature_pine_leaves|Frunze de pin|#40735a;
    nature_autumn_leaves|Frunze de toamnă|#c4793f; nature_cherry_leaves|Flori de cireș|#d497ac;
    nature_cactus|Cactus|#5c8d62; nature_hay|Balot de fân|#c9a84e; nature_pumpkin|Dovleac|#cd7c3a;
    nature_melon|Pepene|#6f9c54; nature_mushroom|Ciupercă|#b24f4a; nature_moss|Mușchi|#6d864a`),

  // Doar aspect: TNT nu explodează, țepii nu fac daune etc.
  ...grup('Speciale', 20, 0.5, `
    special_tnt|TNT|#b2504a; special_locked|Lacăt|#657f98; special_glow|Bloc luminos|#dfb255;
    special_circuit|Circuit|#356253; special_bounce_pad|Trambulină|#66a676; special_spikes|Țepi|#aeb4bc;
    special_bookshelf|Bibliotecă|#8d6747; special_checkpoint|Punct de control|#434e65;
    special_unbreakable|Bloc indestructibil|#45434b; special_breakable|Bloc fragil|#ae825a`),

  ...grup('Acoperiș', 15, 0.6, `
    roof_red|Țiglă roșie|#a95a4a; roof_brown|Țiglă maro|#815f4a; roof_blue|Țiglă albastră|#506d8f;
    roof_green|Țiglă verde|#577f65; roof_gray|Țiglă gri|#757981; roof_black|Țiglă neagră|#46454d;
    roof_purple|Țiglă mov|#75597f; roof_thatch|Stuf|#bb9a56; roof_orange|Țiglă portocalie|#c47641;
    roof_teal|Țiglă turcoaz|#448084`),

  ...grup('Panouri', 30, 0.3, `
    panel_white|Panou alb|#cfd4da; panel_gray|Panou gri|#777e87; panel_dark|Panou închis|#363b44;
    panel_blue|Panou albastru|#47688f; panel_red|Panou roșu|#8b4c4c; panel_cyan_light|Lumină turcoaz|#cfd4da;
    panel_green_light|Lumină verde|#777e87; panel_amber_light|Lumină chihlimbar|#363b44;
    panel_white_light|Lumină albă|#47688f; panel_red_light|Lumină roșie|#8b4c4c`),

  ...grup('Pavaj', 35, 0.8, `
    path_cobble_path|Alee din piatră|#998b76; path_brick_path|Alee din cărămidă|#9e6c55;
    path_flagstone|Dale de piatră|#99968d; path_pebbles|Pietricele|#a29d94; path_boardwalk|Podea din scânduri|#8e7255;
    path_sidewalk|Trotuar|#aaa8a2`),

  { grup: 'Suspensii' },
  { nume: 'Moale', info: '800 N/m', date: { tip: 'susp', L: 1.4, k: 800, c: 80, masa: 4 } },
  { nume: 'Standard', info: '2500 N/m', date: { tip: 'susp', L: 1.2, k: 2500, c: 220, masa: 6 } },
  { nume: 'Tare', info: '8000 N/m', date: { tip: 'susp', L: 1, k: 8000, c: 600, masa: 8 } },
  { grup: 'Roți' },
  { nume: 'Roată', info: 'motor condus de tine', date: { tip: 'roata', r: 0.55, masa: 8, frecare: 1.2, motor: 'taste', viteza: 9, cuplu: 130 } }
];
})();

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

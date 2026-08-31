// MINIMAL FIX: Only correct WHITE_KEYS and BLACK_KEYS offsets+labels
// Keep the original piano layout (8 white keys, 5 black keys, fixed width)
// Keep afterWhiteIdx positioning unchanged
// ONLY change: which offsets map to white vs black keys, and their correct labels
//
// Strategy: keep the SAME visual layout as the working D-root files (hijaz/bayati/kurd/saba)
// White keys = 8 positions at indices 0..7 with fixed 44px each
// Black keys = 5 positions using afterWhiteIdx
// Just assign the CORRECT scale offsets and CORRECT labels from CHROM_NAMES

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

const CHROM = {
  Bb: ['سیبمل','سی','دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','سیبمل'],
  C:  ['دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو'],
  Eb: ['میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو','دو# / ربمل','ر','میبمل'],
};
function short(s){ return s.split(' / ')[0]; }

// For each file: define which offsets are white keys and which are black keys
// White keys keep the 8-slot layout (afterWhiteIdx for blacks)
// Gaps between white keys determine afterWhiteIdx of black keys

const FILES = [
  // AJAM: scale [0,2,4,5,7,9,11,12] — like a Bb major scale
  // White: 0,2,4,5,7,9,11,12  Black: 1,3,6,8,10
  // Gaps: 0→2(gap=2,1 black:1), 2→4(gap=2,1 black:3), 4→5(gap=1,0 blacks),
  //       5→7(gap=2,1 black:6), 7→9(gap=2,1 black:8), 9→11(gap=2,1 black:10), 11→12(gap=1,0 blacks)
  { file:'ajam.html', root:'Bb',
    white: [0,2,4,5,7,9,11,12],
    black: [{o:1,awi:0},{o:3,awi:1},{o:6,awi:3},{o:8,awi:4},{o:10,awi:5}]
  },
  // NAHAWAND: scale [0,2,3,5,7,8,11,12]
  // White: 0,2,3,5,7,8,11,12  Black: 1,4,6,9,10
  // Gaps: 0→2(1 black:1,awi:0), 2→3(0), 3→5(1 black:4,awi:2), 5→7(1 black:6,awi:3),
  //       7→8(0), 8→11(2 blacks:9,10,awi:5,5), 11→12(0)
  // For double gap 8→11: position 9 at awi:5 slot1, 10 at awi:5 slot2
  // We'll use afterWhiteIdx:5 for both — JS positions them at same spot
  // Better: use fractional positioning — left: idx5*44+28 and idx5*44+44
  // Actually keep it simple: awi:5 for offset9, and for offset10 use leftPx override
  { file:'nahawand.html', root:'C',
    white: [0,2,3,5,7,8,11,12],
    black: [
      {o:1, awi:0},
      {o:4, awi:2},
      {o:6, awi:3},
      {o:9, awi:5, note:'first of double gap 8→11'},
      {o:10,leftPx: 5*44+44-13, note:'second of double gap, shifted right'}
    ]
  },
  // NIKRIZ: scale [0,2,3,6,7,9,10,12]
  // White: 0,2,3,6,7,9,10,12  Black: 1,4,5,8,11
  // Gaps: 0→2(1:1,awi:0), 2→3(0), 3→6(2:4&5,awi:2&2), 6→7(0), 7→9(1:8,awi:4), 9→10(0), 10→12(1:11,awi:6)
  { file:'nikriz.html', root:'C',
    white: [0,2,3,6,7,9,10,12],
    black: [
      {o:1, awi:0},
      {o:4, awi:2, note:'first of double gap 3→6'},
      {o:5, leftPx: 2*44+44-13, note:'second of double gap, shifted right'},
      {o:8, awi:4},
      {o:11,awi:6}
    ]
  },
  // RAST: scale [0,2,3.5,5,7,9,10.5,12] — quarter-tones at 3.5 and 10.5
  // Integer white keys: 0,2,5,7,9,12 — only 6 white keys
  // But we need 8 white key SLOTS to match the standard piano look
  // Solution: treat quarter-tone degrees as "half-white" keys — still white but smaller
  // Keep 8 white slots: 0,2,[3.5],5,7,9,[10.5],12
  // For the layout, map 3.5→slot3 and 10.5→slot6 as white keys
  // Black keys = chromatic fillers: 1,3,4,6,8,10,11
  // Gaps with single blacks: 0→2(1,awi:0), 2→3.5(3,awi:1), 3.5→5(4,awi:2),
  //                          5→7(6,awi:3), 7→9(8,awi:4), 9→10.5(10,awi:5), 10.5→12(11,awi:6)
  { file:'rast.html', root:'C',
    white: [0,2,3.5,5,7,9,10.5,12],
    black: [
      {o:1,  awi:0},
      {o:3,  awi:1},
      {o:4,  awi:2},
      {o:6,  awi:3},
      {o:8,  awi:4},
      {o:10, awi:5},
      {o:11, awi:6}
    ]
  },
  // SEGAH: scale [0,1.5,3.5,5.5,7,8.5,10.5,12] — all quarter-tones except 0,7,12
  // All 8 degrees as white key slots — quarter-tone keys are white with qmark marker
  // Integer chromatic fillers: 1,2,3,4,5,6,8,9,10,11 — all 10 become black keys
  // But 5 black key slots available — pick the 5 most "important" chromatically
  // For Segah: gaps 0→1.5, 1.5→3.5, 3.5→5.5, 5.5→7, 7→8.5, 8.5→10.5, 10.5→12
  // Black keys between white slots: 1(awi:0), 2(awi:1 but 1.5 is quarter so tricky),
  // Actually for Segah it's cleanest to just put 1 black per gap where integer exists:
  // slot0(off0)→slot1(off1.5): integer 1 → awi:0
  // slot1(off1.5)→slot2(off3.5): integers 2,3 → pick 2(awi:1) and 3(leftPx)
  // slot2(off3.5)→slot3(off5.5): integers 4,5 → pick 4(awi:2) and 5(leftPx)
  // slot3(off5.5)→slot4(off7): integer 6 → awi:3
  // slot4(off7)→slot5(off8.5): integer 8 → awi:4
  // slot5(off8.5)→slot6(off10.5): integers 9,10 → pick 9(awi:5) 10(leftPx)
  // slot6(off10.5)→slot7(off12): integer 11 → awi:6
  // That's 9 black keys — over the 5-slot limit for standard layout
  // SIMPLEST: Segah is so quarter-tone heavy, just put the scale-adjacent integers as blacks
  // Keep only 5: 1(awi:0), 3(awi:1), 5(awi:2→leftPx:2*44+28), leave 8(awi:4), 10(awi:5)? 
  // Let's use: 2(awi:0 gap0→1.5 has int 1 closer, but offset2 is further)...
  // SIMPLEST CORRECT: just use standard D-root black key positions but with correct Eb labels
  // The visual layout for Segah at Eb: same shape as D-root but shifted labels
  // Standard piano has blacks at: 1,3,6,8,10 (D-root pattern)
  // For Eb root: those same positions have labels: می،فا#،لا،سی،دو#
  { file:'segah.html', root:'Eb',
    white: [0,1.5,3.5,5.5,7,8.5,10.5,12],
    black: [
      {o:1, awi:0},   // between میبمل(0) and ×(1.5)
      {o:3, awi:1},   // between ×(1.5) and ×(3.5)
      {o:6, awi:3},   // between ×(5.5) and لا#(7)
      {o:8, awi:4},   // between لا#(7) and ×(8.5)
      {o:10,awi:5}    // between ×(8.5) and ×(10.5)
    ]
  },
];

function buildArrays(def) {
  const cn = CHROM[def.root];

  // WHITE_KEYS
  const wLines = def.white.map(o => {
    const lbl = Number.isInteger(o) ? short(cn[o]) : short(cn[Math.ceil(o)])+' نیمبمل';
    // Special suffixes
    const deg = def.white.indexOf(o) + 1;
    const isLast = (deg === def.white.length);
    let label = lbl;
    if (isLast) label = short(cn[0]) + ' (اکتاو)';
    return `  {offset:${o},  label:'${label}'}`;
  });

  // BLACK_KEYS
  const bLines = def.black.map(b => {
    const lbl = short(cn[b.o]);
    if (b.leftPx !== undefined) {
      return `  {offset:${b.o},  label:'${lbl}',  leftPx:${b.leftPx}}`;
    }
    return `  {offset:${b.o},  label:'${lbl}',  afterWhiteIdx:${b.awi}}`;
  });

  return {
    wk: `const WHITE_KEYS = [\n${wLines.join(', ')}\n];`,
    bk: `const BLACK_KEYS = [\n${bLines.join(',\n')}\n];`
  };
}

// Also fix findScaleNote to use Number() comparison
function fixFindScale(src) {
  return src.replace(
    /function findScaleNote\(offset\)\{ return \w+_SCALE\.find\(s=>!s\.isQuarter && s\.offset===offset\); \}/g,
    (m) => m.replace('s.offset===offset', 'Number(s.offset)===Number(offset)')
  ).replace(
    /const findNote=\(offset\)=>scaleArr\.find\(s=>!s\.isQuarter && s\.offset===offset\);/g,
    `const findNote=(offset)=>scaleArr.find(s=>!s.isQuarter && Number(s.offset)===Number(offset));`
  );
}

// Also fix BLACK_KEYS renderer to support leftPx override (for double-gap files)
function fixBkeyRenderer(src) {
  return src.replace(
    /el\.style\.left=\(\(k\.afterWhiteIdx\+1\)\*WKEY_W - BKEY_W\/2 - 3\)\+'px';/g,
    `el.style.left=(k.leftPx !== undefined ? k.leftPx : (k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';`
  );
}

let ok = 0;
for (const def of FILES) {
  const filePath = path.join(BASE, def.file);
  let src = fs.readFileSync(filePath, 'utf8');

  const {wk, bk} = buildArrays(def);

  // Replace WHITE_KEYS
  src = src.replace(/const WHITE_KEYS\s*=\s*\[[\s\S]*?\];/, wk);
  // Replace BLACK_KEYS
  src = src.replace(/const BLACK_KEYS\s*=\s*\[[\s\S]*?\];/, bk);
  // Fix findScaleNote comparison
  src = fixFindScale(src);
  // Fix bkey renderer for leftPx support
  src = fixBkeyRenderer(src);

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR in ${def.file}: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_fix2';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) {
    console.error(`  Round-trip failed: ${def.file}`); fs.unlinkSync(tmp); continue;
  }
  fs.renameSync(tmp, filePath);

  // Print what was set
  console.log(`\n✓ ${def.file} (root=${def.root})`);
  console.log(`  WHITE: ${def.white.map((o,i) => {
    const cn = CHROM[def.root]; 
    const lbl = Number.isInteger(o) ? cn[o].split(' / ')[0] : cn[Math.ceil(o)].split(' / ')[0]+' نیمبمل';
    return o+'='+lbl;
  }).join(', ')}`);
  console.log(`  BLACK: ${def.black.map(b => b.o+'='+CHROM[def.root][b.o].split(' / ')[0]).join(', ')}`);
  ok++;
}
console.log(`\n═══ Done: ${ok}/${FILES.length} ═══`);

// Fix WHITE_KEYS and BLACK_KEYS for all 5 maqam demo files
// Strategy: white keys = scale's integer offsets; black keys = chromatic fillers
// For double-gap fillers: use leftPx instead of afterWhiteIdx
// JS rendering must support optional leftPx override

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────────
// DATA: correct WHITE_KEYS and BLACK_KEYS for each file
// White keys = exact integer offsets from the maqam scale
// CHROM_NAMES index = offset from tonic
// ─────────────────────────────────────────────────────────────────

const WKEY_W = 44, BKEY_W = 26;

// Helper: pixel left for a single black key between white keys at slot i and i+1
// Single filler: centered on boundary (existing formula: i*WKEY_W + WKEY_W - BKEY_W/2 - 3 ≈ i*44+28)
// Double filler positions: 1/3 and 2/3 of the gap, width 20px
function singleBlackLeft(i) { return i * WKEY_W + WKEY_W - Math.round(BKEY_W / 2) - 3; }
function doubleBlackLeft1(i) { return Math.round(i * WKEY_W + WKEY_W * 0.35 - 10); }
function doubleBlackLeft2(i) { return Math.round(i * WKEY_W + WKEY_W * 0.70 - 10); }

// CHROM_NAMES for each root (13 entries, index = semitone offset from tonic)
const CHROM = {
  Bb: ['سیبمل','سی','دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','سیبمل (اکتاو)'],
  C:  ['دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو (اکتاو)'],
  Eb: ['میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو','دو# / ربمل','ر','میبمل (اکتاو)'],
};

// Short name = first token before ' / '
function shortName(full) { return full.split(' / ')[0]; }

// ─────────────────────────────────────────────────────────────────
// AJAM  root=Bb  scale offsets [0,2,4,5,7,9,11,12]
// White keys = all 8 scale degrees (all integers, no quarter tones)
// Chromatic fillers = [1,3,6,8,10] — all single gaps → use afterWhiteIdx
// ─────────────────────────────────────────────────────────────────
const AJAM = {
  file: 'ajam.html',
  root: 'Bb',
  // white key offsets in order
  whiteOffsets: [0,2,4,5,7,9,11,12],
  // black key fillers: {offset, afterWhiteIdx or leftPx, doubleWidth?}
  blackDefs: [
    {offset:1,  afterWhiteIdx:0},  // between slot 0(0) and 1(2) → single
    {offset:3,  afterWhiteIdx:1},  // between slot 1(2) and 2(4) → single
    {offset:6,  afterWhiteIdx:3},  // between slot 3(5) and 4(7) → single
    {offset:8,  afterWhiteIdx:4},  // between slot 4(7) and 5(9) → single
    {offset:10, afterWhiteIdx:5},  // between slot 5(9) and 6(11) → single
  ],
};

// ─────────────────────────────────────────────────────────────────
// NAHAWAND  root=C  scale offsets [0,2,3,5,7,8,11,12]
// White keys = these 8 offsets
// Gap analysis (between consecutive white keys):
//   0→2: filler at 1 (single)
//   2→3: no filler (semitone step)
//   3→5: filler at 4 (single)
//   5→7: filler at 6 (single)
//   7→8: no filler (semitone step)
//   8→11: fillers at 9,10 (DOUBLE → leftPx)
//   11→12: no filler
// ─────────────────────────────────────────────────────────────────
const NAHAWAND = {
  file: 'nahawand.html',
  root: 'C',
  whiteOffsets: [0,2,3,5,7,8,11,12],
  blackDefs: [
    {offset:1,  afterWhiteIdx:0},          // single between idx 0(0) and 1(2)
    {offset:4,  afterWhiteIdx:2},          // single between idx 2(3) and 3(5)
    {offset:6,  afterWhiteIdx:3},          // single between idx 3(5) and 4(7)
    {offset:9,  leftPx: doubleBlackLeft1(5), doubleW: true},  // double gap idx5(8)→idx6(11)
    {offset:10, leftPx: doubleBlackLeft2(5), doubleW: true},
  ],
};

// ─────────────────────────────────────────────────────────────────
// NIKRIZ  root=C  scale offsets [0,2,3,6,7,9,10,12]
// Gap analysis:
//   0→2: filler at 1 (single)
//   2→3: no filler
//   3→6: fillers at 4,5 (DOUBLE → leftPx)
//   6→7: no filler
//   7→9: filler at 8 (single)
//   9→10: no filler
//   10→12: filler at 11 (single)
// ─────────────────────────────────────────────────────────────────
const NIKRIZ = {
  file: 'nikriz.html',
  root: 'C',
  whiteOffsets: [0,2,3,6,7,9,10,12],
  blackDefs: [
    {offset:1,  afterWhiteIdx:0},
    {offset:4,  leftPx: doubleBlackLeft1(2), doubleW: true},  // double gap idx2(3)→idx3(6)
    {offset:5,  leftPx: doubleBlackLeft2(2), doubleW: true},
    {offset:8,  afterWhiteIdx:4},
    {offset:11, afterWhiteIdx:6},
  ],
};

// ─────────────────────────────────────────────────────────────────
// RAST  root=C  scale offsets (integer only) [0,2,5,7,9,12]
// Quarter-tone offsets 3.5 and 10.5 → handled as qmark floaters, NOT piano keys
// White keys = integer scale degrees: [0,2,5,7,9,12]  (6 keys)
// Chromatic fillers for integers:
//   0→2: filler at 1 (single)
//   2→5: fillers at 3,4 (DOUBLE)
//   5→7: filler at 6 (single)
//   7→9: filler at 8 (single)
//   9→12: fillers at 10,11 (DOUBLE)
// ─────────────────────────────────────────────────────────────────
const RAST = {
  file: 'rast.html',
  root: 'C',
  whiteOffsets: [0,2,5,7,9,12],
  blackDefs: [
    {offset:1,  afterWhiteIdx:0},
    {offset:3,  leftPx: doubleBlackLeft1(1), doubleW: true},  // double gap idx1(2)→idx2(5)
    {offset:4,  leftPx: doubleBlackLeft2(1), doubleW: true},
    {offset:6,  afterWhiteIdx:2},
    {offset:8,  afterWhiteIdx:3},
    {offset:10, leftPx: doubleBlackLeft1(4), doubleW: true},  // double gap idx4(9)→idx5(12)
    {offset:11, leftPx: doubleBlackLeft2(4), doubleW: true},
  ],
};

// ─────────────────────────────────────────────────────────────────
// SEGAH  root=Eb  scale offsets (integer only) [0,7,12]
// Quarter-tone offsets 1.5,3.5,5.5,8.5,10.5 → qmark floaters
// White keys = only 3 integer scale degrees: [0,7,12]
// Chromatic fillers:
//   0→7: fillers at 1,2,3,4,5,6 (SIX!) → distribute as 2 groups of 3
//   7→12: fillers at 8,9,10,11 (FOUR) → 2+2 split
// For 6 fillers in one gap and 4 in another: use leftPx with equal spacing
// ─────────────────────────────────────────────────────────────────
function multiBlackLeft(slotIdx, pos, total) {
  // pos = 0-indexed position among 'total' fillers in gap after white key slotIdx
  const fraction = (pos + 1) / (total + 1);
  return Math.round(slotIdx * WKEY_W + WKEY_W * fraction - 10);
}

const SEGAH = {
  file: 'segah.html',
  root: 'Eb',
  whiteOffsets: [0,7,12],
  blackDefs: [
    // Gap 0→7 (slot 0): 6 fillers at offsets 1-6
    {offset:1,  leftPx: multiBlackLeft(0,0,6), doubleW: true},
    {offset:2,  leftPx: multiBlackLeft(0,1,6), doubleW: true},
    {offset:3,  leftPx: multiBlackLeft(0,2,6), doubleW: true},
    {offset:4,  leftPx: multiBlackLeft(0,3,6), doubleW: true},
    {offset:5,  leftPx: multiBlackLeft(0,4,6), doubleW: true},
    {offset:6,  leftPx: multiBlackLeft(0,5,6), doubleW: true},
    // Gap 7→12 (slot 1): 4 fillers at offsets 8-11
    {offset:8,  leftPx: multiBlackLeft(1,0,4), doubleW: true},
    {offset:9,  leftPx: multiBlackLeft(1,1,4), doubleW: true},
    {offset:10, leftPx: multiBlackLeft(1,2,4), doubleW: true},
    {offset:11, leftPx: multiBlackLeft(1,3,4), doubleW: true},
  ],
};

// ─────────────────────────────────────────────────────────────────
// Build JS array strings
// ─────────────────────────────────────────────────────────────────
function buildWhiteKeys(def) {
  const cn = CHROM[def.root];
  const lines = def.whiteOffsets.map(o => {
    const lbl = shortName(cn[o]);
    return `  {offset:${o},  label:'${lbl}'}`;
  });
  return `const WHITE_KEYS = [\n${lines.join(', ')}\n];`;
}

function buildBlackKeys(def) {
  const cn = CHROM[def.root];
  const entries = def.blackDefs.map(b => {
    const lbl = shortName(cn[b.offset]);
    const widthAttr = b.doubleW ? `, doubleW:true` : '';
    if (b.leftPx !== undefined) {
      return `  {offset:${b.offset},  label:'${lbl}',  leftPx:${b.leftPx}${widthAttr}}`;
    } else {
      return `  {offset:${b.offset},  label:'${lbl}',  afterWhiteIdx:${b.afterWhiteIdx}${widthAttr}}`;
    }
  });
  return `const BLACK_KEYS = [\n${entries.join(',\n')}\n];`;
}

// ─────────────────────────────────────────────────────────────────
// Patch each file: replace WHITE_KEYS and BLACK_KEYS blocks
// Also patch the BLACK_KEYS renderer to support leftPx and doubleW
// ─────────────────────────────────────────────────────────────────
function patchFile(def) {
  const filePath = path.join(BASE, def.file);
  const bak = filePath + '.bak_keysfix_20260813';

  // Backup if not already backed up
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(filePath, bak);
    console.log(`  Backed up → ${path.basename(bak)}`);
  }

  let src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');

  // Find WHITE_KEYS block: starts with 'const WHITE_KEYS = ['
  // ends with '];' on its own line (or same line)
  let wStart = -1, wEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*const WHITE_KEYS\s*=\s*\[/.test(lines[i])) {
      wStart = i;
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('];')) { wEnd = j; break; }
      }
      break;
    }
  }

  // Find BLACK_KEYS block
  let bStart = -1, bEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*const BLACK_KEYS\s*=\s*\[/.test(lines[i])) {
      bStart = i;
      for (let j = i; j < lines.length; j++) {
        if (lines[j].includes('];')) { bEnd = j; break; }
      }
      break;
    }
  }

  if (wStart < 0 || wEnd < 0) { console.error('  ERROR: WHITE_KEYS not found in '+def.file); return false; }
  if (bStart < 0 || bEnd < 0) { console.error('  ERROR: BLACK_KEYS not found in '+def.file); return false; }

  const newWhite = buildWhiteKeys(def);
  const newBlack = buildBlackKeys(def);

  console.log(`  ${def.file}: WHITE_KEYS L${wStart+1}-${wEnd+1}, BLACK_KEYS L${bStart+1}-${bEnd+1}`);
  console.log(`  New WHITE_KEYS:\n${newWhite}`);
  console.log(`  New BLACK_KEYS:\n${newBlack}`);

  // Replace blocks (work from bottom to avoid line-index shift)
  // Always replace BLACK first if it comes after WHITE
  let newLines = [...lines];

  // Replace BLACK_KEYS
  newLines.splice(bStart, bEnd - bStart + 1, ...newBlack.split('\n'));

  // Recalculate wStart/wEnd if they were before bStart (they should be)
  // WHITE is always before BLACK, so indices unchanged
  newLines.splice(wStart, wEnd - wStart + 1, ...newWhite.split('\n'));

  // ── Also patch the BLACK_KEYS renderer to support leftPx + doubleW ──
  // Find: BLACK_KEYS.forEach(k=>{
  //   const bEl = document.createElement('div');
  //   ...
  //   bEl.style.left = ...afterWhiteIdx...
  // We need to update ALL occurrences (there are 2 per file: main + combo)
  let patched = newLines.join('\n');

  // Pattern to find the left-position calculation inside BLACK_KEYS.forEach
  // Original: bEl.style.left = (k.afterWhiteIdx*WKEY_W+WKEY_W-BKEY_W/2-3)+'px';
  const oldLeftCalc = /bEl\.style\.left\s*=\s*\(k\.afterWhiteIdx\*WKEY_W\+WKEY_W-BKEY_W\/2-3\)\+'px';/g;
  const newLeftCalc = `bEl.style.left = (k.leftPx !== undefined ? k.leftPx : (k.afterWhiteIdx*WKEY_W+WKEY_W-BKEY_W/2-3))+'px';`;
  patched = patched.replace(oldLeftCalc, newLeftCalc);

  // Add doubleW width support: after bEl.style.left line, set width if doubleW
  // We'll replace the left line + inject width override right after
  const oldLeftLine = `bEl.style.left = (k.leftPx !== undefined ? k.leftPx : (k.afterWhiteIdx*WKEY_W+WKEY_W-BKEY_W/2-3))+'px';`;
  const newLeftLine = `bEl.style.left = (k.leftPx !== undefined ? k.leftPx : (k.afterWhiteIdx*WKEY_W+WKEY_W-BKEY_W/2-3))+'px';\n      if(k.doubleW) bEl.style.width=BKEY_W*0.72+'px';`;
  patched = patched.split(oldLeftLine).join(newLeftLine);

  // Write to temp file first, verify, then replace
  const tmp = filePath + '.tmp_keysfix';
  fs.writeFileSync(tmp, patched, 'utf8');

  // Verify round-trip
  const verify = fs.readFileSync(tmp, 'utf8');
  if (verify !== patched) {
    console.error('  ERROR: round-trip verify failed for '+def.file);
    fs.unlinkSync(tmp);
    return false;
  }

  // Validate JS syntax of <script> block
  const scriptMatch = patched.match(/<script>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1]);
      console.log('  JS syntax OK');
    } catch(e) {
      console.error('  JS SYNTAX ERROR: '+e.message);
      fs.unlinkSync(tmp);
      return false;
    }
  }

  fs.renameSync(tmp, filePath);
  console.log(`  ✓ ${def.file} patched successfully\n`);
  return true;
}

// ─────────────────────────────────────────────────────────────────
// Run
// ─────────────────────────────────────────────────────────────────
const defs = [AJAM, NAHAWAND, NIKRIZ, RAST, SEGAH];
let ok = 0;
for (const d of defs) {
  console.log(`\n── Patching ${d.file} ──`);
  if (patchFile(d)) ok++;
}
console.log(`\n═══ Done: ${ok}/${defs.length} files patched ═══`);

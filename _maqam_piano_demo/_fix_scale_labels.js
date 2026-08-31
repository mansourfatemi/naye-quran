// Fix SCALE array labels to match the correct root's CHROM_NAMES
// Also fix RAST and SEGAH quarter-tone labels to match C/Eb root

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = path.dirname(__filename);

// CHROM_NAMES per root (same as in _fix_keys.js)
const CHROM = {
  Bb: ['سیبمل','سی','دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','سیبمل (اکتاو)'],
  C:  ['دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو (اکتاو)'],
  Eb: ['میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو','دو# / ربمل','ر','میبمل (اکتاو)'],
};

// Short name = first token before ' / '
function shortName(full) { return full.split(' / ')[0]; }

// Quarter-tone label: "X نیمتیز" where X is chromName of floor(offset)
// OR "X نیمبمل" depending on direction — use the chromName function approach:
// offset 1.5 from Eb: between می (1) and فا (2) → "می نیمتیز (ربعپرده)"  
// Actually: use "lower note + نیمتیز" for .5 upward quarter tones
// RAST from C: offset 3.5 = between ر# (3) and می (4) → "ر# نیمتیز (ربعپرده)"
// RAST from C: offset 10.5 = between لا# (10) and سی (11) → "لا# نیمتیز (ربعپرده)"
// SEGAH from Eb: offset 1.5 = between می (1) and فا (2) → "می نیمتیز (ربعپرده)"
//                 offset 3.5 = between سل (4) and... wait:
//   Eb CHROM: [میبمل,می,فا,فا# / سلبمل,سل,سل# / لابمل,لا,لا# / سیبمل,سی,دو,دو# / ربمل,ر,میبمل(اکتاو)]
//   offset 1.5: floor=1(می), ceil=2(فا) → "می نیمتیز"
//   offset 3.5: floor=3(فا#/سلبمل→فا#), ceil=4(سل) → "فا# نیمتیز"
//   offset 5.5: floor=5(سل#/لابمل→سل#), ceil=6(لا) → "سل# نیمتیز"
//   offset 8.5: floor=8(سی), ceil=9(دو) → "سی نیمتیز"
//   offset 10.5: floor=10(دو#/ربمل→دو#), ceil=11(ر) → "دو# نیمتیز"
function quarterLabel(offset, chromArr) {
  const lo = shortName(chromArr[Math.floor(offset)]);
  return lo + ' نیمتیز (ربعپرده)';
}

// Suffix for special scale degrees
function degSuffix(deg, isLast) {
  if (isLast) return ' (اکتاو)';
  if (deg === 5) return ' (غماز)';
  return '';
}

// ─── Per-file definitions ───
const FILES = [
  {
    file: 'ajam.html',
    scaleName: 'AJAM_SCALE',
    root: 'Bb',
    // offsets in order: [0,2,4,5,7,9,11,12] — all integer
    scaleOffsets: [0,2,4,5,7,9,11,12],
    // Ghammaz at deg 5 (offset 7), octave at deg 8 (offset 12)
    // desc texts to preserve (we only change labels)
  },
  {
    file: 'nahawand.html',
    scaleName: 'NAHAWAND_SCALE',
    root: 'C',
    scaleOffsets: [0,2,3,5,7,8,11,12],
  },
  {
    file: 'nikriz.html',
    scaleName: 'NIKRIZ_SCALE',
    root: 'C',
    scaleOffsets: [0,2,3,6,7,9,10,12],
  },
  {
    file: 'rast.html',
    scaleName: 'RAST_SCALE',
    root: 'C',
    scaleOffsets: [0,2,3.5,5,7,9,10.5,12],
  },
  {
    file: 'segah.html',
    scaleName: 'SIKAH_SCALE',
    root: 'Eb',
    scaleOffsets: [0,1.5,3.5,5.5,7,8.5,10.5,12],
  },
];

function computeNewLabel(offset, deg, totalDeg, chromArr) {
  const isLast = (deg === totalDeg);
  if (!Number.isInteger(offset)) {
    // quarter-tone
    return quarterLabel(offset, chromArr) + (isLast ? ' (اکتاو)' : deg === 5 ? ' (غماز)' : '');
  }
  const base = shortName(chromArr[offset]);
  // Special suffix
  let suffix = '';
  if (isLast) suffix = ' (اکتاو)';
  else if (deg === 5) suffix = ' (غماز)';
  return base + suffix;
}

function patchScaleLabels(def) {
  const filePath = path.join(BASE, def.file);
  let src = fs.readFileSync(filePath, 'utf8');
  const chromArr = CHROM[def.root];
  const totalDeg = def.scaleOffsets.length;

  // Find the SCALE array block
  const scaleRegex = new RegExp(`(const ${def.scaleName}\\s*=\\s*\\[)([\\s\\S]*?)(\\];)`);
  const match = src.match(scaleRegex);
  if (!match) {
    console.error(`  ERROR: ${def.scaleName} not found in ${def.file}`);
    return false;
  }

  const oldBlock = match[0];
  const entries = match[2];

  // Parse each {deg:N, offset:X, label:'...', desc:'...'} entry and rebuild with new label
  // We'll do a regex replace on each label field per line
  let newEntries = entries;

  def.scaleOffsets.forEach((offset, idx) => {
    const deg = idx + 1;
    const newLabel = computeNewLabel(offset, deg, totalDeg, chromArr);
    // Match: label:'anything' on a line containing offset:X
    // We need to match the specific entry. Use deg as anchor.
    const degPattern = new RegExp(
      `({deg:${deg},\\s*offset:${offset}[^}]*?label:')(.*?)('})`
    );
    const linePattern = new RegExp(
      `(\\{deg:${deg},\\s*offset:${offset.toString().replace('.','\\.')}[^\\n]*?label:')(.*?)(')`,
      'g'
    );
    const before = newEntries;
    newEntries = newEntries.replace(linePattern, (m, pre, oldLabel, post) => {
      console.log(`    deg${deg} offset${offset}: '${oldLabel}' → '${newLabel}'`);
      return pre + newLabel + post;
    });
    if (newEntries === before) {
      console.log(`    deg${deg} offset${offset}: NO MATCH (label unchanged)`);
    }
  });

  const newBlock = match[1] + newEntries + match[3];
  const patchedSrc = src.replace(oldBlock, newBlock);

  // Validate JS
  const scriptMatch = patchedSrc.match(/<script>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1]);
    } catch(e) {
      console.error(`  JS SYNTAX ERROR: ${e.message}`);
      return false;
    }
  }

  const tmp = filePath + '.tmp_scalelabels';
  fs.writeFileSync(tmp, patchedSrc, 'utf8');
  const verify = fs.readFileSync(tmp, 'utf8');
  if (verify !== patchedSrc) {
    console.error(`  Round-trip failed`);
    fs.unlinkSync(tmp);
    return false;
  }
  fs.renameSync(tmp, filePath);
  console.log(`  ✓ ${def.file} scale labels patched`);
  return true;
}

let ok = 0;
for (const def of FILES) {
  console.log(`\n── ${def.file} (root=${def.root}) ──`);
  if (patchScaleLabels(def)) ok++;
}
console.log(`\n═══ Done: ${ok}/${FILES.length} ═══`);

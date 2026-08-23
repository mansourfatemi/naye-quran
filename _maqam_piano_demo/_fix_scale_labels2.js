// Fix 2 issues from previous script:
// 1. Double '(اکتاو)' in deg8 labels — CHROM[12] already contains '(اکتاو)', remove the suffix we added
// 2. Segah quarter-tones: نیمبمل vs نیمتیز — for Eb root going up, these are quarter-sharps FROM the lower note
//    Offsets from Eb: 1.5=between می(1) and فا(2) → می + 3/4 tone up = می نیمتیز ✓ (quarter-sharp of می)
//    But in Segah maqam theory, ALL quarter-tone degrees are "half-flat" relative to western pitch names:
//    - offset 1.5 = "می کوچک" / "می نیمبمل" (Eb+1.5 = F minus quarter = F quarter-flat)
//    - offset 3.5 = "سل کوچک" / "سل نیمبمل" (Eb+3.5 = Ab minus quarter = Ab quarter-flat)  
//    Wait — let me reconsider carefully:
//    Eb root. offset 1.5 semitones above Eb = between E natural (1) and F (2).
//    The note at 1.5 semitones above Eb is: E-quarter-flat (E♭♭/4) = "می نیمبمل"
//    OR equivalently F-quarter-sharp from below = "می نیمتیز" from می
//    In Persian maqam pedagogy for Sikah: the convention is "می نیمبمل" (E quarter-flat)
//    because the reference pitch is E (می) and we lower it a quarter tone.
//    SO: for Segah offsets 1.5, 3.5, 5.5 → use نیمبمل (quarter-flat of the upper note)
//    For offsets 8.5, 10.5 → same logic
//    Let's use the convention: if offset = N.5, the note is at ceil(offset) minus quarter = "X نیمبمل"
//    where X = shortName(CHROM[ceil(offset)])

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = path.dirname(__filename);

const CHROM = {
  Bb: ['سیبمل','سی','دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','سیبمل (اکتاو)'],
  C:  ['دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو (اکتاو)'],
  Eb: ['میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو','دو# / ربمل','ر','میبمل (اکتاو)'],
};
function shortName(full) { return full.split(' / ')[0]; }

// Correct quarter-tone labeling by root:
// For C root (Rast): use نیمتیز (quarter-sharp FROM floor note) — as in standard Rast pedagogy
// For Eb root (Segah): use نیمبمل (quarter-flat OF ceil note) — as in Sikah/Segah pedagogy
function quarterLabel(offset, chromArr, useFlat) {
  if (useFlat) {
    // نیمبمل: X = ceil note, minus quarter
    const hi = shortName(chromArr[Math.ceil(offset)]);
    return hi + ' نیمبمل (ربعپرده)';
  } else {
    // نیمتیز: X = floor note, plus quarter
    const lo = shortName(chromArr[Math.floor(offset)]);
    return lo + ' نیمتیز (ربعپرده)';
  }
}

// Build the correct label for a scale degree
function label(offset, deg, totalDeg, chromArr, useFlat) {
  const isLast = (deg === totalDeg);
  let base;
  if (!Number.isInteger(offset)) {
    base = quarterLabel(offset, chromArr, useFlat);
  } else {
    // For the octave degree, CHROM[12] already contains "(اکتاو)" — use as-is
    base = shortName(chromArr[offset]);
    if (isLast) base = base; // no extra suffix — octave label is just the note name
  }
  // Add (غماز) suffix for deg5 if not last and not quarter-tone
  if (deg === 5 && !isLast && Number.isInteger(offset)) {
    base += ' (غماز)';
  }
  return base;
}

// Special: Segah deg5 (offset 7, لا#) was labeled 'غماز اول' in the original
// We'll keep it as 'لا# (غماز اول)' to preserve the pedagogical note about two ghammaz points
const SEGAH_DEG5_LABEL = 'لا# (غماز اول)';

// ─── File configs ───
const FILES = [
  { file:'ajam.html',     scaleName:'AJAM_SCALE',     root:'Bb', useFlat:false,
    offsets:[0,2,4,5,7,9,11,12] },
  { file:'nahawand.html', scaleName:'NAHAWAND_SCALE', root:'C',  useFlat:false,
    offsets:[0,2,3,5,7,8,11,12] },
  { file:'nikriz.html',   scaleName:'NIKRIZ_SCALE',   root:'C',  useFlat:false,
    offsets:[0,2,3,6,7,9,10,12] },
  { file:'rast.html',     scaleName:'RAST_SCALE',     root:'C',  useFlat:false,
    offsets:[0,2,3.5,5,7,9,10.5,12] },
  { file:'segah.html',    scaleName:'SIKAH_SCALE',    root:'Eb', useFlat:true,
    offsets:[0,1.5,3.5,5.5,7,8.5,10.5,12] },
];

function patchFile(def) {
  const filePath = path.join(BASE, def.file);
  let src = fs.readFileSync(filePath, 'utf8');
  const chromArr = CHROM[def.root];
  const totalDeg = def.offsets.length;

  const scaleRegex = new RegExp(`(const ${def.scaleName}\\s*=\\s*\\[)([\\s\\S]*?)(\\];)`);
  const match = src.match(scaleRegex);
  if (!match) { console.error(`  ERROR: ${def.scaleName} not found`); return false; }

  let newEntries = match[2];

  def.offsets.forEach((offset, idx) => {
    const deg = idx + 1;
    let newLabel;
    if (def.file === 'segah.html' && deg === 5) {
      newLabel = SEGAH_DEG5_LABEL;
    } else {
      newLabel = label(offset, deg, totalDeg, chromArr, def.useFlat);
    }

    const offsetStr = offset.toString().replace('.', '\\.');
    const linePattern = new RegExp(
      `(\\{deg:${deg},\\s*offset:${offsetStr}[^\\n]*?label:')(.*?)(')`,
      'g'
    );
    newEntries = newEntries.replace(linePattern, (m, pre, oldLabel, post) => {
      if (oldLabel !== newLabel) {
        console.log(`    deg${deg} off${offset}: '${oldLabel}' → '${newLabel}'`);
      }
      return pre + newLabel + post;
    });
  });

  const newSrc = src.replace(match[0], match[1] + newEntries + match[3]);

  // Validate JS
  const sm = newSrc.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR: ${e.message}`); return false; }
  }

  const tmp = filePath + '.tmp_sl2';
  fs.writeFileSync(tmp, newSrc, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== newSrc) {
    console.error('  Round-trip failed'); fs.unlinkSync(tmp); return false;
  }
  fs.renameSync(tmp, filePath);
  console.log(`  ✓ ${def.file} patched`);
  return true;
}

let ok = 0;
for (const def of FILES) {
  console.log(`\n── ${def.file} ──`);
  if (patchFile(def)) ok++;
}
console.log(`\n═══ Done: ${ok}/${FILES.length} ═══`);

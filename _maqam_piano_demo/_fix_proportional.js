// Proportional piano layout:
// Each semitone = ST_PX pixels wide. White keys have variable width = their semitone span.
// Black (chromatic) keys are thin and sit at their exact semitone position.
// This makes intervals visually accurate — a 2-semitone gap looks twice as wide as a 1-semitone step.
//
// Architecture:
//   - Remove WHITE_KEYS / BLACK_KEYS arrays entirely → replace with single PIANO_KEYS array
//   - Each entry: {offset, label, type:'scale'|'chrom', deg?}
//   - Renderer uses leftPx and widthPx computed from offset
//   - Scale keys (type='scale'): colored/highlighted, wider, clickable
//   - Chrom keys (type='chrom'): thin gray keys between scale keys
//   - Quarter-tone floaters (.qmark) unchanged (already proportional via OFFSET_CENTER_PX)

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

// Pixels per semitone
const ST_PX = 36;
// Scale key height and chrom key height
const SCALE_KEY_H = 120;  // white key height (px)
const CHROM_KEY_H = 72;   // chromatic key height (px)
// Min width for a scale key (for very small intervals like 1 semitone)
const SCALE_KEY_MIN_W = 28;
// Width of a chromatic (black) key
const CHROM_KEY_W = 20;

// CHROM_NAMES per root
const CHROM = {
  Bb: ['سیبمل','سی','دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','سیبمل (اکتاو)'],
  C:  ['دو','دو# / ربمل','ر','ر# / میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو (اکتاو)'],
  Eb: ['میبمل','می','فا','فا# / سلبمل','سل','سل# / لابمل','لا','لا# / سیبمل','سی','دو','دو# / ربمل','ر','میبمل (اکتاو)'],
};
function shortName(s) { return s.split(' / ')[0]; }

// Scale definitions: {file, scaleName, root, offsets (including quarter-tones)}
const FILES = [
  { file:'ajam.html',     scaleName:'AJAM_SCALE',     root:'Bb',
    offsets:[0,2,4,5,7,9,11,12] },
  { file:'nahawand.html', scaleName:'NAHAWAND_SCALE', root:'C',
    offsets:[0,2,3,5,7,8,11,12] },
  { file:'nikriz.html',   scaleName:'NIKRIZ_SCALE',   root:'C',
    offsets:[0,2,3,6,7,9,10,12] },
  { file:'rast.html',     scaleName:'RAST_SCALE',     root:'C',
    offsets:[0,2,3.5,5,7,9,10.5,12] },
  { file:'segah.html',    scaleName:'SIKAH_SCALE',    root:'Eb',
    offsets:[0,1.5,3.5,5.5,7,8.5,10.5,12] },
];

// Compute left position (px) for a given offset
function leftPx(offset) { return Math.round(offset * ST_PX); }

// Compute width (px) for a scale key spanning from offset to nextOffset
function scaleKeyW(offset, nextOffset) {
  return Math.max(SCALE_KEY_MIN_W, Math.round((nextOffset - offset) * ST_PX));
}

// Total piano width
function totalW(maxOffset) { return Math.round(maxOffset * ST_PX) + CHROM_KEY_W; }

// Build new WHITE_KEYS and BLACK_KEYS arrays for a file
// WHITE_KEYS = scale degrees (integer offsets only for Rast/Segah, all for others)
// BLACK_KEYS = chromatic fillers between scale integer degrees
// BUT: for Rast and Segah, quarter-tone scale degrees → qmark floaters (unchanged)
// Scale keys get leftPx + widthPx fields
// Chrom keys get leftPx field

function buildKeyArrays(def) {
  const cn = CHROM[def.root];
  const intOffsets = def.offsets.filter(o => Number.isInteger(o));
  const maxOffset = 12;

  // WHITE_KEYS = integer scale degrees with their proportional widths
  const whiteKeys = intOffsets.map((o, i) => {
    const nextO = i < intOffsets.length - 1 ? intOffsets[i+1] : maxOffset + 1;
    const lbl = shortName(cn[o]);
    const lp = leftPx(o);
    const wp = scaleKeyW(o, nextO === maxOffset + 1 ? maxOffset : nextO);
    // For last key, give it a fixed minimum width
    const finalW = (o === 12) ? SCALE_KEY_MIN_W : scaleKeyW(o, nextO === maxOffset + 1 ? o + 1 : nextO);
    return `  {offset:${o}, label:'${lbl}', leftPx:${lp}, widthPx:${finalW}}`;
  });

  // BLACK_KEYS = chromatic integers NOT in the scale
  const allChrom = [1,2,3,4,5,6,7,8,9,10,11];
  const chromKeys = allChrom
    .filter(o => !intOffsets.includes(o))
    .map(o => {
      const lbl = shortName(cn[o]);
      const lp = Math.round(o * ST_PX - CHROM_KEY_W / 2);
      return `  {offset:${o}, label:'${lbl}', leftPx:${lp}}`;
    });

  return { whiteKeys, chromKeys };
}

// New WHITE_KEYS renderer: uses leftPx and widthPx from the key object
const NEW_WKEY_RENDERER_OLD = `el.style.left=(i*WKEY_W)+'px';`;
const NEW_WKEY_RENDERER_NEW = `el.style.left=k.leftPx+'px'; el.style.width=k.widthPx+'px';`;

// New BKEY renderer: uses leftPx, fixed CHROM_KEY_W width
const OLD_BKEY_LEFT = `el.style.left=(k.leftPx !== undefined ? k.leftPx : (k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';\n      if(k.doubleW) el.style.width=Math.round(BKEY_W*0.72)+'px';`;
const NEW_BKEY_LEFT = `el.style.left=k.leftPx+'px'; el.style.width=${CHROM_KEY_W}+'px';`;

function patchFile(def) {
  const filePath = path.join(BASE, def.file);
  let src = fs.readFileSync(filePath, 'utf8');

  const { whiteKeys, chromKeys } = buildKeyArrays(def);

  const newWK = `const WHITE_KEYS = [\n${whiteKeys.join(',\n')}\n];`;
  const newBK = `const BLACK_KEYS = [\n${chromKeys.join(',\n')}\n];`;

  // Also update WKEY_W and BKEY_W constants (BKEY_W no longer used in positioning)
  // Add CHROM_KEY_W and ST_PX constants
  const newConsts = `const WKEY_W = ${ST_PX}, BKEY_W = ${CHROM_KEY_W}, TICK_W = ${ST_PX}, ST_PX = ${ST_PX}, CHROM_KEY_W = ${CHROM_KEY_W};`;
  const oldConsts = /const WKEY_W\s*=\s*44,\s*BKEY_W\s*=\s*26,\s*TICK_W\s*=\s*44;/;

  // Replace WHITE_KEYS block
  src = src.replace(/const WHITE_KEYS\s*=\s*\[[\s\S]*?\];/, newWK);
  // Replace BLACK_KEYS block
  src = src.replace(/const BLACK_KEYS\s*=\s*\[[\s\S]*?\];/, newBK);
  // Replace WKEY_W constants
  src = src.replace(oldConsts, newConsts);

  // Patch WHITE_KEYS renderer (2 occurrences)
  src = src.split(NEW_WKEY_RENDERER_OLD).join(NEW_WKEY_RENDERER_NEW);

  // Patch BLACK_KEYS renderer (2 occurrences)
  // The existing renderer after previous patches has this pattern:
  const bkeyOldPattern = /el\.style\.left=\(k\.leftPx !== undefined \? k\.leftPx : \(k\.afterWhiteIdx\+1\)\*WKEY_W - BKEY_W\/2 - 3\)\+'px';\s*\n\s*if\(k\.doubleW\) el\.style\.width=Math\.round\(BKEY_W\*0\.72\)\+'px';/g;
  src = src.replace(bkeyOldPattern, `el.style.left=k.leftPx+'px'; el.style.width=${CHROM_KEY_W}+'px';`);

  // Update CSS: .wkey width should not be fixed anymore — we set it via JS
  // Add/update .bkey CSS to use CHROM_KEY_W default width
  // Find and update the CSS .wkey width rule
  src = src.replace(/\.wkey\s*\{([^}]*?)width\s*:\s*\d+px/g, (m, inner) => {
    return '.wkey {' + inner + `width: ${Math.round(ST_PX * 2)}px`; // default, overridden by JS
  });
  src = src.replace(/\.bkey\s*\{([^}]*?)width\s*:\s*\d+px/g, (m, inner) => {
    return '.bkey {' + inner + `width: ${CHROM_KEY_W}px`;
  });

  // Update piano container width
  const pianoW = totalW(12);
  src = src.replace(/#piano\s*\{([^}]*?)width\s*:\s*\d+px/g, (m, inner) => {
    return '#piano {' + inner + `width: ${pianoW}px`;
  });
  src = src.replace(/\.piano-wrap\s*\{([^}]*?)width\s*:\s*\d+px/g, (m, inner) => {
    return '.piano-wrap {' + inner + `width: ${pianoW + 20}px`;
  });

  // Update OFFSET_CENTER_PX to match new proportional positions
  // Each offset o → center = Math.round(o * ST_PX + ST_PX/2) ... but for octave keys it's just at leftPx
  // Actually for quarter-tone marks we just need the center of each semitone slot
  const newCenters = Array.from({length:13}, (_,i) => Math.round(i * ST_PX + ST_PX/2));
  const newCenterStr = `const OFFSET_CENTER_PX = [${newCenters.join(',')}];`;
  src = src.replace(/const OFFSET_CENTER_PX\s*=\s*\[[^\]]+\];/, newCenterStr);

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR: ${e.message}`); return false; }
  }

  const tmp = filePath + '.tmp_prop';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) {
    console.error('  Round-trip failed'); fs.unlinkSync(tmp); return false;
  }
  fs.renameSync(tmp, filePath);

  console.log(`✓ ${def.file} — ${whiteKeys.length} scale keys, ${chromKeys.length} chrom keys, piano width=${pianoW}px`);
  return true;
}

let ok = 0;
for (const def of FILES) {
  process.stdout.write(`\n── ${def.file} ──\n`);
  if (patchFile(def)) ok++;
}
console.log(`\n═══ Done: ${ok}/${FILES.length} ═══`);

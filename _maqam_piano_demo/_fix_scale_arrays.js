// Fix SCALE array labels to match correct tonic
// Each scale degree label must match the piano key it's on

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

const PIANO_FA = {
  0:'دو', 1:'دو#', 2:'ر', 3:'میبمل', 4:'می',
  5:'فا', 6:'فا#', 7:'سل', 8:'لابمل', 9:'لا',
  10:'سیبمل', 11:'سی', 12:'دو', 13:'دو#', 14:'ر',
  15:'میبمل', 16:'می', 17:'فا', 18:'فا#', 19:'سل',
  20:'لابمل', 21:'لا', 22:'سیبمل',
};

// For quarter-tones: name based on surrounding notes
function quarterName(semi) {
  const lo = PIANO_FA[Math.floor(semi)] || '?';
  const hi = PIANO_FA[Math.ceil(semi)] || '?';
  return `${hi} نیمبمل (ربعپرده)`;
}

const FILES = {
  'ajam.html': {
    scaleName: 'AJAM_SCALE',
    tonic: 10,
    // offsets from tonic, degSuffix
    degrees: [
      {deg:1, offset:0,  suffix:''},
      {deg:2, offset:2,  suffix:''},
      {deg:3, offset:4,  suffix:''},
      {deg:4, offset:5,  suffix:''},
      {deg:5, offset:7,  suffix:' (غماز)'},
      {deg:6, offset:9,  suffix:''},
      {deg:7, offset:11, suffix:''},
      {deg:8, offset:12, suffix:' (اکتاو)'},
    ]
  },
  'nahawand.html': {
    scaleName: 'NAHAWAND_SCALE',
    tonic: 0,
    degrees: [
      {deg:1, offset:0,  suffix:''},
      {deg:2, offset:2,  suffix:''},
      {deg:3, offset:3,  suffix:''},
      {deg:4, offset:5,  suffix:''},
      {deg:5, offset:7,  suffix:' (غماز)'},
      {deg:6, offset:8,  suffix:''},
      {deg:7, offset:11, suffix:''},
      {deg:8, offset:12, suffix:' (اکتاو)'},
    ]
  },
  'nikriz.html': {
    scaleName: 'NIKRIZ_SCALE',
    tonic: 0,
    degrees: [
      {deg:1, offset:0,  suffix:''},
      {deg:2, offset:2,  suffix:''},
      {deg:3, offset:3,  suffix:''},
      {deg:4, offset:6,  suffix:''},
      {deg:5, offset:7,  suffix:' (غماز)'},
      {deg:6, offset:9,  suffix:''},
      {deg:7, offset:10, suffix:''},
      {deg:8, offset:12, suffix:' (اکتاو)'},
    ]
  },
  'rast.html': {
    scaleName: 'RAST_SCALE',
    tonic: 0,
    degrees: [
      {deg:1, offset:0,   suffix:''},
      {deg:2, offset:2,   suffix:''},
      {deg:3, offset:3.5, suffix:' (ربعپرده)'},
      {deg:4, offset:5,   suffix:''},
      {deg:5, offset:7,   suffix:' (غماز)'},
      {deg:6, offset:9,   suffix:''},
      {deg:7, offset:10.5,suffix:' (ربعپرده)'},
      {deg:8, offset:12,  suffix:' (اکتاو)'},
    ]
  },
  'segah.html': {
    scaleName: 'SIKAH_SCALE',
    tonic: 3,
    degrees: [
      {deg:1, offset:0,   suffix:''},
      {deg:2, offset:1.5, suffix:' (ربعپرده)'},
      {deg:3, offset:3.5, suffix:' (ربعپرده)'},
      {deg:4, offset:5.5, suffix:' (ربعپرده)'},
      {deg:5, offset:7,   suffix:' (غماز اول)'},
      {deg:6, offset:8.5, suffix:' (ربعپرده)'},
      {deg:7, offset:10.5,suffix:' (ربعپرده)'},
      {deg:8, offset:12,  suffix:' (اکتاو)'},
    ]
  },
};

function getLabel(tonic, offset, suffix) {
  const absSemi = tonic + offset;
  if (!Number.isInteger(offset)) {
    return quarterName(absSemi) ;
  }
  const fa = PIANO_FA[absSemi] || '?';
  return fa + suffix;
}

let ok = 0;
for (const [fname, info] of Object.entries(FILES)) {
  const filePath = path.join(BASE, fname);
  let src = fs.readFileSync(filePath, 'utf8');

  // Find SCALE array block
  const scaleRe = new RegExp(`(const ${info.scaleName}\\s*=\\s*\\[)([\\s\\S]*?)(\\];)`);
  const match = src.match(scaleRe);
  if (!match) { console.log(`${fname}: SCALE not found`); continue; }

  let block = match[2];
  let changed = 0;

  for (const {deg, offset, suffix} of info.degrees) {
    const newLabel = getLabel(info.tonic, offset, suffix);
    // Match: {deg:N, offset:X, label:'...'
    const offStr = offset.toString().replace('.', '\\.');
    const re = new RegExp(`(\\{deg:${deg},\\s*offset:${offStr}[^}]*?label:')(.*?)(')`, 'g');
    block = block.replace(re, (m, pre, oldLabel, post) => {
      if (oldLabel !== newLabel) {
        console.log(`  ${fname} deg${deg}: '${oldLabel}' → '${newLabel}'`);
        changed++;
      }
      return pre + newLabel + post;
    });
  }

  if (changed > 0) {
    src = src.replace(match[0], match[1] + block + match[3]);

    const sm = src.match(/<script>([\s\S]*?)<\/script>/);
    if (sm) {
      try { new vm.Script(sm[1]); }
      catch(e) { console.error(`  JS ERROR: ${e.message}`); continue; }
    }

    const tmp = filePath + '.tmp_sca';
    fs.writeFileSync(tmp, src, 'utf8');
    if (fs.readFileSync(tmp,'utf8') !== src) { console.error('Round-trip failed'); fs.unlinkSync(tmp); continue; }
    fs.renameSync(tmp, filePath);
    console.log(`✓ ${fname}: ${changed} labels fixed\n`);
    ok++;
  } else {
    console.log(`${fname}: no changes needed`);
  }
}
console.log(`\n═══ Done: ${ok} files updated ═══`);

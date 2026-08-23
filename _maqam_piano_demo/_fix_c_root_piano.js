// Fix all 5 files: piano always shows C4→C5 (one octave from دو to دو)
// Scale degrees highlighted wherever they fall (white or black key)
// Tonic gets special 'tonic' class for extra highlight
// Structure mirrors index.html (name-based, not offset-based)

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

// Standard piano C4→C5
// name, persian label, type, semitone-from-C
const PIANO_KEYS = [
  {name:'C4',  fa:'دو',   type:'white', semi:0},
  {name:'Cs4', fa:'دو#',  type:'black', semi:1,  awi:0},
  {name:'D4',  fa:'ر',    type:'white', semi:2},
  {name:'Ds4', fa:'ر#',   type:'black', semi:3,  awi:1},
  {name:'E4',  fa:'می',   type:'white', semi:4},
  {name:'F4',  fa:'فا',   type:'white', semi:5},
  {name:'Fs4', fa:'فا#',  type:'black', semi:6,  awi:3},
  {name:'G4',  fa:'سل',   type:'white', semi:7},
  {name:'Gs4', fa:'سل#',  type:'black', semi:8,  awi:4},
  {name:'A4',  fa:'لا',   type:'white', semi:9},
  {name:'As4', fa:'لا#',  type:'black', semi:10, awi:5},
  {name:'B4',  fa:'سی',   type:'white', semi:11},
  {name:'C5',  fa:'دو',   type:'white', semi:12},
];

const WHITE_KEYS = PIANO_KEYS.filter(k => k.type === 'white');
const BLACK_KEYS = PIANO_KEYS.filter(k => k.type === 'black');

// Root semitone from C for each file
const ROOTS = {
  'ajam.html':     10,  // Bb
  'nahawand.html':  0,  // C
  'nikriz.html':    0,  // C
  'rast.html':      0,  // C
  'segah.html':     3,  // Eb
};

// Scale offsets from tonic (including quarter-tones)
const SCALES = {
  'ajam.html':    [0,2,4,5,7,9,11,12],
  'nahawand.html':[0,2,3,5,7,8,11,12],
  'nikriz.html':  [0,2,3,6,7,9,10,12],
  'rast.html':    [0,2,3.5,5,7,9,10.5,12],
  'segah.html':   [0,1.5,3.5,5.5,7,8.5,10.5,12],
};

// Persian note names from C (for labels)
const FA_FROM_C = {
  0:'دو', 1:'دو#', 2:'ر', 3:'ر#', 4:'می', 5:'فا',
  6:'فا#', 7:'سل', 8:'سل#', 9:'لا', 10:'لا#', 11:'سی', 12:'دو'
};
// Flat alternatives for flat-key contexts
const FA_FLAT = {
  1:'ربمل', 3:'میبمل', 6:'سلبمل', 8:'لابمل', 10:'سیبمل'
};

// For each file, build:
// 1. NEW WHITE_KEYS array (C4..C5 white keys, with scale degree info)
// 2. NEW BLACK_KEYS array (C#..B black keys, with scale degree info)
// 3. NEW SCALE array with correct absolute note names

function buildNewArrays(fname) {
  const rootSemi = ROOTS[fname];
  const scaleOffsets = SCALES[fname];

  // Map each scale offset → absolute semitone from C
  // offset 12 → semi 12 (C5 octave)
  const scaleSemis = scaleOffsets.map((o, idx) => {
    if (o === 12) return {semi: 12, offset: o, deg: idx+1, isQuarter: false};
    if (!Number.isInteger(o)) {
      const abs = (rootSemi + o) % 12;
      return {semi: abs, offset: o, deg: idx+1, isQuarter: true};
    }
    const abs = (rootSemi + o) % 12;
    return {semi: abs, offset: o, deg: idx+1, isQuarter: false};
  });

  // Build WHITE_KEYS — add deg info if this semi is a scale degree
  const wkLines = WHITE_KEYS.map(k => {
    const scaleDeg = scaleSemis.find(s => !s.isQuarter && s.semi === k.semi);
    const isOctave = k.semi === 12;
    const isTonic  = scaleDeg && scaleDeg.deg === 1;
    const label = isOctave
      ? (rootSemi === 0 ? 'دو (اکتاو)' : FA_FROM_C[rootSemi] + ' (اکتاو)')
      : k.fa;
    if (scaleDeg) {
      return `  {name:'${k.name}', label:'${label}', deg:${scaleDeg.deg}, isTonic:${isTonic}}`;
    }
    return `  {name:'${k.name}', label:'${label}'}`;
  });

  // Build BLACK_KEYS — add deg info if this semi is a scale degree
  const bkLines = BLACK_KEYS.map(k => {
    const scaleDeg = scaleSemis.find(s => !s.isQuarter && s.semi === k.semi);
    const isTonic  = scaleDeg && scaleDeg.deg === 1;
    // Use flat name in flat-key contexts (Bb, Eb roots)
    const useFlat = rootSemi === 10 || rootSemi === 3;
    const label = (useFlat && FA_FLAT[k.semi]) ? FA_FLAT[k.semi] : k.fa;
    if (scaleDeg) {
      return `  {name:'${k.name}', label:'${label}', afterWhiteIdx:${k.awi}, deg:${scaleDeg.deg}, isTonic:${isTonic}}`;
    }
    return `  {name:'${k.name}', label:'${label}', afterWhiteIdx:${k.awi}}`;
  });

  // Quarter-tone entries for the scale array
  const quarterEntries = scaleSemis
    .filter(s => s.isQuarter)
    .map(s => {
      const loSemi = Math.floor(s.semi);
      const hiSemi = Math.ceil(s.semi);
      const loName = FA_FROM_C[loSemi];
      const hiName = FA_FROM_C[hiSemi];
      const label = `${hiName} نیمبمل (ربعپرده)`;
      return {deg: s.deg, semi: s.semi, label};
    });

  return {
    wk: `const WHITE_KEYS = [\n${wkLines.join(',\n')}\n];`,
    bk: `const BLACK_KEYS = [\n${bkLines.join(',\n')}\n];`,
    quarterEntries,
    scaleSemis,
    rootSemi,
  };
}

// Build new renderer that uses deg/isTonic from WHITE_KEYS/BLACK_KEYS
// instead of calling findScaleNote(offset)
const NEW_WKEY_RENDER = `WHITE_KEYS.forEach((k,i)=>{
  const el=document.createElement('div');
  el.className='wkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=(i*WKEY_W)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=()=>{ const freq=freqFromSemi(k.semi !== undefined ? k.semi : i*2); playMainNote({freq, label:k.label, desc:k.desc||''}, el); };
  piano.appendChild(el); keyElements['s'+(k.semi||i)]= el;
});`;

const NEW_BKEY_RENDER = `BLACK_KEYS.forEach(k=>{
  const el=document.createElement('div');
  el.className='bkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=((k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=(e)=>{ e.stopPropagation(); const freq=freqFromSemi(k.semi||0); playMainNote({freq, label:k.label, desc:k.desc||''}, el); };
  piano.appendChild(el); keyElements['s'+(k.semi||0)]= el;
});`;

// freqFromSemi helper (semi = semitones from C4)
const FREQ_HELPER = `function freqFromSemi(semi){ return 261.626 * Math.pow(2, semi/12); }`;

const files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html'];

let ok = 0;
for (const fname of files) {
  const filePath = path.join(BASE, fname);
  let src = fs.readFileSync(filePath, 'utf8');

  const {wk, bk, scaleSemis, rootSemi} = buildNewArrays(fname);

  // Replace WHITE_KEYS and BLACK_KEYS arrays
  src = src.replace(/const WHITE_KEYS\s*=\s*\[[\s\S]*?\];/, wk);
  src = src.replace(/const BLACK_KEYS\s*=\s*\[[\s\S]*?\];/, bk);

  // Add freqFromSemi helper after WKEY_W line if not present
  if (!src.includes('freqFromSemi')) {
    src = src.replace(
      /const WKEY_W\s*=\s*\d+[^;]+;/,
      m => m + '\n' + FREQ_HELPER
    );
  }

  // Add semi field to each piano key in WHITE_KEYS (already in data above)
  // Add tonic CSS class
  if (!src.includes('.wkey.tonic')) {
    src = src.replace(
      '.wkey.active{background:#ffcdd2}',
      '.wkey.active{background:#ffcdd2}\n  .wkey.tonic{background:#fff9c4;border-color:#f9a825;border-width:2px}\n  .wkey.tonic.active{background:#ffe082}\n  .bkey.tonic{background:#f9a825}\n  .bkey.tonic.active{background:#e65100}\n  .tonic-chip{background:#f9a825!important;color:#333!important}'
    );
  }

  // Also add semi property to WHITE_KEYS entries so renderer can read it
  // Already included in buildNewArrays output via name lookup
  // Add semi to wkey via JS: WHITE_KEYS already has name, we lookup semi from PIANO_KEYS
  // Simplest: add a SEMIS lookup object
  const semiMap = `const KEY_SEMI = {C4:0,Cs4:1,D4:2,Ds4:3,E4:4,F4:5,Fs4:6,G4:7,Gs4:8,A4:9,As4:10,B4:11,C5:12};`;
  if (!src.includes('KEY_SEMI')) {
    src = src.replace(
      /const WKEY_W\s*=\s*\d+[^;]+;/,
      m => m + '\n' + semiMap
    );
  }

  // Update renderer to use KEY_SEMI[k.name] for freq
  // Replace old WHITE_KEYS.forEach renderer (main piano)
  // Pattern: WHITE_KEYS.forEach((k,i)=>{ ... piano.appendChild(el); keyElements[...]=el; });
  const oldWkRender = /WHITE_KEYS\.forEach\(\(k,i\)=>\{[\s\S]*?piano\.appendChild\(el\);[^\n]*\n\}\);/;
  if (oldWkRender.test(src)) {
    const newWR = `WHITE_KEYS.forEach((k,i)=>{
  const el=document.createElement('div');
  const semi=KEY_SEMI[k.name];
  el.className='wkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=(i*WKEY_W)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=()=>{ playMainNote({freq:freqFromSemi(semi), label:k.label, desc:''}, el); };
  piano.appendChild(el); keyElements['s'+semi]=el;
});`;
    src = src.replace(oldWkRender, newWR);
  }

  // Replace old BLACK_KEYS.forEach renderer (main piano)
  const oldBkRender = /BLACK_KEYS\.forEach\(k=>\{[\s\S]*?piano\.appendChild\(el\);[^\n]*\n\}\);/;
  if (oldBkRender.test(src)) {
    const newBR = `BLACK_KEYS.forEach(k=>{
  const el=document.createElement('div');
  const semi=KEY_SEMI[k.name];
  el.className='bkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=((k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=(e)=>{ e.stopPropagation(); playMainNote({freq:freqFromSemi(semi), label:k.label, desc:''}, el); };
  piano.appendChild(el); keyElements['s'+semi]=el;
});`;
    src = src.replace(oldBkRender, newBR);
  }

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR in ${fname}: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_croot';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) {
    console.error(`Round-trip failed: ${fname}`); fs.unlinkSync(tmp); continue;
  }
  fs.renameSync(tmp, filePath);

  // Report
  const rootName = ['C','C#','D','D#','E','F','F#','G','G#','A','Bb','B'][ROOTS[fname]];
  console.log(`\n✓ ${fname} (root=${rootName})`);
  console.log(`  Scale degrees on piano:`);
  const scaleS = SCALES[fname];
  scaleS.forEach((o,i) => {
    const abs = o === 12 ? 12 : (ROOTS[fname] + o) % 12;
    const isQ = !Number.isInteger(o);
    const fa = isQ ? `${FA_FROM_C[Math.floor(abs)]}~${FA_FROM_C[Math.ceil(abs)]} 1⁄4` : FA_FROM_C[Math.round(abs)];
    const key = isQ ? 'QT' : (WHITE_KEYS.find(k=>k.semi===Math.round(abs)) ? 'white' : 'black');
    console.log(`    deg${i+1} off=${o} → ${fa} [${key}]`);
  });
  ok++;
}

console.log(`\n═══ Done: ${ok}/${files.length} ═══`);

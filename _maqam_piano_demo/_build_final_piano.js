// Final correct piano for all 5 files
// Each piano starts from tonic and ends at octave (tonic+12)
// Scale degrees highlighted on correct keys (white or black)
// Quarter-tone degrees shown as qmark floaters (unchanged)

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

// Full chromatic map: semitone-from-C → {name, fa, type}
// Extended to cover Bb3(=As3,semi=-2) through Bb4+octave
// We use octave-relative semitone numbering:
//   Ajam:  As4(10)=tonic, C5(12), D5(14), Ds5(15), F5(17), G5(19), A5(21), As5(22)
//   Segah: Ds4(3)=tonic, As4(10), Ds5(15)=octave

const PIANO_NOTES = {
  // C4 octave
  0: {name:'C4',  fa:'دو',    type:'white'},
  1: {name:'Cs4', fa:'دو#',   type:'black', awi:0},
  2: {name:'D4',  fa:'ر',     type:'white'},
  3: {name:'Ds4', fa:'میبمل', type:'black', awi:1},
  4: {name:'E4',  fa:'می',    type:'white'},
  5: {name:'F4',  fa:'فا',    type:'white'},
  6: {name:'Fs4', fa:'فا#',   type:'black', awi:3},
  7: {name:'G4',  fa:'سل',    type:'white'},
  8: {name:'Gs4', fa:'لابمل', type:'black', awi:4},
  9: {name:'A4',  fa:'لا',    type:'white'},
  10:{name:'As4', fa:'سیبمل', type:'black', awi:5},
  11:{name:'B4',  fa:'سی',    type:'white'},
  // C5 octave
  12:{name:'C5',  fa:'دو',    type:'white'},
  13:{name:'Cs5', fa:'دو#',   type:'black', awi:0},
  14:{name:'D5',  fa:'ر',     type:'white'},
  15:{name:'Ds5', fa:'میبمل', type:'black', awi:1},
  16:{name:'E5',  fa:'می',    type:'white'},
  17:{name:'F5',  fa:'فا',    type:'white'},
  18:{name:'Fs5', fa:'فا#',   type:'black', awi:3},
  19:{name:'G5',  fa:'سل',    type:'white'},
  20:{name:'Gs5', fa:'لابمل', type:'black', awi:4},
  21:{name:'A5',  fa:'لا',    type:'white'},
  22:{name:'As5', fa:'سیبمل', type:'black', awi:5},
};

// Per-file: tonic semitone (from C4=0), scale intervals
const FILES = {
  'ajam.html':    {tonic:10, intervals:[2,2,1,2,2,2,1],       scaleName:'AJAM_SCALE'},
  'nahawand.html':{tonic:0,  intervals:[2,1,2,2,1,3,1],       scaleName:'NAHAWAND_SCALE'},
  'nikriz.html':  {tonic:0,  intervals:[2,1,3,1,2,1,2],       scaleName:'NIKRIZ_SCALE'},
  'rast.html':    {tonic:0,  intervals:[2,1.5,1.5,2,2,1.5,1.5],scaleName:'RAST_SCALE'},
  'segah.html':   {tonic:3,  intervals:[1.5,2,2,1.5,1.5,2,1.5],scaleName:'SIKAH_SCALE'},
};

// Compute scale semitones for a file
function getScaleSemis(tonic, intervals) {
  const semis = [tonic];
  let pos = tonic;
  for (const iv of intervals) { pos += iv; semis.push(pos); }
  return semis; // 8 values
}

// Build piano key range from tonic to tonic+12
// Returns {whites, blacks, allKeys} — keys between tonic and tonic+12 inclusive
function buildPianoRange(tonic) {
  const end = tonic + 12;
  // All semitones from tonic to end
  const allSemis = [];
  for (let s = tonic; s <= end; s++) allSemis.push(s);

  const whites = allSemis.filter(s => PIANO_NOTES[s] && PIANO_NOTES[s].type === 'white');
  const blacks = allSemis.filter(s => PIANO_NOTES[s] && PIANO_NOTES[s].type === 'black');
  return {whites, blacks};
}

// Build afterWhiteIdx for black keys relative to the piano range
function getAwi(blackSemi, whites) {
  // How many white keys come before this black key?
  const count = whites.filter(w => w < blackSemi).length;
  return count - 1; // afterWhiteIdx = index of white key immediately before
}

function buildArrays(fname) {
  const {tonic, intervals} = FILES[fname];
  const scaleSemis = getScaleSemis(tonic, intervals);
  const {whites, blacks} = buildPianoRange(tonic);

  // WHITE_KEYS lines
  const wLines = whites.map(s => {
    const k = PIANO_NOTES[s];
    const deg = scaleSemis.indexOf(s) + 1; // 0 if not in scale, else 1-8
    const scaleDeg = scaleSemis.indexOf(s);
    const isTonic = (scaleDeg === 0);
    const isOctave = (scaleDeg === 7);
    let label = k.fa;
    if (isOctave) label = k.fa + ' (اکتاو)';
    if (scaleDeg >= 0) {
      return `  {name:'${k.name}', label:'${label}', deg:${scaleDeg+1}, isTonic:${isTonic}}`;
    }
    return `  {name:'${k.name}', label:'${label}'}`;
  });

  // BLACK_KEYS lines
  const bLines = blacks.map(s => {
    const k = PIANO_NOTES[s];
    const awi = getAwi(s, whites);
    const scaleDeg = scaleSemis.indexOf(s);
    const isTonic = (scaleDeg === 0);
    const isOctave = (scaleDeg === 7);
    let label = k.fa;
    if (isOctave) label = k.fa + ' (اکتاو)';
    if (scaleDeg >= 0) {
      return `  {name:'${k.name}', label:'${label}', afterWhiteIdx:${awi}, deg:${scaleDeg+1}, isTonic:${isTonic}}`;
    }
    return `  {name:'${k.name}', label:'${label}', afterWhiteIdx:${awi}}`;
  });

  // KEY_SEMI map for this piano range
  const semiEntries = [...whites, ...blacks].map(s => `${PIANO_NOTES[s].name}:${s}`).join(',');

  return {
    wk: `const WHITE_KEYS = [\n${wLines.join(',\n')}\n];`,
    bk: `const BLACK_KEYS = [\n${bLines.join(',\n')}\n];`,
    semiMap: `const KEY_SEMI = {${semiEntries}};`,
    whites, blacks, scaleSemis
  };
}

// Renderer template — same for all files
function makeWkRenderer(appendEl, playFn, keysObj) {
  return `WHITE_KEYS.forEach((k,i)=>{
  const el=document.createElement('div');
  const semi=KEY_SEMI[k.name];
  el.className='wkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=(i*WKEY_W)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=()=>{${playFn}({freq:freqFromSemi(semi),label:k.label,desc:''},el);};
  ${appendEl}.appendChild(el); ${keysObj}['s'+semi]=el;
});`;
}
function makeBkRenderer(appendEl, playFn, keysObj) {
  return `BLACK_KEYS.forEach(k=>{
  const el=document.createElement('div');
  const semi=KEY_SEMI[k.name];
  el.className='bkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=((k.afterWhiteIdx+1)*WKEY_W-BKEY_W/2-3)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=(e)=>{e.stopPropagation();${playFn}({freq:freqFromSemi(semi),label:k.label,desc:''},el);};
  ${appendEl}.appendChild(el); ${keysObj}['s'+semi]=el;
});`;
}

let ok = 0;
for (const fname of Object.keys(FILES)) {
  const filePath = path.join(BASE, fname);
  const bakPath  = filePath + '.bak_keysfix_20260813';
  if (!fs.existsSync(bakPath)) { console.error(`No backup: ${fname}`); continue; }

  let src = fs.readFileSync(bakPath, 'utf8');
  const {wk, bk, semiMap, whites, scaleSemis} = buildArrays(fname);

  // Replace data arrays
  src = src.replace(/const WHITE_KEYS\s*=\s*\[[\s\S]*?\];/, wk);
  src = src.replace(/const BLACK_KEYS\s*=\s*\[[\s\S]*?\];/, bk);

  // Add KEY_SEMI and freqFromSemi after WKEY_W line
  src = src.replace(
    /const WKEY_W\s*=[^;]+;/,
    m => m + '\n' + semiMap + '\nfunction freqFromSemi(s){return 261.626*Math.pow(2,s/12);}'
  );

  // Add tonic CSS
  if (!src.includes('wkey.tonic')) {
    src = src.replace(
      '.wkey.active{background:#ffcdd2}',
      '.wkey.active{background:#ffcdd2}\n  .wkey.tonic{border:2px solid #f9a825;background:#fffde7}\n  .bkey.tonic{background:#f9a825!important}\n  .tonic-chip{background:#f9a825!important;color:#333!important}'
    );
  }

  // Replace main piano renderers
  src = src.replace(
    /WHITE_KEYS\.forEach\(\(k,i\)=>\{[\s\S]*?piano\.appendChild\(el\);[^\n]*keyElements[^\n]*\n\}\);/,
    makeWkRenderer('piano','playMainNote','keyElements')
  );
  src = src.replace(
    /BLACK_KEYS\.forEach\(k=>\{[\s\S]*?piano\.appendChild\(el\);[^\n]*keyElements[^\n]*\n\}\);/,
    makeBkRenderer('piano','playMainNote','keyElements')
  );

  // Replace detail piano renderers
  src = src.replace(
    /WHITE_KEYS\.forEach\(\(k,i\)=>\{[\s\S]*?container\.appendChild\(el\);[^\n]*detailKeyElements[^\n]*\n\s*\}\);/,
    makeWkRenderer('container','playDetailNote','detailKeyElements')
  );
  src = src.replace(
    /BLACK_KEYS\.forEach\(k=>\{[\s\S]*?container\.appendChild\(el\);[^\n]*detailKeyElements[^\n]*\n\s*\}\);/,
    makeBkRenderer('container','playDetailNote','detailKeyElements')
  );

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`JS ERROR in ${fname}: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_fp';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) { console.error('Round-trip failed'); fs.unlinkSync(tmp); continue; }
  fs.renameSync(tmp, filePath);

  const tonic = FILES[fname].tonic;
  const tonicNote = PIANO_NOTES[tonic];
  const octaveNote = PIANO_NOTES[tonic+12];
  console.log(`✓ ${fname}: ${tonicNote.name}(${tonicNote.fa}) → ${octaveNote.name}(${octaveNote.fa})`);
  console.log(`  ${whites.length} white keys, scale degrees: ${scaleSemis.map((s,i)=>(i+1)+':'+( PIANO_NOTES[s]?PIANO_NOTES[s].fa:'QT')).join(', ')}`);
  ok++;
}
console.log(`\n═══ Done: ${ok}/${Object.keys(FILES).length} ═══`);

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

const PIANO_NOTES = {
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

const FILES = {
  'ajam.html':    {tonic:10, intervals:[2,2,1,2,2,2,1]},
  'nahawand.html':{tonic:0,  intervals:[2,1,2,2,1,3,1]},
  'nikriz.html':  {tonic:0,  intervals:[2,1,3,1,2,1,2]},
  'rast.html':    {tonic:0,  intervals:[2,1.5,1.5,2,2,1.5,1.5]},
  'segah.html':   {tonic:3,  intervals:[1.5,2,2,1.5,1.5,2,1.5]},
};

function getScaleSemis(tonic, intervals) {
  const s = [tonic]; let pos = tonic;
  for (const iv of intervals) { pos += iv; s.push(pos); }
  return s;
}

function buildPiano(tonic) {
  const whites = [], blacks = [];
  for (let s = tonic; s <= tonic+12; s++) {
    const k = PIANO_NOTES[s];
    if (!k) continue;
    if (k.type === 'white') whites.push(s);
    else blacks.push(s);
  }
  return {whites, blacks};
}

function getAwi(blackSemi, whites) {
  return whites.filter(w => w < blackSemi).length - 1;
}

function buildArrays(fname) {
  const {tonic, intervals} = FILES[fname];
  const scaleSemis = getScaleSemis(tonic, intervals);
  const {whites, blacks} = buildPiano(tonic);

  const wLines = whites.map(s => {
    const k = PIANO_NOTES[s];
    const idx = scaleSemis.indexOf(s);
    const isTonic = idx === 0, isOctave = idx === 7;
    const label = isOctave ? k.fa+' (اکتاو)' : k.fa;
    if (idx >= 0) return `  {name:'${k.name}', label:'${label}', deg:${idx+1}, isTonic:${isTonic}}`;
    return `  {name:'${k.name}', label:'${label}'}`;
  });

  const bLines = blacks.map(s => {
    const k = PIANO_NOTES[s];
    const awi = getAwi(s, whites);
    const idx = scaleSemis.indexOf(s);
    const isTonic = idx === 0, isOctave = idx === 7;
    const label = isOctave ? k.fa+' (اکتاو)' : k.fa;
    if (idx >= 0) return `  {name:'${k.name}', label:'${label}', afterWhiteIdx:${awi}, deg:${idx+1}, isTonic:${isTonic}}`;
    return `  {name:'${k.name}', label:'${label}', afterWhiteIdx:${awi}}`;
  });

  const allSemis = [...whites, ...blacks].sort((a,b)=>a-b);
  const semiMap = allSemis.map(s => `${PIANO_NOTES[s].name}:${s}`).join(',');

  return {
    wk: `const WHITE_KEYS = [\n${wLines.join(',\n')}\n];`,
    bk: `const BLACK_KEYS = [\n${bLines.join(',\n')}\n];`,
    semiMap: `const KEY_SEMI={${semiMap}};`,
    whites, scaleSemis
  };
}

let ok = 0;
for (const fname of Object.keys(FILES)) {
  const filePath = path.join(BASE, fname);
  const bakPath  = filePath + '.bak_keysfix_20260813';
  if (!fs.existsSync(bakPath)) { console.error(`No backup: ${fname}`); continue; }

  let src = fs.readFileSync(bakPath, 'utf8');
  const {wk, bk, semiMap, whites, scaleSemis} = buildArrays(fname);

  // 1. Replace data arrays
  src = src.replace(/const WHITE_KEYS\s*=\s*\[[\s\S]*?\];/, wk);
  src = src.replace(/const BLACK_KEYS\s*=\s*\[[\s\S]*?\];/, bk);

  // 2. Add KEY_SEMI + freqFromSemi after WKEY_W line
  src = src.replace(
    /(const WKEY_W\s*=[^;\n]+;)/,
    `$1\n${semiMap}\nfunction freqFromSemi(s){return 261.626*Math.pow(2,s/12);}`
  );

  // 3. Add tonic CSS after .wkey.active rule
  if (!src.includes('wkey.tonic')) {
    src = src.replace(
      '.wkey.active{background:#ffcdd2}',
      '.wkey.active{background:#ffcdd2}\n  .wkey.tonic{border:2px solid #f9a825 !important;background:#fffde7 !important}\n  .bkey.tonic{background:#f9a825 !important}\n  .tonic-chip{background:#f9a825 !important;color:#333 !important}'
    );
  }

  // 4. Replace renderers — use line-by-line replacement on exact known lines
  // Main piano WHITE_KEYS renderer (lines 237-244 in backup)
  const OLD_MAIN_WK = `WHITE_KEYS.forEach((k,i)=>{
  const el=document.createElement('div');
  const note=findScaleNote(k.offset);
  el.className='wkey'+(note?' used':'');
  el.style.left=(i*WKEY_W)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(note?'<div class="deg-badge"><span class="deg-chip">'+toFa(note.deg)+'</span></div>':'');
  el.onclick=()=>playMainNote(note||{freq:freqFromOffset(k.offset),label:k.label,desc:''}, el);
  piano.appendChild(el); keyElements['o'+k.offset]=el;
});`;

  const NEW_MAIN_WK = `WHITE_KEYS.forEach((k,i)=>{
  const el=document.createElement('div');
  const semi=KEY_SEMI[k.name];
  el.className='wkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=(i*WKEY_W)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=()=>playMainNote({freq:freqFromSemi(semi),label:k.label,desc:''}, el);
  piano.appendChild(el); keyElements['s'+semi]=el;
});`;

  const OLD_MAIN_BK = `BLACK_KEYS.forEach(k=>{
  const el=document.createElement('div');
  const note=findScaleNote(k.offset);
  el.className='bkey'+(note?' used':'');
  el.style.left=((k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(note?'<div class="deg-badge"><span class="deg-chip">'+toFa(note.deg)+'</span></div>':'');
  el.onclick=(e)=>{ e.stopPropagation(); playMainNote(note||{freq:freqFromOffset(k.offset),label:k.label,desc:''}, el); };
  piano.appendChild(el); keyElements['o'+k.offset]=el;
});`;

  const NEW_MAIN_BK = `BLACK_KEYS.forEach(k=>{
  const el=document.createElement('div');
  const semi=KEY_SEMI[k.name];
  el.className='bkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=((k.afterWhiteIdx+1)*WKEY_W-BKEY_W/2-3)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=(e)=>{e.stopPropagation(); playMainNote({freq:freqFromSemi(semi),label:k.label,desc:''}, el);};
  piano.appendChild(el); keyElements['s'+semi]=el;
});`;

  // Detail piano
  const OLD_DET_WK = `    el.style.left=(i*WKEY_W)+'px';
    el.innerHTML='<div class="lbl">'+k.label+'</div>'+(note?'<div class="deg-badge"><span class="deg-chip">'+toFa(note.deg)+'</span></div>':'');
    el.onclick=()=>playDetailNote(note||{freq:freqFromOffset(k.offset),label:k.label,desc:''}, el);
    container.appendChild(el); detailKeyElements['o'+k.offset]=el;`;

  const NEW_DET_WK = `    el.style.left=(i*WKEY_W)+'px';
    el.className='wkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
    el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
    el.onclick=()=>playDetailNote({freq:freqFromSemi(KEY_SEMI[k.name]),label:k.label,desc:''}, el);
    container.appendChild(el); detailKeyElements['s'+KEY_SEMI[k.name]]=el;`;

  const OLD_DET_BK = `    el.style.left=((k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';
    el.innerHTML='<div class="lbl">'+k.label+'</div>'+(note?'<div class="deg-badge"><span class="deg-chip">'+toFa(note.deg)+'</span></div>':'');
    el.onclick=(e)=>{ e.stopPropagation(); playDetailNote(note||{freq:freqFromOffset(k.offset),label:k.label,desc:''}, el); };
    container.appendChild(el); detailKeyElements['o'+k.offset]=el;`;

  const NEW_DET_BK = `    el.style.left=((k.afterWhiteIdx+1)*WKEY_W-BKEY_W/2-3)+'px';
    el.className='bkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
    el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
    el.onclick=(e)=>{e.stopPropagation(); playDetailNote({freq:freqFromSemi(KEY_SEMI[k.name]),label:k.label,desc:''}, el);};
    container.appendChild(el); detailKeyElements['s'+KEY_SEMI[k.name]]=el;`;

  if (src.includes(OLD_MAIN_WK)) src = src.replace(OLD_MAIN_WK, NEW_MAIN_WK);
  else console.log(`  ${fname}: main WK pattern not found`);
  if (src.includes(OLD_MAIN_BK)) src = src.replace(OLD_MAIN_BK, NEW_MAIN_BK);
  else console.log(`  ${fname}: main BK pattern not found`);
  if (src.includes(OLD_DET_WK))  src = src.replace(OLD_DET_WK,  NEW_DET_WK);
  else console.log(`  ${fname}: detail WK pattern not found`);
  if (src.includes(OLD_DET_BK))  src = src.replace(OLD_DET_BK,  NEW_DET_BK);
  else console.log(`  ${fname}: detail BK pattern not found`);

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR in ${fname}: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_fp2';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) { console.error('Round-trip failed'); fs.unlinkSync(tmp); continue; }
  fs.renameSync(tmp, filePath);

  const t = FILES[fname].tonic;
  console.log(`✓ ${fname}: ${PIANO_NOTES[t].name}→${PIANO_NOTES[t+12].name}, scale: ${scaleSemis.map((s,i)=>`${i+1}:${PIANO_NOTES[s]?PIANO_NOTES[s].fa:'QT'}`).join(' ')}`);
  ok++;
}
console.log(`\n═══ Done: ${ok}/${Object.keys(FILES).length} ═══`);

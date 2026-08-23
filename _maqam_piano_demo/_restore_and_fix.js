// Restore from .bak_keysfix_20260813 then apply ONLY the label fix
// Strategy: keep EXACTLY the same renderer as the backup, only fix WHITE_KEYS/BLACK_KEYS data

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

const ROOTS = { 'ajam.html':10, 'nahawand.html':0, 'nikriz.html':0, 'rast.html':0, 'segah.html':3 };
const SCALES = {
  'ajam.html':    [0,2,4,5,7,9,11,12],
  'nahawand.html':[0,2,3,5,7,8,11,12],
  'nikriz.html':  [0,2,3,6,7,9,10,12],
  'rast.html':    [0,2,3.5,5,7,9,10.5,12],
  'segah.html':   [0,1.5,3.5,5.5,7,8.5,10.5,12],
};

// Full piano C4→C5
const PIANO = [
  {name:'C4', fa:'دو',  semi:0,  type:'white', awi:null},
  {name:'Cs4',fa:'دو#', semi:1,  type:'black', awi:0},
  {name:'D4', fa:'ر',   semi:2,  type:'white', awi:null},
  {name:'Ds4',fa:'ر#',  semi:3,  type:'black', awi:1},
  {name:'E4', fa:'می',  semi:4,  type:'white', awi:null},
  {name:'F4', fa:'فا',  semi:5,  type:'white', awi:null},
  {name:'Fs4',fa:'فا#', semi:6,  type:'black', awi:3},
  {name:'G4', fa:'سل',  semi:7,  type:'white', awi:null},
  {name:'Gs4',fa:'سل#', semi:8,  type:'black', awi:4},
  {name:'A4', fa:'لا',  semi:9,  type:'white', awi:null},
  {name:'As4',fa:'لا#', semi:10, type:'black', awi:5},
  {name:'B4', fa:'سی',  semi:11, type:'white', awi:null},
  {name:'C5', fa:'دو',  semi:12, type:'white', awi:null},
];
const FLAT = {1:'ربمل',3:'میبمل',6:'سلبمل',8:'لابمل',10:'سیبمل'};

function buildKeys(fname) {
  const rootSemi = ROOTS[fname];
  const offsets  = SCALES[fname];
  const useFlat  = (rootSemi===10||rootSemi===3);

  // Which semis (from C) are scale degrees?
  const scaleSemiMap = {}; // semi → {deg, isTonic, isQuarter}
  offsets.forEach((o,i) => {
    const deg = i+1;
    const isTonic = (deg===1);
    if (!Number.isInteger(o)) {
      const abs = (rootSemi + o) % 12;
      scaleSemiMap[abs] = {deg, isTonic, isQuarter:true};
    } else {
      const abs = o===12 ? 12 : (rootSemi + o) % 12;
      scaleSemiMap[abs] = {deg, isTonic, isQuarter:false};
    }
  });

  const whites = PIANO.filter(k=>k.type==='white');
  const blacks = PIANO.filter(k=>k.type==='black');

  // WHITE_KEYS
  const wLines = whites.map(k => {
    const info = scaleSemiMap[k.semi];
    const fa = k.semi===12
      ? (scaleSemiMap[12]||scaleSemiMap[0] ? (useFlat&&FLAT[rootSemi%12] ? FLAT[rootSemi%12] : (PIANO.find(p=>p.semi===rootSemi%12)||{fa:k.fa}).fa)+' (اکتاو)' : k.fa+' (اکتاو)')
      : k.fa;
    if (info && !info.isQuarter) {
      return `  {name:'${k.name}', label:'${fa}', deg:${info.deg}, isTonic:${info.isTonic}}`;
    }
    return `  {name:'${k.name}', label:'${fa}'}`;
  });

  // BLACK_KEYS
  const bLines = blacks.map(k => {
    const info = scaleSemiMap[k.semi];
    const fa = (useFlat && FLAT[k.semi]) ? FLAT[k.semi] : k.fa;
    if (info && !info.isQuarter) {
      return `  {name:'${k.name}', label:'${fa}', afterWhiteIdx:${k.awi}, deg:${info.deg}, isTonic:${info.isTonic}}`;
    }
    return `  {name:'${k.name}', label:'${fa}', afterWhiteIdx:${k.awi}}`;
  });

  return {
    wk: `const WHITE_KEYS = [\n${wLines.join(',\n')}\n];`,
    bk: `const BLACK_KEYS = [\n${bLines.join(',\n')}\n];`,
  };
}

const files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html'];
let ok = 0;

for (const fname of files) {
  const filePath = path.join(BASE, fname);
  const bakPath  = filePath + '.bak_keysfix_20260813';

  // Step 1: restore from backup
  if (!fs.existsSync(bakPath)) { console.error(`No backup for ${fname}`); continue; }
  let src = fs.readFileSync(bakPath, 'utf8');
  console.log(`\n── ${fname} (restored from backup) ──`);

  // Step 2: replace WHITE_KEYS and BLACK_KEYS arrays
  const {wk, bk} = buildKeys(fname);
  src = src.replace(/const WHITE_KEYS\s*=\s*\[[\s\S]*?\];/, wk);
  src = src.replace(/const BLACK_KEYS\s*=\s*\[[\s\S]*?\];/, bk);

  // Step 3: fix renderer — replace offset-based matching with deg-based
  // Old renderer uses: findScaleNote(k.offset) → note
  // New renderer uses: k.deg and k.isTonic directly (already in key data)
  // Also add freqFromSemi helper + KEY_SEMI lookup

  if (!src.includes('KEY_SEMI')) {
    src = src.replace(
      /const WKEY_W\s*=[^;]+;/,
      m => m + '\nconst KEY_SEMI={C4:0,Cs4:1,D4:2,Ds4:3,E4:4,F4:5,Fs4:6,G4:7,Gs4:8,A4:9,As4:10,B4:11,C5:12};' +
           '\nfunction freqFromSemi(s){return 261.626*Math.pow(2,s/12);}'
    );
  }

  // Add tonic CSS if missing
  if (!src.includes('wkey.tonic')) {
    src = src.replace(
      '.wkey.active{background:#ffcdd2}',
      '.wkey.active{background:#ffcdd2}\n  .wkey.tonic{border:2px solid #f9a825;background:#fff9e6}\n  .bkey.tonic{background:#f9a825}\n  .tonic-chip{background:#f9a825!important;color:#222!important}'
    );
  }

  // Replace both main-piano and detail-piano WHITE_KEYS.forEach
  // Pattern ends with either: piano.appendChild / container.appendChild
  src = src.replace(
    /WHITE_KEYS\.forEach\(\(k,i\)=>\{[\s\S]*?(?:piano|container)\.appendChild\(el\);[^\n]*keyElements[^\n]*\n\}\);/g,
    (match) => {
      const isDetail = match.includes('container.appendChild');
      const appendEl = isDetail ? 'container' : 'piano';
      const playFn   = isDetail ? 'playDetailNote' : 'playMainNote';
      const keysObj  = isDetail ? 'detailKeyElements' : 'keyElements';
      return `WHITE_KEYS.forEach((k,i)=>{
  const el=document.createElement('div');
  const semi=KEY_SEMI[k.name];
  el.className='wkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
  el.style.left=(i*WKEY_W)+'px';
  el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
  el.onclick=()=>{${playFn}({freq:freqFromSemi(semi),label:k.label,desc:''}, el);};
  ${appendEl}.appendChild(el); ${keysObj}['s'+semi]=el;
});`;
    }
  );

  // Replace both BLACK_KEYS.forEach
  src = src.replace(
    /BLACK_KEYS\.forEach\(k=>\{[\s\S]*?(?:piano|container)\.appendChild\(el\);[^\n]*keyElements[^\n]*\n\}\);/g,
    (match) => {
      const isDetail = match.includes('container.appendChild');
      const appendEl = isDetail ? 'container' : 'piano';
      const playFn   = isDetail ? 'playDetailNote' : 'playMainNote';
      const keysObj  = isDetail ? 'detailKeyElements' : 'keyElements';
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
  );

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR: ${e.message}`); continue; }
  }
  console.log(`  JS syntax OK`);

  // Write
  const tmp = filePath + '.tmp_final';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) { console.error('Round-trip failed'); fs.unlinkSync(tmp); continue; }
  fs.renameSync(tmp, filePath);
  console.log(`  ✓ saved`);
  ok++;
}

console.log(`\n═══ Done: ${ok}/${files.length} ═══`);

// Fix ONLY the key data for ajam.html:
// Correct scale from Bb: Bb, C, D, Eb, F, G, A, Bb
// Degree 1 (Bb) = black key As4, degree 4 (Eb) = black key Ds4, degree 8 (Bb octave) = black key As4... 
// BUT As4 is already used for degree 1. Degree 8 is one octave higher = As5 — not on standard C4-C5 piano.
// SOLUTION: Show the octave as the C5 key with label change, OR extend piano to include As5.
// CLEANEST: Piano shows C4 to C5 (13 keys), degree 8 Bb is ABOVE C5 — show it as a small extra black key
// OR: start piano from Bb3 to Bb4 — but that changes the layout significantly.
//
// PRACTICAL solution: keep C4-C5 piano, mark degrees 1,4,8 on black keys, 
// degree 8 shares As4 position but octave is labeled differently.
// Actually degree 8 Bb is As4+12 semitones = As5, not on piano.
// Better: show the octave on the SAME key as degree 1 (both are Bb, one octave apart) 
// with a note "اکتاو" and just reuse As4 for both deg1 and deg8.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

// Correct Ajam from Bb key data:
// White keys C4..C5 — with correct degree assignments
// Bb (deg1,8) = As4 (black), Eb (deg4) = Ds4 (black)
const NEW_WHITE_KEYS = `const WHITE_KEYS = [
  {name:'C4',  label:'دو',            deg:2, isTonic:false},
  {name:'D4',  label:'ر',             deg:3, isTonic:false},
  {name:'E4',  label:'می'},
  {name:'F4',  label:'فا',            deg:5, isTonic:false},
  {name:'G4',  label:'سل',            deg:6, isTonic:false},
  {name:'A4',  label:'لا',            deg:7, isTonic:false},
  {name:'B4',  label:'سی'},
  {name:'C5',  label:'دو (اکتاو)'},
];`;

const NEW_BLACK_KEYS = `const BLACK_KEYS = [
  {name:'Cs4', label:'دو#',  afterWhiteIdx:0},
  {name:'Ds4', label:'میبمل', afterWhiteIdx:1, deg:4, isTonic:false},
  {name:'Fs4', label:'فا#',  afterWhiteIdx:3},
  {name:'Gs4', label:'سل#',  afterWhiteIdx:4},
  {name:'As4', label:'سیبمل', afterWhiteIdx:5, deg:1, isTonic:true, degAlso:8},
];`;

const fname = 'ajam.html';
const filePath = path.join(BASE, fname);
let src = fs.readFileSync(filePath, 'utf8');

src = src.replace(/const WHITE_KEYS\s*=\s*\[[\s\S]*?\];/, NEW_WHITE_KEYS);
src = src.replace(/const BLACK_KEYS\s*=\s*\[[\s\S]*?\];/, NEW_BLACK_KEYS);

// Update label rendering to show deg1 AND deg8 on same key (As4)
// In the renderer: if k.degAlso exists, show both deg badges
src = src.replace(
  /el\.innerHTML='<div class="lbl">'\+k\.label\+'<\/div>'\+\(k\.deg\?'<div class="deg-badge"><span class="deg-chip'\+\(k\.isTonic\?' tonic-chip':''\)\+'">'\+toFa\(k\.deg\)\+'<\/span><\/div>':''\);/g,
  `el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+(k.degAlso?'/'+toFa(k.degAlso):'')+'</span></div>':'');`
);

// Validate JS
const sm = src.match(/<script>([\s\S]*?)<\/script>/);
if (sm) {
  try { new vm.Script(sm[1]); console.log('JS syntax OK'); }
  catch(e) { console.error('JS ERROR: '+e.message); process.exit(1); }
}

const tmp = filePath + '.tmp_ajamfix';
fs.writeFileSync(tmp, src, 'utf8');
if (fs.readFileSync(tmp,'utf8') !== src) { console.error('Round-trip failed'); process.exit(1); }
fs.renameSync(tmp, filePath);
console.log('✓ ajam.html fixed');
console.log('Scale on piano:');
console.log('  deg1+8: سیبمل (As4) ⬛ TONIC');
console.log('  deg2:   دو (C4) ⬜');
console.log('  deg3:   ر (D4) ⬜');
console.log('  deg4:   میبمل (Ds4) ⬛');
console.log('  deg5:   فا (F4) ⬜');
console.log('  deg6:   سل (G4) ⬜');
console.log('  deg7:   لا (A4) ⬜');

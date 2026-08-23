// Fix ajam.html: piano As4→As5 (466Hz) → As3→As4 (233Hz)
// Changes needed:
// 1. NOTE_FREQ_BB3 = 466.164 → 233.082
// 2. WHITE_KEYS and BLACK_KEYS: use octave-3 names (As3, C4, D4, Ds4, F4, G4, A4, As4)
// 3. KEY_SEMI map: update to new semitone values (As3=-2, C4=0, D4=2, Ds4=3, F4=5, G4=7, A4=9, As4=10)

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

// Semitone from C4: As3=-2, Bb3=-2, C4=0, D4=2, Eb4/Ds4=3, F4=5, G4=7, A4=9, Bb4/As4=10
const PIANO_OCT3 = {
  '-2': {name:'As3', fa:'سیبمل'},
  '0':  {name:'C4',  fa:'دو'},
  '2':  {name:'D4',  fa:'ر'},
  '3':  {name:'Ds4', fa:'میبمل'},
  '5':  {name:'F4',  fa:'فا'},
  '7':  {name:'G4',  fa:'سل'},
  '9':  {name:'A4',  fa:'لا'},
  '10': {name:'As4', fa:'سیبمل'},
};

// Piano range As3(-2) to As4(10): all keys between
// White keys in this range: C4(0), D4(2), E4(4), F4(5), G4(7), A4(9), B4(11)... 
// Wait — As3 to As4: semis -2,-1,0,1,2,3,4,5,6,7,8,9,10
// White keys (W): 0(C4), 2(D4), 4(E4), 5(F4), 7(G4), 9(A4)
// Black keys (B): -2(As3/tonic), -1(B3→no wait)
// Actually:
// -2 = As3/Bb3 = BLACK ← tonic
// -1 = B3 = WHITE
// 0  = C4 = WHITE
// 1  = Cs4 = BLACK
// 2  = D4 = WHITE
// 3  = Ds4/Eb4 = BLACK ← deg4
// 4  = E4 = WHITE
// 5  = F4 = WHITE
// 6  = Fs4 = BLACK
// 7  = G4 = WHITE
// 8  = Gs4 = BLACK
// 9  = A4 = WHITE
// 10 = As4/Bb4 = BLACK ← octave/deg8

// White keys: B3(-1), C4(0), D4(2), E4(4), F4(5), G4(7), A4(9)  → 7 whites
// Black keys: As3(-2,tonic), Cs4(1), Ds4(3,deg4), Fs4(6), Gs4(8), As4(10,octave) → 6 blacks

// afterWhiteIdx for blacks (index of white key to the LEFT):
// As3(-2): before B3 → awi = -1? No — sits before first white key
//   Actually As3 is BEFORE B3, so it has no white key to its left in range
//   → awi=0 but positioned BEFORE first white key → leftPx = -BKEY_W/2-3 = negative
//   Better: use leftPx directly

// Let's compute positions:
// White key i → left = i * WKEY_W (44px)
// White keys in order: B3(-1,i=0), C4(0,i=1), D4(2,i=2), E4(4,i=3), F4(5,i=4), G4(7,i=5), A4(9,i=6)
// Black key left = (whiteKeysToLeft * WKEY_W) + WKEY_W - BKEY_W/2 - 3
// As3(-2): 0 white keys to left → left = 0 + 44 - 13 - 3 = 28? No, it's BEFORE first white
//   → leftPx = -BKEY_W/2 = -13 ... or just use leftPx=0 and let it sit at leftmost
//   Actually As3 is before B3 in keyboard order
//   B3=white key 0 starts at 0px, As3/Bb3 sits between A3 and B3 → to the LEFT of B3
//   leftPx = 0 + WKEY_W - BKEY_W/2 - 3 = 44-13-3=28? No that's after B3...
//   As3 is BEFORE B3: leftPx = -BKEY_W/2 - 3 = -16 (slightly off-screen left edge)
//   Or just: leftPx = 44*0 - BKEY_W/2 - 3 = -16
//   Let's use awi=-1 equivalent: leftPx = (0)*44 + 44 - 13 - 3 = 28... no
//   Key sequence on piano: [As3]B3 [Cs4]C4[Ds4]D4 E4[Fs4]F4[Gs4]G4[As4]A4
//   As3 is at the very left edge, before B3
//   Its center should be at: 0*44 - BKEY_W/2 = 0-13 = -13px ... clip to 0
//   Use leftPx = 2 (just a tiny bit from left edge, visible)

const WKEY_W = 44, BKEY_W = 26;

// White keys for Ajam As3→As4:
// B3(-1), C4(0), D4(2), E4(4), F4(5), G4(7), A4(9)
const WHITE_KEYS_AJAM = [
  {name:'B3',  fa:'سی',    semi:-1,  deg:null,  isTonic:false},
  {name:'C4',  fa:'دو',    semi:0,   deg:2,     isTonic:false},
  {name:'D4',  fa:'ر',     semi:2,   deg:3,     isTonic:false},
  {name:'E4',  fa:'می',    semi:4,   deg:null,  isTonic:false},
  {name:'F4',  fa:'فا',    semi:5,   deg:5,     isTonic:false},
  {name:'G4',  fa:'سل',    semi:7,   deg:6,     isTonic:false},
  {name:'A4',  fa:'لا',    semi:9,   deg:7,     isTonic:false},
];

// Black keys for Ajam As3→As4:
// As3(-2,tonic/deg1), Cs4(1), Ds4(3,deg4), Fs4(6), Gs4(8), As4(10,octave/deg8)
const BLACK_KEYS_AJAM = [
  {name:'As3', fa:'سیبمل',  semi:-2, awi:0,  deg:1,  isTonic:true,  leftPx: 2},
  {name:'Cs4', fa:'دو#',    semi:1,  awi:1,  deg:null, isTonic:false},
  {name:'Ds4', fa:'میبمل',  semi:3,  awi:2,  deg:4,  isTonic:false},
  {name:'Fs4', fa:'فا#',    semi:6,  awi:4,  deg:null, isTonic:false},
  {name:'Gs4', fa:'لابمل',  semi:8,  awi:5,  deg:null, isTonic:false},
  {name:'As4', fa:'سیبمل',  semi:10, awi:6,  deg:8,  isTonic:false, label:'سیبمل (اکتاو)'},
];

function wkLine(k) {
  const label = k.fa;
  if (k.deg) return `  {name:'${k.name}', label:'${label}', deg:${k.deg}, isTonic:${k.isTonic}}`;
  return `  {name:'${k.name}', label:'${label}'}`;
}

function bkLine(k) {
  const label = k.label || k.fa;
  const leftPxStr = k.leftPx !== undefined ? `, leftPx:${k.leftPx}` : '';
  if (k.deg) return `  {name:'${k.name}', label:'${label}', afterWhiteIdx:${k.awi}${leftPxStr}, deg:${k.deg}, isTonic:${k.isTonic}}`;
  return `  {name:'${k.name}', label:'${label}', afterWhiteIdx:${k.awi}${leftPxStr}}`;
}

const newWK = `const WHITE_KEYS = [\n${WHITE_KEYS_AJAM.map(wkLine).join(',\n')}\n];`;
const newBK = `const BLACK_KEYS = [\n${BLACK_KEYS_AJAM.map(bkLine).join(',\n')}\n];`;

// KEY_SEMI map: name → semitone from C4
const allKeys = [...WHITE_KEYS_AJAM, ...BLACK_KEYS_AJAM];
const semiMap = allKeys.map(k => `${k.name}:${k.semi}`).join(',');
const newSemiMap = `const KEY_SEMI={${semiMap}};`;

const filePath = path.join(BASE, 'ajam.html');
let src = fs.readFileSync(filePath, 'utf8');

// 1. Freq: 466.164 → 233.082
src = src.replace('NOTE_FREQ_BB3 = 466.164', 'NOTE_FREQ_BB3 = 233.082');

// 2. WHITE_KEYS
src = src.replace(/const WHITE_KEYS\s*=\s*\[[\s\S]*?\];/, newWK);

// 3. BLACK_KEYS
src = src.replace(/const BLACK_KEYS\s*=\s*\[[\s\S]*?\];/, newBK);

// 4. KEY_SEMI
src = src.replace(/const KEY_SEMI=\{[^}]+\};/, newSemiMap);

// 5. Fix bkey renderer to support leftPx override
src = src.replace(
  /el\.style\.left=\(\(k\.afterWhiteIdx\+1\)\*WKEY_W-BKEY_W\/2-3\)\+'px';/g,
  `el.style.left=(k.leftPx !== undefined ? k.leftPx : (k.afterWhiteIdx+1)*WKEY_W-BKEY_W/2-3)+'px';`
);

// Validate JS
const sm = src.match(/<script>([\s\S]*?)<\/script>/);
if (sm) {
  try { new vm.Script(sm[1]); console.log('JS syntax OK'); }
  catch(e) { console.error('JS ERROR: ' + e.message); process.exit(1); }
}

const tmp = filePath + '.tmp_oct';
fs.writeFileSync(tmp, src, 'utf8');
if (fs.readFileSync(tmp,'utf8') !== src) { console.error('Round-trip failed'); process.exit(1); }
fs.renameSync(tmp, filePath);

console.log('✓ ajam.html fixed: As3→As4 (233→466 Hz)');
console.log('White keys: B3, C4, D4, E4, F4, G4, A4');
console.log('Black keys: As3(tonic/1), Cs4, Ds4(4), Fs4, Gs4, As4(8octave)');

// Verify freqs
const C4_F = 261.626;
const BB3_F = 233.082;
console.log('\nVerification:');
[0,2,4,5,7,9,11,12].forEach((o,i) => {
  const freq = BB3_F * Math.pow(2, o/12);
  const semi = Math.round(Math.log2(freq/C4_F)*12);
  const inRange = semi >= -2 && semi <= 10;
  console.log(`  deg${i+1} offset=${o} → ${freq.toFixed(0)}Hz → semi=${semi} ${inRange?'✅':'❌'}`);
});

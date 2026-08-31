// Fix tonic frequencies to match the new piano range
// ajam.html:  NOTE_FREQ_BB3 (233.082 = Bb3) → must become As4 (466.164 = Bb4 = one octave higher)
//   Because piano now shows As4→As5, so tonic is As4 not Bb3
//   Bb4 = As4 = 466.164 Hz
// segah.html: NOTE_FREQ_EB4 (311.127 = Eb4) → still Eb4 = Ds4 ✅ already correct
// nahawand/nikriz/rast: NOTE_FREQ_C4 (261.626) ✅ already correct

// Also fix KEY_SEMI map in ajam.html — currently maps C4-range but piano is As4-As5
// And fix freqFromSemi to use correct C4 base

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

// Only ajam needs freq fix: Bb3(233.082) → Bb4/As4(466.164)
const fname = 'ajam.html';
const filePath = path.join(BASE, fname);
let src = fs.readFileSync(filePath, 'utf8');

// Fix NOTE_FREQ_BB3 value
const OLD_FREQ = 'NOTE_FREQ_BB3 = 233.082';
const NEW_FREQ = 'NOTE_FREQ_BB3 = 466.164';  // Bb4 = As4, one octave up

if (src.includes(OLD_FREQ)) {
  src = src.split(OLD_FREQ).join(NEW_FREQ);
  console.log('✓ ajam.html: NOTE_FREQ_BB3 233.082 → 466.164 (Bb3 → Bb4)');
} else {
  // Find what's there
  const m = src.match(/NOTE_FREQ_BB3\s*=\s*[\d.]+/);
  console.log('Current: ' + (m ? m[0] : 'NOT FOUND'));
}

// Validate JS
const sm = src.match(/<script>([\s\S]*?)<\/script>/);
if (sm) {
  try { new vm.Script(sm[1]); console.log('JS syntax OK'); }
  catch(e) { console.error('JS ERROR: ' + e.message); process.exit(1); }
}

const tmp = filePath + '.tmp_freq';
fs.writeFileSync(tmp, src, 'utf8');
if (fs.readFileSync(tmp,'utf8') !== src) { console.error('Round-trip failed'); process.exit(1); }
fs.renameSync(tmp, filePath);
console.log('✓ saved');

// Verify: with NOTE_FREQ_BB3=466.164 and offset=0,2,4,5,7,9,11,12:
// offset 0  → 466.164 * 2^(0/12)  = 466.164 Hz = As4(semi=10) ✅
// offset 2  → 466.164 * 2^(2/12)  = 523.25  Hz = C5 (semi=12) ✅
// offset 4  → 466.164 * 2^(4/12)  = 587.33  Hz = D5 (semi=14) ✅
// offset 5  → 466.164 * 2^(5/12)  = 622.25  Hz = Ds5(semi=15) ✅
// offset 7  → 466.164 * 2^(7/12)  = 698.46  Hz = F5 (semi=17) ✅
// offset 9  → 466.164 * 2^(9/12)  = 783.99  Hz = G5 (semi=19) ✅
// offset 11 → 466.164 * 2^(11/12) = 880.00  Hz = A5 (semi=21) ✅
// offset 12 → 466.164 * 2^(12/12) = 932.33  Hz = As5(semi=22) ✅
console.log('\nVerification (offset → freq → semi from C4):');
const C4 = 261.626;
const NEW_BB = 466.164;
const offsets = [0,2,4,5,7,9,11,12];
const PIANO = {10:'As4/سیبمل',12:'C5/دو',14:'D5/ر',15:'Ds5/میبمل',17:'F5/فا',19:'G5/سل',21:'A5/لا',22:'As5/سیبمل'};
for (const o of offsets) {
  const freq = NEW_BB * Math.pow(2, o/12);
  const semi = Math.round(Math.log2(freq/C4) * 12);
  const note = PIANO[semi] || '?';
  const inRange = (semi >= 10 && semi <= 22);
  console.log(`  offset=${o} → ${freq.toFixed(1)}Hz → semi=${semi} → ${note} ${inRange ? '✅' : '❌'}`);
}

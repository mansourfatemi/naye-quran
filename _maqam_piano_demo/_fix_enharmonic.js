// Fix enharmonic naming in scale labels and key labels for better maqam context:
// Nahawand (C root): offset 3 = Eb (میبمل) not ر# — because Nahawand is a minor-family maqam
// Nikriz (C root):   offset 3 = Eb (میبمل) not ر# — same reason (minor 3rd from C)
// Nikriz:            offset 10 = بمل لا (B flat) not لا# — (in Western would be Bb/A#, but Nahawand upper = Bb)
// Rast (C root):     offset 3.5 quarter-tone — "ر# نیمتیز" is fine (between ر# and می)
// Nahawand:          offset 8 = سل# → better as لابمل for maqam context (Hijaz genus uses Ab typically)
// But let's be conservative: only fix the clearly-wrong ones:
// - Nahawand deg3 offset3: ر# → میبمل (Eb = minor third, standard in Nahawand)
// - Nahawand deg6 offset8: سل# → لابمل (Ab in Nahawand/Hijaz context)
// - Nikriz deg3 offset3: ر# → میبمل
// - Nikriz deg7 offset10: لا# → سیبمل (Bb in Nahawand upper tetrachord context)

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

const FIXES = [
  // {file, search_exact_str, replace_with_str}
  // Nahawand deg3
  { file:'nahawand.html', from:`label:'ر#',              desc:'نیمپرده بالاتر — سومین نُت جنس نهاوند'`,
                           to:  `label:'میبمل',              desc:'نیمپرده بالاتر — سومین نُت جنس نهاوند'` },
  // Nahawand deg6
  { file:'nahawand.html', from:`label:'سل#',          desc:'نیمپرده بالاتر — دومین نُت جنس حجاز'`,
                           to:  `label:'لابمل',          desc:'نیمپرده بالاتر — دومین نُت جنس حجاز'` },
  // Nahawand WHITE_KEYS: offset:3 label:'ر#' → میبمل, offset:8 label:'سل#' → لابمل
  { file:'nahawand.html', from:`{offset:3,  label:'ر#'}`,
                           to:  `{offset:3,  label:'میبمل'}` },
  { file:'nahawand.html', from:`{offset:8,  label:'سل#'}`,
                           to:  `{offset:8,  label:'لابمل'}` },
  // Nikriz deg3
  { file:'nikriz.html',   from:`label:'ر#',              desc:'نیمپرده بالاتر — سومین نُت جنس نکریز'`,
                           to:  `label:'میبمل',              desc:'نیمپرده بالاتر — سومین نُت جنس نکریز'` },
  // Nikriz deg7
  { file:'nikriz.html',   from:`label:'لا#',              desc:'نیمپرده بالاتر — سومین نُت جنس نهاوند'`,
                           to:  `label:'سیبمل',              desc:'نیمپرده بالاتر — سومین نُت جنس نهاوند'` },
  // Nikriz WHITE_KEYS
  { file:'nikriz.html',   from:`{offset:3,  label:'ر#'}`,
                           to:  `{offset:3,  label:'میبمل'}` },
  { file:'nikriz.html',   from:`{offset:10,  label:'لا#'}`,
                           to:  `{offset:10,  label:'سیبمل'}` },
  // Ajam deg4: offset5 = 'ر#' → should be 'می' ... wait: Bb CHROM[5]='ر# / میبمل' → first token='ر#'
  // But in Ajam (major scale from Bb): the 4th degree is Eb (= ر# / میبمل)
  // Actually ر# IS correct in a Bb major scale (it's enharmonic to Eb but spelled as ر# in sharp keys)
  // Ajam is like Bb major — sharps convention → ر# is correct, leave as-is
  // Ajam deg7: offset11 = 'لا' → Bb CHROM[11]='لا' → correct
];

for (const fix of FIXES) {
  const filePath = path.join(BASE, fix.file);
  let src = fs.readFileSync(filePath, 'utf8');
  if (!src.includes(fix.from)) {
    console.log(`${fix.file}: NOT FOUND: ...${fix.from.substring(0,40)}...`);
    continue;
  }
  const newSrc = src.split(fix.from).join(fix.to);
  const count = src.split(fix.from).length - 1;

  // Validate JS
  const sm = newSrc.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR in ${fix.file}: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_enh';
  fs.writeFileSync(tmp, newSrc, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== newSrc) {
    console.error(`Round-trip failed`); fs.unlinkSync(tmp); continue;
  }
  fs.renameSync(tmp, filePath);
  console.log(`✓ ${fix.file}: replaced ${count}x '${fix.from.substring(7,30)}...' → '${fix.to.substring(7,30)}...'`);
}
console.log('\nDone.');

// Fix findScaleNote type coercion issue:
// WHITE_KEYS offsets are numbers, SCALE offsets are numbers — but strict === may fail
// if one is stored as integer and other as float (e.g. 7 vs 7.0)
// Also: the AJAM_SCALE has label 'فا (غماز)' but WHITE_KEYS has 'فا' — that's fine, we match by offset
// Real fix: use == instead of === OR ensure both are Number() compared

// Actually the real bug is subtler: WHITE_KEYS forEach passes k.offset which was parsed from JSON
// The SCALE array offset values — check if any are stored differently

// Let's just make findScaleNote robust: Number(s.offset) === Number(offset)
// And also for detail piano: same fix needed

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

const files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html'];

// Patterns to fix — all findScaleNote / findNote functions
const FIXES = [
  // Main piano findScaleNote
  [
    `function findScaleNote(offset){ return AJAM_SCALE.find(s=>!s.isQuarter && s.offset===offset); }`,
    `function findScaleNote(offset){ return AJAM_SCALE.find(s=>!s.isQuarter && Number(s.offset)===Number(offset)); }`
  ],
  [
    `function findScaleNote(offset){ return NAHAWAND_SCALE.find(s=>!s.isQuarter && s.offset===offset); }`,
    `function findScaleNote(offset){ return NAHAWAND_SCALE.find(s=>!s.isQuarter && Number(s.offset)===Number(offset)); }`
  ],
  [
    `function findScaleNote(offset){ return NIKRIZ_SCALE.find(s=>!s.isQuarter && s.offset===offset); }`,
    `function findScaleNote(offset){ return NIKRIZ_SCALE.find(s=>!s.isQuarter && Number(s.offset)===Number(offset)); }`
  ],
  [
    `function findScaleNote(offset){ return RAST_SCALE.find(s=>!s.isQuarter && s.offset===offset); }`,
    `function findScaleNote(offset){ return RAST_SCALE.find(s=>!s.isQuarter && Number(s.offset)===Number(offset)); }`
  ],
  [
    `function findScaleNote(offset){ return SIKAH_SCALE.find(s=>!s.isQuarter && s.offset===offset); }`,
    `function findScaleNote(offset){ return SIKAH_SCALE.find(s=>!s.isQuarter && Number(s.offset)===Number(offset)); }`
  ],
  // Detail piano findNote — uses scaleArr which is dynamic, fix with Number comparison
  [
    `const findNote=(offset)=>scaleArr.find(s=>!s.isQuarter && s.offset===offset);`,
    `const findNote=(offset)=>scaleArr.find(s=>!s.isQuarter && Number(s.offset)===Number(offset));`
  ],
];

let totalOk = 0;
for (const fname of files) {
  const filePath = path.join(BASE, fname);
  let src = fs.readFileSync(filePath, 'utf8');
  let changed = 0;

  for (const [oldStr, newStr] of FIXES) {
    if (src.includes(oldStr)) {
      src = src.split(oldStr).join(newStr);
      changed++;
    }
  }

  if (changed === 0) {
    // Check what the actual findScaleNote looks like
    const m = src.match(/function findScaleNote[^\n]+/);
    console.log(`${fname}: NO FIXES APPLIED. Actual: ${m ? m[0] : 'NOT FOUND'}`);
    continue;
  }

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_fs';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) {
    console.error('Round-trip failed'); fs.unlinkSync(tmp); continue;
  }
  fs.renameSync(tmp, filePath);
  console.log(`✓ ${fname}: ${changed} fix(es) applied`);
  totalOk++;
}
console.log(`\nDone: ${totalOk}/${files.length}`);

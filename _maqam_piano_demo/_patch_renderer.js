// Patch the BLACK_KEYS renderer in all 5 files to support leftPx + doubleW
// Old formula: el.style.left=((k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';
// New formula: el.style.left=(k.leftPx !== undefined ? k.leftPx : (k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';
// Plus: if(k.doubleW) el.style.width=Math.round(BKEY_W*0.72)+'px';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = path.dirname(__filename);
const files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html'];

const OLD = `el.style.left=((k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';`;
const NEW = `el.style.left=(k.leftPx !== undefined ? k.leftPx : (k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';\n      if(k.doubleW) el.style.width=Math.round(BKEY_W*0.72)+'px';`;

let totalOk = 0;
for (const fname of files) {
  const filePath = path.join(BASE, fname);
  let src = fs.readFileSync(filePath, 'utf8');

  const count = (src.split(OLD).length - 1);
  if (count === 0) {
    console.log(`${fname}: pattern NOT found — checking actual lines...`);
    // Show the actual left= lines for debug
    src.split('\n').forEach((l, i) => {
      if (l.includes('bkey') || l.includes('style.left') || l.includes('afterWhiteIdx')) {
        console.log(`  L${i+1}: ${l.trim()}`);
      }
    });
    continue;
  }

  const patched = src.split(OLD).join(NEW);
  const patchCount = (patched.split(NEW).length - 1);
  console.log(`${fname}: replaced ${count} occurrence(s) → ${patchCount} new blocks`);

  // Validate JS
  const scriptMatch = patched.match(/<script>([\s\S]*?)<\/script>/);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1]);
    } catch(e) {
      console.error(`  JS SYNTAX ERROR in ${fname}: ${e.message}`);
      continue;
    }
  }

  // Write temp then rename
  const tmp = filePath + '.tmp_renderer';
  fs.writeFileSync(tmp, patched, 'utf8');
  const verify = fs.readFileSync(tmp, 'utf8');
  if (verify !== patched) {
    console.error(`  Round-trip failed for ${fname}`);
    fs.unlinkSync(tmp);
    continue;
  }
  fs.renameSync(tmp, filePath);
  console.log(`  ✓ ${fname} renderer patched`);
  totalOk++;
}

console.log(`\nDone: ${totalOk}/${files.length} renderer patches applied`);

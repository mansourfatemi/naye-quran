// Fix: CSS .wkey has width:72px which overrides JS el.style.width
// Solution: change CSS .wkey width to 'auto' so JS inline style takes precedence
// Also fix .bkey width from 20px (CSS) — JS sets it inline anyway, but let's keep CSS as fallback

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);
const files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html'];

// The exact CSS strings to replace (from _fix_css_piano.js output)
const OLD_WKEY_CSS = `.wkey {position:absolute;top:0;width:72px;height:160px;background:#fefefe;border:1px solid #bbb;border-radius:0 0 8px 8px;cursor:pointer;box-shadow:inset 0 -6px 10px -6px rgba(0,0,0,.15);transition:background .12s;min-width:24px}`;
const NEW_WKEY_CSS = `.wkey {position:absolute;top:0;width:auto;height:160px;background:#fefefe;border:1px solid #bbb;border-radius:0 0 8px 8px;cursor:pointer;box-shadow:inset 0 -6px 10px -6px rgba(0,0,0,.15);transition:background .12s;min-width:24px}`;

let ok = 0;
for (const fname of files) {
  const filePath = path.join(BASE, fname);
  let src = fs.readFileSync(filePath, 'utf8');

  if (!src.includes(OLD_WKEY_CSS)) {
    // Try to find actual .wkey CSS line for debugging
    const m = src.match(/\.wkey \{[^\}]+\}/);
    console.log(`${fname}: NOT FOUND. Actual: ${m ? m[0].substring(0,80) : 'missing'}`);
    continue;
  }

  src = src.split(OLD_WKEY_CSS).join(NEW_WKEY_CSS);

  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`JS ERROR: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_wcss';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) {
    console.error('Round-trip failed'); fs.unlinkSync(tmp); continue;
  }
  fs.renameSync(tmp, filePath);
  console.log(`✓ ${fname}: .wkey width → auto`);
  ok++;
}
console.log(`\nDone: ${ok}/${files.length}`);

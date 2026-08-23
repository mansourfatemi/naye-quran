// Update CSS for proportional piano layout across all 5 files
// Key design principles:
//   - Scale keys (white): full height, colored border, wide = their interval width
//   - Chrom keys (gray): shorter, narrow (20px), clearly subordinate
//   - Visual hierarchy: scale keys are the "important" ones; chrom = reference only
//   - Piano total width = 12 * 36 + 20 = 452px

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);

const ST_PX = 36;
const PIANO_W = 12 * ST_PX + 20; // 452px
const WKEY_H = 160;
const BKEY_H = 96;
const CHROM_KEY_W = 20;

const files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html'];

// CSS replacements (exact string → new string)
const CSS_FIXES = [
  // Piano container width
  [
    `.piano{position:relative;height:180px;width:352px;margin:0 auto;direction:ltr}`,
    `.piano{position:relative;height:${WKEY_H + 20}px;width:${PIANO_W}px;margin:0 auto;direction:ltr}`
  ],
  // White key CSS — remove fixed width (set by JS), update height
  [
    `.wkey {position:absolute;top:0;width: 72px;height:180px;background:#fefefe;border:1px solid #ccc;border-radius:0 0 6px 6px;cursor:pointer;box-shadow:inset 0 -6px 10px -6px rgba(0,0,0,.15);transition:background .12s}`,
    `.wkey {position:absolute;top:0;width:${ST_PX * 2}px;height:${WKEY_H}px;background:#fefefe;border:1px solid #bbb;border-radius:0 0 8px 8px;cursor:pointer;box-shadow:inset 0 -6px 10px -6px rgba(0,0,0,.15);transition:background .12s;min-width:${CHROM_KEY_W + 4}px}`
  ],
  // Black key CSS — use chrom key width, shorter height, gray color
  [
    `.bkey {position:absolute;top:0;width: 20px;height:110px;background:#1a1a1a;border-radius:0 0 4px 4px;cursor:pointer;z-index:5;box-shadow:0 3px 6px rgba(0,0,0,.4);transition:background .12s}`,
    `.bkey {position:absolute;top:0;width:${CHROM_KEY_W}px;height:${BKEY_H}px;background:#555;border-radius:0 0 4px 4px;cursor:pointer;z-index:5;box-shadow:0 3px 6px rgba(0,0,0,.4);transition:background .12s;border:1px solid #333}`
  ],
  // Diagwrap width (interval diagram above piano)
  [
    `.diagwrap{width:308px;margin:0;direction:ltr}`,
    `.diagwrap{width:${PIANO_W}px;margin:0;direction:ltr}`
  ],
  // Piano wrap
  [
    `.piano-wrap{margin:18px 16px;overflow-x:auto;padding-bottom:6px}`,
    `.piano-wrap{margin:18px 4px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}`
  ],
];

let ok = 0;
for (const fname of files) {
  const filePath = path.join(BASE, fname);
  let src = fs.readFileSync(filePath, 'utf8');
  let changed = 0;

  for (const [oldStr, newStr] of CSS_FIXES) {
    if (src.includes(oldStr)) {
      src = src.split(oldStr).join(newStr);
      changed++;
    } else {
      // Try to find a close match for debugging
      const key = oldStr.substring(0, 20);
      const idx = src.indexOf(key);
      if (idx >= 0) {
        const actual = src.substring(idx, idx + oldStr.length);
        console.log(`  ${fname}: PARTIAL MATCH for '${key}...' — actual: '${actual.substring(0,60)}'`);
      } else {
        console.log(`  ${fname}: NOT FOUND: '${key}...'`);
      }
    }
  }

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_css';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) {
    console.error('  Round-trip failed'); fs.unlinkSync(tmp); continue;
  }
  fs.renameSync(tmp, filePath);
  console.log(`✓ ${fname}: ${changed}/${CSS_FIXES.length} CSS rules updated`);
  ok++;
}
console.log(`\nDone: ${ok}/${files.length}`);

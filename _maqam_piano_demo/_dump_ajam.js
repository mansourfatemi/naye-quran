const fs=require('fs');
const c=fs.readFileSync('ajam.html','utf8');
function grab(startMarker, endMarker){
  const s = c.indexOf(startMarker);
  const e = c.indexOf(endMarker, s);
  return c.substring(s, e+endMarker.length);
}
console.log('--- WHITE_KEYS ---');
console.log(grab('const WHITE_KEYS = [', '];'));
console.log('--- BLACK_KEYS ---');
console.log(grab('const BLACK_KEYS = [', '];'));
console.log('--- AJAM_SCALE ---');
console.log(grab('const AJAM_SCALE = [', '\n];'));
console.log('--- H2 header ---');
const idx = c.indexOf('<h2>عجم');
console.log(JSON.stringify(c.substring(idx, idx+60)));

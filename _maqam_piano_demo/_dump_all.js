const fs=require('fs');
const files = {
  'nahawand.html': 'NAHAWAND_SCALE',
  'nikriz.html': 'NIKRIZ_SCALE',
  'segah.html': 'SIKAH_SCALE',
  'rast.html': 'RAST_SCALE'
};
function grab(c, startMarker, endMarker){
  const s = c.indexOf(startMarker);
  if(s<0) return 'NOT FOUND: '+startMarker;
  const e = c.indexOf(endMarker, s);
  return c.substring(s, e+endMarker.length);
}
Object.keys(files).forEach(f=>{
  const c = fs.readFileSync(f, 'utf8');
  console.log('=========', f, '=========');
  console.log('--- WHITE_KEYS ---');
  console.log(grab(c, 'const WHITE_KEYS = [', '];'));
  console.log('--- BLACK_KEYS ---');
  console.log(grab(c, 'const BLACK_KEYS = [', '];'));
  console.log('---', files[f], '---');
  console.log(grab(c, 'const '+files[f]+' = [', '\n];'));
  // find h2 header
  const h2idx = c.indexOf('<h2>');
  console.log('--- first H2 ---');
  console.log(JSON.stringify(c.substring(h2idx, h2idx+70)));
});

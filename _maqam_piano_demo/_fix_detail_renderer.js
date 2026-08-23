// Fix the detail piano renderer (inside combo detail view) — same logic as main piano
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const BASE = path.dirname(__filename);
const files = ['ajam.html','nahawand.html','nikriz.html','rast.html','segah.html'];

let ok = 0;
for (const fname of files) {
  const filePath = path.join(BASE, fname);
  let src = fs.readFileSync(filePath, 'utf8');

  // Replace detail WHITE_KEYS.forEach renderer
  // Pattern: WHITE_KEYS.forEach((k,i)=>{ ... container.appendChild(el); detailKeyElements[...]=el; });
  const oldWkDetail = /WHITE_KEYS\.forEach\(\(k,i\)=>\{[\s\S]*?container\.appendChild\(el\);[^\n]*\n\s*\}\);/;
  if (oldWkDetail.test(src)) {
    const newWD = `WHITE_KEYS.forEach((k,i)=>{
    const el=document.createElement('div');
    const semi=KEY_SEMI[k.name];
    el.className='wkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
    el.style.left=(i*WKEY_W)+'px';
    el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
    el.onclick=()=>{ playDetailNote({freq:freqFromSemi(semi), label:k.label, desc:''}, el); };
    container.appendChild(el); detailKeyElements['s'+semi]=el;
  });`;
    src = src.replace(oldWkDetail, newWD);
    console.log(`${fname}: detail WHITE renderer patched`);
  } else {
    console.log(`${fname}: detail WHITE renderer NOT FOUND`);
  }

  // Replace detail BLACK_KEYS.forEach renderer
  const oldBkDetail = /BLACK_KEYS\.forEach\(k=>\{[\s\S]*?container\.appendChild\(el\);[^\n]*\n\s*\}\);/;
  if (oldBkDetail.test(src)) {
    const newBD = `BLACK_KEYS.forEach(k=>{
    const el=document.createElement('div');
    const semi=KEY_SEMI[k.name];
    el.className='bkey'+(k.deg?' used':'')+(k.isTonic?' tonic':'');
    el.style.left=((k.afterWhiteIdx+1)*WKEY_W - BKEY_W/2 - 3)+'px';
    el.innerHTML='<div class="lbl">'+k.label+'</div>'+(k.deg?'<div class="deg-badge"><span class="deg-chip'+(k.isTonic?' tonic-chip':'')+'">'+toFa(k.deg)+'</span></div>':'');
    el.onclick=(e)=>{ e.stopPropagation(); playDetailNote({freq:freqFromSemi(semi), label:k.label, desc:''}, el); };
    container.appendChild(el); detailKeyElements['s'+semi]=el;
  });`;
    src = src.replace(oldBkDetail, newBD);
    console.log(`${fname}: detail BLACK renderer patched`);
  } else {
    console.log(`${fname}: detail BLACK renderer NOT FOUND`);
  }

  // Validate JS
  const sm = src.match(/<script>([\s\S]*?)<\/script>/);
  if (sm) {
    try { new vm.Script(sm[1]); }
    catch(e) { console.error(`  JS ERROR: ${e.message}`); continue; }
  }

  const tmp = filePath + '.tmp_det';
  fs.writeFileSync(tmp, src, 'utf8');
  if (fs.readFileSync(tmp,'utf8') !== src) {
    console.error('Round-trip failed'); fs.unlinkSync(tmp); continue;
  }
  fs.renameSync(tmp, filePath);
  console.log(`✓ ${fname} saved\n`);
  ok++;
}
console.log(`Done: ${ok}/${files.length}`);

const fs=require('fs');
const c=fs.readFileSync('ajam.html','utf8');
console.log('has (D):', c.includes('(D)'));
const idx = c.indexOf('(D)');
if(idx>=0) console.log(JSON.stringify(c.substring(Math.max(0,idx-250), idx+80)));
console.log('has D4:', c.includes('D4'));
console.log('has NOTE_FREQ_D4:', c.includes('NOTE_FREQ_D4'));

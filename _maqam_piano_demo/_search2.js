const fs=require('fs');
const c=fs.readFileSync('ajam.html','utf8');
console.log('has 233.082:', c.includes('233.082'));
console.log('has freqFromOffset:', c.includes('freqFromOffset'));
const idx = c.indexOf('233.082');
if(idx>=0) console.log(JSON.stringify(c.substring(Math.max(0,idx-100), idx+100)));
else {
  const idx2 = c.indexOf('freqFromOffset');
  console.log(JSON.stringify(c.substring(Math.max(0,idx2-150), idx2+50)));
}

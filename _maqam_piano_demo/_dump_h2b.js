const fs=require('fs');
['nahawand.html','nikriz.html','segah.html','rast.html','ajam.html'].forEach(f=>{
  const c = fs.readFileSync(f, 'utf8');
  const idx = c.indexOf('شروع میشود');
  console.log('===', f, '===');
  if(idx<0){ console.log('NOT FOUND'); return; }
  console.log(JSON.stringify(c.substring(Math.max(0,idx-60), idx+20)));
});

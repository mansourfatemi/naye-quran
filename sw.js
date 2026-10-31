const CACHE='mt-mq-v20261031071953';

const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./avatar_manshawy.jpg','./avatar_mostafa_ismail.jpg','./avatar_hashemi.jpg','./avatar_shahhat_anwar.jpg','./creator.jpg'];

self.addEventListener('install',e=>{

  e.waitUntil(caches.open(CACHE).then(async c=>{

    await c.addAll(CORE);

  }));self.skipWaiting();

});

self.addEventListener('activate',e=>{

  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));

  self.clients.claim();

});

self.addEventListener('fetch',e=>{

  if(e.request.method!=='GET')return;

  if(e.request.url.includes('archive.org')||e.request.url.includes('.us.archive.org')){

    e.respondWith(caches.open('nq-offline-v1').then(async c=>{

      const hit=await c.match(e.request.url);

      if(hit){

        const rh=e.request.headers.get('range');

        if(!rh)return hit;

        const buf=await hit.arrayBuffer();const total=buf.byteLength;

        const m=/bytes=(\d+)-(\d*)/.exec(rh);

        const start=m?parseInt(m[1],10):0;

        const end=(m&&m[2])?Math.min(parseInt(m[2],10),total-1):total-1;

        if(start>=total)return new Response('',{status:416,headers:{'Content-Range':'bytes */'+total}});

        return new Response(buf.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Range':'bytes '+start+'-'+end+'/'+total,'Content-Length':String(end-start+1),'Accept-Ranges':'bytes'}});

      }

      try{

        const resp=await fetch(e.request);

        if(resp&&resp.status===200)c.put(e.request.url,resp.clone());

        return resp;

      }catch(err){return new Response('',{status:503});}

    }));

    return;

  }

  e.respondWith(caches.match(e.request).then(c=>{

    if(c)return c;

    return fetch(e.request).then(r=>{

      if(!r||r.status!==200)return r;

      caches.open(CACHE).then(ca=>ca.put(e.request,r.clone()));return r;

    }).catch(()=>c||new Response('Offline',{status:503}));

  }));

});
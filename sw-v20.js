const CACHE='ultimate-workshop-v23';
const CORE=['index.html','operations.html','style.css','pin.css','workshop.css','operations.css','quote-v12.css','upgrade-v14.css','progress-v16.css','desktop-v19.css','app.js','workshop.js','operations.js','pin.js','quote-v12.js','upgrade-v14.js','restore-v14.js','progress-v16.js','ops-progress-v16.js','quote-revision-v18.js','offline-v20.js','customer-notify-v20.js','notification-context-v21.js','monitor-v20.js','loyalty-guard-v22.js','repair-data-v23.js','device-layout-v19.js','logo.png','manifest.json'];
const scoped=p=>new URL(p,self.registration.scope).href;
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(CORE.map(p=>cache.add(scoped(p))));await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE&&key.startsWith('ultimate-workshop-'))await caches.delete(key);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{try{const fresh=await fetch(req);if(fresh.ok&&!url.search){const cache=await caches.open(CACHE);cache.put(scoped(url.pathname.split('/').pop()||'index.html'),fresh.clone())}return fresh}catch(_){const cache=await caches.open(CACHE);const name=url.pathname.split('/').pop()||'index.html';return(await cache.match(scoped(name)))||(await cache.match(scoped('index.html')))||new Response('Workshop is offline and this page is not cached yet.',{status:503,headers:{'Content-Type':'text/plain'}})}})());return;
  }
  event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(req,{ignoreSearch:true});const network=fetch(req).then(r=>{if(r.ok)cache.put(req,r.clone());return r}).catch(()=>null);return cached||(await network)||new Response('',{status:504})})());
});
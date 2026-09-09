const CACHE='ultimate-workshop-v25-6-approved';
const CORE=[
  'index.html','operations.html','approval.html','portal.html',
  'style.css','pin.css','workshop.css','operations.css','quote-v12.css','upgrade-v14.css','progress-v16.css','desktop-v19.css','styles/theme-v25.css','styles/visual-polish-v25.css','styles/home-v25.css','styles/home-banner-v25.css','styles/home-approved-v25-6.css',
  'app.js','workshop.js','operations.js','pin.js','quote-v12.js','upgrade-v14.js','restore-v14.js','progress-v16.js','ops-progress-v16.js',
  'quote-revision-v18.js','offline-v20.js','customer-notify-v20.js','notification-context-v21.js','monitor-v20.js','repair-data-v23.js','parts-catalog-v24.js','device-layout-v19.js',
  'src/core/config-v25.js','src/core/api-v25.js','src/core/auth-v25.js','src/core/features-v25.js','src/features/loyalty/guard-v25.js','src/features/home/home-v25.js',
  'assets/home-hero-v25.svg','logo.png','manifest.json'
];
const scoped=p=>new URL(p,self.registration.scope).href;
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await Promise.allSettled(CORE.map(p=>cache.add(scoped(p))));await self.skipWaiting()})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE&&key.startsWith('ultimate-workshop-'))await caches.delete(key);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  const req=event.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  const name=url.pathname.split('/').pop()||'index.html';
  if(req.mode==='navigate'){
    event.respondWith((async()=>{try{const fresh=await fetch(req,{cache:'no-store'});if(fresh.ok){const cache=await caches.open(CACHE);cache.put(scoped(name),fresh.clone())}return fresh}catch(_){const cache=await caches.open(CACHE);return(await cache.match(scoped(name)))||(await cache.match(scoped('index.html')))||new Response('Workshop is offline and this page is not cached yet.',{status:503,headers:{'Content-Type':'text/plain'}})}})());return;
  }
  const isCode=/\.(?:js|css|html|json|svg)$/i.test(url.pathname);
  if(isCode){
    event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const fresh=await fetch(req,{cache:'no-store'});if(fresh.ok)cache.put(req,fresh.clone());return fresh}catch(_){return(await cache.match(req,{ignoreSearch:true}))||new Response('',{status:504})}})());return;
  }
  event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(req,{ignoreSearch:true});if(cached)return cached;try{const fresh=await fetch(req);if(fresh.ok)cache.put(req,fresh.clone());return fresh}catch(_){return new Response('',{status:504})}})());
});

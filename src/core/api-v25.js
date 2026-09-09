(()=>{
  const cfg=window.WorkshopConfig;
  if(!cfg)throw new Error('WorkshopConfig must load before WorkshopAPI');

  const nativeFetch=window.fetch.bind(window);
  const token=()=>localStorage.getItem(cfg.storage.token)||'';
  const profile=()=>{try{return JSON.parse(localStorage.getItem(cfg.storage.profile)||'null')}catch(_){return null}};
  const setProfile=user=>{window.workshopUser=user||null;if(user)localStorage.setItem(cfg.storage.profile,JSON.stringify(user));else localStorage.removeItem(cfg.storage.profile);document.dispatchEvent(new CustomEvent('workshop-user-ready',{detail:user||null}))};
  const clearSession=()=>{localStorage.removeItem(cfg.storage.token);setProfile(null)};

  function legacyRoute(url){
    if(!url.startsWith(cfg.supabase.base)||url.startsWith(cfg.supabase.gateway))return url;
    const fn=url.slice(cfg.supabase.base.length).split(/[?#]/)[0];
    const service=cfg.legacyServiceMap[fn];
    return service?cfg.gatewayUrl(service):url;
  }

  function cacheKey(sourceName,action){return cfg.offlineBootstrapCache[`${sourceName}:${action}`]||''}
  function cachedResponse(key){try{const body=localStorage.getItem(key);if(!body)return null;return new Response(body,{status:200,headers:{'Content-Type':'application/json','X-Workshop-Offline':'1'}})}catch(_){return null}}
  async function saveCache(key,response){if(!key||!response.ok)return;try{const text=await response.clone().text();JSON.parse(text);localStorage.setItem(key,text);localStorage.setItem(`${key}:at`,new Date().toISOString())}catch(_){}}

  async function request(service,action,payload={},options={}){
    const headers=new Headers(options.headers||{});headers.set('Content-Type','application/json');
    if(options.auth!==false){const t=token();if(t)headers.set('x-workshop-token',t)}
    const response=await nativeFetch(cfg.gatewayUrl(service),{method:'POST',headers,body:JSON.stringify({action,...payload}),cache:options.cache||'no-store'});
    const data=await response.json().catch(()=>({}));
    if(response.status===401&&options.auth!==false){clearSession();document.dispatchEvent(new CustomEvent('workshop:session-expired'))}
    if(!response.ok)throw new Error(data.error||`Workshop request failed (${response.status})`);
    return data;
  }

  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!url.startsWith(cfg.supabase.base))return nativeFetch(input,init);

    const routedUrl=legacyRoute(url);
    const headers=new Headers(init.headers||(input instanceof Request?input.headers:undefined));
    let action='',sourceName='';
    try{if(typeof init.body==='string')action=JSON.parse(init.body)?.action||''}catch(_){}
    sourceName=url.slice(cfg.supabase.base.length).split(/[?#]/)[0];
    const key=cacheKey(sourceName,action);
    const isLogin=routedUrl===cfg.gatewayUrl('auth')&&action==='login';
    const t=token();if(t&&!isLogin)headers.set('x-workshop-token',t);

    try{
      const response=await nativeFetch(routedUrl,{...init,headers});
      if(response.status===401&&!isLogin&&navigator.onLine!==false){clearSession();document.dispatchEvent(new CustomEvent('workshop:session-expired'))}
      if(response.ok&&key)saveCache(key,response);
      return response;
    }catch(error){
      const cached=key?cachedResponse(key):null;
      if(cached){document.dispatchEvent(new CustomEvent('workshop-offline-cache',{detail:{key,action}}));return cached}
      throw error;
    }
  };

  window.WorkshopAPI=Object.freeze({request,nativeFetch,token,profile,setProfile,clearSession,legacyRoute});
  window.workshopUser=profile();
})();

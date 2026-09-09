(()=>{
  const BASE="https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/";
  const GATEWAY=BASE+"workshop-gateway";
  const AUTH=GATEWAY+"?service=auth";
  const TOKEN_KEY="workshopPinSession";
  const PROFILE_KEY="workshopStaffProfile";
  const MAIN_CACHE="workshopOfflineCacheMainV20";
  const PRO_CACHE="workshopOfflineCacheProV20";
  const nativeFetch=window.fetch.bind(window);
  const SERVICE_MAP={
    "workshop-auth":"auth",
    "workshop-admin":"admin",
    "workshop-pro":"pro",
    "workshop-inspections":"inspections",
    "workshop-restore":"restore",
    "workshop-customer":"customer",
    "workshop-quotes":"quotes",
    "workshop-sync":"sync",
    "workshop-notify":"notify",
    "workshop-monitor":"monitor"
  };

  function gate(){return document.getElementById("pinGate")}
  function messageEl(){return document.getElementById("pinMessage")}
  function token(){return localStorage.getItem(TOKEN_KEY)||""}
  function setProfile(user){window.workshopUser=user||null;if(user)localStorage.setItem(PROFILE_KEY,JSON.stringify(user));else localStorage.removeItem(PROFILE_KEY);document.dispatchEvent(new CustomEvent("workshop-user-ready",{detail:user||null}))}
  function getProfile(){try{return JSON.parse(localStorage.getItem(PROFILE_KEY)||"null")}catch(_){return null}}
  function routeWorkshopUrl(url){
    if(!url.startsWith(BASE)||url.startsWith(GATEWAY))return url;
    const functionName=url.slice(BASE.length).split(/[?#]/)[0];
    const service=SERVICE_MAP[functionName];
    return service?`${GATEWAY}?service=${service}`:url;
  }
  function cacheKey(sourceName,action){if(sourceName==="workshop-inspections"&&action==="workshop_bootstrap")return MAIN_CACHE;if(sourceName==="workshop-pro"&&action==="bootstrap")return PRO_CACHE;return""}
  function cachedResponse(key){try{const body=localStorage.getItem(key);if(!body)return null;return new Response(body,{status:200,headers:{"Content-Type":"application/json","X-Workshop-Offline":"1"}})}catch(_){return null}}
  async function saveCache(key,response){if(!key||!response.ok)return;try{const text=await response.clone().text();JSON.parse(text);localStorage.setItem(key,text);localStorage.setItem(`${key}:at`,new Date().toISOString())}catch(_){}}
  window.workshopUser=getProfile();

  function ensureUserSelect(){
    if(document.getElementById("staffUser")||!document.getElementById("pinInput"))return;
    const input=document.getElementById("pinInput");
    const label=document.createElement("label");label.className="pin-user-label";label.innerHTML='<span>Technician</span><select id="staffUser" class="pin-user-select"><option value="josh">Josh · Admin</option><option value="will">Will · Technician</option></select>';
    input.parentNode.insertBefore(label,input);
    const saved=getProfile();if(saved?.display_name==="Will")document.getElementById("staffUser").value="will";
    const h=gate()?.querySelector("h1");if(h)h.textContent="Workshop sign in";
    const copy=gate()?.querySelector(".pin-copy");if(copy)copy.textContent="Choose your name and enter your personal workshop PIN.";
  }
  function showGate(message=""){ensureUserSelect();const g=gate();if(g)g.classList.remove("hidden");const m=messageEl();if(m){m.textContent=message;m.classList.remove("ok")}setTimeout(()=>document.getElementById("pinInput")?.focus(),80)}
  function hideGate(){const g=gate();if(g)g.classList.add("hidden")}
  function clearSession(){localStorage.removeItem(TOKEN_KEY);setProfile(null)}

  window.fetch=async function(input,init={}){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    if(url.startsWith(BASE)){
      const routedUrl=routeWorkshopUrl(url);
      const headers=new Headers(init.headers||(input instanceof Request?input.headers:undefined));
      let action="",sourceName="";
      try{if(typeof init.body==="string")action=JSON.parse(init.body)?.action||""}catch(_){}
      if(url.startsWith(BASE))sourceName=url.slice(BASE.length).split(/[?#]/)[0];
      const key=cacheKey(sourceName,action);
      const isLogin=routedUrl===AUTH&&action==="login";
      const t=token();if(t&&!isLogin)headers.set("x-workshop-token",t);
      try{
        const response=await nativeFetch(routedUrl,{...init,headers});
        if(response.status===401&&!isLogin&&navigator.onLine!==false){clearSession();showGate("Your workshop session has expired.")}
        if(response.ok&&key)saveCache(key,response);
        return response;
      }catch(error){
        const cached=key?cachedResponse(key):null;
        if(cached){document.dispatchEvent(new CustomEvent("workshop-offline-cache",{detail:{key,action}}));return cached}
        throw error;
      }
    }
    return nativeFetch(input,init);
  };

  async function validateToken(){
    ensureUserSelect();const t=token(),saved=getProfile();if(!t){showGate();return}
    if(navigator.onLine===false&&saved){setProfile(saved);hideGate();document.documentElement.dataset.offlineAuth="1";return}
    try{
      const r=await nativeFetch(AUTH,{method:"POST",headers:{"Content-Type":"application/json","x-workshop-token":t},body:JSON.stringify({action:"session"}),cache:"no-store"});
      const data=await r.json().catch(()=>({}));
      if(r.ok&&data.user){delete document.documentElement.dataset.offlineAuth;setProfile(data.user);hideGate();return}
      if(r.status===401){clearSession();showGate("Please sign in to the workshop.");return}
    }catch(_){if(saved){setProfile(saved);hideGate();document.documentElement.dataset.offlineAuth="1";return}}
    if(saved){setProfile(saved);hideGate();document.documentElement.dataset.offlineAuth="1";return}
    showGate("Connect to the internet once to sign in on this device.")
  }

  async function submitPin(){
    const input=document.getElementById("pinInput"),button=document.getElementById("pinSubmit"),m=messageEl();
    const username=document.getElementById("staffUser")?.value||"josh",pin=(input?.value||"").trim();
    if(!/^\d{4,8}$/.test(pin)){if(m)m.textContent="Enter your 4–8 digit PIN.";return}
    if(navigator.onLine===false){if(m)m.textContent="Internet connection is needed for the first sign-in.";return}
    if(button){button.disabled=true;button.textContent="Signing in…"}if(m)m.textContent="";
    try{
      const r=await nativeFetch(AUTH,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username,pin})});const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.token)throw new Error(data.error||"Incorrect name or PIN");
      localStorage.setItem(TOKEN_KEY,data.token);setProfile(data.user);
      if(m){m.textContent=`Signed in as ${data.user.display_name}`;m.classList.add("ok")};hideGate();setTimeout(()=>location.reload(),160);
    }catch(e){if(m)m.textContent=e.message||"Incorrect name or PIN";if(input){input.value="";input.focus()}}
    finally{if(button){button.disabled=false;button.textContent="Sign in"}}
  }

  async function lock(){const t=token();if(t&&navigator.onLine!==false){try{await nativeFetch(AUTH,{method:"POST",headers:{"Content-Type":"application/json","x-workshop-token":t},body:JSON.stringify({action:"logout"})})}catch(_){}}clearSession();showGate("Workshop locked.")}

  document.addEventListener("DOMContentLoaded",()=>{
    ensureUserSelect();const b=document.getElementById("pinSubmit");if(b)b.textContent="Sign in";
    b?.addEventListener("click",submitPin);document.getElementById("pinInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")submitPin()});document.getElementById("lockBtn")?.addEventListener("click",lock);validateToken();
  });
  window.addEventListener('online',()=>validateToken());
})();

(()=>{
  const scripts=[
    ['progress-v16.js?v=22','progressV16'],
    ['quote-revision-v18.js?v=22','quoteRevisionV18'],
    ['offline-v20.js?v=22','offlineV20'],
    ['customer-notify-v20.js?v=22','notifyV20'],
    ['notification-context-v21.js?v=22','notifyContextV21'],
    ['monitor-v20.js?v=22','monitorV20'],
    ['loyalty-guard-v22.js?v=22','loyaltyGuardV22']
  ];
  scripts.forEach(([src,key])=>{if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.dataset[key]='1';document.head.appendChild(s)});
})();

(()=>{
  if(!document.querySelector('link[data-desktop-v19]')){
    const l=document.createElement('link');l.rel='stylesheet';l.href='desktop-v19.css?v=22';l.dataset.desktopV19='1';document.head.appendChild(l);
  }
  if(!document.querySelector('script[data-device-layout-v19]')){
    const s=document.createElement('script');s.src='device-layout-v19.js?v=22';s.dataset.deviceLayoutV19='1';document.head.appendChild(s);
  }
})();
(()=>{
  const cfg=window.WorkshopConfig,api=window.WorkshopAPI;
  if(!cfg||!api)throw new Error('Workshop core must load before auth');

  const $=id=>document.getElementById(id);
  function gate(){return $('pinGate')}
  function messageEl(){return $('pinMessage')}
  function getProfile(){return api.profile()}
  function setProfile(user){api.setProfile(user)}

  function ensureUserSelect(){
    if($('staffUser')||!$('pinInput'))return;
    const input=$('pinInput');
    const label=document.createElement('label');
    label.className='pin-user-label';
    label.innerHTML='<span>Technician</span><select id="staffUser" class="pin-user-select"><option value="josh">Josh · Admin</option><option value="will">Will · Technician</option></select>';
    input.parentNode.insertBefore(label,input);
    const saved=getProfile();if(saved?.display_name==='Will')$('staffUser').value='will';
    const h=gate()?.querySelector('h1');if(h)h.textContent='Workshop sign in';
    const copy=gate()?.querySelector('.pin-copy');if(copy)copy.textContent='Choose your name and enter your personal workshop PIN.';
  }

  function showGate(message=''){
    ensureUserSelect();gate()?.classList.remove('hidden');
    const m=messageEl();if(m){m.textContent=message;m.classList.remove('ok')}
    setTimeout(()=>$('pinInput')?.focus(),80);
  }
  function hideGate(){gate()?.classList.add('hidden')}

  async function validateToken(){
    ensureUserSelect();const saved=getProfile();
    if(!api.token()){showGate();return}
    if(navigator.onLine===false&&saved){setProfile(saved);hideGate();document.documentElement.dataset.offlineAuth='1';return}
    try{
      const data=await api.request('auth','session',{}, {cache:'no-store'});
      if(data.user){delete document.documentElement.dataset.offlineAuth;setProfile(data.user);hideGate();return}
    }catch(_){
      if(navigator.onLine!==false&&!api.token()){showGate('Please sign in to the workshop.');return}
      if(saved){setProfile(saved);hideGate();document.documentElement.dataset.offlineAuth='1';return}
    }
    if(saved){setProfile(saved);hideGate();document.documentElement.dataset.offlineAuth='1';return}
    showGate('Connect to the internet once to sign in on this device.');
  }

  async function submitPin(){
    const input=$('pinInput'),button=$('pinSubmit'),m=messageEl();
    const username=$('staffUser')?.value||'josh',pin=(input?.value||'').trim();
    if(!/^\d{4,8}$/.test(pin)){if(m)m.textContent='Enter your 4–8 digit PIN.';return}
    if(navigator.onLine===false){if(m)m.textContent='Internet connection is needed for the first sign-in.';return}
    if(button){button.disabled=true;button.textContent='Signing in…'}if(m)m.textContent='';
    try{
      const data=await api.request('auth','login',{username,pin},{auth:false});
      if(!data.token)throw new Error('Incorrect name or PIN');
      localStorage.setItem(cfg.storage.token,data.token);setProfile(data.user);
      if(m){m.textContent=`Signed in as ${data.user.display_name}`;m.classList.add('ok')}
      hideGate();setTimeout(()=>location.reload(),160);
    }catch(e){if(m)m.textContent=e.message||'Incorrect name or PIN';if(input){input.value='';input.focus()}}
    finally{if(button){button.disabled=false;button.textContent='Sign in'}}
  }

  async function lock(){
    if(api.token()&&navigator.onLine!==false){try{await api.request('auth','logout')}catch(_){}}
    api.clearSession();showGate('Workshop locked.');
  }

  function init(){
    ensureUserSelect();const b=$('pinSubmit');if(b)b.textContent='Sign in';
    b?.addEventListener('click',submitPin);$('pinInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')submitPin()});$('lockBtn')?.addEventListener('click',lock);
    validateToken();
  }

  document.addEventListener('workshop:session-expired',()=>showGate('Your workshop session has expired.'));
  window.addEventListener('online',()=>validateToken());
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.WorkshopAuth=Object.freeze({validateToken,lock,showGate,hideGate});
})();

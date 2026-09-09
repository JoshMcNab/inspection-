(()=>{
  const ENDPOINT="https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-inspections";
  const TOKEN_KEY="workshopPinSession";
  const nativeFetch=window.fetch.bind(window);

  function gate(){return document.getElementById("pinGate")}
  function messageEl(){return document.getElementById("pinMessage")}
  function showGate(message=""){
    const g=gate();if(g)g.classList.remove("hidden");
    const m=messageEl();if(m){m.textContent=message;m.classList.remove("ok")}
    setTimeout(()=>document.getElementById("pinInput")?.focus(),80);
  }
  function hideGate(){const g=gate();if(g)g.classList.add("hidden")}
  function token(){return localStorage.getItem(TOKEN_KEY)||""}

  window.fetch=async function(input,init={}){
    const url=typeof input==="string"?input:(input&&input.url)||"";
    if(url.startsWith(ENDPOINT)){
      const headers=new Headers(init.headers||(input instanceof Request?input.headers:undefined));
      let isLogin=false;
      try{if(typeof init.body==="string")isLogin=JSON.parse(init.body)?.action==="login"}catch(e){}
      const t=token();if(t&&!isLogin)headers.set("x-workshop-token",t);
      const response=await nativeFetch(input,{...init,headers});
      if(response.status===401&&!isLogin){localStorage.removeItem(TOKEN_KEY);showGate("Workshop PIN required.")}
      return response;
    }
    return nativeFetch(input,init);
  };

  async function validateToken(){
    const t=token();
    if(!t){showGate();return}
    try{
      const r=await nativeFetch(ENDPOINT,{method:"GET",headers:{"x-workshop-token":t},cache:"no-store"});
      if(r.ok){hideGate();return}
    }catch(e){}
    localStorage.removeItem(TOKEN_KEY);showGate("Please enter the workshop PIN.")
  }

  async function submitPin(){
    const input=document.getElementById("pinInput");
    const button=document.getElementById("pinSubmit");
    const m=messageEl();
    const pin=(input?.value||"").trim();
    if(!/^\d{4,8}$/.test(pin)){if(m)m.textContent="Enter the 4–8 digit workshop PIN.";return}
    if(button){button.disabled=true;button.textContent="Checking…"}
    if(m)m.textContent="";
    try{
      const r=await nativeFetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",pin})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||!data.token)throw new Error(data.error||"Incorrect PIN");
      localStorage.setItem(TOKEN_KEY,data.token);
      if(m){m.textContent="Unlocked";m.classList.add("ok")}
      hideGate();
      setTimeout(()=>location.reload(),180);
    }catch(e){if(m)m.textContent=e.message||"Incorrect PIN";if(input){input.value="";input.focus()}}
    finally{if(button){button.disabled=false;button.textContent="Unlock Workshop"}}
  }

  document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("pinSubmit")?.addEventListener("click",submitPin);
    document.getElementById("pinInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")submitPin()});
    document.getElementById("lockBtn")?.addEventListener("click",()=>{localStorage.removeItem(TOKEN_KEY);showGate("Workshop locked.")});
    validateToken();
  });
})();
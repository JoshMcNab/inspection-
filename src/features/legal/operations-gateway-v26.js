(()=>{
  if(window.__UAW_OPERATIONS_GATEWAY_V26__)return;
  window.__UAW_OPERATIONS_GATEWAY_V26__=true;
  const DIRECT='https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-pro';
  const GATEWAY='https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-gateway?service=pro';
  const nativeFetch=window.fetch.bind(window);

  function hardenPayload(body){
    if(typeof body!=='string')return body;
    try{
      const data=JSON.parse(body);
      if(data?.package&&typeof data.package==='object')data.package.vat_rate=0;
      if(data?.invoice&&typeof data.invoice==='object')data.invoice.vat_rate=0;
      return JSON.stringify(data);
    }catch(_){return body}
  }

  window.fetch=function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(url!==DIRECT)return nativeFetch(input,init);
    const next={...(init||{}),body:hardenPayload(init?.body)};
    return nativeFetch(GATEWAY,next);
  };

  function enforceDisplay(){
    for(const id of ['invVat','pkgVat']){
      const el=document.getElementById(id);
      if(!el)continue;
      el.value='0';el.readOnly=true;el.min='0';el.max='0';el.title='Ultimate Automotive Works LTD is not VAT registered. VAT is not charged.';
    }
    document.querySelectorAll('.ops-total span').forEach(el=>{
      if(el.textContent==='Sales ex VAT')el.textContent='Sales';
      if(el.textContent==='VAT')el.textContent='VAT (not charged)';
    });
  }
  new MutationObserver(enforceDisplay).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enforceDisplay);else enforceDisplay();
})();

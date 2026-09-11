(()=>{
  if(window.__UAW_PORTAL_NON_VAT_V26__)return;
  window.__UAW_PORTAL_NON_VAT_V26__=true;
  function refresh(){
    document.querySelectorAll('#portalContent small').forEach(el=>{
      if(el.textContent.includes(' including VAT'))el.textContent=el.textContent.replace(' including VAT',' · VAT not charged');
    });
  }
  const root=document.getElementById('portalContent')||document.documentElement;
  new MutationObserver(refresh).observe(root,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
})();

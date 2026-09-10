(()=>{
  if(window.__UAW_NON_VAT_V26__)return;
  window.__UAW_NON_VAT_V26__=true;
  const IDS=new Set(['vatRate','invVat','pkgVat']);
  const NOTE='Ultimate Automotive Works LTD is not VAT registered. VAT is not charged.';
  let syncing=false;

  function addNote(el){
    const key=`uaw-non-vat-${el.id}`;
    if(document.getElementById(key))return;
    const note=document.createElement('small');
    note.id=key;note.dataset.uawNonVat='1';note.textContent=NOTE;
    note.style.cssText='display:block;margin-top:6px;color:#fca5a5;font-size:10px;line-height:1.4;font-weight:700';
    el.setAttribute('aria-describedby',key);
    el.insertAdjacentElement('afterend',note);
  }
  function enforce(el){
    if(!el||!IDS.has(el.id))return false;
    let changed=false;
    if(String(el.value)!=='0'){el.value='0';changed=true}
    el.readOnly=true;el.min='0';el.max='0';el.step='0.01';el.title=NOTE;
    addNote(el);
    return changed;
  }
  function refresh(){
    if(syncing)return;syncing=true;
    let quoteChanged=false,invoiceChanged=false;
    for(const id of IDS){const el=document.getElementById(id);if(!el)continue;const changed=enforce(el);if(id==='vatRate'&&changed)quoteChanged=true;if(id==='invVat'&&changed)invoiceChanged=true}
    syncing=false;
    if(quoteChanged&&typeof window.renderQuoteTotals==='function')setTimeout(()=>window.renderQuoteTotals(),0);
    if(invoiceChanged&&typeof window.renderInvoiceTotalsOnly==='function')setTimeout(()=>window.renderInvoiceTotalsOnly(),0);
  }
  document.addEventListener('input',event=>{const el=event.target;if(el&&IDS.has(el.id)){enforce(el);refresh()}},true);
  document.addEventListener('change',event=>{const el=event.target;if(el&&IDS.has(el.id)){enforce(el);refresh()}},true);
  const observer=new MutationObserver(refresh);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('workshop:features-ready',refresh);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
})();
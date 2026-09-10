(()=>{
  if(window.__UAW_PORTAL_QUOTE_REQUEST_V26__)return;
  window.__UAW_PORTAL_QUOTE_REQUEST_V26__=true;
  const token=new URLSearchParams(location.search).get('t')||'';
  const host=document.getElementById('portalContent');
  if(!host||token.length<32)return;
  function ensureStyle(){if(document.getElementById('portalQuoteRequestV26Style'))return;const s=document.createElement('style');s.id='portalQuoteRequestV26Style';s.textContent='.portal-request-quote{margin:0 0 14px;padding:15px;border:1px solid #4a2830;border-radius:16px;background:linear-gradient(135deg,#171019,#111722)}.portal-request-quote p{margin:4px 0 12px;color:#9fb0c7;font-size:12px;line-height:1.45}.portal-request-quote a{display:flex;align-items:center;justify-content:space-between;min-height:50px;padding:0 14px;border-radius:12px;background:linear-gradient(135deg,#ef2b2d,#c5161e);color:#fff;text-decoration:none;font-weight:900}.portal-request-quote a span{font-size:26px;font-weight:300}';document.head.appendChild(s)}
  function add(){if(document.getElementById('portalRequestQuoteV26'))return;ensureStyle();const box=document.createElement('div');box.id='portalRequestQuoteV26';box.className='portal-request-quote';box.innerHTML=`<b>Need a quote for more work?</b><p>Send the workshop a new quote request using the vehicle details already linked to your portal.</p><a href="request-quote.html?t=${encodeURIComponent(token)}">Request another quote <span>›</span></a>`;host.prepend(box)}
  new MutationObserver(()=>setTimeout(add,30)).observe(host,{childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(add,250));else setTimeout(add,250);
})();

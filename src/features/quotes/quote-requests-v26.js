(()=>{
  if(window.__UAW_QUOTE_REQUESTS_V26__)return;
  window.__UAW_QUOTE_REQUESTS_V26__=true;
  const cfg=window.WorkshopConfig;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const fmt=v=>v?new Date(v).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
  const PUBLIC_LINK='https://app.ultimateautomotiveworks.com/request-quote.html';
  let filter='';

  function ensureStyle(){
    if(document.querySelector('link[data-uaw-quote-requests]'))return;
    const l=document.createElement('link');l.rel='stylesheet';l.href=`styles/quote-requests-v26.css?v=${encodeURIComponent(cfg?.assetVersion||'26.7')}`;l.dataset.uawQuoteRequests='1';document.head.appendChild(l);
  }
  async function api(action,payload={}){return window.WorkshopAPI.request('quote_requests',action,payload)}
  function setActive(){document.querySelectorAll('#opsNav button').forEach(b=>b.classList.toggle('active',b.dataset.tool==='quote-requests'))}
  function setUrl(){const u=new URL(location.href);u.searchParams.set('tool','quote-requests');history.replaceState(null,'',u)}
  function normaliseWhatsApp(phone){let d=String(phone||'').replace(/\D/g,'');if(d.startsWith('0'))d='44'+d.slice(1);return d}
  function addressText(r){return [r.address,r.town_city,r.postcode].filter(Boolean).join(', ')}

  function injectNav(){
    const nav=$('opsNav');if(!nav||nav.querySelector('[data-tool="quote-requests"]'))return;
    const b=document.createElement('button');b.type='button';b.dataset.tool='quote-requests';b.className='quote-request-nav';b.innerHTML='<span>💬</span><b>Quote Requests</b>';b.onclick=()=>window.showTool('quote-requests');
    const portal=nav.querySelector('[data-tool="portal"]');if(portal)portal.insertAdjacentElement('beforebegin',b);else nav.appendChild(b);
  }
  async function refreshBadge(){
    try{const d=await api('list',{status:'new'});const count=(d.requests||[]).length;const b=document.querySelector('#opsNav [data-tool="quote-requests"]');if(b){b.classList.toggle('has-new',count>0);b.dataset.count=count>99?'99+':String(count)}}catch(_){ }
  }

  function contactLinks(r){
    const out=[];
    if(r.phone){out.push(`<a href="tel:${esc(r.phone)}">☎ Call</a>`);const wa=normaliseWhatsApp(r.phone);if(wa)out.push(`<a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>`)}
    if(r.email)out.push(`<a href="mailto:${esc(r.email)}?subject=${encodeURIComponent('Your quote request · Ultimate Automotive Works LTD')}">✉ Email</a>`);
    return out.join('');
  }
  function photos(r){
    const list=Array.isArray(r.uploads)?r.uploads.filter(x=>x.signed_url):[];if(!list.length)return'';
    return `<div class="qr-photos">${list.map((x,i)=>`<a href="${esc(x.signed_url)}" target="_blank" rel="noopener"><img src="${esc(x.signed_url)}" alt="Quote request photo ${i+1}" loading="lazy"></a>`).join('')}</div>`;
  }
  function requestCard(r){
    const ref=`QR-${String(r.id||'').slice(0,8).toUpperCase()}`;
    const converted=r.status==='converted'||r.job_id;
    const address=addressText(r)||'—';
    const privacy=r.privacy_acknowledged?`Acknowledged${r.privacy_version?` · ${r.privacy_version}`:''}`:'Legacy / not recorded';
    const marketing=r.marketing_opt_in?'Opted in':'No marketing opt-in';
    return `<article class="qr-request ${r.status==='new'?'is-new':''}" data-id="${esc(r.id)}">
      <div class="qr-request-head"><div><p class="qr-reference">${esc(ref)} · ${esc(r.request_type||'General quote')}</p><h3>${esc(r.registration||'Vehicle')} · ${esc(r.make_model||'Vehicle details not supplied')}</h3><p>${esc(r.customer_name||'Customer')} · ${esc(r.source==='portal'?'Customer portal':'Public request')}</p></div><span class="qr-time">${fmt(r.created_at)}</span></div>
      <div class="qr-request-body">
        <div class="qr-meta"><div><span>Customer</span><b>${esc(r.customer_name||'—')}</b></div><div><span>Preferred contact</span><b>${esc(r.preferred_contact||'—')}</b></div><div><span>Phone</span><b>${esc(r.phone||'—')}</b></div><div><span>Email</span><b>${esc(r.email||'—')}</b></div><div class="qr-address"><span>Address</span><b>${esc(address)}</b></div><div><span>Vehicle</span><b>${esc([r.make_model,r.year].filter(Boolean).join(' · ')||'—')}</b></div><div><span>Mileage</span><b>${r.mileage?`${Number(r.mileage).toLocaleString()} miles`:'—'}</b></div><div><span>Privacy record</span><b>${esc(privacy)}</b></div><div><span>Marketing</span><b>${esc(marketing)}</b></div></div>
        <div class="qr-description">${esc(r.description||'')}</div>
        <div class="qr-contact-actions">${contactLinks(r)}</div>
        ${photos(r)}
        <div class="qr-controls"><select id="qr-status-${esc(r.id)}">${['new','reviewing','quoted','converted','closed','spam'].map(s=>`<option value="${s}" ${s===r.status?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select><textarea id="qr-notes-${esc(r.id)}" placeholder="Private workshop notes…">${esc(r.staff_notes||'')}</textarea></div>
        <div class="qr-actions"><button onclick="saveQuoteRequest('${esc(r.id)}')">Save</button><button class="convert" onclick="convertQuoteRequest('${esc(r.id)}')" ${converted?'disabled':''}>${converted?'Converted':'Create job & draft quote'}</button></div>
        ${converted?`<div class="qr-converted">✓ Added to workshop${r.job_id?' as a job':''}. Open Job Cards & Quotes from the main app to price and send the quote.</div>`:''}
      </div>
    </article>`;
  }

  async function render(){
    ensureStyle();injectNav();setActive();setUrl();
    const view=$('opsView');if(!view)return;
    view.innerHTML='<div class="screen-title"><p class="eyebrow">WORKSHOP PRO</p><h1>Quote Requests</h1><p class="muted">Customer quote requests from your public link and customer portal.</p></div><div class="ops-card"><div class="qr-toolbar"><button class="primary-share" id="qrShareLink">Share quote request link</button><button id="qrCopyLink">Copy link</button><select id="qrFilter"><option value="">All requests</option><option value="new">New</option><option value="reviewing">Reviewing</option><option value="quoted">Quoted</option><option value="converted">Converted</option><option value="closed">Closed</option><option value="spam">Spam</option></select></div><p class="ops-note">Public link: <b>app.ultimateautomotiveworks.com/request-quote.html</b></p></div><div id="quoteRequestList" class="qr-request-list"><div class="ops-loading">Loading quote requests…</div></div>';
    $('qrFilter').value=filter;$('qrFilter').onchange=e=>{filter=e.target.value;loadList()};$('qrCopyLink').onclick=()=>copyLink();$('qrShareLink').onclick=()=>shareLink();
    await loadList();
  }
  async function loadList(){
    const list=$('quoteRequestList');if(!list)return;list.innerHTML='<div class="ops-loading">Loading quote requests…</div>';
    try{const d=await api('list',filter?{status:filter}:{}),rows=d.requests||[];list.innerHTML=rows.length?rows.map(requestCard).join(''):'<div class="qr-empty">No quote requests in this view.</div>';refreshBadge()}catch(e){list.innerHTML=`<div class="qr-empty">${esc(e.message||'Unable to load quote requests.')}</div>`}
  }
  async function save(id){
    try{await api('update',{id,status:$(`qr-status-${id}`)?.value,staff_notes:$(`qr-notes-${id}`)?.value||''});await loadList()}catch(e){alert(e.message)}
  }
  async function convert(id){
    if(!confirm('Create a workshop job and draft quote from this request?'))return;
    try{const result=await api('convert',{id});alert(`Created Job #${result.job?.job_number||''}. You can now price it in Job Cards & Quotes.`);await loadList()}catch(e){alert(e.message)}
  }
  async function copyLink(){try{await navigator.clipboard.writeText(PUBLIC_LINK);alert('Quote request link copied.')}catch(_){prompt('Copy this quote request link:',PUBLIC_LINK)}}
  async function shareLink(){if(navigator.share){try{await navigator.share({title:'Request a Quote · Ultimate Automotive Works LTD',text:'Request a quote from Ultimate Automotive Works LTD',url:PUBLIC_LINK});return}catch(_){}}copyLink()}

  window.saveQuoteRequest=save;window.convertQuoteRequest=convert;
  function install(){
    ensureStyle();injectNav();
    const original=window.showTool;if(!original||original.__uawQuoteRequestsWrapped)return setTimeout(install,80);
    function wrapped(name){if(name==='quote-requests')return render();return original(name)}wrapped.__uawQuoteRequestsWrapped=true;window.showTool=wrapped;
    if(new URLSearchParams(location.search).get('tool')==='quote-requests')setTimeout(render,50);refreshBadge();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();

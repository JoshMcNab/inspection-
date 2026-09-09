(()=>{
  if(window.__UAW_LOYALTY_GUARD_V25__)return;
  window.__UAW_LOYALTY_GUARD_V25__=true;

  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const money=n=>`£${Number(n||0).toFixed(2)}`;
  let installed=false,currentCustomer='',rendering=false,renderTimer=0;

  function profile(){return window.WorkshopAPI?.profile?.()||window.workshopUser||null}
  async function api(action,payload={}){
    if(window.WorkshopAPI?.request)return window.WorkshopAPI.request('admin',action,payload);
    const r=await fetch('https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-gateway?service=admin',{method:'POST',headers:{'Content-Type':'application/json','x-workshop-token':localStorage.getItem('workshopPinSession')||''},body:JSON.stringify({action,...payload})});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Rewards request failed');return d;
  }

  function ensureStyle(){
    if($('loyaltyGuardStyleV25'))return;
    const s=document.createElement('style');s.id='loyaltyGuardStyleV25';
    s.textContent=`
      .loyalty-guard-card{border:1px solid var(--uaw-border-strong,#334155)!important}
      .loyalty-guard-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .loyalty-guard-rule{padding:12px;border:1px solid var(--uaw-border,#273244);border-radius:12px;background:#0c131d;min-width:0}
      .loyalty-guard-rule b{display:block;color:#fff;line-height:1.25;margin-bottom:4px}
      .loyalty-guard-rule span{display:block;color:#94a3b8;font-size:12px;line-height:1.4}
      .reward-modal-v25{position:fixed;inset:0;z-index:10070;background:#000c;display:flex;align-items:center;justify-content:center;padding:16px}
      .reward-modal-v25.hidden{display:none}.reward-card-v25{width:min(620px,100%);background:#0d141f;border:1px solid #334155;border-radius:22px;padding:18px;max-height:90vh;overflow:auto}
      .reward-head-v25{display:flex;justify-content:space-between;gap:12px;align-items:start}.reward-head-v25 h2{margin:3px 0}.reward-close-v25{border:0;background:#151c27;color:#fff;border-radius:10px;padding:8px 11px;font-weight:900}
      .reward-choice-v25{display:block;width:100%;text-align:left;border:1px solid #334155;background:#101722;color:#fff;border-radius:14px;padding:13px;margin:8px 0}.reward-choice-v25 b,.reward-choice-v25 span,.reward-choice-v25 small{display:block}.reward-choice-v25 span,.reward-choice-v25 small{color:#94a3b8;margin-top:3px}
      @media(max-width:560px){.loyalty-guard-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(s);
  }

  function ensureModal(){
    ensureStyle();if($('rewardModalV25'))return;
    const m=document.createElement('div');m.id='rewardModalV25';m.className='reward-modal-v25 hidden';
    m.innerHTML='<div class="reward-card-v25"><div class="reward-head-v25"><div><p class="eyebrow">ULTIMATE REWARDS</p><h2>Apply customer reward</h2></div><button class="reward-close-v25" type="button" onclick="closeRewardModalV25()">Close</button></div><div id="rewardBodyV25"></div></div>';
    document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)window.closeRewardModalV25()});
  }
  window.closeRewardModalV25=()=>$('rewardModalV25')?.classList.add('hidden');

  window.applyRewardInvoiceV25=async invoiceId=>{
    const b=$('rewardBodyV25');if(b)b.innerHTML='<div class="ops-loading">Applying reward safely…</div>';
    try{const r=await api('loyalty_redeem',{customer_id:currentCustomer,invoice_id:invoiceId,count:1});window.closeRewardModalV25();alert(`${money(r.reward_value)} reward applied to the invoice.`);window.showTool?.('loyalty')}
    catch(e){if(b)b.innerHTML=`<div class="ops-empty">${esc(e.message)}</div>`}
  };

  async function safeRedeem(customerId){
    if(navigator.onLine===false){alert('Rewards need an internet connection so the invoice and points balance can be checked safely.');return}
    currentCustomer=customerId;ensureModal();$('rewardModalV25').classList.remove('hidden');$('rewardBodyV25').innerHTML='<div class="ops-loading">Checking reward eligibility…</div>';
    try{
      const d=await api('loyalty_redemption_options',{customer_id:customerId});
      if(Number(d.points_balance||0)<Number(d.reward_points||250)){$('rewardBodyV25').innerHTML=`<div class="ops-empty">Not enough points. Balance: ${esc(d.points_balance||0)} / ${esc(d.reward_points||250)}.</div>`;return}
      if(!d.invoices?.length){$('rewardBodyV25').innerHTML='<div class="ops-empty">No eligible unpaid invoice is available. Rewards cannot be stacked or used on paid, void or refunded invoices.</div>';return}
      $('rewardBodyV25').innerHTML=`<p class="ops-note">Choose the invoice to receive the ${money(d.reward_value)} reward. Only one reward can be used on an invoice.</p>${d.invoices.map(x=>`<button class="reward-choice-v25" type="button" onclick="applyRewardInvoiceV25('${x.id}')"><b>Invoice #${esc(x.invoice_number)}${x.job_number?` · Job #${esc(x.job_number)}`:''}</b><span>Outstanding ${money(x.outstanding)}</span><small>Apply ${money(x.reward_value)} Ultimate Rewards credit</small></button>`).join('')}`;
    }catch(e){$('rewardBodyV25').innerHTML=`<div class="ops-empty">${esc(e.message)}</div>`}
  }

  async function renderSafetyCard(){
    clearTimeout(renderTimer);
    if(new URLSearchParams(location.search).get('tool')!=='loyalty')return;
    const view=$('opsView');if(!view||$('loyaltyGuardV25')||rendering)return;
    rendering=true;
    try{
      const d=await api('loyalty_limits');
      if(new URLSearchParams(location.search).get('tool')!=='loyalty'||$('loyaltyGuardV25'))return;
      const s=d.settings||{},card=document.createElement('div');card.id='loyaltyGuardV25';card.className='ops-card loyalty-guard-card';
      card.innerHTML=`<p class="eyebrow">REWARD PROTECTION</p><h2>Anti-abuse safeguards</h2><div class="loyalty-guard-grid"><div class="loyalty-guard-rule"><b>1 reward max</b><span>Only one redemption can be attached to each invoice.</span></div><div class="loyalty-guard-rule"><b>${money(s.max_reward_value_per_invoice||5)} maximum</b><span>Maximum reward credit allowed on a single invoice.</span></div><div class="loyalty-guard-rule"><b>No points on rewards</b><span>The reward is applied as invoice credit before new points are calculated.</span></div><div class="loyalty-guard-rule"><b>Refund protection</b><span>Void/refunded invoices do not earn points and awarded points are reversed.</span></div></div>${profile()?.role==='admin'?`<details style="margin-top:12px"><summary>Change maximum reward per invoice</summary><label>Maximum reward value £<input id="loyaltyMaxRewardV25" type="number" step="0.01" min="${Number(s.reward_value||5)}" max="100" value="${Number(s.max_reward_value_per_invoice||5)}"></label><button class="primary" type="button" onclick="saveLoyaltyLimitV25()">Save safety limit</button></details>`:''}`;
      const heading=view.querySelector('.screen-title');heading?.insertAdjacentElement('afterend',card)||view.prepend(card);
    }catch(e){console.warn('Reward protection panel unavailable',e)}finally{rendering=false}
  }
  function scheduleCard(){clearTimeout(renderTimer);renderTimer=setTimeout(renderSafetyCard,80)}

  window.saveLoyaltyLimitV25=async()=>{try{const cap=Number($('loyaltyMaxRewardV25')?.value||5),r=await api('loyalty_limits_save',{max_reward_value_per_invoice:cap,reverse_points_on_refund:true});alert(`Maximum reward per invoice set to ${money(r.settings.max_reward_value_per_invoice)}.`);$('loyaltyGuardV25')?.remove();scheduleCard()}catch(e){alert(e.message)}};

  function install(){
    ensureModal();
    if(!installed&&typeof window.redeemReward==='function'){installed=true;window.redeemReward=safeRedeem}
    const view=$('opsView');if(view&&!view.dataset.loyaltyGuardV25){view.dataset.loyaltyGuardV25='1';new MutationObserver(scheduleCard).observe(view,{childList:true,subtree:false})}
    scheduleCard();
  }

  let tries=0;const timer=setInterval(()=>{tries++;install();if(installed&&tries>20)clearInterval(timer);if(tries>200)clearInterval(timer)},100);
  document.addEventListener('workshop:features-ready',install);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();

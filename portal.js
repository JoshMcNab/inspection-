(()=>{
const ENDPOINT="https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-pro";
const token=new URLSearchParams(location.search).get("t")||"";
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const money=n=>`£${Number(n||0).toFixed(2)}`;
const date=v=>v?new Date(v.length===10?`${v}T12:00:00`:v).toLocaleDateString("en-GB"):"—";
const statusClass=s=>String(s||"").toLowerCase().replace(/\s+/g,"-");
async function api(){
  const r=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"public_portal",token})});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||"Unable to open customer portal");
  return data;
}
function invoiceTotals(inv,items){
  const net=items.reduce((s,x)=>s+Number(x.quantity||0)*Number(x.unit_price||0)+Number(x.labour_hours||0)*Number(x.labour_rate||0),0);
  const vat=net*Number(inv.vat_rate||0)/100,total=net+vat,paid=Number(inv.amount_paid||0);
  return{net,vat,total,paid,outstanding:Math.max(0,total-paid)};
}
function quoteTotals(q,items){
  const parts=items.reduce((s,x)=>s+Number(x.quantity||0)*Number(x.unit_price||0),0),labour=items.reduce((s,x)=>s+Number(x.labour_hours||0)*Number(q.labour_rate||0),0),net=parts+labour,vat=net*Number(q.vat_rate||0)/100;
  return{parts,labour,net,vat,total:net+vat};
}
async function load(){
  if(token.length<32){$("portalTitle").textContent="Invalid portal link";return}
  try{
    const d=await api(),v=d.vehicle||{},c=d.customer||{};
    $("portalTitle").textContent=`${v.registration||"Vehicle"} · ${v.make_model||"Workshop record"}`;
    $("portalSub").textContent=c.name?`Welcome, ${c.name}`:"Your vehicle workshop record";
    let html=`<div class="portal-card"><h2>Vehicle</h2><div class="portal-grid"><div><span>Registration</span><b>${esc(v.registration||"—")}</b></div><div><span>Make & model</span><b>${esc(v.make_model||"—")}</b></div><div><span>Year</span><b>${esc(v.year||"—")}</b></div><div><span>Mileage</span><b>${v.mileage?`${Number(v.mileage).toLocaleString()} miles`:"—"}</b></div><div><span>MOT due</span><b>${date(v.mot_due)}</b></div><div><span>Service due</span><b>${date(v.service_due_date)}</b></div></div></div>`;
    html+=`<div class="portal-card"><h2>Workshop jobs</h2>${(d.jobs||[]).map(j=>`<div class="portal-row"><b>Job #${j.job_number}</b><span>${esc(j.work_summary||"Workshop job")}</span>${j.customer_notes?`<small>${esc(j.customer_notes)}</small>`:""}<span class="portal-status ${statusClass(j.status)}">${esc(j.status)}</span></div>`).join("")||"<p>No workshop jobs to show.</p>"}</div>`;
    html+=`<div class="portal-card"><h2>Quotes</h2>${(d.quotes||[]).map(q=>{const items=(d.quote_items||[]).filter(x=>x.quote_id===q.id),t=quoteTotals(q,items),j=(d.jobs||[]).find(x=>x.id===q.job_id);return`<div class="portal-row"><b>Job #${j?.job_number||""} quote</b>${items.map(x=>`<span>${esc(x.description)} · ${Number(x.quantity||0)} × ${money(x.unit_price)}${Number(x.labour_hours||0)?` · ${Number(x.labour_hours)} labour hrs`:""}</span>`).join("")}<small>Total ${money(t.total)} including VAT</small><span class="portal-status ${statusClass(q.status)}">${esc(q.status)}</span></div>`}).join("")||"<p>No quotes to show.</p>"}</div>`;
    html+=`<div class="portal-card"><h2>Invoices</h2>${(d.invoices||[]).map(inv=>{const items=(d.invoice_items||[]).filter(x=>x.invoice_id===inv.id),t=invoiceTotals(inv,items),j=(d.jobs||[]).find(x=>x.id===inv.job_id);return`<div class="portal-row"><b>Invoice #${inv.invoice_number} · Job #${j?.job_number||""}</b><div class="portal-money"><span>Total</span><b>${money(t.total)}</b><span>Paid</span><b>${money(t.paid)}</b><strong>Outstanding</strong><strong>${money(t.outstanding)}</strong></div><span class="portal-status ${statusClass(inv.status)}">${esc(inv.status)}</span></div>`}).join("")||"<p>No invoices to show.</p>"}</div>`;
    html+=`<div class="portal-card"><h2>Warranties</h2>${(d.warranties||[]).map(w=>`<div class="portal-row"><b>${esc(w.description)}</b><span>${esc(w.supplier||"")}${w.part_number?` · ${esc(w.part_number)}`:""}</span><small>${date(w.starts_on)} → ${date(w.expires_on)}${w.mileage_limit?` · up to ${Number(w.mileage_limit).toLocaleString()} miles`:""}</small><span class="portal-status ${statusClass(w.status)}">${esc(w.status)}</span></div>`).join("")||"<p>No warranties recorded.</p>"}</div>`;
    html+=`<div class="portal-card"><h2>Documents</h2>${(d.documents||[]).map(doc=>`<div class="portal-row portal-doc"><div><b>${esc(doc.filename)}</b><span>${esc(doc.category||"Document")}</span></div>${doc.signed_url?`<a href="${esc(doc.signed_url)}" target="_blank" rel="noopener">Open</a>`:""}</div>`).join("")||"<p>No customer documents available.</p>"}</div>`;
    $("portalContent").innerHTML=html;
  }catch(e){$("portalTitle").textContent="Unable to open portal";$("portalMessage").innerHTML=`<div class="portal-error">${esc(e.message)}</div>`}
}
load();
})();
(()=>{
const ENDPOINT="https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-gateway?service=progress";
const token=new URLSearchParams(location.search).get("t")||"";
let loading=false;
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const statusProgress=s=>({"Booked In":10,"Awaiting Approval":20,"Awaiting Parts":35,"In Progress":60,"Completed":100,"Collected":100,"Cancelled":0}[s]??10);
const fmt=v=>v?new Date(v).toLocaleString("en-GB",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}):"—";
function leadTime(job){
  if(["Completed","Collected"].includes(job.status)||Number(job.progress_percent)>=100)return{short:"Ready / completed",long:"Your vehicle work is complete."};
  if(!job.estimated_ready_at)return{short:"Lead time pending",long:"The workshop will add an estimated ready time when it is confirmed."};
  const eta=new Date(job.estimated_ready_at),ms=eta-Date.now();
  if(ms<=0)return{short:"Update due",long:`Estimated ready time was ${fmt(job.estimated_ready_at)}. The workshop will update this if the schedule changes.`};
  const hours=Math.ceil(ms/3600000),days=Math.ceil(ms/86400000);
  const short=hours<=2?"Due shortly":hours<48?`About ${hours} hour${hours===1?"":"s"} remaining`:`About ${days} day${days===1?"":"s"} remaining`;
  return{short,long:`Estimated ready ${fmt(job.estimated_ready_at)}`};
}
async function api(){const r=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"public_progress",token})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Unable to load progress");return d}
async function render(){
  const host=document.getElementById("portalContent");
  if(!host||host.querySelector(".customer-progress-v16")||loading||token.length<32)return;
  loading=true;
  try{
    const d=await api(),jobs=d.jobs||[];
    const job=jobs.find(j=>!["Collected","Cancelled"].includes(j.status))||jobs[0];
    if(!job)return;
    const pct=Math.max(0,Math.min(100,Number(job.progress_percent??statusProgress(job.status))));
    const lead=leadTime(job);
    const card=document.createElement("div");card.className="portal-card customer-progress-card customer-progress-v16";
    card.innerHTML=`<div class="progress-topline"><div><p class="eyebrow">LIVE VEHICLE PROGRESS</p><h2>Job #${esc(job.job_number)} · ${esc(job.status||"Workshop job")}</h2></div><div class="progress-percent">${pct}%</div></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><div class="progress-fill" style="width:${pct}%"></div></div><div class="lead-time-pill">⏱ ${esc(lead.short)}</div><div class="progress-meta"><div><span>Estimated ready</span><b>${job.estimated_ready_at?esc(fmt(job.estimated_ready_at)):"To be confirmed"}</b></div><div><span>Current status</span><b>${esc(job.status||"In workshop")}</b></div></div><p class="muted">${esc(lead.long)}</p>${job.customer_progress_note?`<div class="customer-progress-note"><b>Workshop update</b><br>${esc(job.customer_progress_note)}</div>`:""}<small class="progress-updated">Last updated ${esc(fmt(job.updated_at))}</small>`;
    host.prepend(card);
  }catch(e){console.warn("Customer progress unavailable",e)}finally{loading=false}
}
const host=document.getElementById("portalContent");if(host)new MutationObserver(()=>setTimeout(render,20)).observe(host,{childList:true});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(render,100));else setTimeout(render,100);
})();
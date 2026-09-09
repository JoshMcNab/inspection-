(()=>{
const ENDPOINT="https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-gateway?service=progress";
const TOKEN_KEY="workshopPinSession";
let jobs=[],busy=false,timer=null;
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const localDT=v=>{if(!v)return"";const d=new Date(v),p=n=>String(n).padStart(2,"0");return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
async function api(action,payload={}){const r=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","x-workshop-token":localStorage.getItem(TOKEN_KEY)||""},body:JSON.stringify({action,...payload})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Progress update failed");return d}
function activePortal(){return new URLSearchParams(location.search).get("tool")==="portal"}
function portalVehicle(){const view=document.getElementById("opsView");return view?.querySelector("select")?.value||""}
function pct(value){return Math.max(0,Math.min(100,Number(value)||0))}
function renderEditor(selectedId=""){
  const host=document.getElementById("customerProgressEditorV16");if(!host)return;
  const current=jobs.find(x=>x.id===selectedId)||jobs.find(x=>!["Collected","Cancelled"].includes(x.status))||jobs[0];
  if(!current){host.innerHTML=`<div class="ops-card progress-editor-card"><h2>Vehicle progress</h2><p class="ops-note">No workshop jobs are recorded for this vehicle yet.</p></div>`;return}
  const p=pct(current.progress_percent);
  host.innerHTML=`<div class="ops-card progress-editor-card"><div class="section-heading"><h2>Customer live progress</h2><span class="ops-pill amber">Portal</span></div><p class="ops-note">Update this and the customer sees the new progress and lead time in their secure portal.</p><label>Job<select id="pgJob" onchange="progressSelectJob(this.value)">${jobs.map(j=>`<option value="${j.id}" ${j.id===current.id?"selected":""}>Job #${esc(j.job_number)} · ${esc(j.status)}</option>`).join("")}</select></label><label>Progress</label><div class="progress-slider-row"><input id="pgProgress" type="range" min="0" max="100" step="5" value="${p}" oninput="document.getElementById('pgValue').textContent=this.value+'%'"><b id="pgValue">${p}%</b></div><div class="progress-presets"><button type="button" onclick="setProgressPreset(10)">Booked 10%</button><button type="button" onclick="setProgressPreset(25)">Approved 25%</button><button type="button" onclick="setProgressPreset(40)">Parts 40%</button><button type="button" onclick="setProgressPreset(60)">In progress 60%</button><button type="button" onclick="setProgressPreset(85)">Final checks 85%</button><button type="button" onclick="setProgressPreset(100)">Ready 100%</button></div><label>Estimated ready / lead time<input id="pgReady" type="datetime-local" value="${esc(localDT(current.estimated_ready_at))}"></label><label>Customer progress update<textarea id="pgNote" placeholder="e.g. Front brakes completed. Waiting for rear discs to arrive this afternoon.">${esc(current.customer_progress_note||"")}</textarea></label><div class="ops-actions"><button class="primary" onclick="saveCustomerProgress()">✓ Update customer portal</button></div><p id="pgState" class="progress-save-state">Current job status: ${esc(current.status||"Workshop job")}</p></div>`;
}
window.progressSelectJob=id=>renderEditor(id);
window.setProgressPreset=value=>{const s=document.getElementById("pgProgress"),v=document.getElementById("pgValue");if(s)s.value=String(value);if(v)v.textContent=`${value}%`};
window.saveCustomerProgress=async()=>{const state=document.getElementById("pgState"),jobId=document.getElementById("pgJob")?.value||"";if(!jobId)return;try{if(state)state.textContent="Updating customer portal…";const r=await api("save_progress",{job_id:jobId,progress_percent:document.getElementById("pgProgress")?.value||0,estimated_ready_at:document.getElementById("pgReady")?.value?new Date(document.getElementById("pgReady").value).toISOString():null,customer_progress_note:document.getElementById("pgNote")?.value||""});jobs=jobs.map(j=>j.id===r.job.id?{...j,...r.job}:j);renderEditor(r.job.id);const n=document.getElementById("pgState");if(n)n.textContent="✓ Customer portal updated."}catch(e){if(state)state.textContent=e.message||"Update failed"}};
async function decorate(){
  if(!activePortal()||busy)return;
  const view=document.getElementById("opsView");if(!view||view.querySelector("#customerProgressEditorV16"))return;
  const vehicleId=portalVehicle();if(!vehicleId)return;
  busy=true;
  try{const d=await api("staff_progress",{vehicle_id:vehicleId});jobs=d.jobs||[];const holder=document.createElement("div");holder.id="customerProgressEditorV16";const cards=view.querySelectorAll(":scope > .ops-card");if(cards[0])cards[0].insertAdjacentElement("afterend",holder);else view.appendChild(holder);renderEditor()}catch(e){console.warn("Progress editor unavailable",e)}finally{busy=false}
}
function schedule(){clearTimeout(timer);timer=setTimeout(decorate,80)}
const view=document.getElementById("opsView");if(view)new MutationObserver(schedule).observe(view,{childList:true,subtree:false});
window.addEventListener("popstate",schedule);document.addEventListener("DOMContentLoaded",schedule);setTimeout(schedule,500);
})();
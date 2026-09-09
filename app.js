const sections=[
["EXTERIOR","Bodywork & panels","Check panels, mirrors and visible damage."],
["EXTERIOR","Windscreen & glass","Check windscreen for cracks, chips and visibility."],
["LIGHTING","Headlights","Check dipped/main beam operation and condition."],
["LIGHTING","Indicators & hazards","Check all indicators and hazard lamps."],
["TYRES","Front tyres","Check tread, pressure, damage and wear."],
["TYRES","Rear tyres","Check tread, pressure, damage and wear."],
["BRAKES","Brake condition","Check pads/discs/drums and visible condition."],
["BRAKES","Parking brake","Check operation and holding ability."],
["STEERING","Steering","Check steering operation, play and unusual noise."],
["SUSPENSION","Suspension","Check shocks, springs, bushes and leaks."],
["ENGINE","Engine bay","Check visible leaks, belts, hoses and condition."],
["FLUIDS","Engine oil","Check level and visible condition."],
["FLUIDS","Coolant","Check level and leaks."],
["FLUIDS","Brake fluid","Check level and leaks."],
["EXHAUST","Exhaust system","Check visible condition, mounting and leaks."],
["UNDERBODY","Underside","Check visible corrosion, leaks and damage."],
["SAFETY","Seat belts & seats","Check belts, buckles and seat security."],
["SAFETY","Warning lights","Check dashboard warning lights."],
["ROAD TEST","Engine performance","Check starting, running and unusual noises."],
["ROAD TEST","Braking performance","Check braking feel, pull and noise."]
];
let i=0,results=sections.map(x=>({section:x[0],item:x[1],status:null,notes:"",photo:null}));
let data={}; const $=id=>document.getElementById(id);
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");scrollTo(0,0)}
function getSaved(){try{return JSON.parse(localStorage.getItem("vehicleInspections")||"[]")}catch(e){return[]}}
function esc(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
function startInspection(){data={};i=0;results=sections.map(x=>({section:x[0],item:x[1],status:null,notes:"",photo:null}));["customer","reg","model","year","mileage","vin","overall"].forEach(id=>{if($(id))$(id).value=""});show("details")}
function beginChecklist(){data.customer=$("customer").value;data.reg=$("reg").value.toUpperCase();data.model=$("model").value;data.year=$("year").value;data.mileage=$("mileage").value;data.vin=$("vin").value;i=0;show("checklist");renderItem()}
function renderItem(){let r=results[i];$("sectionLabel").textContent=r.section;$("itemTitle").textContent=r.item;$("itemHelp").textContent=sections[i][2];$("counter").textContent=`${i+1} / ${results.length}`;$("progress").style.width=`${((i+1)/results.length)*100}%`;$("notes").value=r.notes||"";document.querySelectorAll(".status-grid button").forEach(b=>b.classList.toggle("selected",b.dataset.status===r.status));$("photoPreview").innerHTML=r.photo?`<img class="photo-thumb" src="${r.photo}">`:"";$("nextBtn").textContent=i===results.length-1?"Summary →":"Next →"}
function setStatus(s){results[i].status=s;renderItem()}
$("notes").addEventListener("input",e=>results[i].notes=e.target.value);
$("photo").addEventListener("change",e=>{let f=e.target.files[0];if(!f)return;let rd=new FileReader();rd.onload=()=>{results[i].photo=rd.result;renderItem()};rd.readAsDataURL(f)});
function prevItem(){if(i>0){i--;renderItem()}else show("details")}
function nextItem(){if(i<results.length-1){i++;renderItem()}else{renderSummary();show("summary")}}
function statusCounts(items){let c={pass:0,advisory:0,fail:0,unchecked:0};(items||[]).forEach(r=>c[r.status||"unchecked"]++);return c}
function renderSummary(){let c=statusCounts(results);$("summaryStats").innerHTML=Object.entries(c).map(([k,v])=>`<div class="summary-card ${k}"><b>${v}</b><span>${k.toUpperCase()}</span></div>`).join("")}
function saveInspection(){let saved=getSaved();let signature="";try{signature=canvas.toDataURL("image/png")}catch(e){};saved.unshift({...data,results:JSON.parse(JSON.stringify(results)),overall:$("overall").value,signature,date:new Date().toISOString()});try{localStorage.setItem("vehicleInspections",JSON.stringify(saved.slice(0,50)));renderRecent();alert("Inspection saved on this iPhone.");show("home")}catch(e){alert("This inspection is too large to save. Try removing some photos and save again.")}}
function inspectionRow(x,index){let c=statusCounts(x.results);return `<button class="inspection-row" onclick="openSavedInspection(${index})"><div><b>${esc(x.reg||"No registration")}</b><span>${esc(x.model||"Vehicle")}</span><small>${new Date(x.date).toLocaleString("en-GB")}</small></div><div class="row-status"><span class="pass-dot">${c.pass} ✓</span>${c.advisory?`<span class="advisory-dot">${c.advisory} !</span>`:""}${c.fail?`<span class="fail-dot">${c.fail} ×</span>`:""}<strong>›</strong></div></button>`}
function renderRecent(){let saved=getSaved();$("savedCount").textContent=saved.length;$("recent").className=saved.length?"list inspection-list":"list empty";$("recent").innerHTML=saved.length?saved.slice(0,5).map((x,index)=>inspectionRow(x,index)).join(""):"No inspections yet."}
function showPastInspections(){let saved=getSaved();$("pastList").className=saved.length?"list inspection-list":"list empty";$("pastList").innerHTML=saved.length?saved.map((x,index)=>inspectionRow(x,index)).join(""):"No inspections yet.";show("past")}
function openSavedInspection(index){let x=getSaved()[index];if(!x)return;$("savedTitle").textContent=`${x.reg||"No registration"} · ${x.model||"Vehicle"}`;$("savedDate").textContent=x.date?new Date(x.date).toLocaleString("en-GB"):"";$("savedVehicle").innerHTML=`<h3>Vehicle details</h3><div class="detail-grid"><div><span>Customer</span><b>${esc(x.customer||"—")}</b></div><div><span>Registration</span><b>${esc(x.reg||"—")}</b></div><div><span>Make & model</span><b>${esc(x.model||"—")}</b></div><div><span>Year</span><b>${esc(x.year||"—")}</b></div><div><span>Mileage</span><b>${esc(x.mileage||"—")}</b></div><div><span>VIN</span><b>${esc(x.vin||"—")}</b></div></div>`;let c=statusCounts(x.results);$("savedStats").innerHTML=Object.entries(c).map(([k,v])=>`<div class="summary-card ${k}"><b>${v}</b><span>${k.toUpperCase()}</span></div>`).join("");$("savedResults").innerHTML=(x.results||[]).map(r=>`<div class="result-row"><div><small>${esc(r.section||"")}</small><b>${esc(r.item||"")}</b>${r.notes?`<p>${esc(r.notes)}</p>`:""}</div><span class="status-badge ${r.status||"unchecked"}">${esc((r.status||"unchecked").toUpperCase())}</span>${r.photo?`<img class="saved-photo" src="${r.photo}" alt="Inspection photo">`:""}</div>`).join("");$("savedOverall").innerHTML=`<h3>Overall comments</h3><p>${esc(x.overall||"No overall comments recorded.")}</p>${x.signature?`<h3>Technician signature</h3><img class="saved-signature" src="${x.signature}" alt="Technician signature">`:""}`;show("savedDetail")}
$("homeBtn").onclick=()=>{renderRecent();show("home")};renderRecent();

const canvas=$("sig"),ctx=canvas.getContext("2d");let drawing=false;
function resizeSig(){let previous="";try{previous=canvas.toDataURL()}catch(e){};canvas.width=canvas.clientWidth*2;canvas.height=canvas.clientHeight*2;ctx.setTransform(2,0,0,2,0,0);ctx.lineWidth=2;ctx.lineCap="round";if(previous){let img=new Image();img.onload=()=>ctx.drawImage(img,0,0,canvas.clientWidth,canvas.clientHeight);img.src=previous}}
resizeSig();addEventListener("resize",resizeSig);
function pos(e){let r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}}
function down(e){drawing=true;let p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()}
function move(e){if(!drawing)return;let p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()}
canvas.addEventListener("mousedown",down);canvas.addEventListener("mousemove",move);addEventListener("mouseup",()=>drawing=false);canvas.addEventListener("touchstart",down);canvas.addEventListener("touchmove",move);canvas.addEventListener("touchend",()=>drawing=false);
function clearSig(){ctx.clearRect(0,0,canvas.width,canvas.height)}

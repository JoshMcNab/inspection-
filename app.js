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
function startInspection(){data={};i=0;results=sections.map(x=>({section:x[0],item:x[1],status:null,notes:"",photo:null}));show("details")}
function beginChecklist(){data.customer=$("customer").value;data.reg=$("reg").value;data.model=$("model").value;data.year=$("year").value;data.mileage=$("mileage").value;data.vin=$("vin").value;i=0;show("checklist");renderItem()}
function renderItem(){let r=results[i];$("sectionLabel").textContent=r.section;$("itemTitle").textContent=r.item;$("itemHelp").textContent=sections[i][2];$("counter").textContent=`${i+1} / ${results.length}`;$("progress").style.width=`${((i+1)/results.length)*100}%`;$("notes").value=r.notes||"";document.querySelectorAll(".status-grid button").forEach(b=>b.classList.toggle("selected",b.dataset.status===r.status));$("photoPreview").innerHTML=r.photo?`<img class="photo-thumb" src="${r.photo}">`:"";$("nextBtn").textContent=i===results.length-1?"Summary →":"Next →"}
function setStatus(s){results[i].status=s;renderItem()}
$("notes").addEventListener("input",e=>results[i].notes=e.target.value);
$("photo").addEventListener("change",e=>{let f=e.target.files[0];if(!f)return;let rd=new FileReader();rd.onload=()=>{results[i].photo=rd.result;renderItem()};rd.readAsDataURL(f)});
function prevItem(){if(i>0){i--;renderItem()}else show("details")}
function nextItem(){if(i<results.length-1){i++;renderItem()}else{renderSummary();show("summary")}}
function renderSummary(){let c={pass:0,advisory:0,fail:0,unchecked:0};results.forEach(r=>c[r.status||"unchecked"]++);$("summaryStats").innerHTML=Object.entries(c).map(([k,v])=>`<div class="summary-card"><b>${v}</b><span>${k.toUpperCase()}</span></div>`).join("")}
function saveInspection(){let saved=JSON.parse(localStorage.getItem("vehicleInspections")||"[]");saved.unshift({...data,results,overall:$("overall").value,date:new Date().toISOString()});localStorage.setItem("vehicleInspections",JSON.stringify(saved.slice(0,50)));renderRecent();alert("Inspection saved on this iPhone.");show("home")}
function renderRecent(){let saved=JSON.parse(localStorage.getItem("vehicleInspections")||"[]");$("savedCount").textContent=saved.length;$("recent").className=saved.length?"list":"list empty";$("recent").innerHTML=saved.length?saved.slice(0,5).map(x=>`<div style="padding:10px 0;border-bottom:1px solid #eee"><b>${x.reg||"No registration"}</b> — ${x.model||"Vehicle"}<br><small>${new Date(x.date).toLocaleString("en-GB")}</small></div>`).join(""):"No inspections yet."}
$("homeBtn").onclick=()=>show("home");renderRecent();

const canvas=$("sig"),ctx=canvas.getContext("2d");let drawing=false;
function resizeSig(){canvas.width=canvas.clientWidth*2;canvas.height=canvas.clientHeight*2;ctx.scale(2,2)}
resizeSig();addEventListener("resize",()=>{resizeSig()});
function pos(e){let r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:p.clientX-r.left,y:p.clientY-r.top}}
function down(e){drawing=true;let p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()}
function move(e){if(!drawing)return;let p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()}
canvas.addEventListener("mousedown",down);canvas.addEventListener("mousemove",move);addEventListener("mouseup",()=>drawing=false);canvas.addEventListener("touchstart",down);canvas.addEventListener("touchmove",move);canvas.addEventListener("touchend",()=>drawing=false);
function clearSig(){ctx.clearRect(0,0,canvas.width,canvas.height)}

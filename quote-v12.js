(()=>{
  const money=n=>`£${Number(n||0).toFixed(2)}`;
  const originalAdd=window.addQuoteLine;
  const originalRemove=window.removeQuoteLine;
  const originalUpdate=window.updateQuoteLine;
  const originalOpen=window.openQuoteForJob;
  const originalTotals=window.renderQuoteTotals;
  let activeVehicleId='',activeJobId='';

  function fireInput(input){input.dispatchEvent(new Event('input',{bubbles:true}))}
  function valuesFor(line){const inputs=line.querySelectorAll('input');return{description:inputs[0]?.value||'',quantity:Number(inputs[1]?.value||0),unit:Number(inputs[2]?.value||0),hours:Number(inputs[3]?.value||0)}}
  function lineTotal(line){const v=valuesFor(line),rate=Number(document.getElementById('labourRate')?.value||0);return(v.quantity*v.unit)+(v.hours*rate)}
  function relabel(line,index){
    if(line.dataset.multiPartReady==='1'){const total=line.querySelector('.quote-line-total b');if(total)total.textContent=money(lineTotal(line));const badge=line.querySelector('.quote-line-badge');if(badge)badge.textContent=`ITEM ${index+1}`;return}
    line.dataset.multiPartReady='1';const labels=line.querySelectorAll('label');
    if(labels[0]?.firstChild)labels[0].firstChild.nodeValue='Part / work description';if(labels[1]?.firstChild)labels[1].firstChild.nodeValue='Qty';if(labels[2]?.firstChild)labels[2].firstChild.nodeValue='Price £ each';if(labels[3]?.firstChild)labels[3].firstChild.nodeValue='Labour hrs';
    const head=document.createElement('div');head.className='quote-line-head';head.innerHTML=`<span class="quote-line-badge">ITEM ${index+1}</span><span class="quote-line-hint">Each part can have its own quantity and price</span>`;line.prepend(head);
    const footer=document.createElement('div');footer.className='quote-line-footer';footer.innerHTML=`<button type="button" class="quote-duplicate">Duplicate</button><div class="quote-line-total"><span>Item total</span><b>${money(lineTotal(line))}</b></div>`;line.appendChild(footer);footer.querySelector('.quote-duplicate')?.addEventListener('click',()=>duplicateLine(line));line.querySelectorAll('input').forEach(input=>input.addEventListener('input',refreshLineTotals));
  }
  function refreshLineTotals(){document.querySelectorAll('#quoteLines .quote-line').forEach((line,index)=>relabel(line,index))}
  function setLastLine({description='',quantity=1,unit=0,hours=0}){const lines=document.querySelectorAll('#quoteLines .quote-line'),line=lines[lines.length-1];if(!line)return;const inputs=line.querySelectorAll('input'),vals=[description,quantity,unit,hours];inputs.forEach((input,i)=>{if(i<4){input.value=vals[i];fireInput(input)}});refreshLineTotals();inputs[0]?.focus()}
  function addPartLine(){if(typeof originalAdd!=='function')return;originalAdd();setLastLine({description:'',quantity:1,unit:0,hours:0})}
  function addLabourLine(){if(typeof originalAdd!=='function')return;originalAdd();setLastLine({description:'Labour',quantity:0,unit:0,hours:1})}
  function duplicateLine(source){if(typeof originalAdd!=='function')return;const v=valuesFor(source);originalAdd();setLastLine({description:v.description,quantity:v.quantity,unit:v.unit,hours:v.hours})}
  window.addPartLine=addPartLine;window.addLabourLine=addLabourLine;window.addQuoteLine=addPartLine;
  if(typeof originalRemove==='function')window.removeQuoteLine=function(index){originalRemove(index);setTimeout(refreshLineTotals,0)};
  if(typeof originalUpdate==='function')window.updateQuoteLine=function(index,field,value){originalUpdate(index,field,value);refreshLineTotals()};
  if(typeof originalTotals==='function')window.renderQuoteTotals=function(){originalTotals();refreshLineTotals()};
  if(typeof originalOpen==='function')window.openQuoteForJob=function(jobId){activeJobId=jobId;originalOpen(jobId);setTimeout(()=>{refreshLineTotals();injectContextButtons()},0)};

  function proUrl(tool,kind,id){const u=new URL('operations.html',location.href);u.searchParams.set('tool',tool);if(kind&&id)u.searchParams.set(kind,id);return u.href}
  function injectHomeTile(){const grid=document.querySelector('.workshop-launch');if(!grid||document.getElementById('workshopProTile'))return;const b=document.createElement('button');b.id='workshopProTile';b.className='workshop-tile';b.innerHTML='<span>⚙</span><b>Workshop Pro</b><small>Bookings, invoices & profit</small>';b.onclick=()=>location.href='operations.html?tool=bookings';grid.appendChild(b)}
  function injectContextButtons(){
    const vehicleActions=document.querySelector('#vehicleDetail .vehicle-actions');if(vehicleActions&&!document.getElementById('vehicleProBtn')){const b=document.createElement('button');b.id='vehicleProBtn';b.className='secondary';b.textContent='⚙ Pro tools';b.onclick=()=>location.href=proUrl('mot','vehicle',activeVehicleId);vehicleActions.appendChild(b)}
    const jobForm=document.getElementById('jobForm');if(jobForm&&!document.getElementById('jobProTools')){const wrap=document.createElement('div');wrap.id='jobProTools';wrap.className='quote-part-actions';wrap.innerHTML='<button class="secondary" type="button">🔑 Check-in</button><button class="secondary" type="button">£ Invoice & Profit</button><button class="secondary" type="button">🧰 Service Package</button><button class="secondary" type="button">📎 Documents</button>';const buttons=wrap.querySelectorAll('button');buttons[0].onclick=()=>location.href=proUrl('checkin','job',activeJobId);buttons[1].onclick=()=>location.href=proUrl('invoices','job',activeJobId);buttons[2].onclick=()=>location.href=proUrl('packages','job',activeJobId);buttons[3].onclick=()=>location.href=proUrl('documents','job',activeJobId);jobForm.appendChild(wrap)}
  }
  const oldVehicle=window.openVehicle;if(typeof oldVehicle==='function')window.openVehicle=function(id){activeVehicleId=id;oldVehicle(id);setTimeout(injectContextButtons,0)};
  const oldJob=window.openJob;if(typeof oldJob==='function')window.openJob=function(id){activeJobId=id;oldJob(id);setTimeout(injectContextButtons,0)};

  const observer=new MutationObserver(()=>refreshLineTotals());
  const start=()=>{const lines=document.getElementById('quoteLines');if(lines)observer.observe(lines,{childList:true});document.getElementById('labourRate')?.addEventListener('input',refreshLineTotals);refreshLineTotals();injectHomeTile();injectContextButtons()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
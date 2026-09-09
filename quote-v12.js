(()=>{
  const money=n=>`£${Number(n||0).toFixed(2)}`;
  const originalAdd=window.addQuoteLine;
  const originalRemove=window.removeQuoteLine;
  const originalUpdate=window.updateQuoteLine;
  const originalOpen=window.openQuoteForJob;
  const originalTotals=window.renderQuoteTotals;

  function fireInput(input){
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function valuesFor(line){
    const inputs=line.querySelectorAll('input');
    return {
      description:inputs[0]?.value||'',
      quantity:Number(inputs[1]?.value||0),
      unit:Number(inputs[2]?.value||0),
      hours:Number(inputs[3]?.value||0)
    };
  }

  function lineTotal(line){
    const v=valuesFor(line);
    const rate=Number(document.getElementById('labourRate')?.value||0);
    return (v.quantity*v.unit)+(v.hours*rate);
  }

  function relabel(line,index){
    if(line.dataset.multiPartReady==='1'){
      const total=line.querySelector('.quote-line-total b');
      if(total)total.textContent=money(lineTotal(line));
      const badge=line.querySelector('.quote-line-badge');
      if(badge)badge.textContent=`ITEM ${index+1}`;
      return;
    }
    line.dataset.multiPartReady='1';
    const labels=line.querySelectorAll('label');
    if(labels[0]?.firstChild)labels[0].firstChild.nodeValue='Part / work description';
    if(labels[1]?.firstChild)labels[1].firstChild.nodeValue='Qty';
    if(labels[2]?.firstChild)labels[2].firstChild.nodeValue='Price £ each';
    if(labels[3]?.firstChild)labels[3].firstChild.nodeValue='Labour hrs';

    const head=document.createElement('div');
    head.className='quote-line-head';
    head.innerHTML=`<span class="quote-line-badge">ITEM ${index+1}</span><span class="quote-line-hint">Each part can have its own quantity and price</span>`;
    line.prepend(head);

    const footer=document.createElement('div');
    footer.className='quote-line-footer';
    footer.innerHTML=`<button type="button" class="quote-duplicate">Duplicate</button><div class="quote-line-total"><span>Item total</span><b>${money(lineTotal(line))}</b></div>`;
    line.appendChild(footer);
    footer.querySelector('.quote-duplicate')?.addEventListener('click',()=>duplicateLine(line));
    line.querySelectorAll('input').forEach(input=>input.addEventListener('input',refreshLineTotals));
  }

  function refreshLineTotals(){
    document.querySelectorAll('#quoteLines .quote-line').forEach((line,index)=>relabel(line,index));
  }

  function setLastLine({description='',quantity=1,unit=0,hours=0}){
    const lines=document.querySelectorAll('#quoteLines .quote-line');
    const line=lines[lines.length-1];
    if(!line)return;
    const inputs=line.querySelectorAll('input');
    const vals=[description,quantity,unit,hours];
    inputs.forEach((input,i)=>{if(i<4){input.value=vals[i];fireInput(input)}});
    refreshLineTotals();
    inputs[0]?.focus();
  }

  function addPartLine(){
    if(typeof originalAdd!=='function')return;
    originalAdd();
    setLastLine({description:'',quantity:1,unit:0,hours:0});
  }

  function addLabourLine(){
    if(typeof originalAdd!=='function')return;
    originalAdd();
    setLastLine({description:'Labour',quantity:0,unit:0,hours:1});
  }

  function duplicateLine(source){
    if(typeof originalAdd!=='function')return;
    const v=valuesFor(source);
    originalAdd();
    setLastLine({description:v.description,quantity:v.quantity,unit:v.unit,hours:v.hours});
  }

  window.addPartLine=addPartLine;
  window.addLabourLine=addLabourLine;
  window.addQuoteLine=addPartLine;

  if(typeof originalRemove==='function'){
    window.removeQuoteLine=function(index){originalRemove(index);setTimeout(refreshLineTotals,0)};
  }
  if(typeof originalUpdate==='function'){
    window.updateQuoteLine=function(index,field,value){originalUpdate(index,field,value);refreshLineTotals()};
  }
  if(typeof originalTotals==='function'){
    window.renderQuoteTotals=function(){originalTotals();refreshLineTotals()};
  }
  if(typeof originalOpen==='function'){
    window.openQuoteForJob=function(jobId){originalOpen(jobId);setTimeout(refreshLineTotals,0)};
  }

  const observer=new MutationObserver(()=>refreshLineTotals());
  const start=()=>{
    const lines=document.getElementById('quoteLines');
    if(lines)observer.observe(lines,{childList:true});
    document.getElementById('labourRate')?.addEventListener('input',refreshLineTotals);
    refreshLineTotals();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
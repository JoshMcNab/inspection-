(()=>{
  const TEMPLATE='Additional work has been identified while carrying out the approved repair. Please review the revised quote below. We will not carry out the additional work or exceed the authorised amount without your approval.';
  const BUTTON_ID='removeRevisedQuoteMode';
  let wrapped=false;

  function tools(){return document.getElementById('quoteRevisionTools')}
  function message(){return document.getElementById('quoteCustomerMessage')}
  function button(){return document.getElementById(BUTTON_ID)}

  function isAutoRevisionMessage(){
    const value=(message()?.value||'').trim();
    return value===TEMPLATE;
  }

  function isRevisionMode(){
    return !!tools()?.classList.contains('revision-highlight')||isAutoRevisionMessage();
  }

  function sync(){
    const btn=button();
    if(btn)btn.disabled=!isRevisionMode();
  }

  function removeRevisedQuoteMode(){
    const msg=message();
    if(msg&&isAutoRevisionMessage()){
      msg.value='';
      msg.dispatchEvent(new Event('input',{bubbles:true}));
    }
    tools()?.classList.remove('revision-highlight');
    sync();
    alert('Revised/additional quote wording removed. If you are changing a quote the customer has already approved, the previous approval will still be protected and the system will create a new revision when you save.');
  }
  window.removeRevisedQuoteMode=removeRevisedQuoteMode;

  function installButton(){
    const actions=tools()?.querySelector('.quote-revision-actions');
    if(!actions||button())return;
    const btn=document.createElement('button');
    btn.id=BUTTON_ID;
    btn.type='button';
    btn.className='secondary';
    btn.textContent='✕ Remove revised / additional quote';
    btn.onclick=removeRevisedQuoteMode;
    actions.appendChild(btn);
    sync();
  }

  function wrapAdditionalWork(){
    if(wrapped||typeof window.startAdditionalWorkRevision!=='function')return;
    const original=window.startAdditionalWorkRevision;
    window.startAdditionalWorkRevision=function(...args){
      const result=original.apply(this,args);
      setTimeout(sync,0);
      return result;
    };
    wrapped=true;
  }

  function install(){installButton();wrapAdditionalWork();sync()}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  const observer=new MutationObserver(install);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('input',event=>{if(event.target?.id==='quoteCustomerMessage')sync()});
})();

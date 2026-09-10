(()=>{
  if(window.__UAW_QUOTE_REQUEST_STATUS_V26__)return;
  window.__UAW_QUOTE_REQUEST_STATUS_V26__=true;
  const STATUS='Quote Requested';

  function addOption(select,afterAll=false){
    if(!select||[...select.options].some(o=>o.value===STATUS||o.textContent===STATUS))return;
    const option=document.createElement('option');option.value=STATUS;option.textContent=STATUS;
    if(afterAll&&select.options.length)select.insertBefore(option,select.options[1]||null);else select.insertBefore(option,select.options[0]||null);
  }
  function install(){
    addOption(document.getElementById('jobStatusFilter'),true);
    addOption(document.getElementById('jobStatus'));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  document.addEventListener('workshop:features-ready',install);
})();

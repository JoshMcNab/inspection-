(()=>{
  if(window.__UAW_APPROVAL_SHARE_FIX_V26__)return;
  window.__UAW_APPROVAL_SHARE_FIX_V26__=true;

  const approvalLink=()=>document.getElementById('approvalLinkInput')?.value?.trim()||'';

  async function copyLink(){
    const link=approvalLink();
    if(!link)return alert('Create the customer approval link first.');
    try{
      await navigator.clipboard.writeText(link);
      alert('Approval link copied.');
      return;
    }catch(_){ }
    const input=document.getElementById('approvalLinkInput');
    if(input){
      input.focus();input.select();input.setSelectionRange(0,99999);
      try{document.execCommand('copy');alert('Approval link copied.');return}catch(_){ }
    }
    prompt('Copy this approval link:',link);
  }

  function openLink(){
    const link=approvalLink();
    if(!link)return alert('Create the customer approval link first.');
    location.href=link;
  }

  async function shareLink(){
    const link=approvalLink();
    if(!link)return;
    if(navigator.share){
      try{
        await navigator.share({title:'Workshop quote approval',url:link});
        return;
      }catch(err){
        if(err?.name==='AbortError')return;
      }
    }
    copyLink();
  }

  function enhance(){
    const share=document.getElementById('approvalShare');
    const input=document.getElementById('approvalLinkInput');
    if(!share||!input)return;
    const grid=share.querySelector('.share-grid');
    if(!grid)return;

    window.shareApprovalLink=shareLink;
    window.copyApprovalLink=copyLink;
    window.openApprovalLink=openLink;

    if(!grid.querySelector('[data-uaw-open-approval]')){
      const open=document.createElement('button');
      open.type='button';open.className='secondary';open.dataset.uawOpenApproval='1';
      open.textContent='Open link';open.onclick=openLink;
      grid.appendChild(open);
    }
    if(!grid.querySelector('[data-uaw-copy-approval]')){
      const copy=document.createElement('button');
      copy.type='button';copy.className='secondary';copy.dataset.uawCopyApproval='1';
      copy.textContent='Copy link';copy.onclick=copyLink;
      grid.appendChild(copy);
    }
  }

  const target=document.getElementById('quoteBuilder')||document.body;
  new MutationObserver(()=>enhance()).observe(target,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,100));
  else setTimeout(enhance,100);
})();

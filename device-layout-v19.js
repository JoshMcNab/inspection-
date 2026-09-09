(()=>{
  const desktopQuery=window.matchMedia('(min-width: 900px)');
  function applyLayout(){
    const desktop=desktopQuery.matches;
    document.documentElement.dataset.layout=desktop?'desktop':'mobile';
    document.documentElement.dataset.deviceHint=desktop?'desktop':'iphone-mobile';
    const bannerSub=document.querySelector('.banner-sub');
    if(bannerSub){
      if(!bannerSub.dataset.mobileText)bannerSub.dataset.mobileText=bannerSub.textContent||'Built for your iPhone';
      bannerSub.textContent=desktop?'Workshop management · Desktop view':bannerSub.dataset.mobileText;
    }
  }
  applyLayout();
  if(desktopQuery.addEventListener)desktopQuery.addEventListener('change',applyLayout);
  else if(desktopQuery.addListener)desktopQuery.addListener(applyLayout);
  window.addEventListener('orientationchange',()=>setTimeout(applyLayout,80));
  document.addEventListener('DOMContentLoaded',applyLayout);
})();

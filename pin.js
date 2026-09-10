(()=>{
  const VERSION='26.2';
  const loaded=new Map();

  function asset(path){return `${path}?v=${VERSION}`}
  function loadStyle(path){
    if([...document.styleSheets].some(s=>s.href&&s.href.includes(path)))return;
    const link=document.createElement('link');link.rel='stylesheet';link.href=asset(path);link.dataset.workshopCore='style';document.head.appendChild(link);
  }
  function loadScript(path){
    if(loaded.has(path))return loaded.get(path);
    if([...document.scripts].some(s=>s.src&&s.src.includes(path)))return Promise.resolve();
    const task=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=asset(path);script.async=false;script.dataset.workshopCore=path;
      script.onload=resolve;script.onerror=()=>reject(new Error(`Failed to load ${path}`));
      document.head.appendChild(script);
    });
    loaded.set(path,task);return task;
  }

  async function boot(){
    loadStyle('styles/theme-v25.css');
    loadStyle('styles/visual-polish-v25.css');
    loadStyle('styles/home-banner-v25.css');
    loadStyle('styles/home-approved-v25-6.css');
    await loadScript('src/core/config-v25.js');
    await loadScript('src/core/api-v25.js');
    await loadScript('src/core/auth-v25.js');
    await loadScript('src/core/features-v25.js');
    document.documentElement.dataset.workshopVersion=window.WorkshopConfig?.version||'26.2';
  }

  boot().catch(error=>{
    console.error('[Workshop core bootstrap]',error);
    const message=document.getElementById('pinMessage');
    if(message)message.textContent='Workshop core could not load. Check your connection and refresh.';
  });
})();

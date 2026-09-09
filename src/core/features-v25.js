(()=>{
  const cfg=window.WorkshopConfig;
  if(!cfg)throw new Error('WorkshopConfig must load before feature registry');

  const common=[
    'progress-v16.js',
    'quote-revision-v18.js',
    'offline-v20.js',
    'customer-notify-v20.js',
    'notification-context-v21.js',
    'monitor-v20.js',
    'loyalty-guard-v22.js',
    'repair-data-v23.js'
  ];
  const pageFeatures={
    index:common,
    operations:[...common,'parts-catalog-v24.js']
  };

  function pageName(){return /operations\.html$/i.test(location.pathname)?'operations':'index'}
  function asset(src){return `${src}?v=${encodeURIComponent(cfg.assetVersion)}`}
  function loadScript(src){
    if([...document.scripts].some(s=>s.src&&new URL(s.src,location.href).pathname.endsWith('/'+src)))return Promise.resolve();
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=asset(src);s.async=false;s.dataset.workshopFeature=src;s.onload=resolve;s.onerror=()=>reject(new Error(`Could not load ${src}`));document.body.appendChild(s)});
  }
  function ensureLayoutAssets(){
    if(!document.querySelector('link[data-workshop-desktop]')){const l=document.createElement('link');l.rel='stylesheet';l.href=asset('desktop-v19.css');l.dataset.workshopDesktop='1';document.head.appendChild(l)}
    if(![...document.scripts].some(s=>s.src&&s.src.includes('device-layout-v19.js'))){const s=document.createElement('script');s.src=asset('device-layout-v19.js');s.dataset.workshopLayout='1';document.body.appendChild(s)}
  }
  async function loadAll(){
    ensureLayoutAssets();
    for(const src of pageFeatures[pageName()]||common){try{await loadScript(src)}catch(error){console.error('[Workshop feature loader]',error)}}
    document.dispatchEvent(new CustomEvent('workshop:features-ready',{detail:{page:pageName(),version:cfg.version}}));
  }

  window.WorkshopFeatures=Object.freeze({loadAll,loadScript,pageName});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadAll);else loadAll();
})();

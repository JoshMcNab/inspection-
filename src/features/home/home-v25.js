(()=>{
  if(window.__UAW_HOME_V25__)return;
  window.__UAW_HOME_V25__=true;

  const $=id=>document.getElementById(id);
  let screenObserver=null,statusTimer=0;

  function ensureStyle(){
    if(document.querySelector('link[data-uaw-home-style]'))return;
    const l=document.createElement('link');
    l.rel='stylesheet';
    l.href=`styles/home-v25.css?v=${encodeURIComponent(window.WorkshopConfig?.assetVersion||'25.2')}`;
    l.dataset.uawHomeStyle='1';
    document.head.appendChild(l);
  }

  function profile(){
    try{return window.WorkshopAPI?.profile?.()||window.workshopUser||JSON.parse(localStorage.getItem('workshopStaffProfile')||'null')}catch(_){return null}
  }

  function goOperations(tool){location.href=`operations.html?tool=${encodeURIComponent(tool)}&v=${encodeURIComponent(window.WorkshopConfig?.assetVersion||'25.2')}`}

  function header(){
    const h=document.querySelector('body>header');
    if(!h)return;
    h.classList.add('uaw-header-v25');
    const name=h.querySelector('.app-name');
    if(name&&!name.dataset.uawV25){name.dataset.uawV25='1';name.innerHTML='<strong>Vehicle Inspection Pro</strong><small>Ultimate Automotive Works</small>'}
    const actions=h.querySelector('.header-actions');
    if(actions&&!$('uawHeaderBellV25')){
      const b=document.createElement('button');
      b.id='uawHeaderBellV25';b.type='button';b.className='uaw-header-bell';b.setAttribute('aria-label','Customer notifications');b.textContent='♧';
      b.onclick=()=>goOperations('notifications');
      actions.insertBefore(b,actions.firstChild);
    }
  }

  function dashboardCard({icon,title,copy,accent='blue',action,admin=false}){
    const b=document.createElement('button');
    b.type='button';b.className=`uaw-dashboard-card${admin?' uaw-admin-card':''}`;b.dataset.accent=accent;
    b.innerHTML=`<span class="uaw-card-icon">${icon}</span><b>${title}</b><small>${copy}</small>`;
    b.addEventListener('click',action);
    return b;
  }

  function markLegacy(home){
    const stats=home.querySelector(':scope > .cards');if(stats)stats.classList.add('uaw-home-legacy');
    const recent=$('recent');if(recent)recent.classList.add('uaw-home-legacy');
    const head=recent?.previousElementSibling;if(head?.classList.contains('section-heading'))head.classList.add('uaw-home-legacy');
  }

  function buildHero(home){
    const hero=home.querySelector('.workshop-banner');if(!hero)return;
    hero.innerHTML=`<div class="banner-left"><img src="logo.png?v=10" class="banner-logo" alt="Ultimate Automotive Works"></div><div class="banner-copy"><p class="banner-kicker">Workshop</p><h1>Vehicle<br>Inspection</h1><p class="banner-tagline">Fast. <span>Reliable.</span> Professional.</p><p class="banner-sub">Built for your iPhone.</p></div>`;
  }

  function buildActions(home){
    const buttons=[...home.querySelectorAll(':scope > button.big')];
    const newInspection=buttons.find(b=>String(b.getAttribute('onclick')||'').includes('startInspection'));
    const past=buttons.find(b=>String(b.getAttribute('onclick')||'').includes('showPastInspections'));
    if(newInspection){newInspection.classList.add('uaw-primary-action');newInspection.innerHTML='＋&nbsp;&nbsp; New Inspection'}
    if(past){past.classList.add('uaw-secondary-action');past.innerHTML='🗂&nbsp;&nbsp; View Past Inspections'}
  }

  function buildLaunch(home){
    const launch=home.querySelector('.workshop-launch');if(!launch)return;
    launch.dataset.v14='1';
    launch.innerHTML='';

    const notifySentinel=document.createElement('span');notifySentinel.id='notifyHomeTileV20';notifySentinel.className='uaw-home-sentinel';
    const monitorSentinel=document.createElement('span');monitorSentinel.id='monitorHomeTileV20';monitorSentinel.className='uaw-home-sentinel';
    launch.append(notifySentinel,monitorSentinel);

    launch.append(
      dashboardCard({icon:'▦',title:'Workshop Dashboard',copy:'Jobs, reminders & activity',accent:'red',action:()=>window.showWorkshopDashboard?.()}),
      dashboardCard({icon:'🚗',title:'Customers & Vehicles',copy:'Search by registration',accent:'blue',action:()=>window.showVehicles?.()}),
      dashboardCard({icon:'🧾',title:'Job Cards & Quotes',copy:'Work status & approvals',accent:'blue',action:()=>window.showJobs?.()}),
      dashboardCard({icon:'⚙️',title:'Workshop Pro',copy:'Bookings, invoices & profit',accent:'neutral',action:()=>goOperations('bookings')}),
      dashboardCard({icon:'⭐',title:'Loyalty & Rewards',copy:'Repeat customer points',accent:'red',action:()=>goOperations('loyalty')}),
      dashboardCard({icon:'🔔',title:'Notifications',copy:'Updates & reminders',accent:'blue',action:()=>goOperations('notifications')})
    );
    if(profile()?.role==='admin')launch.append(dashboardCard({icon:'🛡️',title:'Admin & Reliability',copy:'Users, settings & backups',accent:'purple',admin:true,action:()=>goOperations('admin')}));
  }

  function buildFooter(home){
    let footer=$('uawHomeStatusV25');
    if(!footer){
      footer=document.createElement('div');footer.id='uawHomeStatusV25';footer.className='uaw-home-status';
      footer.innerHTML='<span class="uaw-status-dot"></span><div class="uaw-status-copy"><b>Online • synced</b><small>All systems operational</small></div><div class="uaw-status-brand">Powered by<b>Ultimate Automotive Works</b></div>';
      home.appendChild(footer);
      const version=document.createElement('div');version.className='uaw-home-version';version.textContent=`Version ${window.WorkshopConfig?.version||'25.2.0'}`;home.appendChild(version);
    }
    updateStatus();
  }

  function updateStatus(){
    clearTimeout(statusTimer);statusTimer=setTimeout(()=>{
      const footer=$('uawHomeStatusV25');if(!footer)return;
      const copy=footer.querySelector('.uaw-status-copy');
      const count=window.WorkshopOffline?.count?.()||0;
      const online=navigator.onLine!==false;
      footer.classList.toggle('is-offline',!online);footer.classList.toggle('has-queue',online&&count>0);
      if(!online)copy.innerHTML=`<b>Offline mode</b><small>${count?`${count} change${count===1?'':'s'} waiting to sync`:'Work is saved on this device'}</small>`;
      else if(count)copy.innerHTML=`<b>${count} change${count===1?'':'s'} waiting</b><small>Will sync automatically</small>`;
      else copy.innerHTML='<b>Online • synced</b><small>All systems operational</small>';
    },30);
  }

  function homeState(){
    const active=$('home')?.classList.contains('active');
    document.body.classList.toggle('uaw-home-active',!!active);
  }

  function build(){
    ensureStyle();header();
    const home=$('home');if(!home)return;
    home.classList.add('uaw-home-v25');
    buildHero(home);buildActions(home);buildLaunch(home);markLegacy(home);buildFooter(home);homeState();
    if(!screenObserver){screenObserver=new MutationObserver(homeState);document.querySelectorAll('.screen').forEach(x=>screenObserver.observe(x,{attributes:true,attributeFilter:['class']}))}
  }

  window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);
  document.addEventListener('workshop-offline-queue',updateStatus);document.addEventListener('workshop-sync-complete',updateStatus);
  document.addEventListener('workshop-user-ready',()=>setTimeout(build,30));
  document.addEventListener('workshop:features-ready',()=>setTimeout(build,30));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
  setTimeout(build,400);
})();

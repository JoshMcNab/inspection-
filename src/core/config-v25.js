(()=>{
  const VERSION='26.7.0';
  const BASE='https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/';
  const GATEWAY=BASE+'workshop-gateway';

  const config={
    appName:'Ultimate Automotive Works Workshop',
    version:VERSION,
    assetVersion:'26.7',
    supabase:{base:BASE,gateway:GATEWAY},
    storage:{
      token:'workshopPinSession',
      profile:'workshopStaffProfile',
      mainBootstrap:'workshopOfflineCacheMainV20',
      proBootstrap:'workshopOfflineCacheProV20'
    },
    services:{
      auth:'workshop-auth',
      admin:'workshop-admin',
      pro:'workshop-pro',
      inspections:'workshop-inspections',
      restore:'workshop-restore',
      customer:'workshop-customer',
      progress:'workshop-progress',
      payments:'workshop-payments',
      quotes:'workshop-quotes',
      quote_requests:'workshop-quote-requests',
      sync:'workshop-sync',
      notify:'workshop-notify',
      monitor:'workshop-monitor',
      repair:'workshop-repair-data',
      parts:'workshop-parts'
    },
    legacyServiceMap:{
      'workshop-auth':'auth',
      'workshop-admin':'admin',
      'workshop-pro':'pro',
      'workshop-inspections':'inspections',
      'workshop-restore':'restore',
      'workshop-customer':'customer',
      'workshop-progress':'progress',
      'workshop-payments':'payments',
      'workshop-quotes':'quotes',
      'workshop-quote-requests':'quote_requests',
      'workshop-sync':'sync',
      'workshop-notify':'notify',
      'workshop-monitor':'monitor',
      'workshop-repair-data':'repair',
      'workshop-parts':'parts'
    },
    offlineBootstrapCache:{
      'workshop-inspections:workshop_bootstrap':'workshopOfflineCacheMainV20',
      'workshop-pro:bootstrap':'workshopOfflineCacheProV20'
    }
  };

  config.gatewayUrl=service=>`${GATEWAY}?service=${encodeURIComponent(service)}`;
  window.WorkshopConfig=Object.freeze(config);
})();

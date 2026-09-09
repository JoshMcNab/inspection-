(()=>{
  const BASE="https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/";
  const GATEWAY=BASE+"workshop-gateway";
  const nativeFetch=window.fetch.bind(window);
  const map={
    "workshop-inspections":"inspections",
    "workshop-pro":"pro"
  };

  function route(url){
    if(typeof url!=="string"||!url.startsWith(BASE)||url.startsWith(GATEWAY))return url;
    const fn=url.slice(BASE.length).split(/[?#]/)[0];
    const service=map[fn];
    return service?`${GATEWAY}?service=${service}`:url;
  }

  window.fetch=function(input,init){
    if(typeof input==="string")return nativeFetch(route(input),init);
    if(input instanceof Request){
      const routed=route(input.url);
      if(routed!==input.url)return nativeFetch(routed,{method:input.method,headers:input.headers,body:init?.body,signal:input.signal,...init});
    }
    return nativeFetch(input,init);
  };
})();
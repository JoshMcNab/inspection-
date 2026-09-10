(()=>{
const GATEWAY='https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-gateway';
const form=document.getElementById('quoteRequestForm');
const msg=document.getElementById('quoteFormMessage');
const submit=document.getElementById('submitQuoteRequest');
const photoInput=document.getElementById('qrPhotos');
const preview=document.getElementById('photoPreview');
const startedAt=Date.now();
const qs=new URLSearchParams(location.search);
const portalToken=qs.get('t')||'';
let photos=[];
const $=id=>document.getElementById(id);

async function api(service,action,payload={}){
  const r=await fetch(`${GATEWAY}?service=${encodeURIComponent(service)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload}),cache:'no-store'});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||'Unable to send quote request');
  return data;
}
function setValue(id,value){const el=$(id);if(el&&value!==null&&value!==undefined&&!el.value)el.value=String(value)}
function renderPhotos(){
  preview.innerHTML='';
  photos.forEach((file,index)=>{
    const wrap=document.createElement('div');wrap.className='photo-chip';
    const img=document.createElement('img');img.alt=`Selected photo ${index+1}`;img.src=URL.createObjectURL(file);
    img.onload=()=>URL.revokeObjectURL(img.src);
    const remove=document.createElement('button');remove.type='button';remove.setAttribute('aria-label','Remove photo');remove.textContent='×';remove.onclick=()=>{photos.splice(index,1);renderPhotos()};
    wrap.append(img,remove);preview.appendChild(wrap);
  });
}
photoInput?.addEventListener('change',()=>{
  const picked=[...photoInput.files||[]].filter(f=>String(f.type||'').startsWith('image/'));
  photos=[...photos,...picked].slice(0,3);photoInput.value='';renderPhotos();
});
$('qrReg')?.addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase()});
$('qrPostcode')?.addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase()});

function readAsDataURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Could not read one of the photos'));r.readAsDataURL(file)})}
async function photoPayload(file){
  const original=await readAsDataURL(file);
  try{
    const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=original});
    const max=1600,scale=Math.min(1,max/Math.max(img.naturalWidth||1,img.naturalHeight||1));
    const w=Math.max(1,Math.round((img.naturalWidth||1)*scale)),h=Math.max(1,Math.round((img.naturalHeight||1)*scale));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');
    ctx.drawImage(img,0,0,w,h);
    const compressed=canvas.toDataURL('image/jpeg',.82);
    if(compressed.length<7_000_000)return{name:(file.name||'quote-photo').replace(/\.[^.]+$/,'')+'.jpg',data_url:compressed};
  }catch(_){ }
  if(file.size>5_000_000)throw new Error(`${file.name||'A photo'} is too large. Please choose a smaller image.`);
  return{name:file.name||'quote-photo',data_url:original};
}

async function prefillFromPortal(){
  if(portalToken.length<32)return;
  try{
    const d=await api('customer','public_portal',{token:portalToken});
    setValue('qrName',d.customer?.name);setValue('qrPhone',d.customer?.phone);setValue('qrEmail',d.customer?.email);
    setValue('qrReg',d.vehicle?.registration);setValue('qrModel',d.vehicle?.make_model);setValue('qrYear',d.vehicle?.year);setValue('qrMileage',d.vehicle?.mileage);
    $('portalNotice')?.classList.remove('hidden');
  }catch(_){ }
}

form?.addEventListener('submit',async e=>{
  e.preventDefault();msg.textContent='';
  const name=$('qrName').value.trim(),phone=$('qrPhone').value.trim(),email=$('qrEmail').value.trim(),reg=$('qrReg').value.trim(),description=$('qrDescription').value.trim();
  if(!name||!reg||!description){msg.textContent='Please complete your name, registration and the work you need quoted.';return}
  if(!phone&&!email){msg.textContent='Please enter a phone number or email address.';return}
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent='Please enter a valid email address.';return}
  if(!$('qrConsent').checked){msg.textContent='Please confirm that we may contact you about the quote request.';return}
  submit.disabled=true;submit.firstChild.textContent='Sending… ';
  try{
    const encoded=[];for(const file of photos)encoded.push(await photoPayload(file));
    const result=await api('quote_requests','submit',{
      customer_name:name,phone,email,preferred_contact:$('qrPreferred').value,
      address:$('qrAddress').value.trim(),town_city:$('qrTownCity').value.trim(),postcode:$('qrPostcode').value.trim(),
      registration:reg,make_model:$('qrModel').value.trim(),year:$('qrYear').value.trim(),mileage:$('qrMileage').value,
      request_type:$('qrType').value,description,photos:encoded,consent_contact:true,website:$('qrWebsite').value,form_started_at:startedAt,user_agent:navigator.userAgent,portal_token:portalToken
    });
    form.classList.add('hidden');$('quoteReference').textContent=result.reference||'REQUEST RECEIVED';$('quoteSuccess').classList.remove('hidden');window.scrollTo({top:0,behavior:'smooth'});
  }catch(err){msg.textContent=err.message||'Unable to send the quote request. Please try again.';submit.disabled=false;submit.innerHTML='Send Quote Request <span>›</span>'}
});

prefillFromPortal();
})();

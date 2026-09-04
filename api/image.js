function b64(buf){return Buffer.from(buf).toString("base64")}
async function asDataUrl(url){try{const r=await fetch(url,{headers:{"User-Agent":"BandungBiruAI/1.0 (https://persib-media.vercel.app)"}});if(!r.ok)return "";const t=r.headers.get("content-type")||"image/jpeg";if(!t.startsWith("image/"))return "";const buf=await r.arrayBuffer();if(buf.byteLength<1000)return "";return "data:"+t+";base64,"+b64(buf)}catch(e){return ""}}

async function geminiGenerate(p,keys){
 for(const key of keys){
  if(!key||key.length<20)continue;
  let MODELS=["gemini-2.5-flash-image","gemini-2.5-flash-image-preview","gemini-3-flash-image","gemini-3-pro-image","gemini-2.0-flash-preview-image-generation"];
  try{const lr=await fetch("https://generativelanguage.googleapis.com/v1beta/models?key="+key+"&pageSize=500");
   const lj=await lr.json();
   if(lj.error&&/API_KEY_INVALID|invalid authentication/i.test(lj.error.message||""))continue;
   const imgm=((lj.models||[]).map(x=>(x.name||"").replace("models/",""))).filter(n=>/image|imagen|banana/i.test(n));
   if(imgm.length)MODELS=[...imgm,...MODELS];}catch(e){}
  for(const m of MODELS){
   try{const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});
    const j=await r.json();
    if(j.error&&/API_KEY_INVALID|invalid authentication/i.test(j.error.message||""))break;
    const parts=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];
    for(const pt of parts){if(pt.inlineData&&pt.inlineData.data)return "data:"+(pt.inlineData.mimeType||"image/png")+";base64,"+pt.inlineData.data}
   }catch(e){}
  }
 }
 return "";
}

async function hfGenerate(p,tok){
 try{
  const r=await fetch("https://router.huggingface.co/v1/images/generations",{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({model:"black-forest-labs/FLUX.1-schnell",prompt:p,n:1,size:"1024x1024"})});
  if(r.ok){const j=await r.json();const d=j.data&&j.data[0];
   if(d){if(d.b64_json)return "data:image/jpeg;base64,"+d.b64_json;if(d.url)return await asDataUrl(d.url)||d.url}}
 }catch(e){}
 for(const m of ["black-forest-labs/FLUX.1-schnell","stabilityai/stable-diffusion-xl-base-1.0"]){
  try{
   const r=await fetch("https://api-inference.huggingface.co/models/"+m,{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json","x-wait-for-model":"true"},body:JSON.stringify({inputs:p})});
   if(r.ok){const ct=r.headers.get("content-type")||"";if(ct.includes("image"))return "data:image/jpeg;base64,"+b64(await r.arrayBuffer())}
  }catch(e){}
 }
 return "";
}

async function qwenGenerate(p,key){
 for(const b of ["https://dashscope-intl.aliyuncs.com","https://dashscope.aliyuncs.com"]){
  for(const model of ["qwen-image-plus","qwen-image"]){
   try{
    const r=await fetch(b+"/api/v1/services/aigc/multimodal-generation/generation",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:model,input:{messages:[{role:"user",content:[{text:p}]}]},parameters:{size:"1024*1024",n:1}})});
    const j=await r.json();
    const c=j.output&&j.output.choices&&j.output.choices[0]&&j.output.choices[0].message&&j.output.choices[0].message.content;
    const img=c&&c[0]&&(c[0].image||c[0].image_url);
    if(img)return await asDataUrl(img)||img;
   }catch(e){}
  }
 }
 return "";
}

async function prodiaGenerate(p,key){
 try{
  const r=await fetch("https://api.prodia.com/v1/sdxl/generate",{method:"POST",headers:{"X-Prodia-Key":key,"Content-Type":"application/json"},body:JSON.stringify({prompt:p,negative_prompt:"text, watermark, logo, blurry, low quality",model:"sdxlv1.0.safetensors",steps:18,cfg_scale:7,width:1024,height:1024})});
  const j=await r.json();const id=j.job||j.id||j.jobId;if(!id)return "";
  for(let i=0;i<20;i++){await new Promise(rs=>setTimeout(rs,1500));
   try{
    const s=await fetch("https://api.prodia.com/v1/job/"+id,{headers:{"X-Prodia-Key":key}});
    const sj=await s.json();
    const st=(sj.status||"").toLowerCase();
    if(st==="succeeded"||st==="success"){const u=sj.imageUrl||sj.image_url||("https://images.prodia.xyz/"+id+".png");return await asDataUrl(u)||u}
    if(st==="failed")return "";
   }catch(e){}
  }
 }catch(e){}
 return "";
}

async function commonsFallback(prompt){
 const stop=/foto|photo|realistic|lens|text|logos|watermark|floodlights|candid|atmosphere|textures|depth|field|premium|newsroom|editorial|sports|photography|natural|shot|mm|no|tanpa|dengan|untuk|yang|dan|dari|pada/i;
 const base=(prompt.match(/[a-z0-9]{4,}/gi)||[]).filter(w=>!stop.test(w)).slice(0,3).join(" ");
 const queries=[base+" football stadium","football stadium","soccer player","football","stadium"];
 for(const qq of queries){
  try{
   const r=await fetch("https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch="+encodeURIComponent(qq)+"&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size&iiurlwidth=1200",{headers:{"User-Agent":"BandungBiruAI/1.0 (https://persib-media.vercel.app)"}});
   const j=await r.json();const ps=j&&j.query&&j.query.pages?Object.values(j.query.pages):[];
   for(const p of ps){const ii=p.imageinfo&&p.imageinfo[0];const u=ii&&(ii.thumburl||ii.url);if(u){const d=await asDataUrl(u);if(d)return d}}
  }catch(e){}
 }
 return "";
}

async function loremFallback(){
 for(const q of ["football,stadium","soccer","stadium"]){
  const d=await asDataUrl("https://loremflickr.com/1024/1024/"+q);
  if(d)return d;
 }
 return "";
}

export default async function handler(req,res){
 const p=(req.body&&req.body.prompt)||"";
 const keys=(process.env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);
 const hf=process.env.HF_TOKEN||"";
 const qk=process.env.QWEN_KEY||"";
 const pk=process.env.PRODIA_KEY||"";
 let last="";
 const g=await geminiGenerate(p,keys);
 if(g)return res.status(200).json({dataUrl:g,credit:"AI: NANO BANANA"});
 last="gemini: key/kuota tidak valid";
 if(hf){const h=await hfGenerate(p,hf);
  if(h)return res.status(200).json({dataUrl:h,credit:"AI: FLUX (HF)"});
  last+=" | hf: gagal"}
 if(qk){const q=await qwenGenerate(p,qk);
  if(q)return res.status(200).json({dataUrl:q,credit:"AI: QWEN-IMAGE"});
  last+=" | qwen: gagal"}
 if(pk){const pr=await prodiaGenerate(p,pk);
  if(pr)return res.status(200).json({dataUrl:pr,credit:"AI: PRODIA SDXL"});
  last+=" | prodia: gagal"}
 const cu=await commonsFallback(p);
 if(cu)return res.status(200).json({dataUrl:cu,credit:"📷 WIKIMEDIA COMMONS (CC)"});
 const lo=await loremFallback();
 if(lo)return res.status(200).json({dataUrl:lo,credit:"📷 LOREMFLICKR (CC)"});
 return res.status(200).json({error:"Semua generator gagal: "+last});
}

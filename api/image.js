async function commonsFallback(prompt){
 try{
  const stop=/foto|photo|realistic|lens|text|logos|watermark|stadium|floodlights|candid|atmosphere|textures|depth|field|premium|newsroom|editorial|sports|photography|natural|shot|mm|no|tanpa/i;
  const words=(prompt.match(/[a-z0-9]{4,}/gi)||[]).filter(w=>!stop.test(w)).slice(0,3).join(" ")||"football";
  const r=await fetch("https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch="+encodeURIComponent(words+" football stadium")+"&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size&iiurlwidth=1200");
  const j=await r.json();
  const ps=j&&j.query&&j.query.pages?Object.values(j.query.pages):[];
  for(const p of ps){const ii=p.imageinfo&&p.imageinfo[0];const u=ii&&(ii.thumburl||ii.url);if(u)return u}
 }catch(e){}
 return "";
}
export default async function handler(req,res){
 const keys=(process.env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);
 const p=(req.body&&req.body.prompt)||"";
 let last="";
 for(const key of keys){
  let MODELS=["gemini-2.5-flash-image","gemini-2.5-flash-image-preview","gemini-3-flash-image","gemini-3-pro-image","gemini-2.0-flash-preview-image-generation"];
  try{
   const lr=await fetch("https://generativelanguage.googleapis.com/v1beta/models?key="+key+"&pageSize=500");
   const lj=await lr.json();
   const imgm=((lj.models||[]).map(x=>(x.name||"").replace("models/",""))).filter(n=>/image|imagen|banana/i.test(n));
   if(imgm.length)MODELS=[...imgm,...MODELS];
  }catch(e){}
  for(const m of MODELS){
   try{
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});
    const j=await r.json();
    if(j.error){last=m+": "+j.error.message;continue}
    const parts=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];
    for(const pt of parts){if(pt.inlineData&&pt.inlineData.data)return res.status(200).json({dataUrl:"data:"+(pt.inlineData.mimeType||"image/png")+";base64,"+pt.inlineData.data,model:m})}
    last=m+": tanpa inlineData";
   }catch(e){last=m+": "+e.message}
  }
 }
 const cu=await commonsFallback(p);
 if(cu)return res.status(200).json({url:cu,credit:"📷 WIKIMEDIA COMMONS (CC)"});
 return res.status(200).json({error:"Gemini & Commons gagal: "+last});
}

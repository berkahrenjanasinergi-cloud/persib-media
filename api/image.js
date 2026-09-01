export default async function handler(req,res){
 const keys=(process.env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);
 const p=(req.body&&req.body.prompt)||"";
 if(!keys.length)return res.status(200).json({error:"GEMINI_KEY belum ada"});
 let last="";
 for(const key of keys){
  let MODELS=["gemini-2.5-flash-image","gemini-2.5-flash-image-preview","gemini-3-flash-image","gemini-3-pro-image","gemini-2.0-flash-preview-image-generation"];
  try{
   const lr=await fetch("https://generativelanguage.googleapis.com/v1beta/models?key="+key);
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
 return res.status(200).json({error:"Semua model gambar gagal (kuota gratis habis atau model berganti). Tambah key kedua dipisah koma di GEMINI_KEY. Detail: "+last});
}

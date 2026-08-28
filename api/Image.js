 export default async function handler(req,res){
 const key=process.env.GEMINI_KEY;const p=(req.body&&req.body.prompt)||"";
 if(!key)return res.status(200).json({error:"GEMINI_KEY belum ada"});
 const MODELS=["gemini-2.5-flash-image","gemini-2.0-flash-preview-image-generation"];
 let last="";
 for(const m of MODELS){
  try{
   const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});
   const j=await r.json();
   const parts=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];
   for(const pt of parts){if(pt.inlineData&&pt.inlineData.data)return res.status(200).json({dataUrl:"data:"+(pt.inlineData.mimeType||"image/png")+";base64,"+pt.inlineData.data,model:m})}
   last=(j.error&&j.error.message)||("http "+r.status);
  }catch(e){last=e.message}
 }
 return res.status(200).json({error:"Gemini image gagal: "+last});
}

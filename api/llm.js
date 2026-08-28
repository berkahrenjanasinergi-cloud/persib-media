export default async function handler(req,res){
 const key=process.env.GEMINI_KEY;
 const p=(req.body&&req.body.prompt)||"";
 if(!key) return res.status(200).json({error:"GEMINI_KEY belum ada di env Vercel"});
 const MODELS=["gemini-2.5-flash","gemini-2.5-flash-lite","gemini-2.0-flash","gemini-2.0-flash-lite"];
 let last="";
 for(const m of MODELS){
  try{
   const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});
   const j=await r.json();
   if(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts&&j.candidates[0].content.parts[0]&&j.candidates[0].content.parts[0].text){
    return res.status(200).json({text:j.candidates[0].content.parts[0].text.trim(),model:m});
   }
   last=(j.error&&j.error.message)||("http "+r.status);
  }catch(e){last=e.message}
 }
 return res.status(200).json({error:"Semua model gagal: "+last});
}

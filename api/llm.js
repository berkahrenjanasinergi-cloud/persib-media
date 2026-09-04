export default async function handler(req,res){
 const keys=(process.env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);
 const p=(req.body&&req.body.prompt)||"";
 if(!keys.length)return res.status(200).json({error:"GEMINI_KEY belum ada"});
 let last="";
 for(const key of keys){
  let MODELS=["gemini-2.5-flash","gemini-2.5-flash-lite","gemini-2.0-flash","gemini-2.0-flash-lite"];
  try{
   const lr=await fetch("https://generativelanguage.googleapis.com/v1beta/models?key="+key+"&pageSize=500");
   const lj=await lr.json();
   const tm=((lj.models||[]).map(x=>(x.name||"").replace("models/",""))).filter(n=>/flash|lite|pro/.test(n)&&!/image|imagen|tts|embedding|live/i.test(n));
   if(tm.length)MODELS=[...tm.slice(0,8),...MODELS];
  }catch(e){}
  for(const m of MODELS){
   try{
    const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});
    const j=await r.json();
    if(j.error){last=m+": "+j.error.message;continue}
    const t=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts&&j.candidates[0].content.parts[0]&&j.candidates[0].content.parts[0].text;
    if(t)return res.status(200).json({text:t.trim(),model:m});
    last=m+": tanpa text";
   }catch(e){last=m+": "+e.message}
  }
 }
 return res.status(200).json({error:"Semua model gagal: "+last});
}

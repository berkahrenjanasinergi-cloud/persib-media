export default async function handler(req,res){
 const key=process.env.GEMINI_KEY;const p=(req.body&&req.body.prompt)||"";
 if(!key)return res.status(200).json({text:null});
 for(const m of ["gemini-2.5-flash","gemini-2.0-flash","gemini-2.0-flash-lite"]){
  try{
   const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});
   const j=await r.json();
   const t=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts&&j.candidates[0].content.parts[0]&&j.candidates[0].content.parts[0].text;
   if(t)return res.status(200).json({text:t.trim()});
  }catch(e){}
 }
 return res.status(200).json({text:null});
}

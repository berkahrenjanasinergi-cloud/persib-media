export default async function handler(req,res){
 const key=process.env.ARK_API_KEY;
 const base=process.env.ARK_BASE||"https://ark.ap-southeast.byteplusapi.com";
 const model=process.env.ARK_MODEL||"doubao-seedance-1-0-lite-250428";
 if(!key)return res.status(200).json({error:"Seedance butuh ARK_API_KEY (BytePlus/Volcano Ark). Daftar console.byteplus.com → aktivasi Seedance → isi env Vercel (biasanya ada kredit trial). Tidak ada Seedance gratis tanpa key — ini jalur resminya."});
 if(req.query.task){
  try{
   const r=await fetch(base+"/v1/contents/generations/tasks/"+req.query.task,{headers:{Authorization:"Bearer "+key}});
   const j=await r.json();
   if(j.status==="succeeded"&&j.content&&j.content.video_url)return res.status(200).json({url:j.content.video_url});
   if(j.status==="failed")return res.status(200).json({error:(j.error&&j.error.message)||"task gagal"});
   return res.status(200).json({status:j.status||"running"});
  }catch(e){return res.status(200).json({error:String(e.message||e)})}
 }
 try{
  const p=(req.body&&req.body.prompt)||"";
  const r=await fetch(base+"/v1/contents/generations/tasks",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:model,content:[{type:"text",text:p}]})});
  const j=await r.json();
  if(j.id)return res.status(200).json({id:j.id});
  return res.status(200).json({error:(j.error&&j.error.message)||JSON.stringify(j).slice(0,200)});
 }catch(e){return res.status(200).json({error:String(e.message||e)})}
}

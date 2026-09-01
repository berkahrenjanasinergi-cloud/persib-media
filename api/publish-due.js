import {publishTo} from ".lib/publish-lib.js";
const H=K=>({apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"});
export default async function handler(req,res){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
 if(!U||!K)return res.json({note:"supabase not configured"});
 const due=await(await fetch(`${U}/rest/v1/posts?status=eq.scheduled&scheduled_at=lte.${new Date().toISOString()}`,{headers:H(K)})).json();
 const results=[];
 for(const p of due||[]){
  const r=await publishTo({platform:p.platform,message:p.content,imageUrl:p.image_url,videoUrl:p.video_url},process.env);
  await fetch(`${U}/rest/v1/posts?id=eq.${p.id}`,{method:"PATCH",headers:H(K),body:JSON.stringify({status:r.ok?"published":"failed",result:r.ok?"auto":(r.error||"").slice(0,120)})});
  await fetch(`${U}/rest/v1/events`,{method:"POST",headers:H(K),body:JSON.stringify({id:Date.now(),kind:r.ok?"publish_ok":"publish_fail",meta:{platform:p.platform}})});
  results.push({platform:p.platform,ok:!!r.ok});
 }
 res.json({processed:results.length,results});
}

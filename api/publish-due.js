import {publishTo} from "../lib/publish-lib.js";
export default async function handler(req,res){
 try{
  const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
  const H={apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"};
  const due=await(await fetch(U+"/rest/v1/posts?status=eq.scheduled&scheduled_at=lte."+new Date().toISOString()+"&limit=5",{headers:H})).json();
  const results=[];
  for(const p of (due||[])){
   const j=await publishTo({platform:p.platform,message:p.content,image_url:p.image_url,video_url:p.video_url},process.env);
   await fetch(U+"/rest/v1/posts?id=eq."+p.id,{method:"PATCH",headers:H,body:JSON.stringify(j.ok?{status:"published",result:"real"}:{status:"failed",result:(j.error||"").slice(0,100)})});
   results.push({platform:p.platform,ok:!!j.ok});
  }
  res.status(200).json({processed:results.length,results});
 }catch(e){res.status(200).json({processed:0,results:[],error:String(e.message||e)})}
}

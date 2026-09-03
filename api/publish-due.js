export default async function handler(req,res){
 try{
  const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
  const H={apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"};
  const due=await(await fetch(U+"/rest/v1/posts?status=eq.scheduled&scheduled_at=lte."+new Date().toISOString()+"&limit=5",{headers:H})).json();
  const base="https://"+(process.env.VERCEL_PROJECT_PRODUCTION_DOMAIN||"persib-media.vercel.app");
  const results=[];
  for(const p of (due||[])){
   let j={ok:false,error:"publish error"};
   try{const r=await fetch(base+"/api/publish",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({platform:p.platform,message:p.content,imageUrl:p.image_url,videoUrl:p.video_url})});j=await r.json()}catch(e){j={ok:false,error:String(e.message||e)}}
   await fetch(U+"/rest/v1/posts?id=eq."+p.id,{method:"PATCH",headers:H,body:JSON.stringify(j.ok?{status:"published",result:"real"}:{status:"failed",result:(j.error||"").slice(0,100)})});
   results.push({platform:p.platform,ok:!!j.ok});
  }
  res.status(200).json({processed:results.length,results});
 }catch(e){res.status(200).json({processed:0,results:[],error:String(e.message||e)})}
}

const H=K=>({apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"});
const G="https://graph.facebook.com/v21.0";
export async function getConn(U,K,p){const r=await(await fetch(`${U}/rest/v1/connections?id=eq.${p}`,{headers:H(K)})).json();return (r||[])[0]}
async function graph(path,body){const r=await fetch(G+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json();if(j.error)throw new Error(j.error.message);return j}
export async function publishTo({platform,message,imageUrl,videoUrl},env){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;message=message||"";
 try{
  if(platform==="telegram"&&env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_CHAT_ID){const r=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:message})});return r.ok?{ok:true}:{ok:false,error:"telegram"}}
  if(platform==="discord"&&env.DISCORD_WEBHOOK){const r=await fetch(env.DISCORD_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:message})});return r.ok?{ok:true}:{ok:false,error:"discord"}}
  const conn=await getConn(U,K,platform);
  if(!conn)return{ok:false,error:platform+" belum terhubung via OAuth"};
  if(platform==="facebook"){
   if(imageUrl)return{ok:true,id:(await graph(`/${conn.account_id}/photos`,{url:imageUrl,caption:message,access_token:conn.access_token})).id};
   return{ok:true,id:(await graph(`/${conn.account_id}/feed`,{message,access_token:conn.access_token})).id};
  }
  if(platform==="instagram"){
   const img=imageUrl||("https://image.pollinations.ai/prompt/"+encodeURIComponent("Persib Bandung football media: "+message.slice(0,200))+"?width=1024&height=1024&nologo=true");
   const body=videoUrl?{media_type:"VIDEO",video_url:videoUrl,caption:message,access_token:conn.access_token}:{image_url:img,caption:message,access_token:conn.access_token};
   const c=await graph(`/${conn.account_id}/media`,body);
   return{ok:true,id:(await graph(`/${conn.account_id}/media_publish`,{creation_id:c.id,access_token:conn.access_token})).id};
  }
  if(platform==="tiktok"){
   if(!videoUrl)return{ok:false,error:"TikTok butuh URL video publik (source PULL_FROM_URL)."};
   let tok=conn.access_token;
   if(conn.expires_at&&new Date(conn.expires_at)<new Date()&&conn.refresh_token){
    const t=await(await fetch("https://open.tiktokapis.com/v2/oauth/token/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_key:env.TIKTOK_CLIENT_KEY,client_secret:env.TIKTOK_CLIENT_SECRET,grant_type:"refresh_token",refresh_token:conn.refresh_token})})).json();
    if(t.access_token){tok=t.access_token;await fetch(`${U}/rest/v1/connections?id=eq.tiktok`,{method:"PATCH",headers:H(K),body:JSON.stringify({access_token:t.access_token,refresh_token:t.refresh_token,expires_at:new Date(Date.now()+(t.expires_in||86400)*1000).toISOString()})});}
   }
   const r=await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/",{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({post_info:{title:message.slice(0,2200),privacy_level:"EVERYONE",disable_duet:false,disable_comment:false,disable_stitch:false,brand_content_toggle:false,user_generated_content_toggle:true},source_info:{source:"PULL_FROM_URL",video_url:videoUrl}})});
   const j=await r.json();if(!r.ok)throw new Error(j.error?.message||"tiktok");return{ok:true};
  }
  return{ok:false,error:"platform tidak didukung"};
 }catch(e){return{ok:false,error:String(e.message||e)}}
}
export default async function handler(req,res){res.status(404).json({ok:false})}

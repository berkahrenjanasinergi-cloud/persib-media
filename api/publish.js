const H=K=>({apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"});
const G="https://graph.facebook.com/v21.0";
async function graph(path,body){const r=await fetch(G+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json();if(j.error)throw new Error(j.error.message);return j}
async function getConn(U,K,p){const r=await(await fetch(U+"/rest/v1/connections?id=eq."+p,{headers:H(K)})).json();return (r||[])[0]}
async function geminiImage(prompt,env){
 const keys=(env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);
 for(const key of keys){
  let MODELS=["gemini-2.5-flash-image","gemini-2.5-flash-image-preview","gemini-3-flash-image","gemini-3-pro-image"];
  try{const lr=await fetch("https://generativelanguage.googleapis.com/v1beta/models?key="+key+"&pageSize=500");const lj=await lr.json();
   const imgm=((lj.models||[]).map(x=>(x.name||"").replace("models/",""))).filter(n=>/image|imagen|banana/i.test(n));
   if(imgm.length)MODELS=[...imgm,...MODELS];}catch(e){}
  for(const m of MODELS){
   try{const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})});
    const j=await r.json();
    const parts=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];
    for(const pt of parts){if(pt.inlineData&&pt.inlineData.data)return "data:"+(pt.inlineData.mimeType||"image/png")+";base64,"+pt.inlineData.data}
   }catch(e){}
  }
 }
 return "";
}
async function storeImage(dataUrl,env,name){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;
 try{const blob=await (await fetch(dataUrl)).blob();
  const r=await fetch(U+"/storage/v1/object/media/"+name,{method:"POST",headers:{apikey:K,Authorization:"Bearer "+K,"Content-Type":"image/png"},body:blob});
  if(r.ok)return U+"/storage/v1/object/public/media/"+name;}catch(e){}
 return "";
}
async function publishTo({platform,message,imageUrl,videoUrl},env){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;message=message||"";
 try{
  if(platform==="telegram"&&env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_CHAT_ID){const r=await fetch("https://api.telegram.org/bot"+env.TELEGRAM_BOT_TOKEN+"/sendMessage",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:message})});return r.ok?{ok:true}:{ok:false,error:"telegram"}}
  if(platform==="discord"&&env.DISCORD_WEBHOOK){const r=await fetch(env.DISCORD_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:message})});return r.ok?{ok:true}:{ok:false,error:"discord"}}
  const conn=await getConn(U,K,platform);
  if(!conn)return{ok:false,error:platform+" belum terhubung via OAuth"};
  if(platform==="facebook"){
   if(imageUrl)return{ok:true,id:(await graph("/"+conn.account_id+"/photos",{url:imageUrl,caption:message,access_token:conn.access_token})).id};
   return{ok:true,id:(await graph("/"+conn.account_id+"/feed",{message:message,access_token:conn.access_token})).id};
  }
  if(platform==="instagram"){
   if(!conn.account_id||!conn.access_token)return{ok:false,error:"Koneksi IG tidak lengkap — hubungkan ulang di Social Manager."};
   let img=imageUrl||"";
   if(!img){const d=await geminiImage("Photorealistic editorial sports photography, "+message.slice(0,120)+", natural stadium floodlights, no text, no logos",env);
    if(d)img=await storeImage(d,env,"auto-"+Date.now()+".png");}
   if(!img)return{ok:false,error:"Gambar tidak tersedia — lampirkan gambar lalu Retry."};
   const c=await graph("/"+conn.account_id+"/media",{image_url:img,caption:message.slice(0,2000),access_token:conn.access_token});
   let p;
   try{p=await graph("/"+conn.account_id+"/media_publish",{creation_id:c.id,access_token:conn.access_token})}
   catch(ep){await new Promise(r=>setTimeout(r,2500));p=await graph("/"+conn.account_id+"/media_publish",{creation_id:c.id,access_token:conn.access_token})}
   return{ok:true,id:p.id};
  }
  if(platform==="tiktok"){
   if(!videoUrl)return{ok:false,error:"TikTok butuh URL video publik."};
   let tok=conn.access_token;
   if(conn.expires_at&&new Date(conn.expires_at)<new Date()&&conn.refresh_token){
    const t=await(await fetch("https://open.tiktokapis.com/v2/oauth/token/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_key:env.TIKTOK_CLIENT_KEY,client_secret:env.TIKTOK_CLIENT_SECRET,grant_type:"refresh_token",refresh_token:conn.refresh_token})})).json();
    if(t.access_token){tok=t.access_token;await fetch(U+"/rest/v1/connections?id=eq.tiktok",{method:"PATCH",headers:H(K),body:JSON.stringify({access_token:t.access_token,refresh_token:t.refresh_token,expires_at:new Date(Date.now()+(t.expires_in||86400)*1000).toISOString()})});}
   }
   const r=await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/",{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({post_info:{title:message.slice(0,2200),privacy_level:"EVERYONE",disable_duet:false,disable_comment:false,disable_stitch:false,brand_content_toggle:false,user_generated_content_toggle:true},source_info:{source:"PULL_FROM_URL",video_url:videoUrl}})});
   const j=await r.json();if(!r.ok)throw new Error((j.error&&j.error.message)||"tiktok");return{ok:true};
  }
  return{ok:false,error:"platform tidak didukung"};
 }catch(e){return{ok:false,error:String(e.message||e)}}
}
export default async function handler(req,res){
 try{const j=await publishTo(req.body||{},process.env);res.status(200).json(j)}
 catch(e){res.status(200).json({ok:false,error:String(e.message||e)})}
}

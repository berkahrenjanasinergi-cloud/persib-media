const H=K=>({apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"});
export default async function handler(req,res){
 const {TIKTOK_CLIENT_KEY:CK,TIKTOK_CLIENT_SECRET:CS,SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
 const redirect="https://"+req.headers.host+"/api/oauth-tiktok-callback";
 try{
  const t=await(await fetch("https://open.tiktokapis.com/v2/oauth/token/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_key:CK,client_secret:CS,code:req.query.code,grant_type:"authorization_code",redirect_uri:redirect})})).json();
  if(!t.access_token)throw new Error(t.message||"gagal token");
  const me=await(await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name",{headers:{Authorization:"Bearer "+t.access_token}})).json();
  await fetch(`${U}/rest/v1/connections?id=eq.tiktok`,{method:"DELETE",headers:H(K)});
  await fetch(`${U}/rest/v1/connections`,{method:"POST",headers:H(K),body:JSON.stringify({id:"tiktok",platform:"tiktok",account_name:me.data?.display_name||me.data?.username||"TikTok",account_id:me.data?.open_id,access_token:t.access_token,refresh_token:t.refresh_token,expires_at:new Date(Date.now()+(t.expires_in||86400)*1000).toISOString()})});
  res.redirect("/?connected=TikTok");
 }catch(e){res.redirect("/?connect_error="+encodeURIComponent(String(e.message||e)))}
}
const H=K=>({apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"});
export default async function handler(req,res){
 const {META_APP_ID:A,META_APP_SECRET:S,SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
 const redirect="https://"+req.headers.host+"/api/oauth-meta-callback";
 try{
  const r=await(await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?client_id=${A}&client_secret=${S}&redirect_uri=${encodeURIComponent(redirect)}&code=${req.query.code}`)).json();
  if(!r.access_token)throw new Error(r.error_message||"gagal token");
  const l=await(await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${A}&client_secret=${S}&fb_exchange_token=${r.access_token}`)).json();
  const long=l.access_token||r.access_token;
  const acc=await(await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${long}`)).json();
  const page=(acc.data||[])[0];
  if(!page)throw new Error("Tidak ada Facebook Page. Buat Page & tautkan IG Business dulu.");
  await fetch(`${U}/rest/v1/connections?id=eq.facebook`,{method:"DELETE",headers:H(K)});
  await fetch(`${U}/rest/v1/connections`,{method:"POST",headers:H(K),body:JSON.stringify({id:"facebook",platform:"facebook",account_name:page.name,account_id:page.id,access_token:page.access_token})});
  const ig=page.instagram_business_account;
  if(ig){await fetch(`${U}/rest/v1/connections?id=eq.instagram`,{method:"DELETE",headers:H(K)});
   await fetch(`${U}/rest/v1/connections`,{method:"POST",headers:H(K),body:JSON.stringify({id:"instagram",platform:"instagram",account_name:"@"+(ig.username||ig.id),account_id:ig.id,access_token:page.access_token})});
   res.redirect("/?connected=Facebook+Instagram");}
  else res.redirect("/?connected=Facebook+(IG tidak ditemukan: tautkan IG Business ke Page)");
 }catch(e){res.redirect("/?connect_error="+encodeURIComponent(String(e.message||e)))}
}
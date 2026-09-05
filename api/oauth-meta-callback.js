const G="https://graph.facebook.com/v21.0";
export default async function handler(req,res){
 const {META_APP_ID:ID,META_APP_SECRET:SEC,SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
 const redirect=process.env.META_REDIRECT_URI||("https://"+(process.env.VERCEL_PROJECT_PRODUCTION_DOMAIN||"persib-media.vercel.app")+"/api/oauth-meta-callback");
 const code=req.query.code||"";
 const fail=m=>res.redirect("/?connect_error="+encodeURIComponent(m));
 if(!code)return fail("no code");
 try{
  const t1=await(await fetch(G+"/oauth/access_token?client_id="+ID+"&client_secret="+SEC+"&redirect_uri="+encodeURIComponent(redirect)+"&code="+code)).json();
  if(!t1.access_token)return fail((t1.error&&t1.error.message)||"token exchange gagal");
  const t2=await(await fetch(G+"/oauth/access_token?grant_type=fb_exchange_token&client_id="+ID+"&client_secret="+SEC+"&fb_exchange_token="+encodeURIComponent(t1.access_token))).json();
  const userTok=t2.access_token||t1.access_token;
  const acc=await(await fetch(G+"/me/accounts?access_token="+encodeURIComponent(userTok))).json();
  const page=(acc.data||[])[0];
  if(!page)return fail("tidak ada Page Facebook");
  const ig=await(await fetch(G+"/"+page.id+"?fields=instagram_business_account&access_token="+encodeURIComponent(page.access_token))).json();
  if(!ig.instagram_business_account)return fail("Page belum terhubung ke Instagram Business");
  const H={apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"};
  await fetch(U+"/rest/v1/connections?id=eq.instagram",{method:"DELETE",headers:H});
  await fetch(U+"/rest/v1/connections?id=eq.facebook",{method:"DELETE",headers:H});
  await fetch(U+"/rest/v1/connections",{method:"POST",headers:H,body:JSON.stringify({platform:"instagram",account_id:ig.instagram_business_account.id,account_name:"@"+(ig.instagram_business_account.username||"akun"),access_token:page.access_token,expires_at:new Date(Date.now()+60*86400e3).toISOString()})});
  await fetch(U+"/rest/v1/connections",{method:"POST",headers:H,body:JSON.stringify({platform:"facebook",account_id:page.id,account_name:page.name,access_token:page.access_token,expires_at:new Date(Date.now()+60*86400e3).toISOString()})});
  res.redirect("/?connected=Instagram+Facebook+(long-lived)");
 }catch(e){return fail(String(e.message||e))}
}

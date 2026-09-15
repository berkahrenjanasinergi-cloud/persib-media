const G="https://graph.facebook.com/v21.0";
export default async function handler(req,res){
 const {META_APP_ID:ID,META_APP_SECRET:SEC,SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
 const redirect=process.env.META_REDIRECT_URI||("https://"+(process.env.VERCEL_PROJECT_PRODUCTION_DOMAIN||"persib-media.vercel.app")+"/api/oauth-meta-callback");
 const fail=m=>res.redirect("/?connect_error="+encodeURIComponent(String(m).slice(0,300)));
 if(req.query.error)return fail(req.query.error_description||req.query.error);
 const code=req.query.code||"";
 if(!code)return fail("tidak ada code dari Facebook");
 try{
  const t1=await(await fetch(G+"/oauth/access_token?client_id="+ID+"&client_secret="+SEC+"&redirect_uri="+encodeURIComponent(redirect)+"&code="+encodeURIComponent(code))).json();
  if(!t1.access_token)return fail((t1.error&&t1.error.message)||JSON.stringify(t1).slice(0,200));
  const t2=await(await fetch(G+"/oauth/access_token?grant_type=fb_exchange_token&client_id="+ID+"&client_secret="+SEC+"&fb_exchange_token="+encodeURIComponent(t1.access_token))).json();
  const userTok=t2.access_token||t1.access_token;
  const acc=await(await fetch(G+"/me/accounts?access_token="+encodeURIComponent(userTok))).json();
  const page=(acc.data||[])[0];
  if(!page)return fail("Akun Facebook-mu tidak punya Page/Fanpage. Buat Page dulu di Facebook.");
  const ig=await(await fetch(G+"/"+page.id+"?fields=instagram_business_account&access_token="+encodeURIComponent(page.access_token))).json();
  if(!ig.instagram_business_account)return fail("Page '"+page.name+"' belum ditautkan ke akun Instagram Business/Creator. Tautkan lewat Pengaturan Page → Linked Accounts.");
  const H={apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"};
  await fetch(U+"/rest/v1/connections?id=eq.instagram",{method:"DELETE",headers:H});
  await fetch(U+"/rest/v1/connections?id=eq.facebook",{method:"DELETE",headers:H});
  const r1=await fetch(U+"/rest/v1/connections",{method:"POST",headers:H,body:JSON.stringify({id:"instagram",platform:"instagram",account_id:ig.instagram_business_account.id,account_name:"@"+(ig.instagram_business_account.username||"akun"),access_token:page.access_token,expires_at:new Date(Date.now()+60*86400e3).toISOString()})});
  const r2=await fetch(U+"/rest/v1/connections",{method:"POST",headers:H,body:JSON.stringify({id:"facebook",platform:"facebook",account_id:page.id,account_name:page.name,access_token:page.access_token,expires_at:new Date(Date.now()+60*86400e3).toISOString()})});
  if(!r1.ok||!r2.ok)return fail("Gagal simpan koneksi ke Supabase: "+(await r1.text()).slice(0,150));
  res.redirect("/?connected=Instagram+%26+Facebook+(long-lived+60+hari)");
 }catch(e){return fail(e.message||e)}
}

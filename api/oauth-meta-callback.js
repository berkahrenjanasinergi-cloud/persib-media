const H=K=>({apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"});
export default async function handler(req,res){
 const {META_APP_ID:A,META_APP_SECRET:S,SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
 const redirect="https://"+req.headers.host+"/api/oauth-meta-callback";
 try{
  const r=await(await fetch("https://graph.facebook.com/v21.0/oauth/access_token?client_id="+A+"&client_secret="+S+"&redirect_uri="+encodeURIComponent(redirect)+"&code="+req.query.code)).json();
  if(!r.access_token)throw new Error("Gagal token: "+(r.error_message||JSON.stringify(r)));
  const l=await(await fetch("https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id="+A+"&client_secret="+S+"&fb_exchange_token="+r.access_token)).json();
  const long=l.access_token||r.access_token;
  const acc=await(await fetch("https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token="+long)).json();
  if(acc.error)throw new Error("Facebook bilang: "+acc.error.message);
  const pages=acc.data||[];
  if(!pages.length)throw new Error("Akun yang login tidak mengelola Page manapun. Loginlah dengan akun admin Page.");
  const page=pages[0];
  await fetch(U+"/rest/v1/connections?id=eq.facebook",{method:"DELETE",headers:H(K)});
  await fetch(U+"/rest/v1/connections",{method:"POST",headers:H(K),body:JSON.stringify({id:"facebook",platform:"facebook",account_name:page.name,account_id:page.id,access_token:page.access_token})});
  const ig=page.instagram_business_account;
  if(ig){
   await fetch(U+"/rest/v1/connections?id=eq.instagram",{method:"DELETE",headers:H(K)});
   await fetch(U+"/rest/v1/connections",{method:"POST",headers:H(K),body:JSON.stringify({id:"instagram",platform:"instagram",account_name:"@"+(ig.username||ig.id),account_id:ig.id,access_token:page.access_token})});
   res.redirect("/?connected="+encodeURIComponent("Facebook + Instagram @"+(ig.username||"")+" TERHUBUNG"));
  }else{
   res.redirect("/?connect_error="+encodeURIComponent("Facebook OK, tapi Page '"+page.name+"' belum punya Instagram tertaut. Tautkan di: Pengaturan Page → Akun tertaut → Instagram."));
  }
 }catch(e){res.redirect("/?connect_error="+encodeURIComponent(String(e.message||e)))}
}

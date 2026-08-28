const H=K=>({apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"});
export default async function handler(req,res){
 const {META_APP_ID:A,META_APP_SECRET:S,SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
 const redirect="https://"+req.headers.host+"/api/oauth-meta-callback";
 const G="https://graph.facebook.com/v21.0";
 try{
  const r=await(await fetch(G+"/oauth/access_token?client_id="+A+"&client_secret="+S+"&redirect_uri="+encodeURIComponent(redirect)+"&code="+req.query.code)).json();
  if(!r.access_token)throw new Error("Gagal token: "+(r.error_message||JSON.stringify(r)));
  const l=await(await fetch(G+"/oauth/access_token?grant_type=fb_exchange_token&client_id="+A+"&client_secret="+S+"&fb_exchange_token="+r.access_token)).json();
  const long=l.access_token||r.access_token;
  const acc=await(await fetch(G+"/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100&access_token="+long)).json();
  let page=(acc.data||[])[0];let via="";
  if(!page){
   const biz=await(await fetch(G+"/me/businesses?access_token="+long)).json();
   for(const b of (biz.data||[])){
    const op=await(await fetch(G+"/"+b.id+"/owned_pages?fields=id,name&limit=50&access_token="+long)).json();
    if((op.data||[]).length){page=op.data[0];via=" (via bisnis)";break}
   }
  }
  if(!page)throw new Error("SINAR-X: akun ini tetap tidak melihat Page sama sekali.");
  const full=await(await fetch(G+"/"+page.id+"?fields=id,name,access_token,instagram_business_account{id,username}&access_token="+long)).json();
  if(!full.access_token)throw new Error("Page '"+page.name+"' ditemukan"+via+" tapi token Halaman tidak bisa diambil.");
  const ig=full.instagram_business_account;
  await fetch(U+"/rest/v1/connections?id=eq.facebook",{method:"DELETE",headers:H(K)});
  await fetch(U+"/rest/v1/connections",{method:"POST",headers:H(K),body:JSON.stringify({id:"facebook",platform:"facebook",account_name:full.name||page.name,account_id:full.id,access_token:full.access_token})});
  if(ig){
   await fetch(U+"/rest/v1/connections?id=eq.instagram",{method:"DELETE",headers:H(K)});
   await fetch(U+"/rest/v1/connections",{method:"POST",headers:H(K),body:JSON.stringify({id:"instagram",platform:"instagram",account_name:"@"+(ig.username||ig.id),account_id:ig.id,access_token:full.access_token})});
   res.redirect("/?connected="+encodeURIComponent("Facebook + Instagram @"+(ig.username||"")+" TERHUBUNG"+via));
  }else{
   res.redirect("/?connect_error="+encodeURIComponent("Facebook OK ("+(full.name||page.name)+") tapi IG belum tertaut ke Page."));
  }
 }catch(e){res.redirect("/?connect_error="+encodeURIComponent(String(e.message||e)))}
}

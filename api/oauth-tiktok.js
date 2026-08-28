export default function handler(req,res){
 const CK=process.env.TIKTOK_CLIENT_KEY;
 if(!CK)return res.status(500).json({error:"TIKTOK_CLIENT_KEY belum diset"});
 const redirect=encodeURIComponent("https://"+req.headers.host+"/api/oauth-tiktok-callback");
 res.redirect("https://www.tiktok.com/v2/auth/authorize/?client_key="+CK+"&response_type=code&scope="+encodeURIComponent("video.publish,user.info.basic")+"&redirect_uri="+redirect);
}
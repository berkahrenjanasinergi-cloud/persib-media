export default function handler(req,res){
 const A=process.env.META_APP_ID;
 if(!A)return res.status(500).json({error:"META_APP_ID belum diset di env Vercel"});
 const redirect=encodeURIComponent("https://"+req.headers.host+"/api/oauth-meta-callback");
 const scope=encodeURIComponent("pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish,business_management");
 res.redirect("https://www.facebook.com/v21.0/dialog/oauth?client_id="+A+"&redirect_uri="+redirect+"&scope="+scope);
}

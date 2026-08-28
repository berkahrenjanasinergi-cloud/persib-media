const H=K=>({apikey:K,Authorization:"Bearer "+K});
export default async function handler(req,res){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=process.env;
 if(req.method==="DELETE"){await fetch(`${U}/rest/v1/connections?id=eq.${req.query.platform}`,{method:"DELETE",headers:H(K)});return res.json({ok:true})}
 const r=await(await fetch(`${U}/rest/v1/connections?select=platform,account_name,updated_at`,{headers:H(K)})).json();
 res.json({connections:Array.isArray(r)?r:[]});
}
export default async function handler(req,res){
 const u=String(req.query.url||"");
 if(!/^https?:\/\//.test(u))return res.status(400).json({error:"url tidak valid"});
 try{
  const r=await fetch(u,{headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}});
  if(!r.ok)return res.status(502).json({error:"upstream "+r.status});
  const ct=r.headers.get("content-type")||"application/octet-stream";
  const buf=await r.arrayBuffer();
  res.setHeader("Content-Type",ct);
  res.setHeader("Cache-Control","public, max-age=86400");
  res.setHeader("Access-Control-Allow-Origin","*");
  return res.status(200).send(Buffer.from(buf));
 }catch(e){return res.status(502).json({error:"gagal mengambil"})}
}

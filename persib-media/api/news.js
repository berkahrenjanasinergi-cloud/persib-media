const FEEDS=[{name:"Persib.co.id",tier:1,url:"https://persib.co.id/feed"},{name:"Simamaung",tier:2,url:"https://simamaung.com/feed"},{name:"ANTARA",tier:2,url:"https://www.antaranews.com/rss/terkini"},{name:"Bola.com",tier:2,url:"https://www.bola.com/feed"},{name:"Detik Sport",tier:2,url:"https://feed.detik.com/index.php/sport"},{name:"Tribun Jabar",tier:2,url:"https://jabar.tribunnews.com/rss"}];
export default async function handler(req,res){
 const out=[];
 await Promise.all(FEEDS.map(async f=>{try{
   const r=await fetch(f.url,{headers:{"User-Agent":"Mozilla/5.0"}});const x=await r.text();
   [...x.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,12).forEach(m=>{
     const g=t=>{const mm=m[1].match(new RegExp("<"+t+"[^>]*>([\\s\\S]*?)</"+t+">"));return mm?mm[1].replace(/<!\[CDATA\[|\]\]>/g,"").replace(/<[^>]+>/g,"").trim():""};
     const t=g("title");if(t)out.push({src:f.name,tier:f.tier,t,link:g("link"),date:g("pubDate")})});
 }catch(e){}}));
 res.setHeader("Cache-Control","s-maxage=300");res.status(200).json({items:out});
}
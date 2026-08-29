const FEEDS=[
 {name:"Persib.co.id",tier:1,url:"https://persib.co.id/feed",rel:97},
 {name:"Simamaung",tier:2,url:"https://simamaung.com/feed",rel:92},
 {name:"BBC Football",tier:2,url:"https://feeds.bbci.co.uk/sport/football/rss.xml",rel:95},
 {name:"Guardian Football",tier:2,url:"https://www.theguardian.com/football/rss",rel:93},
 {name:"Bola.com",tier:2,url:"https://www.bola.com/feed",rel:86,f:/persib|bobotoh|liga 1|timnas|sepak ?bola|maung|piala/i},
 {name:"Detik Sport",tier:2,url:"https://feed.detik.com/index.php/sport",rel:88,f:/persib|bobotoh|liga|timnas|sepak ?bola|piala|mundial|premier|champions|eropa/i},
 {name:"Tribun Jabar",tier:2,url:"https://jabar.tribunnews.com/rss",rel:85,f:/bandung|jabar|persib|bobotoh|cimahi|sumedang|purwakarta/i},
 {name:"Pikiran Rakyat",tier:2,url:"https://www.pikiran-rakyat.com/feed",rel:84,f:/bandung|jabar|persib|bobotoh/i},
 {name:"ANTARA",tier:2,url:"https://www.antaranews.com/rss/terkini",rel:90,f:/bandung|jabar|persib|bobotoh|timnas|sepak ?bola/i}
];
export default async function handler(req,res){
 const out=[];
 await Promise.all(FEEDS.map(async f=>{
  try{
   const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),8000);
   const r=await fetch(f.url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; BandungBiruBot/1.0)"},signal:ctrl.signal});
   clearTimeout(to);
   const x=await r.text();
   const items=[...x.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].slice(0,10);
   for(const m of items){
    try{
     const get=t=>{const mm=m[0].match(new RegExp("<"+t+"[^>]*>([\\s\\S]*?)</"+t+">","i"));return mm?mm[1].replace(/<!\[CDATA\[|\]\]>/g,"").replace(/<[^>]+>/g,"").trim():""};
     const eu=(m[0].match(/<enclosure[^>]*url="([^"]+)"/i)||m[0].match(/<media:content[^>]*url="([^"]+)"/i)||[])[1]||"";
     const t=get("title");
     if(t&&(!f.f||f.f.test(t)))out.push({src:f.name,tier:f.tier,t,link:get("link"),date:get("pubDate")||"",img:eu});
    }catch(e){}
   }
  }catch(e){}
 }));
 res.status(200).json({items:out});
}

const FEEDS=[
 {name:"Persib.co.id",tier:1,url:"https://news.google.com/rss/search?q=persib+site:persib.co.id&hl=id&gl=ID&ceid=ID:id",rel:97,ps:1},
 {name:"Simamaung",tier:2,url:"https://simamaung.com/feed",rel:92},
 {name:"Bandung Football",tier:2,url:"https://bandungfootball.com/feed",rel:88},
 {name:"GNews Persib",tier:2,url:"https://news.google.com/rss/search?q=persib+bandung&hl=id&gl=ID&ceid=ID:id",rel:90,ps:1},
 {name:"GNews Bobotoh",tier:2,url:"https://news.google.com/rss/search?q=bobotoh&hl=id&gl=ID&ceid=ID:id",rel:88,ps:1},
 {name:"GNews Viking",tier:2,url:"https://news.google.com/rss/search?q=viking+persib&hl=id&gl=ID&ceid=ID:id",rel:84,ps:1},
 {name:"GNews Persib Tribun",tier:2,url:"https://news.google.com/rss/search?q=persib+site:tribunnews.com&hl=id&gl=ID&ceid=ID:id",rel:86,ps:1},
 {name:"GNews Persib Kompas",tier:2,url:"https://news.google.com/rss/search?q=persib+site:kompas.com&hl=id&gl=ID&ceid=ID:id",rel:86,ps:1},
 {name:"GNews Persib CNN",tier:2,url:"https://news.google.com/rss/search?q=persib+site:cnnindonesia.com&hl=id&gl=ID&ceid=ID:id",rel:85,ps:1},
 {name:"GNews Persib Liputan6",tier:2,url:"https://news.google.com/rss/search?q=persib+site:liputan6.com&hl=id&gl=ID&ceid=ID:id",rel:84,ps:1},
 {name:"GNews Persib Bola.net",tier:2,url:"https://news.google.com/rss/search?q=persib+site:bola.net&hl=id&gl=ID&ceid=ID:id",rel:84,ps:1},
 {name:"GNews Bandung",tier:2,url:"https://news.google.com/rss/search?q=bandung&hl=id&gl=ID&ceid=ID:id",rel:80,ps:1,f:/persib|bobotoh|bandung|jabar|maung/i},
 {name:"Pikiran Rakyat",tier:2,url:"https://www.pikiran-rakyat.com/feed",rel:84,f:/persib|bobotoh|bandung|jabar/i},
 {name:"Bola.com",tier:2,url:"https://www.bola.com/feed",rel:86,f:/persib|bobotoh|liga 1|timnas|sepak ?bola|maung|piala/i},
 {name:"Okezone",tier:2,url:"https://rss.okezone.com/rss/sport",rel:82,f:/persib|bobotoh|timnas|liga/i},
 {name:"Detik Sport",tier:2,url:"https://feed.detik.com/index.php/sport",rel:88,f:/persib|bobotoh|liga|timnas|sepak ?bola|piala/i},
 {name:"Tribun Jabar",tier:2,url:"https://jabar.tribunnews.com/rss",rel:85,f:/bandung|jabar|persib|bobotoh/i},
 {name:"ANTARA",tier:2,url:"https://www.antaranews.com/rss/terkini",rel:90,f:/bandung|jabar|persib|bobotoh|timnas|sepak ?bola/i},
 {name:"GNews Liga 1",tier:2,url:"https://news.google.com/rss/search?q=liga+1+indonesia&hl=id&gl=ID&ceid=ID:id",rel:88,ps:1},
 {name:"GNews Timnas",tier:2,url:"https://news.google.com/rss/search?q=timnas+indonesia&hl=id&gl=ID&ceid=ID:id",rel:86,ps:1},
 {name:"GNews Champions",tier:2,url:"https://news.google.com/rss/search?q=champions+league&hl=id&gl=ID&ceid=ID:id",rel:85,ps:1},
 {name:"GNews Premier",tier:2,url:"https://news.google.com/rss/search?q=premier+league&hl=id&gl=ID&ceid=ID:id",rel:85,ps:1},
 {name:"BBC Football",tier:2,url:"https://feeds.bbci.co.uk/sport/football/rss.xml",rel:95},
 {name:"Guardian Football",tier:2,url:"https://www.theguardian.com/football/rss",rel:93},
 {name:"Sky Sports",tier:2,url:"https://www.skysports.com/rss/12040",rel:90}
];
export default async function handler(req,res){
 const out=[];
 await Promise.all(FEEDS.map(async f=>{
  try{
   const ctrl=new AbortController();const to=setTimeout(()=>ctrl.abort(),8000);
   const r=await fetch(f.url,{headers:{"User-Agent":"Mozilla/5.0 (compatible; BandungBiruBot/1.0)"},signal:ctrl.signal});
   clearTimeout(to);const x=await r.text();
   const items=[...x.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)].slice(0,12);
   for(const m of items){
    try{
     const get=t=>{const mm=m[0].match(new RegExp("<"+t+"[^>]*>([\\s\\S]*?)</"+t+">","i"));return mm?mm[1].replace(/<!\[CDATA\[|\]\]>/g,"").replace(/<[^>]+>/g,"").trim():""};
     const eu=(m[0].match(/<enclosure[^>]*url="([^"]+)"/i)||m[0].match(/<media:content[^>]*url="([^"]+)"/i)||[])[1]||"";
     let t=get("title");let src=f.name;
     if(f.ps&&t.includes(" - ")){const parts=t.split(" - ");src=parts.pop().trim();t=parts.join(" - ")}
     if(t&&(!f.f||f.f.test(t)))out.push({src,tier:f.tier,t,link:get("link"),date:get("pubDate")||"",img:eu});
    }catch(e){}
   }
  }catch(e){}
 }));
 await Promise.all(out.map(async o=>{if(o.link&&o.link.includes("news.google.com")){try{const rr=await fetch(o.link,{headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},redirect:"follow"});if(rr.url&&!rr.url.includes("news.google.com"))o.link=rr.url}catch(e){}}}));
 res.status(200).json({items:out});
}

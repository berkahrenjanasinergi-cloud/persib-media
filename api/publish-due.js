const H=K=>({apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"return=representation"});
const G="https://graph.facebook.com/v21.0";
async function graph(path,body){const r=await fetch(G+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json();if(j.error)throw new Error(j.error.message);return j}
async function getConn(U,K,p){const r=await(await fetch(U+"/rest/v1/connections?id=eq."+p,{headers:H(K)})).json();return (r||[])[0]}
async function geminiText(p,keys){for(const key of keys){for(const m of ["gemini-2.5-flash","gemini-2.5-flash-lite","gemini-2.0-flash","gemini-2.0-flash-lite"]){try{const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});const j=await r.json();const t=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts&&j.candidates[0].content.parts[0]&&j.candidates[0].content.parts[0].text;if(t)return t.trim()}catch(e){}}}return ""}
async function geminiImage(p,keys){for(const key of keys){for(const m of ["gemini-2.5-flash-image","gemini-2.5-flash-image-preview","gemini-2.0-flash-preview-image-generation"]){try{const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent?key="+key,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:p}]}]})});const j=await r.json();const parts=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];for(const pt of parts){if(pt.inlineData&&pt.inlineData.data)return "data:"+(pt.inlineData.mimeType||"image/png")+";base64,"+pt.inlineData.data}}catch(e){}}}return ""}
async function storeImage(dataUrl,env,name){const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;try{const blob=await (await fetch(dataUrl)).blob();const r=await fetch(U+"/storage/v1/object/media/"+name,{method:"POST",headers:{apikey:K,Authorization:"Bearer "+K,"Content-Type":"image/png"},body:blob});if(r.ok)return U+"/storage/v1/object/public/media/"+name}catch(e){}return ""}
async function commonsImage(q){const queries=[q+" football stadium","football stadium","soccer player"];for(const qq of queries){try{const r=await fetch("https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch="+encodeURIComponent(qq)+"&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size&iiurlwidth=1080",{headers:{"User-Agent":"BandungBiruAI/1.0"}});const j=await r.json();const ps=j&&j.query&&j.query.pages?Object.values(j.query.pages):[];for(const p of ps){const ii=p.imageinfo&&p.imageinfo[0];const u=ii&&(ii.thumburl||ii.url);if(u)return u}}catch(e){}}return ""}
async function getImage(prompt,env,name){const keys=(env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);const d=await geminiImage(prompt,keys);if(d){const u=await storeImage(d,env,name);if(u)return u}return await commonsImage(prompt.slice(0,80))}

/* ===== TUGAS LAMA (TIDAK BERUBAH): 5 slot/hari dari RSS ===== */
async function runAgent(env,base){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;
 if((env.AGENT_ON||"on")==="off")return 0;
 const conn=await getConn(U,K,"instagram");
 if(!conn||!conn.account_id||!conn.access_token)return 0;
 const nowW=new Date(Date.now()+7*3600e3);
 const dateKey=nowW.toISOString().slice(0,10);
 const hhmm=nowW.toISOString().slice(11,16);
 const slots=["07:00","10:30","13:00","17:30","20:00"];
 const seed=parseInt(dateKey.replace(/-/g,""),10);
 const done={};
 try{const r=await fetch(U+"/rest/v1/posts?result=like.agent-"+dateKey+"-*&select=result",{headers:H(K)});(await r.json()).forEach(x=>{done[x.result]=1})}catch(e){}
 let made=0;
 for(let i=0;i<slots.length;i++){
  const jitter=((seed>>(i*3))%21)-10;
  const [sh,sm]=slots[i].split(":").map(Number);
  const tot=sh*60+sm+jitter;
  const slotStr=String(Math.floor(tot/60)).padStart(2,"0")+":"+String(((tot%60)+60)%60).padStart(2,"0");
  const tag="agent-"+dateKey+"-"+i;
  if(done[tag])continue;
  if(hhmm<slotStr)continue;
  try{
   const nr=await fetch(base+"/api/news");const nj=await nr.json();const items=(nj.items||[]).slice(0,12);
   const st=items[Math.floor(Math.random()*items.length)]||{t:"Persib Bandung hari ini",src:"BANDUNG BIRU AI"};
   const videos=(env.AGENT_VIDEO_URLS||"").split(",").map(s=>s.trim()).filter(Boolean);
   let fmt=["post","carousel","story","reels"][Math.floor(Math.random()*4)];
   if(fmt==="reels"&&!videos.length)fmt="carousel";
   const keys=(env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);
   const cap=await geminiText("Kamu admin media fan Persib. Buat caption Instagram "+(fmt==="carousel"?"untuk carousel 3 slide":fmt==="story"?"untuk story":"untuk single post")+" bahasa Indonesia, semangat bobotoh, maks 3 kalimat + 5 hashtag. Topik: "+st.t,keys)||("Persib! 🔵 "+st.t+" #Persib #Bobotoh");
   const imgPrompt="Photorealistic editorial football photo, "+String(st.t).slice(0,100)+", blue stadium atmosphere, no text, no logos";
   if(fmt==="post"){
    const img=await getImage(imgPrompt,env,"ag-"+Date.now()+".png");
    if(!img)throw new Error("no image");
    const c=await graph("/"+conn.account_id+"/media",{image_url:img,caption:cap.slice(0,2000),access_token:conn.access_token});
    await graph("/"+conn.account_id+"/media_publish",{creation_id:c.id,access_token:conn.access_token});
    await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:cap,image_url:img,scheduled_at:new Date().toISOString(),status:"published",result:tag})});
    made++;
   }else if(fmt==="carousel"){
    const imgs=[];for(let k=0;k<3;k++){const u=await getImage(imgPrompt+", variation "+k,env,"agc-"+Date.now()+"-"+k+".png");if(u)imgs.push(u)}
    if(imgs.length<2)throw new Error("carousel images kurang");
    const kids=[];for(const u of imgs){const ci=await graph("/"+conn.account_id+"/media",{image_url:u,is_carousel_item:true,access_token:conn.access_token});kids.push(ci.id)}
    const c=await graph("/"+conn.account_id+"/media",{media_type:"CAROUSEL",children:kids,caption:cap.slice(0,2000),access_token:conn.access_token});
    await graph("/"+conn.account_id+"/media_publish",{creation_id:c.id,access_token:conn.access_token});
    await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:cap,image_url:imgs[0],scheduled_at:new Date().toISOString(),status:"published",result:tag})});
    made++;
   }else if(fmt==="reels"){
    const v=videos[Math.floor(Math.random()*videos.length)];
    const c=await graph("/"+conn.account_id+"/media",{media_type:"VIDEO",video_url:v,caption:cap.slice(0,2000),access_token:conn.access_token});
    await graph("/"+conn.account_id+"/media_publish",{creation_id:c.id,access_token:conn.access_token});
    await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:cap,video_url:v,scheduled_at:new Date().toISOString(),status:"published",result:tag})});
    made++;
   }else{
    const img=await getImage(imgPrompt,env,"ags-"+Date.now()+".png");
    await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:"[STORY — publish manual via app] "+cap,image_url:img||"",scheduled_at:new Date().toISOString(),status:"approval",result:tag})});
    made++;
   }
  }catch(e){
   try{await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:"agent gagal: "+String(e.message||e).slice(0,150),scheduled_at:new Date().toISOString(),status:"failed",result:tag})})}catch(e2){}
  }
 }
 return made;
}

/* ===== helper publish untuk tugas baru ===== */
async function publishFmt(env,conn,fmt,cap,imgPrompt,tag,videos){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;
 if(fmt==="post"){
  const img=await getImage(imgPrompt,env,"agx-"+Date.now()+".png");
  if(!img)throw new Error("no image");
  const c=await graph("/"+conn.account_id+"/media",{image_url:img,caption:cap.slice(0,2000),access_token:conn.access_token});
  await graph("/"+conn.account_id+"/media_publish",{creation_id:c.id,access_token:conn.access_token});
  await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:cap,image_url:img,scheduled_at:new Date().toISOString(),status:"published",result:tag})});
 }else if(fmt==="carousel"){
  const imgs=[];for(let k=0;k<3;k++){const u=await getImage(imgPrompt+", variation "+k,env,"agx-c-"+Date.now()+"-"+k+".png");if(u)imgs.push(u)}
  if(imgs.length<2)throw new Error("carousel images kurang");
  const kids=[];for(const u of imgs){const ci=await graph("/"+conn.account_id+"/media",{image_url:u,is_carousel_item:true,access_token:conn.access_token});kids.push(ci.id)}
  const c=await graph("/"+conn.account_id+"/media",{media_type:"CAROUSEL",children:kids,caption:cap.slice(0,2000),access_token:conn.access_token});
  await graph("/"+conn.account_id+"/media_publish",{creation_id:c.id,access_token:conn.access_token});
  await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:cap,image_url:imgs[0],scheduled_at:new Date().toISOString(),status:"published",result:tag})});
 }else if(fmt==="reels"){
  const v=videos[Math.floor(Math.random()*videos.length)];
  const c=await graph("/"+conn.account_id+"/media",{media_type:"VIDEO",video_url:v,caption:cap.slice(0,2000),access_token:conn.access_token});
  await graph("/"+conn.account_id+"/media_publish",{creation_id:c.id,access_token:conn.access_token});
  await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:cap,video_url:v,scheduled_at:new Date().toISOString(),status:"published",result:tag})});
 }else{
  const img=await getImage(imgPrompt,env,"agx-s-"+Date.now()+".png");
  await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:"[STORY — publish manual via app] "+cap,image_url:img||"",scheduled_at:new Date().toISOString(),status:"approval",result:tag})});
 }
}

/* ===== TUGAS BARU 1: CAMPAIGN RUNNER (12:00 WIB) ===== */
const PHASES=[
 {n:"Teaser",fok:"Hitung mundur & rivalitas",fmt:"reels"},
 {n:"Teaser",fok:"Hitung mundur & rivalitas",fmt:"carousel"},
 {n:"Teaser",fok:"Teaser atmosfer stadion",fmt:"post"},
 {n:"Engagement",fok:"Meme/interaksi Bobotoh",fmt:"carousel"},
 {n:"Engagement",fok:"Polling & tanya bobotoh",fmt:"story"},
 {n:"Engagement",fok:"Nostalgia chant & budaya",fmt:"post"},
 {n:"Praktis",fok:"Info tiket/nobar",fmt:"carousel"},
 {n:"Praktis",fok:"Rute & cuaca stadion",fmt:"post"},
 {n:"Praktis",fok:"Checklist matchday",fmt:"carousel"},
 {n:"Hype",fok:"Bakar semangat & prediksi",fmt:"reels"},
 {n:"Hype",fok:"Preview taktik",fmt:"carousel"},
 {n:"Hype",fok:"Head-to-head seru",fmt:"post"},
 {n:"Live",fok:"Suasana stadion & skor",fmt:"story"},
 {n:"Refleksi",fok:"Reaksi hasil & evaluasi",fmt:"carousel"}
];
async function runCampaign(env,base){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;
 if((env.AGENT_ON||"on")==="off")return 0;
 const conn=await getConn(U,K,"instagram");
 if(!conn||!conn.account_id||!conn.access_token)return 0;
 const nowW=new Date(Date.now()+7*3600e3);
 const dateKey=nowW.toISOString().slice(0,10);
 const hhmm=nowW.toISOString().slice(11,16);
 if(hhmm<"12:00")return 0;
 const tag="agent-c-"+dateKey;
 try{const r=await fetch(U+"/rest/v1/posts?result=eq."+tag+"&select=result",{headers:H(K)});if((await r.json()).length)return 0}catch(e){}
 const start=env.AGENT_CAMPAIGN_START||"2026-09-01";
 const dayIdx=Math.floor((Date.parse(dateKey)-Date.parse(start))/86400000);
 const ph=PHASES[((dayIdx%14)+14)%14];
 const videos=(env.AGENT_VIDEO_URLS||"").split(",").map(s=>s.trim()).filter(Boolean);
 let fmt=ph.fmt;if(fmt==="reels"&&!videos.length)fmt="carousel";
 try{
  const nr=await fetch(base+"/api/news");const nj=await nr.json();const items=(nj.items||[]).slice(0,6);
  const ctxT=items.map(x=>x.t).join(" | ");
  const keys=(env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);
  const cap=await geminiText("Kampanye 'Road to Matchday — Seri Kandang' media fan Persib. Fase hari ini: "+ph.n+" — fokus: "+ph.fok+". Pilar: 1) Hype & Analisis 2) Budaya & Relate Bobotoh 3) Info Praktis Matchday. Berita terkini: "+ctxT+" . Buat caption "+fmt+" bahasa Indonesia maks 3 kalimat + 4 hashtag, original, jangan klaim fakta baru.",keys)||("Road to Matchday! 🔵 "+ph.fok+" #Persib #Bobotoh");
  const imgPrompt="Photorealistic football matchday atmosphere Bandung, "+ph.fok+", blue flares and crowd, no text, no logos";
  await publishFmt(env,conn,fmt,cap,imgPrompt,tag,videos);
  return 1;
 }catch(e){
  try{await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:"campaign gagal: "+String(e.message||e).slice(0,150),scheduled_at:new Date().toISOString(),status:"failed",result:tag})})}catch(e2){}
  return 0;
 }
}

/* ===== TUGAS BARU 2: ANALYSIS RUNNER (15:00 WIB) — konten original dari analisa berita ===== */
async function runAnalysis(env,base){
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;
 if((env.AGENT_ON||"on")==="off")return 0;
 const conn=await getConn(U,K,"instagram");
 if(!conn||!conn.account_id||!conn.access_token)return 0;
 const nowW=new Date(Date.now()+7*3600e3);
 const dateKey=nowW.toISOString().slice(0,10);
 const hhmm=nowW.toISOString().slice(11,16);
 if(hhmm<"15:00")return 0;
 const tag="agent-a-"+dateKey;
 try{const r=await fetch(U+"/rest/v1/posts?result=eq."+tag+"&select=result",{headers:H(K)});if((await r.json()).length)return 0}catch(e){}
 try{
  const nr=await fetch(base+"/api/news");const nj=await nr.json();const items=(nj.items||[]).slice(0,6);
  if(!items.length)return 0;
  const ctxT=items.map(x=>x.t).join(" | ");
  const keys=(env.GEMINI_KEY||"").split(",").map(s=>s.trim()).filter(Boolean);
  const cap=await geminiText("Kamu analis media Persib. Dari kumpulan berita ini: "+ctxT+" — tulis SATU postingan analisis ORIGINAL bahasa Indonesia: temukan benang merah/pola, maks 4 kalimat + 3 hashtag. Tegaskan ini analisis independen, bukan fakta resmi.",keys)||("Analisa Biru 🔵 "+items[0].t+" #Persib #Bobotoh");
  const imgPrompt="Photorealistic tactical football analysis mood, Persib Bandung training ground, coach thinking, blue tones, no text, no logos";
  await publishFmt(env,conn,"post",cap,imgPrompt,tag,[]);
  return 1;
 }catch(e){
  try{await fetch(U+"/rest/v1/posts",{method:"POST",headers:H(K),body:JSON.stringify({platform:"instagram",content:"analisis gagal: "+String(e.message||e).slice(0,150),scheduled_at:new Date().toISOString(),status:"failed",result:tag})})}catch(e2){}
  return 0;
 }
}

/* ===== HANDLER: due-publish + 3 tugas agent ===== */
export default async function handler(req,res){
 const env=process.env;
 const {SUPABASE_URL:U,SUPABASE_SERVICE_KEY:K}=env;
 const base="https://"+(env.VERCEL_PROJECT_PRODUCTION_DOMAIN||"persib-media.vercel.app");
 const results=[];
 try{
  const Hh=H(K);
  const due=await(await fetch(U+"/rest/v1/posts?status=eq.scheduled&scheduled_at=lte."+new Date().toISOString()+"&limit=5",{headers:Hh})).json();
  for(const p of (due||[])){
   let j={ok:false,error:"publish error"};
   try{const r=await fetch(base+"/api/publish",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({platform:p.platform,message:p.content,imageUrl:p.image_url,videoUrl:p.video_url})});j=await r.json()}catch(e){j={ok:false,error:String(e.message||e)}}
   await fetch(U+"/rest/v1/posts?id=eq."+p.id,{method:"PATCH",headers:Hh,body:JSON.stringify(j.ok?{status:"published",result:"real"}:{status:"failed",result:(j.error||"").slice(0,100)})});
   results.push({platform:p.platform,ok:!!j.ok});
  }
 }catch(e){}
 let agent=0,camp=0,anal=0;
 try{agent=await runAgent(env,base)}catch(e){}
 try{camp=await runCampaign(env,base)}catch(e){}
 try{anal=await runAnalysis(env,base)}catch(e){}
 res.status(200).json({processed:results.length,results,agent,campaign:camp,analysis:anal});
}

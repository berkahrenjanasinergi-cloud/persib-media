export default async function handler(req,res){
 const key=process.env.GEMINI_KEY;
 const p=(req.body&&req.body.prompt)||"";
 if(!key) return res.status(200).json({error: "GEMINI_KEY belum ada di env Vercel"});

 try {
   const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="+key, {
     method: "POST",
     headers: {"Content-Type": "application/json"},
     body: JSON.stringify({contents:[{parts:[{text:p}]}]})
   });
   const j = await r.json();
   if (j.candidates && j.candidates[0] && j.candidates[0].content) {
     return res.status(200).json({text: j.candidates[0].content.parts[0].text});
   }
   // Kalau gagal, kirim pesan error aslinya biar ketahuan
   return res.status(200).json({error: j.error ? j.error.message : "Tidak ada candidates", raw: JSON.stringify(j).slice(0,300)});
 } catch(e) {
   return res.status(200).json({error: e.message});
 }
}

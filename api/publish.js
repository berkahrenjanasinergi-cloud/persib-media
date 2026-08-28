import {publishTo} from "./publish-lib.js";
export default async function handler(req,res){
 if(req.method!=="POST")return res.json({ok:false});
 res.json(await publishTo(req.body,process.env));
}
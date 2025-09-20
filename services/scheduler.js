import cron from "node-cron";
import moment from "moment-timezone";
import { Video, GoogleAccount, LiveEvent } from "../models/index.js";
import { tokensForGoogleAccount, uploadToYouTube, getBroadcastDetails } from "./youtubeService.js";
import { releaseStorage, safeUnlink } from "./storageService.js";

export function startSchedulers(io){
  // upload terjadwal tiap menit
  cron.schedule("* * * * *", async ()=>{
    const now = new Date();
    const list = await Video.findAll({ where:{ status:"scheduled" }});
    for(const v of list){
      if(!v.scheduleAt || v.scheduleAt > now) continue;
      try{
        const tokens = await tokensForGoogleAccount(v.googleAccountId);
        const id = await uploadToYouTube(tokens, { title:v.title, description:v.description, categoryId:v.categoryId, privacyStatus:v.privacyStatus }, v.filePath, v.thumbPath);
        await releaseStorage(v.userId, v.sizeMB);
        await safeUnlink(v.filePath); await safeUnlink(v.thumbPath);
        v.youtubeVideoId = id; v.status="uploaded"; await v.save();
        io.to(String(v.userId)).emit("video_status",{ id:v.id, title:v.title, status:"uploaded", youtubeId:id });
      }catch(e){
        v.status="failed"; await v.save();
        io.to(String(v.userId)).emit("video_status",{ id:v.id, title:v.title, status:"failed" });
      }
    }
  });

  // polling status live tiap 30 detik
  cron.schedule("*/30 * * * * *", async ()=>{
    const lives = await LiveEvent.findAll({ where:{} });
    for(const L of lives){
      try{
        if(!L.broadcastId) continue;
        const ga = await GoogleAccount.findByPk(L.googleAccountId);
        if(!ga) continue;
        const { decryptJson } = await import("./cryptoService.js");
        const tokens = decryptJson(ga.encryptedTokens);
        const b = await getBroadcastDetails(tokens, L.broadcastId);
        const st = b?.status?.lifeCycleStatus || L.status;
        if(st && st !== L.status){
          L.status = st==="liveStarting"?"live": (st==="complete"?"complete": st);
          await L.save();
          io.to(String(L.userId)).emit("live_status",{ id:L.id, title:L.title, status:L.status });
        }
      }catch{}
    }
  });
}

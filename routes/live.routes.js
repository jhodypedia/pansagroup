import express from "express";
import moment from "moment-timezone";
import { requireAuth } from "../middlewares/auth.js";
import { requirePremium } from "../middlewares/premium.js";
import { GoogleAccount, LiveEvent } from "../models/index.js";
import { decryptJson } from "../services/cryptoService.js";
import { createLive, getBroadcastDetails, getStreamDetails } from "../services/youtubeService.js";

const r = express.Router();

// LIST PAGE
r.get("/live", requireAuth, async (req,res)=>{
  const lives = await LiveEvent.findAll({ where:{ userId:req.user.id }, order:[["id","DESC"]] });
  res.render("live",{ title:"Live", lives });
});

// CREATE LIVE
r.post("/live/create", requireAuth, requirePremium, async (req,res)=>{
  try{
    const io = req.app.get("io");
    const { title, description, startTime, googleAccountId, privacyStatus="private" } = req.body;
    const ga = await GoogleAccount.findOne({ where:{ id:googleAccountId, userId:req.user.id }});
    if(!ga) return res.json({ success:false, message:"Akun Google tidak valid" });

    const tokens = decryptJson(ga.encryptedTokens);
    const scheduledStartTime = moment.tz(startTime, req.user.timezone || "Asia/Jakarta").utc().toISOString();
    const live = await createLive(tokens, { title, description, scheduledStartTime, privacyStatus });

    await LiveEvent.create({
      userId:req.user.id, googleAccountId, title, description,
      scheduledStartTime: moment.utc(scheduledStartTime).toDate(),
      broadcastId: live.broadcastId,
      streamId: live.streamId,
      streamKey: live.streamKey,
      ingestionUrl: live.ingestionUrl,
      status:"scheduled"
    });

    io.to(String(req.user.id)).emit("live_status", { status:"ready", title });
    res.json({ success:true, message:"Live dibuat", ingestionUrl: live.ingestionUrl, streamKey: live.streamKey, refresh:true });
  }catch(e){
    res.json({ success:false, message:String(e.message||e) });
  }
});

// DELETE
r.post("/live/:id/delete", requireAuth, async (req,res)=>{
  const l = await LiveEvent.findOne({ where:{ id:req.params.id, userId:req.user.id }});
  if(!l) return res.json({ success:false, message:"Live tidak ditemukan" });
  await l.destroy();
  res.json({ success:true, message:"Live dihapus", refresh:true });
});

// DETAIL PAGE
r.get("/live/:id", requireAuth, async (req,res)=>{
  const L = await LiveEvent.findOne({ where:{ id:req.params.id, userId:req.user.id }});
  if(!L) return res.status(404).send("Live tidak ditemukan");
  res.render("live_detail", { title:`Live #${L.id}`, L });
});

// API: GET STATS
r.get("/api/live/:id/stats", requireAuth, async (req,res)=>{
  try{
    const L = await LiveEvent.findOne({ where:{ id:req.params.id, userId:req.user.id }});
    if(!L) return res.json({ success:false, message:"Live tidak ditemukan" });

    const ga = await GoogleAccount.findByPk(L.googleAccountId);
    if(!ga) return res.json({ success:false, message:"Akun Google tidak ditemukan" });
    const tokens = decryptJson(ga.encryptedTokens);

    const b = L.broadcastId ? await getBroadcastDetails(tokens, L.broadcastId) : null;
    const s = L.streamId ? await getStreamDetails(tokens, L.streamId) : null;

    res.json({ success:true, data:{
      broadcast:{
        title: b?.snippet?.title,
        scheduledStartTime: b?.snippet?.scheduledStartTime,
        actualStartTime: b?.snippet?.actualStartTime,
        actualEndTime: b?.snippet?.actualEndTime,
        lifeCycleStatus: b?.status?.lifeCycleStatus,
        privacyStatus: b?.status?.privacyStatus
      },
      stream:{
        frameRate: s?.cdn?.frameRate,
        resolution: s?.cdn?.resolution,
        ingestionType: s?.cdn?.ingestionType,
        streamStatus: s?.status?.streamStatus
      },
      ingestionUrl: L.ingestionUrl,
      streamKeyMasked: L.streamKey ? L.streamKey.replace(/.(?=.{4})/g,"•") : null
    }});
  }catch(e){
    res.json({ success:false, message:String(e.message||e) });
  }
});

export default r;

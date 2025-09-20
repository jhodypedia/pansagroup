import express from "express";
import moment from "moment-timezone";
import { requireAuth } from "../middlewares/auth.js";
import { videoUpload, reserveStorage, releaseStorage, safeUnlink, makeAutoThumb } from "../services/storageService.js";
import { Video, GoogleAccount } from "../models/index.js";
import { tokensForGoogleAccount, uploadToYouTube, getVideoDetails } from "../services/youtubeService.js";
import { decryptJson } from "../services/cryptoService.js";

const r = express.Router();

// LIST PAGE
r.get("/videos", requireAuth, async (req,res)=>{
  const videos = await Video.findAll({ where:{ userId:req.user.id }, order:[["id","DESC"]] });
  res.render("videos",{ title:"Videos", videos });
});

// UPLOAD (langsung / jadwal)
r.post("/videos/upload", requireAuth, videoUpload.fields([{name:"video",maxCount:1},{name:"thumbnail",maxCount:1}]), async (req,res)=>{
  try{
    const io = req.app.get("io");
    const file = req.files.video?.[0];
    if(!file) return res.json({ success:false, message:"Video wajib" });

    const { title, description, categoryId, privacyStatus="private", googleAccountId, scheduleAt, useAutoThumb } = req.body;
    const sizeMB = await reserveStorage(req.user.id, file);

    let thumbPath = req.files.thumbnail?.[0]?.path || null;
    if(!thumbPath && useAutoThumb === "1") thumbPath = await makeAutoThumb(file.path);

    if (scheduleAt){
      const schedUTC = moment.tz(scheduleAt, req.user.timezone || "Asia/Jakarta").utc().toDate();
      const v = await Video.create({
        userId:req.user.id, googleAccountId, title, description, categoryId, privacyStatus,
        filePath:file.path, thumbPath, sizeMB, scheduleAt:schedUTC, status:"scheduled"
      });
      return res.json({ success:true, message:"Video dijadwalkan", id:v.id, refresh:true });
    }

    // Upload langsung
    const tokens = await tokensForGoogleAccount(googleAccountId);
    const videoId = await uploadToYouTube(tokens, { title, description, categoryId, privacyStatus }, file.path, thumbPath);

    await releaseStorage(req.user.id, sizeMB);
    await safeUnlink(file.path); await safeUnlink(thumbPath);

    const v = await Video.create({
      userId:req.user.id, googleAccountId, title, description, categoryId, privacyStatus,
      youtubeVideoId:videoId, status:"uploaded"
    });

    io.to(String(req.user.id)).emit("video_status", { id:v.id, status:"uploaded", youtubeId:videoId, title });
    res.json({ success:true, message:"Upload sukses", id:videoId, refresh:true });
  }catch(e){
    res.json({ success:false, message:String(e.message||e) });
  }
});

// DELETE
r.post("/videos/:id/delete", requireAuth, async (req,res)=>{
  const v = await Video.findOne({ where:{ id:req.params.id, userId:req.user.id }});
  if(!v) return res.json({ success:false, message:"Video tidak ditemukan" });
  await v.destroy();
  res.json({ success:true, message:"Video dihapus", refresh:true });
});

// DETAIL PAGE
r.get("/videos/:id", requireAuth, async (req,res)=>{
  const v = await Video.findOne({ where:{ id:req.params.id, userId:req.user.id }});
  if(!v) return res.status(404).send("Video tidak ditemukan");
  res.render("video_detail", { title:`Video #${v.id}`, v });
});

// API: GET STATS
r.get("/api/videos/:id/stats", requireAuth, async (req,res)=>{
  try{
    const v = await Video.findOne({ where:{ id:req.params.id, userId:req.user.id }});
    if(!v) return res.json({ success:false, message:"Video tidak ditemukan" });
    if(!v.youtubeVideoId) return res.json({ success:true, data:{ pending:true }});

    const ga = await GoogleAccount.findByPk(v.googleAccountId);
    if(!ga) return res.json({ success:false, message:"Akun Google tidak ditemukan" });

    const tokens = decryptJson(ga.encryptedTokens);
    const detail = await getVideoDetails(tokens, v.youtubeVideoId);
    if(!detail) return res.json({ success:false, message:"Detail tidak tersedia" });

    res.json({ success:true, data:{
      title: detail.snippet?.title,
      publishedAt: detail.snippet?.publishedAt,
      privacyStatus: detail.status?.privacyStatus,
      views: detail.statistics?.viewCount,
      likes: detail.statistics?.likeCount,
      comments: detail.statistics?.commentCount,
      duration: detail.contentDetails?.duration,
      link: `https://www.youtube.com/watch?v=${v.youtubeVideoId}`
    }});
  }catch(e){
    res.json({ success:false, message:String(e.message||e) });
  }
});

export default r;

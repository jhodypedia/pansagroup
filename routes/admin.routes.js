import express from "express";
import multer from "multer";
import path from "path";
import os from "os";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/admin.js";
import { v4 as uuidv4 } from "uuid";
import { User, Setting, LicenseKey, Video, LiveEvent } from "../models/index.js";
import { sendWA } from "../services/waService.js";

const r = express.Router();
const upload = multer({ dest: "public/qris" });

// ---------- PAGES ----------
r.get("/admin/dashboard", requireAuth, requireAdmin, async (req,res)=>{
  const stats = {
    totalUsers : await User.count(),
    totalVideos: await Video.count(),
    totalLives : await LiveEvent.count(),
    liveSuccess: await LiveEvent.count({ where:{ status:"complete" }}),
    liveFail   : await LiveEvent.count({ where:{ status:"failed" }}),
    os:{
      platform: `${os.platform()} ${os.release()}`,
      cpus    : os.cpus().length,
      mem     : Math.round(os.totalmem()/1024/1024),
      uptime  : Math.round(os.uptime()/3600)
    }
  };
  res.render("admin/dashboard",{ title:"Admin Dashboard", stats });
});

r.get("/admin/users", requireAuth, requireAdmin, async (req,res)=>{
  const users = await User.findAll({ order:[["id","DESC"]] });
  res.render("admin/users",{ title:"Admin Users", users });
});

r.get("/admin/licenses", requireAuth, requireAdmin, async (req,res)=>{
  const keys = await LicenseKey.findAll({ order:[["id","DESC"]] });
  res.render("admin/licenses",{ title:"Admin Licenses", keys });
});

r.get("/admin/settings", requireAuth, requireAdmin, async (req,res)=>{
  const s = await Setting.findByPk(1) || await Setting.create({ id:1 });
  res.render("admin/settings",{ title:"Admin Settings", s });
});

r.get("/admin/wa", requireAuth, requireAdmin, async (req,res)=>{
  res.render("admin/wa",{ title:"Admin WhatsApp" });
});

// ---------- API ----------
r.post("/admin/users/:id/storage", requireAuth, requireAdmin, async (req,res)=>{
  const u = await User.findByPk(req.params.id);
  if(!u) return res.json({ success:false, message:"User tidak ditemukan" });
  u.storageQuotaMB = parseInt(req.body.storageQuotaMB||"2048");
  await u.save();
  res.json({ success:true, message:"Storage updated" });
});

r.post("/admin/users/:id/role", requireAuth, requireAdmin, async (req,res)=>{
  const u = await User.findByPk(req.params.id);
  if(!u) return res.json({ success:false, message:"User tidak ditemukan" });
  u.role = req.body.role==="admin" ? "admin" : "user";
  await u.save();
  res.json({ success:true, message:"Role updated" });
});

r.post("/admin/users/:id/premium", requireAuth, requireAdmin, async (req,res)=>{
  const u = await User.findByPk(req.params.id);
  if(!u) return res.json({ success:false, message:"User tidak ditemukan" });
  u.isPremium = String(req.body.isPremium)==="true";
  await u.save();
  res.json({ success:true, message:"Premium updated" });
});

r.post("/admin/users/:id/delete", requireAuth, requireAdmin, async (req,res)=>{
  const u = await User.findByPk(req.params.id);
  if(!u) return res.json({ success:false, message:"User tidak ditemukan" });
  await u.destroy();
  res.json({ success:true, message:"User dihapus", refresh:true });
});

r.post("/admin/licenses/generate", requireAuth, requireAdmin, async (req,res)=>{
  const key = "LIC-"+uuidv4().split("-")[0].toUpperCase();
  await LicenseKey.create({ key });
  res.json({ success:true, message:"License dibuat", key, refresh:true });
});

r.post("/admin/settings", requireAuth, requireAdmin, upload.single("qrisImage"), async (req,res)=>{
  const s = await (Setting.findByPk(1) || Setting.create({ id:1 }));
  s.recaptchaEnabled = String(req.body.recaptchaEnabled)==="true";
  s.recaptchaSiteKey = req.body.recaptchaSiteKey || "";
  s.recaptchaSecret  = req.body.recaptchaSecret  || "";
  s.qrisPayload      = req.body.qrisPayload || "";
  if(req.file) s.qrisImagePath = path.join("qris", req.file.filename);
  await s.save();
  res.json({ success:true, message:"Settings tersimpan" });
});

r.post("/admin/wa/broadcast", requireAuth, requireAdmin, async (req,res)=>{
  const { msg } = req.body;
  const users = await User.findAll();
  for(const u of users){ try{ await sendWA(u.phone, msg); }catch{} }
  res.json({ success:true, message:"Broadcast terkirim" });
});

export default r;

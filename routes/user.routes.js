import express from "express";
import os from "os";
import { requireAuth } from "../middlewares/auth.js";
import { User, Video, GoogleAccount, LiveEvent } from "../models/index.js";

const r = express.Router();

r.get("/", (req,res)=> req.session?.user ? res.redirect("/dashboard") : res.redirect("/login"));

r.get("/dashboard", requireAuth, async (req,res)=>{
  const totalVideos = await Video.count({ where:{ userId:req.user.id }});
  const totalAccounts = await GoogleAccount.count({ where:{ userId:req.user.id }});
  res.render("dashboard",{ title:"Dashboard", stats:{ totalVideos, totalAccounts } });
});

r.get("/settings", requireAuth, (req,res)=> res.render("settings",{ title:"Settings" }));

r.post("/settings", requireAuth, async (req,res)=>{
  const u = await User.findByPk(req.user.id);
  u.timezone = req.body.timezone || "Asia/Jakarta";
  await u.save();
  req.session.user = u.toJSON();
  res.json({ success:true, message:"Settings tersimpan", refresh:true });
});

r.get("/stats", requireAuth, async (req,res)=>{
  const videos = await Video.count({ where:{ userId:req.user.id }});
  const lives  = await LiveEvent.count({ where:{ userId:req.user.id }});
  res.render("stats",{ title:"Statistik", stats:{ videos, lives } });
});

export default r;

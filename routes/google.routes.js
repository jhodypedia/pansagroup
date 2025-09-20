import express from "express";
import { oauthClient, saveGoogleTokens } from "../services/googleAuth.js";
import { requireAuth } from "../middlewares/auth.js";
import { GoogleAccount } from "../models/index.js";

const r = express.Router();

r.get("/google/connect", requireAuth, (req,res)=>{
  const o = oauthClient();
  const url = o.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube","https://www.googleapis.com/auth/youtube.upload","https://www.googleapis.com/auth/userinfo.email"]
  });
  res.redirect(url);
});

r.get("/google/callback", requireAuth, async (req,res)=>{
  const o = oauthClient();
  const { code } = req.query;
  const { tokens } = await o.getToken(code);
  await saveGoogleTokens(req.user.id, tokens);
  res.redirect("/settings");
});

r.post("/google/:id/delete", requireAuth, async (req,res)=>{
  const ga = await GoogleAccount.findOne({ where:{ id:req.params.id, userId:req.user.id }});
  if(!ga) return res.json({ success:false, message:"Akun tidak ditemukan" });
  await ga.destroy();
  res.json({ success:true, message:"Akun dihapus", refresh:true });
});

export default r;

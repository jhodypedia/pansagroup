import express from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { User, LicenseKey, Setting } from "../models/index.js";

const r = express.Router();

r.get("/login",(req,res)=> res.render("login",{ title:"Login" }));
r.get("/register",(req,res)=> res.render("register",{ title:"Register" }));

r.post("/login", async (req,res)=>{
  const { email, password } = req.body;
  const u = await User.findOne({ where:{ email }});
  if(!u) return res.json({ success:false, message:"Email tidak terdaftar" });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if(!ok) return res.json({ success:false, message:"Password salah" });
  req.session.user = u.toJSON();
  res.json({ success:true, message:"Login sukses", redirect:"/dashboard" });
});

r.post("/register", async (req,res)=>{
  try{
    const { email, password, phone, licenseKey } = req.body;
    if(!email || !password) return res.json({ success:false, message:"Email & Password wajib" });
    const exists = await User.findOne({ where:{ email }});
    if(exists) return res.json({ success:false, message:"Email sudah dipakai" });
    const hash = await bcrypt.hash(password, 10);
    const u = await User.create({ email, passwordHash:hash, phone, timezone:"Asia/Jakarta" });

    if(licenseKey){
      const k = await LicenseKey.findOne({ where:{ key:licenseKey, isUsed:false }});
      if(!k) return res.json({ success:false, message:"License tidak valid" });
      k.isUsed = true; k.usedByUserId = u.id; await k.save();
      u.isPremium = true; await u.save();
    }

    req.session.user = u.toJSON();
    res.json({ success:true, message:"Register sukses", redirect:"/dashboard" });
  }catch(e){
    res.json({ success:false, message:String(e.message||e) });
  }
});

r.post("/logout",(req,res)=>{ req.session.destroy(()=>res.json({ success:true, message:"Logged out", redirect:"/login" })); });

export default r;

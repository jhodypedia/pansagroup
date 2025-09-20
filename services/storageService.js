import fs from "fs/promises";
import fsn from "fs";
import path from "path";
import multer from "multer";
import { User } from "../models/index.js";
import { spawn } from "child_process";

const upload = multer({ dest: "uploads" });
export const videoUpload = upload;

export async function reserveStorage(userId, file){
  const sizeMB = Math.round((file.size || fsn.statSync(file.path).size)/1024/1024);
  const u = await User.findByPk(userId);
  if(!u) throw new Error("User not found");
  if(u.storageUsedMB + sizeMB > u.storageQuotaMB){
    await fs.unlink(file.path).catch(()=>{});
    throw new Error("Storage quota exceeded");
  }
  u.storageUsedMB += sizeMB; await u.save();
  return sizeMB;
}
export async function releaseStorage(userId, sizeMB){
  const u = await User.findByPk(userId);
  if(!u) return;
  u.storageUsedMB = Math.max(0, (u.storageUsedMB||0) - (sizeMB||0));
  await u.save();
}
export async function safeUnlink(p){
  if(!p) return;
  await fs.unlink(p).catch(()=>{});
}
export async function makeAutoThumb(videoPath){
  const out = path.join("uploads", "auto_"+Date.now()+".jpg");
  const ff = process.env.FFMPEG_PATH || "ffmpeg";
  await new Promise((resolve,reject)=>{
    const pr = spawn(ff, ["-y","-i",videoPath,"-ss","00:00:01.000","-vframes","1", out ]);
    pr.on("close",(c)=> c===0?resolve():reject(new Error("ffmpeg error")));
  });
  return out;
}

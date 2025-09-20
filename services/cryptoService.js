import crypto from "crypto";
const ENC_KEY = Buffer.from(process.env.ENC_KEY || "", "utf8").slice(0,32);
const IV_LEN = 12;

export function encryptJson(obj){
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(JSON.stringify(obj), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}
export function decryptJson(str){
  const raw = Buffer.from(str, "base64");
  const iv = raw.slice(0,IV_LEN);
  const tag = raw.slice(IV_LEN, IV_LEN+16);
  const enc = raw.slice(IV_LEN+16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  return JSON.parse(dec);
}

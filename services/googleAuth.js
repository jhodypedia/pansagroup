import { google } from "googleapis";
import { encryptJson } from "./cryptoService.js";
import { GoogleAccount } from "../models/index.js";

export function oauthClient(){
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
}

export async function saveGoogleTokens(userId, tokens){
  const oauth2 = google.oauth2({ version:"v2", auth: new google.auth.OAuth2() });
  const tok = tokens; // {access_token, refresh_token, scope, expiry_date, ...}
  const auth = oauthClient(); auth.setCredentials(tok);
  const me = await google.oauth2({ version:"v2", auth }).userinfo.get();
  const email = me.data.email || "unknown@gmail.com";
  const enc = encryptJson(tok);
  await GoogleAccount.create({ userId, email, encryptedTokens: enc });
}

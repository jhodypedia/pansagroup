import fs from "fs";
import { google } from "googleapis";

export function yt(tokens){
  const auth = new google.auth.OAuth2();
  auth.setCredentials(tokens);
  return google.youtube({ version:"v3", auth });
}

// Upload video (simple)
export async function uploadToYouTube(tokens, meta, filePath, thumbPath){
  const y = yt(tokens);
  const res = await y.videos.insert({
    part: ["snippet","status"],
    requestBody: {
      snippet: { title: meta.title, description: meta.description, categoryId: meta.categoryId || "22" },
      status: { privacyStatus: meta.privacyStatus || "private" }
    },
    media: { body: fs.createReadStream(filePath) }
  });
  const id = res.data.id;
  if(thumbPath){
    await y.thumbnails.set({ videoId: id, media: { body: fs.createReadStream(thumbPath) } });
  }
  return id;
}

// Live creation (broadcast + stream)
export async function createLive(tokens, { title, description, scheduledStartTime, privacyStatus="private" }){
  const y = yt(tokens);
  // 1) create stream
  const stream = await y.liveStreams.insert({
    part: ["snippet","cdn","contentDetails","status"],
    requestBody: {
      snippet: { title: title + " Stream" },
      cdn: { frameRate: "variable", ingestionType: "rtmp", resolution: "variable" }
    }
  });
  const streamId = stream.data.id;
  const ingestionUrl = stream.data.cdn?.ingestionInfo?.ingestionAddress || "";
  const streamKey   = stream.data.cdn?.ingestionInfo?.streamName || "";

  // 2) create broadcast
  const broadcast = await y.liveBroadcasts.insert({
    part: ["snippet","contentDetails","status"],
    requestBody: {
      snippet: { title, description, scheduledStartTime },
      status: { privacyStatus },
      contentDetails: { enableAutoStart: true, enableAutoStop: true }
    }
  });
  const broadcastId = broadcast.data.id;

  // 3) bind
  await y.liveBroadcasts.bind({ id: broadcastId, part: ["id","contentDetails"], streamId });
  return { broadcastId, streamId, ingestionUrl, streamKey };
}

// Details for stats
export async function getVideoDetails(tokens, videoId){
  const y = yt(tokens);
  const { data } = await y.videos.list({ part:"snippet,statistics,status,contentDetails", id: videoId });
  return data.items?.[0] || null;
}
export async function getBroadcastDetails(tokens, broadcastId){
  const y = yt(tokens);
  const { data } = await y.liveBroadcasts.list({ part:"snippet,status,contentDetails", id: broadcastId });
  return data.items?.[0] || null;
}
export async function getStreamDetails(tokens, streamId){
  const y = yt(tokens);
  const { data } = await y.liveStreams.list({ part:"snippet,cdn,status", id: streamId });
  return data.items?.[0] || null;
}

// Helper tokens
export async function tokensForGoogleAccount(googleAccountId){
  const { GoogleAccount } = await import("../models/index.js");
  const { decryptJson } = await import("./cryptoService.js");
  const ga = await GoogleAccount.findByPk(googleAccountId);
  if(!ga) throw new Error("Google account not found");
  return decryptJson(ga.encryptedTokens);
}

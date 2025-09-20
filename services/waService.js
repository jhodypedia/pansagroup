import makeWASocket, { useMultiFileAuthState, Browsers } from "@whiskeysockets/baileys";
let sock;

export async function startWA(io){
  try{
    const { state, saveCreds } = await useMultiFileAuthState("wa_auth");
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.macOS("Desktop"),
      syncFullHistory: false
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (u)=>{
      const { connection, qr, pairingCode } = u || {};
      if(qr) io.emit("wa_qr", qr);
      if(pairingCode) io.emit("wa_pairing", pairingCode);
      if(connection === "open") io.emit("wa_ready", { user: sock?.user });
      if(connection === "close") io.emit("wa_logout");
    });
  }catch(e){
    console.error("WA error:", e.message);
  }
}

export async function sendWA(phone, message){
  if(!sock) throw new Error("WA not ready");
  if(!phone) return;
  // normalisasi 08xxxx ke 628xxxx
  let num = String(phone).trim();
  if(num.startsWith("08")) num = "62"+num.slice(1);
  if(num.startsWith("+")) num = num.slice(1);
  const jid = num.replace(/\D/g,"") + "@s.whatsapp.net";
  await sock.sendMessage(jid, { text: message });
}

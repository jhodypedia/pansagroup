// services/waService.js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Browsers
} from "@whiskeysockets/baileys";

let sock;

/**
 * Start WhatsApp connection
 * @param {Server} io - Socket.IO instance
 */
export async function startWA(io) {
  try {
    // pakai MultiFileAuthState biar session persistent
    const { state, saveCreds } = await useMultiFileAuthState("wa_auth");

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // QR dikirim ke frontend, bukan terminal
      browser: Browsers.macOS("Desktop"),
      syncFullHistory: false,
    });

    // simpan kredensial kalau update
    sock.ev.on("creds.update", saveCreds);

    // event koneksi
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // kirim QR string ke frontend
        io.emit("wa_qr", qr);
      }

      if (connection === "open") {
        io.emit("wa_ready", { user: sock?.user });
        console.log("✅ WhatsApp connected:", sock?.user?.id);
      }

      if (connection === "close") {
        const reason =
          lastDisconnect?.error?.output?.statusCode ||
          lastDisconnect?.error?.message ||
          lastDisconnect?.error;

        console.log("❌ WhatsApp disconnected:", reason);

        // auto reconnect kalau bukan logout permanen
        if (
          reason !== DisconnectReason.loggedOut &&
          reason !== DisconnectReason.badSession
        ) {
          console.log("🔄 Reconnecting...");
          setTimeout(() => startWA(io), 3000);
        } else {
          io.emit("wa_logout");
          console.log("🛑 Session invalid, perlu scan ulang.");
        }
      }
    });

    // log pesan masuk (opsional)
    sock.ev.on("messages.upsert", (msg) => {
      console.log("📩 New message:", JSON.stringify(msg, null, 2));
    });
  } catch (e) {
    console.error("WA error:", e);
  }
}

/**
 * Kirim pesan WhatsApp
 * @param {string} phone - Nomor tujuan (bisa 08xxxx atau +62xxxx)
 * @param {string} message - Isi pesan
 */
export async function sendWA(phone, message) {
  if (!sock) throw new Error("WA not ready");
  if (!phone) return;

  // normalisasi nomor: 08xxxx -> 628xxxx
  let num = String(phone).trim();
  if (num.startsWith("08")) num = "62" + num.slice(1);
  if (num.startsWith("+")) num = num.slice(1);

  const jid = num.replace(/\D/g, "") + "@s.whatsapp.net";

  await sock.sendMessage(jid, { text: message });
  console.log("📤 WA message sent to", jid);
}

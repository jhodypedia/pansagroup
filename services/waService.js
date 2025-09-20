import makeWASocket, {
  useMultiFileAuthState,
  Browsers,
  DisconnectReason
} from "@whiskeysockets/baileys";

let sock;

/**
 * Start WhatsApp socket
 */
export async function startWA(io) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState("wa_auth");

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // QR kita kirim ke frontend, bukan ke terminal
      browser: Browsers.macOS("Desktop"), // spoof browser
      syncFullHistory: false
    });

    // Simpan kredensial
    sock.ev.on("creds.update", saveCreds);

    // Listener update koneksi
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr, pairingCode } = update;

      if (qr) {
        io.emit("wa_qr", qr); // kirim QR string ke frontend
      }

      if (pairingCode) {
        io.emit("wa_pairing", pairingCode); // pairing code (jika device support)
      }

      if (connection === "open") {
        io.emit("wa_ready", { user: sock?.user });
        console.log("✅ WhatsApp connected:", sock?.user?.id);
      }

      if (connection === "close") {
        const reason =
          lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error;
        const shouldReconnect =
          reason !== DisconnectReason.loggedOut &&
          reason !== DisconnectReason.badSession;

        io.emit("wa_logout");
        console.log("❌ WhatsApp disconnected:", reason);

        if (shouldReconnect) {
          console.log("🔄 Reconnecting...");
          setTimeout(() => startWA(io), 3000); // auto reconnect dengan delay
        } else {
          console.log("🛑 Logged out, perlu scan ulang.");
        }
      }
    });

    // Log event message masuk (opsional)
    sock.ev.on("messages.upsert", (msg) => {
      console.log("📩 New message:", msg);
    });
  } catch (e) {
    console.error("WA error:", e.message);
  }
}

/**
 * Kirim pesan WhatsApp ke nomor tertentu
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
}

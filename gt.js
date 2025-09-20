import bcrypt from "bcrypt";
import { User } from "./models/index.js";

async function seedAdmin() {
  const email = "admin@example.com";
  const password = "admin123"; // ganti setelah login pertama
  const phone = "6281234567890";

  // cek apakah sudah ada
  const exists = await User.findOne({ where: { email } });
  if (exists) {
    console.log("✅ Admin sudah ada:", email);
    return;
  }

  const hash = await bcrypt.hash(password, 10);

  await User.create({
    name: "Super Admin",
    email,
    phone,
    password: hash,
    role: "admin",   // <- role penting
    isPremium: true  // bisa juga default premium
  });

  console.log("🎉 Admin berhasil dibuat:", email, "/", password);
}

seedAdmin().then(() => process.exit());

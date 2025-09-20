import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import csrf from "csurf";
import expressLayouts from "express-ejs-layouts";
import cookieParser from "cookie-parser";

import { initDB } from "./config/db.js";
import { cspDirectives } from "./config/security.js";
import { injectUser } from "./middlewares/auth.js";
import { authLimiter, apiLimiter } from "./middlewares/rateLimiter.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import googleRoutes from "./routes/google.routes.js";
import videosRoutes from "./routes/videos.routes.js";
import liveRoutes from "./routes/live.routes.js";
import adminRoutes from "./routes/admin.routes.js";

import { startSchedulers } from "./services/scheduler.js";
import { startWA } from "./services/waService.js";

dotenv.config();
process.env.TZ = "Asia/Jakarta";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });
app.set("io", io);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(helmet({ contentSecurityPolicy: { directives: cspDirectives } }));
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, sameSite: "lax" }
}));

const csrfProtection = csrf();
app.use(csrfProtection, (req,res,next)=>{ res.locals.csrfToken = req.csrfToken(); next(); });

app.use(injectUser);

// Route groups
app.use("/auth", authLimiter);
app.use("/api", apiLimiter);

app.use(authRoutes);
app.use(userRoutes);
app.use(googleRoutes);
app.use(videosRoutes);
app.use(liveRoutes);
app.use(adminRoutes);

// Socket room per-user
io.on("connection",(socket)=>{
  const uid = socket.handshake.auth?.uid;
  if(uid) socket.join(String(uid));
});

// DB + background workers
await initDB();
startSchedulers(io);
startWA(io);

// 404
app.use((req,res)=> res.status(404).send("Not Found"));

server.listen(process.env.APP_PORT, ()=>console.log("✅ Server ready: http://localhost:"+process.env.APP_PORT));

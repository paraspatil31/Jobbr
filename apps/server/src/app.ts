import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app: Express = express();

/* ── Trust proxy (Replit reverse-proxy sets X-Forwarded-For) ── */
app.set("trust proxy", 1);

/* ── Security headers ────────────────────────────────────────── */
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // allow Replit preview iframe
    contentSecurityPolicy: false,     // managed by Vite in dev
  })
);

/* ── CORS ────────────────────────────────────────────────────── */
const allowedOrigins = [
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /\.repl\.co$/,
  /localhost/,
  /127\.0\.0\.1/,
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / curl
      if (allowedOrigins.some((pat) => pat.test(origin))) return cb(null, true);
      cb(new Error(`CORS: origin not allowed — ${origin}`));
    },
    credentials: true,
  })
);

/* ── Rate limiting ───────────────────────────────────────────── */
// Strict limit on auth endpoints to slow brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests, please try again later." },
});

// General API limit — generous but protects against scraping
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests, please slow down." },
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

/* ── Request logging ─────────────────────────────────────────── */
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

/* ── Body parsing ────────────────────────────────────────────── */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

/* ── Routes ──────────────────────────────────────────────────── */
app.use("/api", router);

/* ── Error handling ──────────────────────────────────────────── */
app.use(errorMiddleware);

export default app;

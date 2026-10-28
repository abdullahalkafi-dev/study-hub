import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { env } from "./config/env.ts";
import { errorHandler, notFound } from "./middleware/error.ts";
import { loadUser } from "./middleware/auth.ts";
import auth from "./modules/auth/auth.routes.ts";
import weeks from "./modules/weeks/weeks.routes.ts";
import progress from "./modules/progress/progress.routes.ts";
import notes from "./modules/notes/notes.routes.ts";
import uploads from "./modules/uploads/upload.routes.ts";
import admin from "./modules/audit/audit.routes.ts";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // behind Caddy/nginx on the VPS
  app.use(cors({ origin: env.webOrigin, credentials: true }));
  app.use(express.json({ limit: "200kb" }));
  app.use(cookieParser());
  app.get("/api/health", (_req, res) => { res.json({ ok: true, db: mongoose.connection.readyState === 1 }); });
  app.use("/api", loadUser);
  app.use("/api/auth", auth);
  app.use("/api/weeks", weeks);
  app.use("/api/progress", progress);
  app.use("/api/notes", notes);
  app.use("/api/uploads", uploads);
  app.use("/api/admin", admin);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

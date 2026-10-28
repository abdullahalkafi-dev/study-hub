import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { authRequired, env } from "../config/env.ts";
import { HttpError } from "./error.ts";

export type AuthUser = { id: string; email: string; role: "learner" | "admin" };
declare global { namespace Express { interface Request { user?: AuthUser } } }

export const COOKIE = "silo_token";
export const signToken = (u: AuthUser) => jwt.sign(u, env.jwtSecret, { expiresIn: "30d" });

// Sets req.user from the cookie. In open single-user mode everybody is the one learner (also admin).
export const loadUser: RequestHandler = (req, _res, next) => {
  if (!authRequired()) { req.user = { id: "me", email: "me@local", role: "admin" }; return next(); }
  const t = req.cookies?.[COOKIE];
  if (t) { try { req.user = jwt.verify(t, env.jwtSecret) as AuthUser; } catch { /* invalid token: stay logged out */ } }
  next();
};
export const requireUser: RequestHandler = (req, _res, next) => next(req.user ? undefined : new HttpError(401, "Please log in"));
export const requireAdmin: RequestHandler = (req, _res, next) =>
  next(req.user?.role === "admin" ? undefined : new HttpError(403, "Admin only"));

import crypto from "node:crypto";
import { env } from "../../config/env.ts";
import { HttpError } from "../../middleware/error.ts";
import { signToken, type AuthUser } from "../../middleware/auth.ts";
import { User } from "./user.model.ts";

// scrypt hash format: salt:hash (hex). No native dependencies.
export function hash(password: string) {
  const salt = crypto.randomBytes(16);
  return salt.toString("hex") + ":" + crypto.scryptSync(password, salt, 64).toString("hex");
}
export function verify(password: string, stored: string) {
  const [salt, h] = stored.split(":");
  if (!salt || !h) return false;
  const a = crypto.scryptSync(password, Buffer.from(salt, "hex"), 64), b = Buffer.from(h, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// Creates or updates the single learner from .env values (never stored in source files).
export async function ensureLearner() {
  if (!env.learnerEmail || !env.learnerPassword) return null;
  await User.updateOne({ email: env.learnerEmail }, { $set: { passwordHash: hash(env.learnerPassword), role: "admin" } }, { upsert: true });
  return env.learnerEmail;
}
export async function login(email: string, password: string) {
  const u: any = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!u || !verify(String(password || ""), u.passwordHash)) throw new HttpError(401, "Wrong email or password");
  const user: AuthUser = { id: String(u._id), email: u.email, role: u.role };
  return { user, token: signToken(user) };
}

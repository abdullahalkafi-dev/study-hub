import { authRequired } from "../../config/env.ts";
import { COOKIE } from "../../middleware/auth.ts";
import { wrap } from "../../middleware/error.ts";
import * as audit from "../audit/audit.service.ts";
import * as svc from "./auth.service.ts";

// COOKIE_SECURE=true when the site is served over HTTPS (set it once Caddy/nginx is in front).
const cookieOpts = { httpOnly: true, sameSite: "lax" as const, secure: process.env.COOKIE_SECURE === "true", maxAge: 30 * 864e5, path: "/" };

export const me = wrap((req, res) => {
  res.json({ authRequired: authRequired(), user: req.user || null });
});
export const login = wrap(async (req, res) => {
  const { user, token } = await svc.login(req.body?.email, req.body?.password);
  res.cookie(COOKIE, token, cookieOpts);
  await audit.record(user, "auth.login");
  res.json({ user });
});
export const logout = wrap((_req, res) => { res.clearCookie(COOKIE, { path: "/" }); res.json({ ok: true }); });

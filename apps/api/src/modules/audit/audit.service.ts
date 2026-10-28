import type { AuthUser } from "../../middleware/auth.ts";
import { AuditLog } from "./audit.model.ts";

// Audit failures must never break the study flow, so errors are swallowed and logged.
export async function record(user: Pick<AuthUser, "id" | "email">, action: string, target = "", meta?: unknown) {
  try { await AuditLog.create({ userId: user.id, email: user.email, action, target, meta }); }
  catch (e) { console.warn("audit write failed:", (e as Error).message); }
}
export const list = (limit = 100, action?: string) =>
  AuditLog.find(action ? { action } : {}).sort({ at: -1 }).limit(Math.min(limit, 500)).lean();

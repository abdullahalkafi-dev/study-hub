import { HttpError, wrap } from "../../middleware/error.ts";
import * as audit from "../audit/audit.service.ts";
import * as svc from "./progress.service.ts";

export const list = wrap(async (req, res) => { res.json({ checks: await svc.list(req.user!.id) }); });

// PUT /api/progress/1-3-math   body: { done: true | false }
export const set = wrap(async (req, res) => {
  const m = /^(\d{1,2})-([1-6])-(recall|math|physics|notes)$/.exec(String(req.params.key));
  if (!m) throw new HttpError(400, "Bad progress key");
  const done = req.body?.done !== false;
  const changed = await svc.setPart(req.user!.id, +m[1], +m[2], m[3], done);
  if (changed) await audit.record(req.user!, done ? "progress.complete" : "progress.undo", req.params.key as string);
  res.json({ key: req.params.key, done });
});

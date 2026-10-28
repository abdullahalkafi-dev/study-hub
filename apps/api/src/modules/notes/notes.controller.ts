import { HttpError, wrap } from "../../middleware/error.ts";
import * as svc from "./notes.service.ts";

export const list = wrap(async (req, res) => { res.json({ notes: await svc.list(req.user!.id) }); });
// PUT /api/notes/1-3   body: { text }
export const save = wrap(async (req, res) => {
  const m = /^(\d{1,2})-([1-6])$/.exec(String(req.params.key));
  if (!m || typeof req.body?.text !== "string") throw new HttpError(400, "Bad note");
  await svc.save(req.user!.id, +m[1], +m[2], req.body.text);
  res.json({ key: req.params.key, saved: true });
});

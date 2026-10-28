import { HttpError, wrap } from "../../middleware/error.ts";
import * as audit from "../audit/audit.service.ts";
import * as svc from "./upload.service.ts";

const dayOf = (req: any) => {
  const w = +req.params.week, d = +req.params.day;
  if (!(w >= 1 && w <= 34 && d >= 1 && d <= 6)) throw new HttpError(400, "Bad week or day");
  return { w, d };
};
const shape = (u: any) => ({ id: String(u._id), filename: u.filename, mime: u.mime, size: u.size, url: `/api/uploads/file/${u._id}` });

export const status = wrap((_req, res) => { res.json({ configured: svc.storageConfigured() }); });
export const list = wrap(async (req, res) => {
  const { w, d } = dayOf(req);
  res.json({ files: (await svc.list(req.user!.id, w, d)).map(shape) });
});
export const add = wrap(async (req, res) => {
  const { w, d } = dayOf(req);
  if (!req.file) throw new HttpError(400, "No file");
  const doc = await svc.add(req.user!.id, w, d, req.file);
  await audit.record(req.user!, "upload.add", `${w}-${d}`, { filename: doc.filename, size: doc.size });
  res.status(201).json(shape(doc));
});
export const file = wrap(async (req, res) => {
  const { meta, stream } = await svc.open(req.user!.id, String(req.params.id));
  res.setHeader("Content-Type", meta.mime);
  res.setHeader("Content-Length", String(meta.size));
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(meta.filename)}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  stream.pipe(res);
});
export const remove = wrap(async (req, res) => {
  const doc = await svc.remove(req.user!.id, String(req.params.id));
  await audit.record(req.user!, "upload.remove", `${doc.week}-${doc.day}`, { filename: doc.filename });
  res.json({ ok: true });
});

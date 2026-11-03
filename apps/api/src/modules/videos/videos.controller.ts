import type { Request, Response } from "express";
import { HttpError, wrap } from "../../middleware/error.ts";
import * as svc from "./videos.service.ts";

function ids(req: Request) {
  const week = +req.params.week, day = +req.params.day;
  if (!(week >= 1 && week <= 34 && day >= 1 && day <= 6)) throw new HttpError(400, "Bad week or day");
  return { week, day };
}

export const list = wrap(async (req, res) => {
  const { week, day } = ids(req);
  res.json(await svc.forDay(week, day));
});

// Streams the file with HTTP Range support, so the browser can seek.
async function send(req: Request, res: Response, week: number, file: string) {
  const src = await svc.source(week, file);
  if (!src) throw new HttpError(404, "Video not found");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", src.type);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (src.modified) res.setHeader("Last-Modified", src.modified.toUTCString());
  const range = svc.parseRange(req.headers.range, src.size);
  if (range === "bad") { res.status(416).setHeader("Content-Range", `bytes */${src.size}`); res.end(); return; }
  const { start, end } = range || { start: 0, end: src.size - 1 };
  if (range) { res.status(206); res.setHeader("Content-Range", `bytes ${start}-${end}/${src.size}`); }
  res.setHeader("Content-Length", String(end - start + 1));
  if (req.method === "HEAD") { res.end(); return; }
  const stream = await src.open(start, end);
  res.on("close", () => stream.destroy());
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}

export const video = wrap(async (req, res) => {
  const { week, day } = ids(req);
  const e = svc.lookup(week, day, String(req.params.subject));
  if (!e) throw new HttpError(404, "No video for this lesson");
  await send(req, res, week, e.file);
});
export const poster = wrap(async (req, res) => {
  const { week, day } = ids(req);
  const e = svc.lookup(week, day, String(req.params.subject));
  if (!e) throw new HttpError(404, "No video for this lesson");
  await send(req, res, week, e.poster);
});

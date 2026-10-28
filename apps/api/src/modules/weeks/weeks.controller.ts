import { HttpError, wrap } from "../../middleware/error.ts";
import * as svc from "./weeks.service.ts";

export const overview = wrap(async (_req, res) => { res.json(await svc.overview()); });
export const week = wrap(async (req, res) => {
  const w = await svc.week(+req.params.week);
  if (!w) throw new HttpError(404, "Week not available yet");
  res.json({ week: +req.params.week, days: w });
});
export const day = wrap(async (req, res) => {
  const d = await svc.day(+req.params.week, +req.params.day);
  if (!d) throw new HttpError(404, "Lesson not found");
  res.json(d);
});

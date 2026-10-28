import { wrap } from "../../middleware/error.ts";
import * as svc from "./audit.service.ts";

export const list = wrap(async (req, res) => {
  const limit = parseInt(String(req.query.limit || "100"), 10) || 100;
  const action = typeof req.query.action === "string" ? req.query.action : undefined;
  res.json({ entries: await svc.list(limit, action) });
});

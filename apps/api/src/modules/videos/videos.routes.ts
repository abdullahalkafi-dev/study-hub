import { Router } from "express";
import { requireUser } from "../../middleware/auth.ts";
import * as c from "./videos.controller.ts";

// Read-only: no database access at all.
const r = Router();
r.use(requireUser);
r.get("/:week/:day", c.list);
r.get("/:week/:day/:subject", c.video);
r.get("/:week/:day/:subject/poster", c.poster);
export default r;

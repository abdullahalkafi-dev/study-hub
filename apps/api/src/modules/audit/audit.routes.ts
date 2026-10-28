import { Router } from "express";
import { requireAdmin, requireUser } from "../../middleware/auth.ts";
import * as c from "./audit.controller.ts";

const r = Router();
r.get("/audit", requireUser, requireAdmin, c.list);
export default r;

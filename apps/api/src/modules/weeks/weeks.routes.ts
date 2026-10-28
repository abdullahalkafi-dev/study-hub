import { Router } from "express";
import { requireUser } from "../../middleware/auth.ts";
import * as c from "./weeks.controller.ts";

const r = Router();
r.use(requireUser);
r.get("/", c.overview);
r.get("/:week", c.week);
r.get("/:week/:day", c.day);
export default r;

import { Router } from "express";
import { requireUser } from "../../middleware/auth.ts";
import * as c from "./progress.controller.ts";

const r = Router();
r.use(requireUser);
r.get("/", c.list);
r.put("/:key", c.set);
export default r;

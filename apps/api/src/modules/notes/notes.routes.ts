import { Router } from "express";
import { requireUser } from "../../middleware/auth.ts";
import * as c from "./notes.controller.ts";

const r = Router();
r.use(requireUser);
r.get("/", c.list);
r.put("/:key", c.save);
export default r;

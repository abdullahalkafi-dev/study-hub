import { Router } from "express";
import multer from "multer";
import { requireUser } from "../../middleware/auth.ts";
import * as c from "./upload.controller.ts";
import { MAX_BYTES } from "./upload.service.ts";

const r = Router();
const up = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 } });
r.use(requireUser);
r.get("/status", c.status);
r.get("/file/:id", c.file);
r.delete("/file/:id", c.remove);
r.get("/:week/:day", c.list);
r.post("/:week/:day", up.single("file"), c.add);
export default r;

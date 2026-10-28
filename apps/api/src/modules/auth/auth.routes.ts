import { Router } from "express";
import * as c from "./auth.controller.ts";

const r = Router();
r.get("/me", c.me);
r.post("/login", c.login);
r.post("/logout", c.logout);
export default r;

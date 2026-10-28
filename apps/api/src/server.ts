import { createApp } from "./app.ts";
import { connectDb, DbConfigError } from "./config/db.ts";
import { authRequired, env } from "./config/env.ts";
import { ensureLearner } from "./modules/auth/auth.service.ts";
import { storageConfigured } from "./modules/uploads/upload.service.ts";

if (process.env.NODE_ENV === "production" && (!authRequired() || env.jwtSecretIsRandom)) {
  console.error("[auth] Production needs LEARNER_EMAIL, LEARNER_PASSWORD and JWT_SECRET in .env. Refusing to start an open server on the internet.");
  process.exit(1);
}
try {
  await connectDb();
  console.log(`[db] MongoDB Atlas connected (database "${env.mongoDbName}")`);
  const who = await ensureLearner();
  if (who) console.log("[auth] login required; learner account ready: " + who);
} catch (e) {
  console.error("[db] " + (e as Error).message);
  if (e instanceof DbConfigError) process.exit(1);
  console.error("[db] Could not reach Atlas. Check: your IP is allowed under Network Access, the user and password are right, and the cluster is running.");
  process.exit(1);
}
if (!authRequired()) console.warn("[auth] OPEN single-user mode (no LEARNER_PASSWORD set). Set LEARNER_EMAIL and LEARNER_PASSWORD in .env to require login.");
else if (env.jwtSecretIsRandom) console.warn("[auth] JWT_SECRET not set: using a random one, so logins reset when the API restarts.");
if (!storageConfigured()) console.warn("[uploads] MinIO keys not set: file uploads are disabled.");
createApp().listen(env.port, () => console.log(`[api] http://localhost:${env.port}`));

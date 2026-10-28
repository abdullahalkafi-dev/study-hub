// Loads the parsed lessons from @silo/content into MongoDB (idempotent: upserts by week + day).
import { availableWeeks, getWeek } from "@silo/content";
import { connectDb, disconnectDb } from "../config/db.ts";
import { env } from "../config/env.ts";
import { Lesson } from "../modules/weeks/lesson.model.ts";
import { ensureLearner } from "../modules/auth/auth.service.ts";

try { await connectDb(); } catch (e) { console.error("[seed] " + (e as Error).message); process.exit(1); }
console.log(`[seed] connected to Atlas database "${env.mongoDbName}"`);
let n = 0;
for (const w of availableWeeks()) {
  for (const d of getWeek(w)!) {
    await Lesson.updateOne({ week: w, day: d.n }, { $set: { title: d.title, data: d } }, { upsert: true });
    n++;
  }
}
const stale = await Lesson.deleteMany({ week: { $nin: availableWeeks() } });
console.log(`seeded ${n} lessons from ${availableWeeks().length} weeks` + (stale.deletedCount ? `, removed ${stale.deletedCount} stale` : ""));
const who = await ensureLearner();
if (who) console.log("learner account ready: " + who);
await disconnectDb();

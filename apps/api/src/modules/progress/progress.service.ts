import { Progress } from "./progress.model.ts";

// { "1-3-math": true, ... } for every finished part of a user.
export async function list(userId: string) {
  const rows: any[] = await Progress.find({ userId }).lean();
  return Object.fromEntries(rows.map((r) => [`${r.week}-${r.day}-${r.part}`, true]));
}
// Returns true if the state actually changed (used to avoid duplicate audit rows).
export async function setPart(userId: string, week: number, day: number, part: string, done: boolean) {
  if (done) {
    const r = await Progress.updateOne({ userId, week, day, part }, { $setOnInsert: { userId, week, day, part } }, { upsert: true, runValidators: true });
    return r.upsertedCount > 0;
  }
  const r = await Progress.deleteOne({ userId, week, day, part });
  return r.deletedCount > 0;
}

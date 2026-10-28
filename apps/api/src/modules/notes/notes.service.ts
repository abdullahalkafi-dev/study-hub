import { Note } from "./notes.model.ts";

export async function list(userId: string) {
  const rows: any[] = await Note.find({ userId }).lean();
  return Object.fromEntries(rows.map((r) => [`${r.week}-${r.day}`, r.text as string]));
}
export async function save(userId: string, week: number, day: number, text: string) {
  await Note.updateOne({ userId, week, day }, { $set: { text } }, { upsert: true, runValidators: true });
}

import mongoose from "mongoose";
import { availableWeeks, getDay, getRoadmap, getWeek, START_DATE } from "@silo/content";
import { Lesson } from "./lesson.model.ts";

const dbUp = () => mongoose.connection.readyState === 1;

// Lessons come from MongoDB after `npm run seed`. If the collection is empty (or Mongo is down)
// the built content package is used, so the app still opens before the first seed.
async function dbWeeks(): Promise<Record<number, { day: number; title: string; checks: string[] }[]> | null> {
  if (!dbUp()) return null;
  const rows: any[] = await Lesson.find({}, { week: 1, day: 1, title: 1, "data.checks": 1 }).sort({ week: 1, day: 1 }).lean();
  if (!rows.length) return null;
  const out: Record<number, any[]> = {};
  for (const r of rows) (out[r.week] ||= []).push({ day: r.day, title: r.title, checks: r.data?.checks || [] });
  return out;
}
export async function overview() {
  const { PHASES, W } = getRoadmap();
  const db = await dbWeeks();
  const have: Record<number, number> = {};
  if (db) for (const w in db) have[+w] = db[w].length;
  else for (const w of availableWeeks()) have[w] = getWeek(w)!.length;
  return {
    startDate: START_DATE, phases: PHASES, source: db ? "mongodb" : "content-package",
    weeks: W.map((w, i) => ({ week: i + 1, math: w[0], physics: w[1], story: w[2], days: have[i + 1] || 0 }))
  };
}
export async function week(w: number) {
  const db = await dbWeeks();
  if (db) return db[w] || null;
  return getWeek(w)?.map((d: any) => ({ day: d.n, title: d.title, checks: d.checks })) || null;
}
export async function day(w: number, d: number) {
  if (dbUp()) {
    const row: any = await Lesson.findOne({ week: w, day: d }).lean();
    if (row) return row.data;
  }
  return getDay(w, d);
}

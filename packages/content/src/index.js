import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const roadmap = JSON.parse(fs.readFileSync(path.join(here, "roadmap.json"), "utf8"));
let weeks = null;

function load() {
  if (!weeks) {
    const f = path.join(here, "../data/weeks.json");
    if (!fs.existsSync(f)) throw new Error("Lesson data missing. Run: npm run content:build");
    weeks = JSON.parse(fs.readFileSync(f, "utf8"));
  }
  return weeks;
}

export const START_DATE = "2026-11-02"; // Mon, week 1 day 1
export const getRoadmap = () => roadmap;
export const availableWeeks = () => Object.keys(load()).map(Number).sort((a, b) => a - b);
export const getWeek = (w) => load()[w] || null;
export const getDay = (w, d) => (load()[w] || []).find((x) => x.n === d) || null;
export const dayIndex = () => availableWeeks().flatMap((w) => load()[w].map((d) => ({ week: w, day: d.n, title: d.title, checks: d.checks })));

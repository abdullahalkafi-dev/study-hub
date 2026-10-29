// Parses ../lessons/week-NN/day-N.txt into data/weeks.json.
// CONTENT_MAX_WEEK limits how many weeks are included (default 23; weeks 24-34 come later).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDay, warnings } from "../src/parser.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, "../lessons");
const max = parseInt(process.env.CONTENT_MAX_WEEK || "23", 10);
const weeks = {};

for (const d of fs.readdirSync(srcRoot, { withFileTypes: true })) {
  const m = /^week-(\d+)$/.exec(d.name);
  if (!d.isDirectory() || !m) continue;
  const n = parseInt(m[1], 10);
  if (n > max) continue;
  const files = fs.readdirSync(path.join(srcRoot, d.name)).filter((f) => /^day-\d+\.txt$/.test(f))
    .sort((a, b) => parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10));
  weeks[n] = files.map((f) => {
    const day = parseDay(fs.readFileSync(path.join(srcRoot, d.name, f), "utf8"), `week-${n}/${f}`);
    day.n = parseInt(f.slice(4), 10);
    return day;
  });
}
fs.mkdirSync(path.join(here, "../data"), { recursive: true });
fs.writeFileSync(path.join(here, "../data/weeks.json"), JSON.stringify(weeks));
if (warnings.length) { console.log(`${warnings.length} parser warnings:`); warnings.slice(0, 30).forEach((w) => console.log("  " + w)); }
const nDays = Object.values(weeks).reduce((a, d) => a + d.length, 0);
console.log(`content: ${Object.keys(weeks).length} weeks, ${nDays} days -> packages/content/data/weeks.json`);

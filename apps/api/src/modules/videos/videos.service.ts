import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Readable } from "node:stream";
import { getVideos, type VideoEntry } from "@silo/content";
import { env } from "../../config/env.ts";
import { mc, storageConfigured } from "../uploads/upload.service.ts";

export type Subject = "math" | "physics";
export const SUBJECTS: Subject[] = ["math", "physics"];

const here = path.dirname(fileURLToPath(import.meta.url));
// Local videos live outside git: silo-study/local/videos/week-NN/<file> (override with VIDEOS_DIR).
const LOCAL_DIR = path.resolve(process.env.VIDEOS_DIR || path.join(here, "../../../../../local/videos"));
const weekDir = (week: number) => `week-${String(week).padStart(2, "0")}`;

export function lookup(week: number, day: number, subject: string): VideoEntry | null {
  if (!SUBJECTS.includes(subject as Subject)) return null;
  return getVideos(week)?.[String(day)]?.[subject as Subject] || null;
}

const localPath = (week: number, file: string) => path.join(LOCAL_DIR, weekDir(week), path.basename(file));
const objectKey = (week: number, file: string) => `videos/${weekDir(week)}/${path.basename(file)}`;

export type Source = { size: number; type: string; modified?: Date; open: (start: number, end: number) => Promise<Readable> };

const MIME: Record<string, string> = { ".mp4": "video/mp4", ".webm": "video/webm", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

// A file is served from the local folder if it is there, otherwise from MinIO when MinIO is configured.
export async function source(week: number, file: string): Promise<Source | null> {
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  const lp = localPath(week, file);
  try {
    const st = await fs.promises.stat(lp);
    if (st.isFile()) return { size: st.size, type, modified: st.mtime, open: async (start, end) => fs.createReadStream(lp, { start, end }) };
  } catch { /* not local */ }
  if (!storageConfigured()) return null;
  try {
    const key = objectKey(week, file);
    const st = await mc().statObject(env.minio.bucket, key);
    return { size: st.size, type, modified: st.lastModified, open: async (start, end) => mc().getPartialObject(env.minio.bucket, key, start, end - start + 1) as Promise<Readable> };
  } catch { return null; }
}

// "bytes=0-99", "bytes=100-", "bytes=-500" -> inclusive [start, end], or null if unsatisfiable
export function parseRange(header: string | undefined, size: number): { start: number; end: number } | "bad" | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return "bad";
  let start: number, end: number;
  if (m[1] === "") { const n = parseInt(m[2], 10); if (n === 0) return "bad"; start = Math.max(0, size - n); end = size - 1; }
  else { start = parseInt(m[1], 10); end = m[2] === "" ? size - 1 : Math.min(parseInt(m[2], 10), size - 1); }
  if (start >= size || start > end) return "bad";
  return { start, end };
}

// Which videos exist for a day (checked against the real storage, cached for a minute).
const cache = new Map<string, { at: number; value: boolean }>();
async function exists(week: number, file: string) {
  const k = week + "/" + file, hit = cache.get(k);
  if (hit && Date.now() - hit.at < 60_000) return hit.value;
  const value = !!(await source(week, file));
  cache.set(k, { at: Date.now(), value });
  return value;
}
export async function forDay(week: number, day: number) {
  const out: Partial<Record<Subject, { video: string; poster: string | null }>> = {};
  for (const s of SUBJECTS) {
    const e = lookup(week, day, s);
    if (!e || !(await exists(week, e.file))) continue;
    out[s] = { video: `/api/videos/${week}/${day}/${s}`, poster: (await exists(week, e.poster)) ? `/api/videos/${week}/${day}/${s}/poster` : null };
  }
  return out;
}

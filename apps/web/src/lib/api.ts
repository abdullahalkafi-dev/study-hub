export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method, credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as any).error || res.statusText);
  return data as T;
}
export const api = {
  get: <T>(url: string) => call<T>("GET", url),
  put: <T>(url: string, body: unknown) => call<T>("PUT", url, body),
  post: <T>(url: string, body: unknown) => call<T>("POST", url, body),
  del: <T>(url: string) => call<T>("DELETE", url)
};

export type Me = { authRequired: boolean; user: { id: string; email: string; role: string } | null };
export type WeekInfo = { week: number; math: string; physics: string; story: string; days: number };
export type Overview = { startDate: string; phases: { name: string; from: number; to: number }[]; weeks: WeekInfo[]; source: string };
export type DaySummary = { day: number; title: string; checks: string[] };

export type Block = any; // parsed lesson block, see packages/content/src/parser.js
export type Section = { key: string; title: string; meta: string; blocks: Block[] };
export type Lesson = { n: number; eyebrow: string; title: string; lead: string; bn: string; sections: Section[]; checks: string[] };

export const DAYNAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function dayDate(start: string, week: number, day: number) {
  const [y, m, d] = start.split("-").map(Number);
  return new Date(y, m - 1, d + (week - 1) * 7 + (day - 1));
}
export const fmtDate = (x: Date) => x.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

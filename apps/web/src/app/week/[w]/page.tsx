"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api, ApiError, DAYNAMES, dayDate, fmtDate, type DaySummary } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function WeekPage({ params }: { params: Promise<{ w: string }> }) {
  const w = +use(params).w;
  const { overview, dayDone, dayComplete } = useStore();
  const [days, setDays] = useState<DaySummary[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api.get<{ days: DaySummary[] }>(`/api/weeks/${w}`).then((r) => setDays(r.days)).catch((e: ApiError) => setErr(e.message));
  }, [w]);
  const info = overview?.weeks[w - 1];
  if (!overview || !info) return <div className="wrap"><h1>Week not found</h1><Link className="btn" href="/weeks">All weeks</Link></div>;
  const done = days ? days.filter((d) => dayComplete(w, d.day)).length : 0;
  const phase = overview.phases.findIndex((p) => w >= p.from && w <= p.to) + 1;

  return (
    <div className="wrap">
      <p className="eyebrow">Phase {phase} · Week {w} of 34</p>
      <h1>{info.math}</h1>
      <p className="lead">Physics: {info.physics}. Story: {info.story}.</p>
      {err && <div className="panel"><b>Lessons for this week are not written yet.</b><p className="meta" style={{ margin: "6px 0 0" }}>{err}</p></div>}
      {days && (
        <>
          <div className="bar" style={{ margin: "6px 0 18px" }}><i style={{ width: Math.round((100 * done) / days.length) + "%" }} /></div>
          <h2>Daily plan</h2>
          {days.map((d) => {
            const n = dayDone(w, d.day);
            return (
              <Link key={d.day} className="day-row" href={`/day/${w}/${d.day}`}>
                <span className="d">{DAYNAMES[d.day - 1]}</span>
                <span className="tt">{d.title}<small>{fmtDate(dayDate(overview.startDate, w, d.day))}</small></span>
                {n === 4 ? <span className="pill ok">Done</span> : n ? <span className="pill">{n}/4</span> : null}
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}

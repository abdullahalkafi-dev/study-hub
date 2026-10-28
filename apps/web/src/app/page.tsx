"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { DAYNAMES, dayDate, fmtDate } from "@/lib/api";

const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);

export default function Dashboard() {
  const { overview, dayComplete, dayDone } = useStore();
  if (!overview) return null;
  const days = overview.weeks.flatMap((w) => Array.from({ length: w.days }, (_, i) => ({ w: w.week, d: i + 1 })));
  const done = days.filter((x) => dayComplete(x.w, x.d)).length;
  const next = days.find((x) => !dayComplete(x.w, x.d));
  const weeksDone = overview.weeks.filter((w) => w.days && Array.from({ length: w.days }, (_, i) => i + 1).every((d) => dayComplete(w.week, d))).length;
  const [y, m, d] = overview.startDate.split("-").map(Number);
  const startsIn = Math.ceil((new Date(y, m - 1, d).getTime() - Date.now()) / 864e5);
  const nextInfo = next && overview.weeks[next.w - 1];

  return (
    <div className="wrap wide">
      <p className="eyebrow">Dashboard</p>
      <h1>{startsIn > 0 ? `Starts in ${startsIn} day${startsIn === 1 ? "" : "s"}. You can begin early.` : "Keep the line going."}</h1>
      <p className="lead">Mon 2 Nov 2026 to Sat 26 Jun 2027. Mon–Sat, about 2 hours a day, Sunday off.</p>
      <div className="stats">
        <div className="stat"><b>{pct(done, 34 * 6)}%</b><span>of all {34 * 6} lesson days complete</span><div className="bar" style={{ marginTop: 10 }}><i style={{ width: pct(done, 34 * 6) + "%" }} /></div></div>
        <div className="stat"><b>{done} / {days.length}</b><span>days complete (of {days.length} written so far)</span></div>
        <div className="stat"><b>{weeksDone} / 34</b><span>weeks complete</span></div>
        <div className="stat"><b>{overview.weeks.filter((w) => w.days).length} / 34</b><span>weeks with lessons</span></div>
      </div>
      {next && nextInfo && (
        <div className="panel">
          <span className="pill ok">Up next</span>
          <h3 style={{ marginTop: 10 }}>Week {next.w} · {DAYNAMES[next.d - 1]}: {nextInfo.math}</h3>
          <p className="meta">{fmtDate(dayDate(overview.startDate, next.w, next.d))} · {dayDone(next.w, next.d)} of 4 parts done</p>
          <div className="bar" style={{ margin: "12px 0 16px" }}><i style={{ width: pct(dayDone(next.w, next.d), 4) + "%" }} /></div>
          <Link className="btn primary" href={`/day/${next.w}/${next.d}`}>Open lesson</Link>
        </div>
      )}
      <h2>Phases</h2>
      {overview.phases.map((p, i) => {
        const inPhase = days.filter((x) => x.w >= p.from && x.w <= p.to);
        const total = (p.to - p.from + 1) * 6, dn = inPhase.filter((x) => dayComplete(x.w, x.d)).length;
        return (
          <div key={p.name} className="panel" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ flex: 1 }}><b>Phase {i + 1}</b> · {p.name}<br /><small className="meta">Weeks {p.from}–{p.to}</small></div>
            <div style={{ minWidth: 120 }}><div className="bar"><i style={{ width: pct(dn, total) + "%" }} /></div><small className="meta">{pct(dn, total)}%</small></div>
          </div>
        );
      })}
    </div>
  );
}

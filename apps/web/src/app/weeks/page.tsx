"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function Weeks() {
  const { overview, dayComplete } = useStore();
  if (!overview) return null;
  return (
    <div className="wrap wide">
      <p className="eyebrow">Roadmap v2</p>
      <h1>All 34 weeks</h1>
      <p className="lead">Foundations move fast. The hard topics get the room.</p>
      {overview.phases.map((p, i) => (
        <section key={p.name}>
          <h2>Phase {i + 1} · {p.name}</h2>
          <div className="cards">
            {overview.weeks.filter((w) => w.week >= p.from && w.week <= p.to).map((w) => {
              const done = Array.from({ length: w.days }, (_, k) => k + 1).filter((d) => dayComplete(w.week, d)).length;
              const body = (<><span className="num">WEEK {w.week}</span><b>{w.math}</b><small>Physics: {w.physics}</small><br /><small>{w.days ? `${done} of ${w.days} days done` : "Lessons coming"}</small></>);
              return w.days ? <Link key={w.week} className="card" href={`/week/${w.week}`}>{body}</Link> : <div key={w.week} className="card soon">{body}</div>;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

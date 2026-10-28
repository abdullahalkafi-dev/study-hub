"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { api, ApiError, DAYNAMES, dayDate, fmtDate, type Lesson } from "@/lib/api";
import { useStore } from "@/lib/store";
import { BlockView, Inline } from "@/components/blocks";

export default function DayPage({ params }: { params: Promise<{ w: string; d: string }> }) {
  const p = use(params), w = +p.w, d = +p.d;
  const { overview, checks } = useStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState(0);
  useEffect(() => {
    setLesson(null); setErr(""); setTab(0);
    api.get<Lesson>(`/api/weeks/${w}/${d}`).then(setLesson).catch((e: ApiError) => setErr(e.message));
  }, [w, d]);

  if (err) return <div className="wrap"><h1>Lesson not found</h1><p className="meta">{err}</p><Link className="btn" href="/weeks">All weeks</Link></div>;
  if (!lesson || !overview) return <p className="skeleton">Loading lesson…</p>;
  const secs = lesson.sections.filter((s) => s.blocks.length);
  const days = overview.weeks[w - 1]?.days || 6;
  const doneTab = (key: string) => !!checks[`${w}-${d}-${key}`];

  return (
    <div className="wrap">
      <p className="eyebrow">{lesson.eyebrow}</p>
      <h1>{lesson.title}</h1>
      <p className="meta">{fmtDate(dayDate(overview.startDate, w, d))}</p>
      <p className="lead"><Inline text={lesson.lead} /></p>
      {lesson.bn && <div className="bn" lang="bn"><span className="lab">বাংলায়</span><Inline text={lesson.bn} /></div>}
      <div className="tabs" role="tablist">
        {secs.map((s, i) => (
          <button key={s.key} className="tab" role="tab" aria-selected={i === tab} onClick={() => { setTab(i); window.scrollTo({ top: 0 }); }}>
            {s.title}{doneTab(s.key) && <span className="tick">✓</span>}
          </button>
        ))}
      </div>
      {secs.map((s, i) => (
        <section className="pane" key={s.key} hidden={i !== tab}>
          <h2>{s.title}</h2>
          {s.meta && <p className="sec-meta">{s.meta}</p>}
          {s.blocks.map((b, j) => <BlockView key={j} b={b} week={w} day={d} />)}
        </section>
      ))}
      <div className="navrow">
        {d > 1 ? <Link className="btn" href={`/day/${w}/${d - 1}`}>← {DAYNAMES[d - 2]}</Link> : <Link className="btn" href={`/week/${w}`}>← Week {w}</Link>}
        {d < days ? <Link className="btn primary" href={`/day/${w}/${d + 1}`}>{DAYNAMES[d]} →</Link> : <Link className="btn primary" href={`/week/${w}`}>Back to Week {w}</Link>}
      </div>
    </div>
  );
}

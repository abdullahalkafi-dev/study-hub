"use client";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { compile, num, type Env } from "@/lib/expr";
import { FunctionPlot, PointPlot } from "./Plot";
import { useStore } from "@/lib/store";
import { api, type Block } from "@/lib/api";

/* ---------- inline text: **bold**, *italic*, `code` ---------- */
export function Inline({ text }: { text: string }): ReactNode {
  const parts = String(text ?? "").split(/(`[^`]+`|\*\*[^*]+\*\*|(?<![\w*])\*[^*\n]+\*(?![\w*]))/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <b key={i}>{p.slice(2, -2)}</b>
      : p.startsWith("`") && p.endsWith("`") && p.length > 2 ? <code key={i}>{p.slice(1, -1)}</code>
      : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <i key={i}>{p.slice(1, -1)}</i>
      : <Fragment key={i}>{p}</Fragment>);
}

/* ---------- quiz ---------- */
export function Quiz({ items }: { items: { q: string; o: string[]; a: number; e: string }[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => items.map(() => null));
  const score = picked.filter((p, i) => p === items[i].a).length;
  return (
    <div className="quiz panel">
      {items.map((it, i) => (
        <div className="qq" key={i}>
          <p><Inline text={it.q} /></p>
          <div className="opts">
            {it.o.map((o, j) => {
              const chosen = picked[i] !== null;
              const cls = "opt" + (chosen && j === it.a ? " right" : "") + (chosen && picked[i] === j && j !== it.a ? " wrong" : "");
              return <button key={j} type="button" className={cls} disabled={chosen} onClick={() => setPicked((p) => p.map((v, k) => (k === i ? j : v)))}><Inline text={o} /></button>;
            })}
          </div>
          {picked[i] !== null && <p className="qexp"><Inline text={it.e} /></p>}
        </div>
      ))}
      <p className="qscore">Score: {score} / {items.length}</p>
    </div>
  );
}

/* ---------- exit ticket (typed numeric answers) ---------- */
export function Exit({ items }: { items: { q: string; a: number; tol: number; e: string }[] }) {
  const [vals, setVals] = useState<string[]>(() => items.map(() => ""));
  const [res, setRes] = useState<(null | { ok: boolean } | "empty")[]>(() => items.map(() => null));
  const good = res.filter((r) => r && r !== "empty" && r.ok).length;
  const check = (i: number) => setRes((r) => r.map((x, k) => {
    if (k !== i) return x;
    if (vals[i].trim() === "") return "empty";
    return { ok: Math.abs(parseFloat(vals[i]) - items[i].a) <= (items[i].tol || 1e-9) };
  }));
  return (
    <div className="exit panel">
      <h3 style={{ marginTop: 0 }}>Exit ticket · answer from memory</h3>
      {items.map((it, i) => (
        <div className="qq" key={i}>
          <p>{i + 1}. <Inline text={it.q} /></p>
          <div className="exrow">
            <input type="number" step="any" aria-label={`Answer ${i + 1}`} value={vals[i]} onChange={(e) => setVals((v) => v.map((x, k) => (k === i ? e.target.value : x)))} onKeyDown={(e) => e.key === "Enter" && check(i)} />
            <button className="btn" type="button" onClick={() => check(i)}>Check</button>
          </div>
          {res[i] === "empty" && <p className="qexp">Enter an answer first.</p>}
          {res[i] && res[i] !== "empty" && <p className="qexp" style={{ color: (res[i] as { ok: boolean }).ok ? "var(--ok)" : "var(--amber)" }}>{(res[i] as { ok: boolean }).ok ? "✓ Correct. " : "↻ Not yet. "}<Inline text={it.e} /></p>}
        </div>
      ))}
      <p className="qscore">{good} of {items.length} correct</p>
    </div>
  );
}

/* ---------- lab: sliders -> live numbers + graph ---------- */
type LabSpec = { title: string; intro: string; vars: { n: string; l: string; min: number; max: number; step: number; v: number }[]; outs: { e: string; l: string; d: number; u: string }[]; plots: string[]; xr: string; yr: string };
export function Lab({ b }: { b: LabSpec }) {
  const [vals, setVals] = useState<Env>(() => Object.fromEntries(b.vars.map((v) => [v.n, v.v])));
  const outs = b.outs.map((o) => {
    try { const r = compile(o.e)(vals); return isFinite(r) ? r.toFixed(o.d) + (o.u ? " " + o.u : "") : "n/a"; } catch { return "n/a"; }
  });
  const plot = useMemo(() => {
    if (!b.plots.length) return null;
    try {
      const [x0, x1] = b.xr.split(","), [y0, y1] = b.yr.split(",");
      return { xmin: num(x0), xmax: num(x1), ymin: num(y0), ymax: num(y1), fns: b.plots.map((e) => { const f = compile(e); return (x: number) => f({ ...vals, x }); }) };
    } catch (e) { return { error: (e as Error).message }; }
  }, [b, vals]);
  return (
    <div className="lab panel">
      <span className="pill ok">Interactive lab</span>
      <h3 style={{ margin: "10px 0 6px" }}>{b.title}</h3>
      <p className="meta"><Inline text={b.intro} /></p>
      <div className="lab-ctl">
        {b.vars.map((v) => (
          <div className="lab-var" key={v.n}>
            <label>{v.l} <strong>{+vals[v.n].toFixed(4)}</strong>
              <input type="range" min={v.min} max={v.max} step={v.step} value={vals[v.n]} onChange={(e) => setVals((s) => ({ ...s, [v.n]: parseFloat(e.target.value) }))} />
            </label>
          </div>
        ))}
      </div>
      <div className="lab-out">{b.outs.map((o, i) => <div className="metric" key={i}><strong>{outs[i]}</strong><span>{o.l}</span></div>)}</div>
      {plot && ("error" in plot ? <p className="meta">Plot unavailable: {plot.error}</p> : <div className="lab-plot"><FunctionPlot title={b.title} xl="x" yl="y" {...plot} /></div>)}
    </div>
  );
}

/* ---------- function graph ---------- */
type FuncSpec = { title: string; xl: string; yl: string; exprs: string[]; xr: string; yr: string; xunit: string; caption: string };
export function FuncGraph({ b }: { b: FuncSpec }) {
  const spec = useMemo(() => {
    try {
      const [x0, x1] = b.xr.split(","), [y0, y1] = b.yr.split(",");
      return { xmin: num(x0), xmax: num(x1), ymin: num(y0), ymax: num(y1), fns: b.exprs.map((e) => { const f = compile(e); return (x: number) => f({ x }); }) };
    } catch (e) { return { error: (e as Error).message }; }
  }, [b]);
  if ("error" in spec) return <p className="meta">Graph unavailable: {spec.error}</p>;
  return (
    <figure className="funcg">
      <b>{b.title}</b>
      <FunctionPlot title={b.title} xl={b.xl} yl={b.yl} xunit={b.xunit} {...spec} />
      <figcaption><Inline text={b.caption} /></figcaption>
    </figure>
  );
}

/* ---------- notes (debounced save to the API) ---------- */
export function Notes({ week, day }: { week: number; day: number }) {
  const { notes, saveNote } = useStore();
  const key = `${week}-${day}`;
  const [text, setText] = useState(notes[key] || "");
  const [state, setState] = useState<"" | "saving" | "saved" | "failed">("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const onChange = (v: string) => {
    setText(v); setState("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { saveNote(key, v).then(() => setState("saved")).catch(() => setState("failed")); }, 600);
  };
  return (
    <>
      <h3>My notes</h3>
      <textarea className="notes" value={text} onChange={(e) => onChange(e.target.value)} placeholder="What clicked today? What confused you? One question for tomorrow…" aria-label="Notes" />
      <p className="save-st" aria-live="polite">{state === "saving" ? "Saving…" : state === "saved" ? "✓ Saved" : state === "failed" ? "Could not save. Is the database running?" : "Notes save automatically."}</p>
    </>
  );
}

/* ---------- per-day uploads (image / audio / video via MinIO) ---------- */
type UFile = { id: string; filename: string; mime: string; size: number; url: string };
export function Uploads({ week, day }: { week: number; day: number }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [files, setFiles] = useState<UFile[]>([]);
  const [msg, setMsg] = useState("");
  const load = () => api.get<{ files: UFile[] }>(`/api/uploads/${week}/${day}`).then((r) => setFiles(r.files)).catch(() => {});
  useEffect(() => {
    api.get<{ configured: boolean }>("/api/uploads/status").then((s) => { setConfigured(s.configured); if (s.configured) load(); }).catch(() => setConfigured(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, day]);
  async function onPick(f: File | undefined) {
    if (!f) return;
    setMsg("Uploading…");
    const fd = new FormData(); fd.append("file", f);
    const res = await fetch(`/api/uploads/${week}/${day}`, { method: "POST", body: fd, credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "" : data.error || "Upload failed");
    if (res.ok) load();
  }
  const remove = (id: string) => api.del(`/api/uploads/file/${id}`).then(load).catch((e) => setMsg(e.message));
  if (configured === null) return null;
  return (
    <>
      <h3>My files for this day</h3>
      {!configured ? <p className="meta">File storage is off. Start MinIO and set MINIO_ACCESS_KEY / MINIO_SECRET_KEY in .env to attach photos of your paper work, audio or video.</p> : (
        <>
          <input type="file" accept="image/*,audio/*,video/*" onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} aria-label="Add image, audio or video" />
          {msg && <p className="err">{msg}</p>}
          <div className="upl">
            {files.map((f) => (
              <figure key={f.id}>
                {f.mime.startsWith("image/") ? <img src={f.url} alt={f.filename} /> : f.mime.startsWith("audio/") ? <audio controls src={f.url} /> : <video controls src={f.url} />}
                <figcaption><span>{f.filename}</span><button className="linkbtn" onClick={() => remove(f.id)}>Delete</button></figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ---------- one markup block ---------- */
export function BlockView({ b, week, day }: { b: Block; week: number; day: number }) {
  const { checks, toggle } = useStore();
  switch (b.t) {
    case "h3": return <h3><Inline text={b.text} /></h3>;
    case "p": return <p><Inline text={b.text} /></p>;
    case "eq": return <div className="eq">{b.text}</div>;
    case "key": return <div className="key"><b className="lab">Key idea</b><Inline text={b.text} /></div>;
    case "trap": return <div className="trap"><b className="lab">Common trap</b><Inline text={b.text} /></div>;
    case "bn": return <div className="bn" lang="bn"><span className="lab">বাংলায়</span><Inline text={b.text} /></div>;
    case "ul": return <ul>{b.items.map((x: string, i: number) => <li key={i}><Inline text={x} /></li>)}</ul>;
    case "ol": return <ol>{b.items.map((x: string, i: number) => <li key={i}><Inline text={x} /></li>)}</ol>;
    case "ex": return <div className="ex"><h4><Inline text={b.title} /></h4><ol>{b.steps.map((x: string, i: number) => <li key={i}><Inline text={x} /></li>)}</ol></div>;
    case "graph": return (
      <figure className="graph"><b>{b.title}</b><PointPlot series={b.series} title={b.title} xl={b.xl} yl={b.yl} /><figcaption><Inline text={b.caption} /></figcaption></figure>
    );
    case "func": return <FuncGraph b={b} />;
    case "lab": return <Lab b={b} />;
    case "quiz": return <Quiz items={b.items} />;
    case "exit": return <Exit items={b.items} />;
    case "predict": return (
      <details className="p predict"><summary><span><b>Pause and predict:</b> <Inline text={b.q} /></span></summary><div className="ans"><Inline text={b.a} /></div></details>
    );
    case "table": return (
      <table className="tbl"><tbody>{b.rows.map((r: string[], i: number) => <tr key={i}>{r.map((c, j) => (i ? <td key={j}><Inline text={c} /></td> : <th key={j}><Inline text={c} /></th>))}</tr>)}</tbody></table>
    );
    case "lvl": return (
      <>
        {b.name && <div className="lvl">{b.name}{b.sub && <small>{b.sub}</small>}</div>}
        {b.items.map((it: { q: string; a: string }, i: number) => (
          <details className="p" key={i}><summary><span><Inline text={it.q} /></span></summary><div className="ans"><Inline text={it.a} /></div></details>
        ))}
      </>
    );
    case "notes": return <><Notes week={week} day={day} /><Uploads week={week} day={day} /></>;
    case "check": {
      const key = `${week}-${day}-${b.key}`;
      return (
        <label className="done-row">
          <input type="checkbox" checked={!!checks[key]} onChange={(e) => toggle(key, e.target.checked)} /> Mark this part complete
        </label>
      );
    }
  }
  return null;
}

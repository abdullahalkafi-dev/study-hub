"use client";
import { useId, useMemo } from "react";

const W = 560, H = 320, L = 52, R = 16, T = 14, B = 42;
const COLS = ["var(--accent)", "var(--amber)", "var(--muted)", "var(--blue)"];

export function niceTicks(lo: number, hi: number) {
  const span = hi - lo || 1, raw = span / 6, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  const step = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag, out: number[] = [];
  for (let t = Math.ceil(lo / step - 1e-9) * step; t <= hi + 1e-9; t += step) out.push(+t.toFixed(10));
  return out;
}
function piLabel(v: number) {
  let k = Math.round(v / (Math.PI / 2));
  if (!k) return "0";
  const sg = k < 0 ? "-" : ""; k = Math.abs(k);
  return k % 2 === 0 ? sg + (k / 2 === 1 ? "π" : k / 2 + "π") : sg + (k === 1 ? "π/2" : k + "π/2");
}

type Frame = { title: string; xl: string; yl: string; xmin: number; xmax: number; ymin: number; ymax: number; xunit?: string };
type Series = { pts: [number, number][]; dots?: boolean };

function Frame({ f, children }: { f: Frame; children: (X: (x: number) => number, Y: (y: number) => number) => React.ReactNode }) {
  const X = (x: number) => L + ((x - f.xmin) / (f.xmax - f.xmin)) * (W - L - R);
  const Y = (y: number) => H - B - ((y - f.ymin) / (f.ymax - f.ymin)) * (H - T - B);
  const xt = f.xunit === "pi"
    ? (() => { const st = f.xmax - f.xmin <= 4 * Math.PI + 1e-9 ? Math.PI / 2 : Math.PI, a: number[] = []; for (let t = Math.ceil(f.xmin / st - 1e-9) * st; t <= f.xmax + 1e-9; t += st) a.push(t); return a; })()
    : niceTicks(f.xmin, f.xmax);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={f.title}>
      {xt.map((t) => <g key={"x" + t}><line className="g-grid" x1={X(t)} y1={T} x2={X(t)} y2={H - B} /><text className="g-txt" x={X(t)} y={H - B + 16} textAnchor="middle">{f.xunit === "pi" ? piLabel(t) : +t.toFixed(6)}</text></g>)}
      {niceTicks(f.ymin, f.ymax).map((t) => <g key={"y" + t}><line className="g-grid" x1={L} y1={Y(t)} x2={W - R} y2={Y(t)} /><text className="g-txt" x={L - 6} y={Y(t) + 4} textAnchor="end">{+t.toFixed(6)}</text></g>)}
      {f.ymin <= 0 && f.ymax >= 0 && <line className="g-axis" x1={L} y1={Y(0)} x2={W - R} y2={Y(0)} />}
      {f.xmin <= 0 && f.xmax >= 0 && <line className="g-axis" x1={X(0)} y1={T} x2={X(0)} y2={H - B} />}
      {children(X, Y)}
      <text className="g-lab" x={(L + W - R) / 2} y={H - 6} textAnchor="middle">{f.xl}</text>
      <text className="g-lab" transform={`translate(13 ${(T + H - B) / 2}) rotate(-90)`} textAnchor="middle">{f.yl}</text>
    </svg>
  );
}

/** Curves from functions y = f(x), with gaps at asymptotes. */
export function FunctionPlot({ fns, ...f }: Frame & { fns: ((x: number) => number)[] }) {
  const cid = useId().replace(/:/g, "");
  const segs = useMemo(() => {
    const N = 400, yr = f.ymax - f.ymin, big = 50 * Math.max(Math.abs(f.ymin), Math.abs(f.ymax), 1);
    return fns.map((fn) => {
      const out: [number, number][][] = []; let cur: [number, number][] = [];
      for (let i = 0; i <= N; i++) {
        const x = f.xmin + ((f.xmax - f.xmin) * i) / N; let y: number;
        try { y = fn(x); } catch { y = NaN; }
        const ok = isFinite(y) && Math.abs(y) <= big;
        if (!ok || (cur.length && Math.abs(y - cur[cur.length - 1][1]) > yr * 1.5)) { if (cur.length > 1) out.push(cur); cur = ok ? [[x, y]] : []; continue; }
        cur.push([x, y]);
      }
      if (cur.length > 1) out.push(cur);
      return out;
    });
  }, [fns, f.xmin, f.xmax, f.ymin, f.ymax]);
  return (
    <Frame f={f}>{(X, Y) => (
      <>
        <clipPath id={cid}><rect x={L} y={T} width={W - L - R} height={H - B - T} /></clipPath>
        {segs.map((ss, k) => ss.map((sg, j) => (
          <polyline key={k + "-" + j} clipPath={`url(#${cid})`} fill="none" stroke={COLS[Math.min(k, 3)]} strokeWidth={3} strokeLinejoin="round"
            points={sg.map((p) => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ")} />
        )))}
      </>
    )}</Frame>
  );
}

/** Connected points from a GRAPH: line. */
export function PointPlot({ series, title, xl, yl }: { series: [number, number][][]; title: string; xl: string; yl: string }) {
  const pts = series.flat();
  if (!pts.length) return null;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  let xmin = Math.min(0, ...xs), xmax = Math.max(...xs), ymin = Math.min(0, ...ys), ymax = Math.max(...ys);
  const px = (xmax - xmin) * 0.06 || 1, py = (ymax - ymin) * 0.1 || 1;
  xmax += px; ymax += py; if (ymin < 0) ymin -= py; if (xmin < 0) xmin -= px;
  return (
    <Frame f={{ title, xl, yl, xmin, xmax, ymin, ymax }}>{(X, Y) => (
      <>
        {series.map((s, k) => (
          <g key={k}>
            <polyline fill="none" stroke={COLS[k % 4]} strokeWidth={3} strokeLinejoin="round" points={s.map((p) => X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1)).join(" ")} />
            {s.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r={4} fill={COLS[k % 4]} />)}
          </g>
        ))}
      </>
    )}</Frame>
  );
}

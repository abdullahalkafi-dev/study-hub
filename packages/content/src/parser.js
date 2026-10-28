// Lesson markup parser (shared by the content build). See packages/content/README for the markup.
/* ---------- markup parser ---------- */
export const warnings = [];
function warn(file, msg) { warnings.push(file + ": " + msg); }
export function parseDay(text, file) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const day = { file, eyebrow: "", title: "", lead: "", bn: "", sections: [], checks: [] };
  let sec = null;
  const intro = [];
  let i = 0;

  function push(b) { (sec ? sec.blocks : intro).push(b); }

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { i++; continue; }

    if (line.startsWith("@day ")) { day.eyebrow = line.slice(5).trim(); i++; continue; }
    if (line.startsWith("# ")) { day.title = line.slice(2).trim(); i++; continue; }
    if (line.startsWith("lead:")) { day.lead = line.slice(5).trim(); i++; continue; }
    if (line.startsWith("@section ")) {
      const [key, title, meta] = line.slice(9).split("|").map((s) => s.trim());
      sec = { key, title: title || key, meta: meta || "", blocks: [] };
      day.sections.push(sec); i++; continue;
    }
    if (line.startsWith("BN:")) {
      const t = line.slice(3).trim();
      if (sec) push({ t: "bn", text: t }); else day.bn = t;
      i++; continue;
    }
    if (line.startsWith("### ")) { push({ t: "h3", text: line.slice(4).trim() }); i++; continue; }
    if (line.startsWith("EQ:")) { push({ t: "eq", text: line.slice(3).trim() }); i++; continue; }
    if (line.startsWith("KEY:")) { push({ t: "key", text: line.slice(4).trim() }); i++; continue; }
    if (line.startsWith("TRAP:")) { push({ t: "trap", text: line.slice(5).trim() }); i++; continue; }
    if (line.startsWith("CHECK:")) {
      const k = line.slice(6).trim();
      day.checks.push(k); push({ t: "check", key: k }); i++; continue;
    }
    if (line.startsWith("NOTES:")) { push({ t: "notes" }); i++; continue; }
    if (line.startsWith("EX:")) {
      const title = line.slice(3).trim(); const steps = []; i++;
      while (i < lines.length && lines[i].trim() !== "/EX") {
        const s = lines[i].trim();
        if (s) steps.push(s.replace(/^\d+\.\s*/, ""));
        i++;
      }
      i++; push({ t: "ex", title, steps }); continue;
    }
    if (line.startsWith("GRAPH:")) {
      const parts = line.slice(6).split("|").map((s) => s.trim());
      const [title, xl, yl, series, ...cap] = parts;
      const sers = (series || "").split(";;").map((s) =>
        s.trim().split(/\s+/).filter(Boolean).map((p) => p.split(",").map(Number)).filter((p) => p.length === 2 && p.every(Number.isFinite)));
      push({ t: "graph", title, xl, yl, series: sers, caption: cap.join(" | ") }); i++; continue;
    }
    if (line.startsWith("FUNC:")) {
      const f = line.slice(5).split("|").map((x) => x.trim());
      if (f.length < 7) warn(file, "bad FUNC: " + line.slice(0, 60));
      push({ t: "func", title: f[0], xl: f[1], yl: f[2], exprs: (f[3] || "").split(";;").map((x) => x.trim()), xr: f[4], yr: f[5], xunit: f[6], caption: f.slice(7).join(" | ") });
      i++; continue;
    }
    if (line.startsWith("PREDICT:")) {
      const body = line.slice(8), k = body.indexOf("=>");
      push({ t: "predict", q: (k < 0 ? body : body.slice(0, k)).trim(), a: k < 0 ? "" : body.slice(k + 2).trim() }); i++; continue;
    }
    if (line.startsWith("LAB:")) {
      const f = line.slice(4).split("|").map((x) => x.trim());
      if (f.length < 7) { warn(file, "bad LAB: " + line.slice(0, 60)); i++; continue; }
      const tail = f.slice(-5), title = f[0], intro = f.slice(1, f.length - 5).join(" | ");
      const vars = tail[0].split(";;").map((v) => { const q = v.split(":").map((x) => x.trim()); return { n: q[0], l: q[1], min: +q[2], max: +q[3], step: +q[4], v: +q[5] }; });
      const outs = tail[1].split(";;").map((o) => { const q = o.split(":").map((x) => x.trim()); return { e: q[0], l: q[1], d: q[2] === undefined ? 2 : parseInt(q[2], 10), u: q[3] || "" }; });
      const plots = tail[2] === "-" ? [] : tail[2].split(";;").map((x) => x.trim());
      push({ t: "lab", title, intro, vars, outs, plots, xr: tail[3], yr: tail[4] }); i++; continue;
    }
    if (line === "EXIT:" || line.startsWith("EXIT:")) {
      const items = []; i++;
      while (i < lines.length && lines[i].trim().startsWith("E:")) {
        const p = lines[i].trim().slice(2).split(";").map((x) => x.trim());
        if (p.length < 4 || !Number.isFinite(parseFloat(p[1]))) warn(file, "bad EXIT line: " + lines[i].trim().slice(0, 60));
        items.push({ q: p[0], a: parseFloat(p[1]), tol: parseFloat(p[2]) || 0, e: p.slice(3).join("; ") }); i++;
      }
      push({ t: "exit", items }); continue;
    }
    if (line.startsWith("LVL:")) {
      const [name, sub] = line.slice(4).split("|").map((s) => s.trim());
      const items = []; i++;
      while (i < lines.length && lines[i].trim().startsWith("P:")) {
        const body = lines[i].trim().slice(2).trim();
        const k = body.indexOf(" => ");
        items.push(k < 0 ? { q: body, a: "" } : { q: body.slice(0, k).trim(), a: body.slice(k + 4).trim() });
        i++;
      }
      push({ t: "lvl", name, sub: sub || "", items }); continue;
    }
    if (line.startsWith("P:")) {
      const items = [];
      while (i < lines.length && lines[i].trim().startsWith("P:")) {
        const body = lines[i].trim().slice(2).trim(); const k = body.indexOf(" => ");
        items.push(k < 0 ? { q: body, a: "" } : { q: body.slice(0, k).trim(), a: body.slice(k + 4).trim() });
        i++;
      }
      push({ t: "lvl", name: "", sub: "", items }); continue;
    }
    if (line.startsWith("QUIZ:")) {
      const items = []; i++;
      while (i < lines.length && lines[i].trim().startsWith("Q:")) {
        const p = lines[i].trim().slice(2).split(";").map((s) => s.trim());
        const o = p.slice(1, -2), a = parseInt(p[p.length - 2], 10) - 1;
        if (o.length < 2 || !(a >= 0 && a < o.length)) warn(file, "bad quiz line: " + lines[i].trim().slice(0, 70));
        items.push({ q: p[0], o, a: a >= 0 && a < o.length ? a : 0, e: p[p.length - 1] });
        i++;
      }
      push({ t: "quiz", items }); continue;
    }
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) { items.push(lines[i].trim().slice(2)); i++; }
      push({ t: "ul", items }); continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s*/, "")); i++; }
      push({ t: "ol", items }); continue;
    }
    if (line.startsWith("|") && line.endsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().slice(1, -1).split("|").map((s) => s.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i++;
      }
      push({ t: "table", rows }); continue;
    }
    if (/^[A-Z]{2,8}:/.test(line)) warn(file, "unknown directive treated as text: " + line.slice(0, 50));
    // paragraph: join consecutive plain lines
    const para = [line]; i++;
    while (i < lines.length) {
      const n = lines[i].trim();
      if (!n || /^(@|#|BN:|EQ:|KEY:|TRAP:|CHECK:|NOTES:|EX:|GRAPH:|LVL:|P:|QUIZ:|FUNC:|PREDICT:|LAB:|EXIT:|E:|[-*] |\d+\.\s|\|)/.test(n)) break;
      para.push(n); i++;
    }
    push({ t: "p", text: para.join(" ") });
  }
  if (intro.length) day.sections.unshift({ key: "intro", title: "Introduction", meta: "", blocks: intro });
  return day;
}


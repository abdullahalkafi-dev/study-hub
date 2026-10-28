"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

function setPref(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* storage blocked: preference just won't persist */ } }

export default function Shell({ children }: { children: ReactNode }) {
  const { me, overview, ready, error, dayComplete, logout } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const dark = root.getAttribute("data-theme") === "dark" || (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    const next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next); setPref("silo-theme", next);
  };
  const toggleBn = () => setPref("silo-nobn", String(document.documentElement.classList.toggle("nobn")));

  const weekStatus = (w: number, days: number) => {
    let c = 0; for (let d = 1; d <= days; d++) if (dayComplete(w, d)) c++;
    return !days ? "" : c === days ? "done" : c ? "part" : "";
  };
  const active = (href: string) => path === href || (href !== "/" && path.startsWith(href + "/"));
  const weekHref = (n: number) => `/week/${n}`;

  if (path === "/login") return <>{children}</>;
  return (
    <div className="app">
      <aside className={"side" + (open ? " open" : "")} aria-label="Course navigation">
        <Link className="brand" href="/"><span className="logo">S</span><span>Silo Study Desk</span></Link>
        <div className="brand-sub">8 months · math + physics · Mon–Sat</div>
        <nav>
          <Link className={"nav-link" + (path === "/" ? " on" : "")} href="/">Dashboard</Link>
          <Link className={"nav-link" + (path === "/weeks" ? " on" : "")} href="/weeks">All 34 weeks</Link>
          {me?.user?.role === "admin" && me.authRequired && <Link className={"nav-link" + (path === "/admin" ? " on" : "")} href="/admin">Activity log</Link>}
        </nav>
        {overview?.phases.map((p, i) => (
          <div key={p.name}>
            <div className="phase-h">Phase {i + 1} · {p.name}</div>
            {overview.weeks.filter((w) => w.week >= p.from && w.week <= p.to).map((w) => (
              <Link key={w.week} href={weekHref(w.week)} className={"nav-link" + (w.days ? "" : " soon") + (active(weekHref(w.week)) || path.startsWith(`/day/${w.week}/`) ? " on" : "")}>
                <span className="n">W{w.week}</span><span className="t">{w.math}</span><span className={"dot " + weekStatus(w.week, w.days)} />
              </Link>
            ))}
          </div>
        ))}
      </aside>
      <div className="main">
        <header className="top">
          <button className="btn ghost menu" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>☰</button>
          <div className="crumbs" />
          <div className="tools">
            {me?.authRequired && me.user && <button className="btn ghost" onClick={logout} title={me.user.email}>Log out</button>}
            <button className="btn ghost" onClick={toggleBn} title="Show or hide the Bangla boxes">বাংলা</button>
            <button className="btn ghost" onClick={toggleTheme} title="Light or dark">◐</button>
          </div>
        </header>
        <main className="view">
          {error && <div className="banner" role="alert">{error}</div>}
          {ready ? children : <p className="skeleton">Loading…</p>}
        </main>
      </div>
    </div>
  );
}

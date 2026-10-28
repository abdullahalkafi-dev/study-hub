"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError, type Me, type Overview } from "./api";

export const PARTS = ["recall", "math", "physics", "notes"] as const;

type Store = {
  me: Me | null; overview: Overview | null; checks: Record<string, boolean>; notes: Record<string, string>;
  ready: boolean; error: string; dayDone: (w: number, d: number) => number; dayComplete: (w: number, d: number) => boolean;
  toggle: (key: string, done: boolean) => Promise<void>; saveNote: (key: string, text: string) => Promise<void>;
  logout: () => Promise<void>; reload: () => Promise<void>;
};
const Ctx = createContext<Store | null>(null);
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error("StoreProvider missing"); return s; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const router = useRouter(), path = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const m = await api.get<Me>("/api/auth/me");
      setMe(m);
      if (m.authRequired && !m.user) { setReady(true); if (path !== "/login") router.replace("/login"); return; }
      const [o, p, n] = await Promise.all([
        api.get<Overview>("/api/weeks"),
        api.get<{ checks: Record<string, boolean> }>("/api/progress").catch(() => null),
        api.get<{ notes: Record<string, string> }>("/api/notes").catch(() => null)
      ]);
      setOverview(o);
      if (p) setChecks(p.checks);
      if (n) setNotes(n.notes);
      setError(p && n ? "" : "The database is not reachable, so progress and notes cannot be saved right now.");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Cannot reach the API. Is it running on port 4000?");
    } finally { setReady(true); }
  }, [path, router]);
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const toggle = useCallback(async (key: string, done: boolean) => {
    setChecks((c) => { const n = { ...c }; if (done) n[key] = true; else delete n[key]; return n; });
    try { await api.put(`/api/progress/${key}`, { done }); setError(""); }
    catch (e) {
      setChecks((c) => { const n = { ...c }; if (done) delete n[key]; else n[key] = true; return n; });
      setError("Could not save progress: " + (e as Error).message);
    }
  }, []);
  const saveNote = useCallback(async (key: string, text: string) => {
    setNotes((n) => ({ ...n, [key]: text }));
    await api.put(`/api/notes/${key}`, { text });
  }, []);
  const logout = useCallback(async () => { await api.post("/api/auth/logout", {}); setChecks({}); setNotes({}); await reload(); router.replace("/login"); }, [reload, router]);

  const dayDone = useCallback((w: number, d: number) => PARTS.filter((p) => checks[`${w}-${d}-${p}`]).length, [checks]);
  const dayComplete = useCallback((w: number, d: number) => dayDone(w, d) === PARTS.length, [dayDone]);

  const value = useMemo(() => ({ me, overview, checks, notes, ready, error, dayDone, dayComplete, toggle, saveNote, logout, reload }),
    [me, overview, checks, notes, ready, error, dayDone, dayComplete, toggle, saveNote, logout, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

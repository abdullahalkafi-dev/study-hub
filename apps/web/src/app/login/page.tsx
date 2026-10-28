"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function Login() {
  const router = useRouter();
  const { reload } = useStore();
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await api.post("/api/auth/login", { email, password }); await reload(); router.replace("/"); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  }
  return (
    <form className="form" onSubmit={submit}>
      <p className="eyebrow">Silo Study Desk</p>
      <h1 style={{ fontSize: 30 }}>Log in</h1>
      <input type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      {err && <p className="err" role="alert">{err}</p>}
      <button className="btn primary" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
    </form>
  );
}

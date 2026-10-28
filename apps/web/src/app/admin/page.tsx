"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Entry = { _id: string; email: string; action: string; target: string; at: string };

export default function Admin() {
  const [rows, setRows] = useState<Entry[] | null>(null), [err, setErr] = useState("");
  useEffect(() => { api.get<{ entries: Entry[] }>("/api/admin/audit?limit=200").then((r) => setRows(r.entries)).catch((e) => setErr(e.message)); }, []);
  return (
    <div className="wrap wide">
      <p className="eyebrow">Admin</p>
      <h1>Activity log</h1>
      <p className="lead">Who completed what and when.</p>
      {err && <p className="err">{err}</p>}
      {rows && (rows.length ? (
        <table className="audit">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r._id}><td>{new Date(r.at).toLocaleString()}</td><td>{r.email}</td><td>{r.action}</td><td>{r.target}</td></tr>)}</tbody>
        </table>
      ) : <p className="meta">Nothing yet.</p>)}
    </div>
  );
}

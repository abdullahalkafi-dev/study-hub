"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Item = { video: string; poster: string | null };
type Videos = Partial<Record<"math" | "physics", Item>>;

// Two video cards (Math and Physics) shown only when the API says this lesson has videos.
export default function DayVideos({ week, day }: { week: number; day: number }) {
  const [v, setV] = useState<Videos | null>(null);
  useEffect(() => {
    let live = true;
    setV(null);
    api.get<Videos>(`/api/videos/${week}/${day}`).then((r) => live && setV(r)).catch(() => live && setV({}));
    return () => { live = false; };
  }, [week, day]);
  if (!v || (!v.math && !v.physics)) return null;
  const cards: { key: "math" | "physics"; title: string }[] = [{ key: "math", title: "Math video" }, { key: "physics", title: "Physics video" }];
  return (
    <div className="vids">
      {cards.map(({ key, title }) => v[key] && (
        <section className="vcard" key={key}>
          <h3>{title}</h3>
          <video controls preload="metadata" playsInline poster={v[key]!.poster || undefined} src={v[key]!.video} />
        </section>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export function RatingStars({
  novelId,
  initialUserScore,
  averageRating,
  ratingCount,
}: {
  novelId: string;
  initialUserScore: number | null;
  averageRating: number;
  ratingCount: number;
}) {
  const [hover, setHover] = useState(0);
  const [score, setScore] = useState(initialUserScore ?? 0);
  const [avg, setAvg] = useState(averageRating);
  const [count, setCount] = useState(ratingCount);
  const [saving, setSaving] = useState(false);

  async function rate(s: number) {
    if (saving) return;
    setSaving(true);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novelId, score: s }),
    });
    if (res.ok) {
      const d = await res.json();
      setScore(s);
      setAvg(d.average);
      setCount(d.count);
    } else if (res.status === 401) {
      window.location.href = "/login?next=" + window.location.pathname;
    }
    setSaving(false);
  }

  const display = hover || score;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onMouseEnter={() => setHover(n)}
            onClick={() => rate(n)}
            disabled={saving}
            className="p-0.5 disabled:opacity-50"
            aria-label={`Beri ${n} bintang`}
          >
            <Star className={`size-5 transition ${n <= display ? "fill-[var(--primary)] text-[var(--primary)]" : "text-[var(--muted)]"}`} />
          </button>
        ))}
      </div>
      <div className="text-xs text-[var(--muted)]">
        {score > 0 ? <span className="text-emerald-400">Kamu kasih {score}★</span> : "Beri rating"}
        <span className="mx-1">·</span>
        Rata {avg.toFixed(1)} ({count})
      </div>
    </div>
  );
}

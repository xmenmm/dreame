"use client";

import { useState } from "react";
import { Star, Send } from "lucide-react";

export function ReviewForm({
  novelId,
  initial,
  averageRating,
  ratingCount,
  isLoggedIn,
}: {
  novelId: string;
  initial: { score: number | null; title: string | null; body: string | null };
  averageRating: number;
  ratingCount: number;
  isLoggedIn: boolean;
}) {
  const [hover, setHover] = useState(0);
  const [score, setScore] = useState(initial.score ?? 0);
  const [title, setTitle] = useState(initial.title ?? "");
  const [body, setBody] = useState(initial.body ?? "");
  const [avg, setAvg] = useState(averageRating);
  const [count, setCount] = useState(ratingCount);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const display = hover || score;

  async function submit(nextScore?: number) {
    if (!isLoggedIn) {
      window.location.href = "/login?next=" + window.location.pathname;
      return;
    }
    const finalScore = nextScore ?? score;
    if (finalScore < 1) {
      setErr("Pilih bintang dulu (1-5)");
      return;
    }
    setErr(null);
    setSaving(true);
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        novelId,
        score: finalScore,
        title: title.trim() || null,
        body: body.trim() || null,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      if (nextScore) setScore(nextScore);
      setAvg(d.average);
      setCount(d.count);
      setSavedAt(Date.now());
    } else if (res.status === 401) {
      window.location.href = "/login?next=" + window.location.pathname;
    } else if (res.status === 400) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error === "blocked" ? "Review mengandung kata terlarang" : "Gagal menyimpan");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onClick={() => submit(n)}
              disabled={saving}
              className="p-0.5 disabled:opacity-50"
              aria-label={`Beri ${n} bintang`}
            >
              <Star className={`size-7 transition ${n <= display ? "fill-[var(--primary)] text-[var(--primary)]" : "text-[var(--muted)]"}`} />
            </button>
          ))}
        </div>
        <div className="text-sm text-[var(--muted)]">
          {score > 0 ? <span className="text-emerald-400 font-semibold">Kamu kasih {score}★</span> : <span>Klik bintang untuk rate</span>}
          <span className="mx-2">·</span>
          Rata {avg.toFixed(1)} ({count} rating)
        </div>
      </div>

      <input
        type="text"
        placeholder="Judul review (opsional)"
        value={title}
        maxLength={120}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
      />
      <textarea
        placeholder="Tulis review kamu... apa yang kamu suka, kelemahan, rekomendasi buat siapa? (opsional)"
        value={body}
        maxLength={2000}
        rows={4}
        onChange={(e) => setBody(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm resize-y"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[var(--muted)]">
          {body.length}/2000
          {savedAt && <span className="ml-2 text-emerald-400">✓ Tersimpan</span>}
          {err && <span className="ml-2 text-red-400">{err}</span>}
        </div>
        <button
          type="button"
          onClick={() => submit()}
          disabled={saving || score < 1}
          className="h-10 px-5 rounded-full bg-[var(--primary)] text-black font-bold text-sm disabled:opacity-50 hover:bg-[var(--primary-hover)] transition inline-flex items-center gap-2"
        >
          <Send className="size-4" /> {saving ? "Menyimpan..." : "Simpan Review"}
        </button>
      </div>
    </div>
  );
}

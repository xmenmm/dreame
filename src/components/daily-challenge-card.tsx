"use client";

import { useState, useTransition } from "react";
import { Coins, Check, BookOpen, Sparkles } from "lucide-react";
import { toast } from "@/lib/toast";

type State = {
  emoji: string;
  label: string;
  reward: number;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

export function DailyChallengeCard({ initial }: { initial: State }) {
  const [state, setState] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const pct = Math.min(100, Math.round((state.progress / state.target) * 100));

  function claim() {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/challenge/claim", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (data.ok) {
          setState((s) => ({ ...s, claimed: true }));
          toast({ kind: "coin", emoji: "🎉", title: `+${state.reward} coin diterima!`, body: "Challenge harian selesai. Balik besok untuk yang baru." });
        } else {
          setError(data.error || data.reason || "Gagal claim");
        }
      } catch {
        setError("Network error");
      }
    });
  }

  if (state.claimed) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-12 rounded-xl bg-emerald-500/20 grid place-items-center text-2xl shrink-0">
            <Check className="size-6 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold">Challenge harian selesai!</div>
            <div className="text-xs text-[var(--muted)]">Balik lagi besok untuk tantangan baru.</div>
          </div>
        </div>
        <span className="text-xs font-bold bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full inline-flex items-center gap-1 shrink-0">
          +{state.reward} <Coins className="size-3" />
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/10 via-[var(--accent)]/5 to-transparent p-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-12 rounded-xl bg-[var(--primary)]/20 grid place-items-center text-2xl shrink-0">
            <span aria-hidden>{state.emoji}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold flex items-center gap-1">
              <Sparkles className="size-3" /> Challenge Hari Ini
            </div>
            <div className="text-sm font-bold mt-0.5 truncate">{state.label}</div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">Reward</div>
          <div className="text-lg font-black inline-flex items-center gap-1">
            +{state.reward} <Coins className="size-4 text-[var(--primary)]" />
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-xs font-bold text-[var(--muted)] tabular-nums">{state.progress}/{state.target}</div>
      </div>

      {/* CTA */}
      <div className="mt-4 flex items-center gap-2">
        {state.completed ? (
          <button
            onClick={claim}
            disabled={pending}
            className="flex-1 h-11 rounded-full bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary-hover)] disabled:opacity-50 inline-flex items-center justify-center gap-2 transition shadow-lg shadow-[var(--primary)]/20"
          >
            {pending ? "Menyimpan..." : (
              <>
                <Coins className="size-4" /> Klaim {state.reward} coin
              </>
            )}
          </button>
        ) : (
          <a
            href="/discover"
            className="flex-1 h-11 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold inline-flex items-center justify-center gap-2 transition"
          >
            <BookOpen className="size-4" /> Mulai Baca
          </a>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400 text-center">{error}</div>
      )}
    </div>
  );
}

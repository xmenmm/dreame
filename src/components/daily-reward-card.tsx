"use client";

import { useState } from "react";
import { Gift, Sparkles, Coins, Check } from "lucide-react";

const SCHEDULE = [5, 10, 15, 20, 25, 30, 50];

export function DailyRewardCard({
  initialCanClaim,
  initialStreak,
}: { initialCanClaim: boolean; initialStreak: number }) {
  const [canClaim, setCanClaim] = useState(initialCanClaim);
  const [streak, setStreak] = useState(initialStreak);
  const [reward, setReward] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function claim() {
    setLoading(true);
    const res = await fetch("/api/rewards/daily", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setReward(d.reward);
      setStreak(d.streak);
      setCanClaim(false);
    } else if (res.status === 401) {
      window.location.href = "/login";
    }
    setLoading(false);
  }

  const todayInCycle = ((streak) % 7) + (canClaim ? 1 : 0);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[var(--primary)]/15 to-[var(--accent)]/15 border border-[var(--primary)]/30 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="size-10 rounded-xl bg-[var(--primary)] grid place-items-center text-black">
          <Gift className="size-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">Hadiah Login Harian</h3>
          <p className="text-xs text-[var(--muted)]">
            {canClaim ? "Klaim coin gratis hari ini!" : streak > 0 ? `Streak ${streak} hari — kembali besok untuk lanjut!` : "Login tiap hari untuk dapat coin gratis."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {SCHEDULE.map((coins, i) => {
          const day = i + 1;
          const claimed = day < (canClaim ? streak % 7 + 1 : streak % 7 || 7);
          const isToday = canClaim && day === ((streak % 7) + 1);
          const isLast = day === 7;
          return (
            <div
              key={day}
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-center ${claimed ? "bg-emerald-500/20 border-emerald-500/40" : isToday ? "bg-[var(--primary)] border-[var(--primary)] text-black" : "bg-[var(--surface)] border-[var(--border)]"} ${isLast ? "ring-2 ring-[var(--primary)]/40" : ""}`}
            >
              {claimed ? <Check className="size-4 text-emerald-400" /> : (
                <>
                  <Coins className={`size-3 ${isToday ? "" : "text-[var(--primary)]"}`} />
                  <span className="text-[10px] font-bold mt-0.5">{coins}</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {reward != null && (
        <div className="mb-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400 flex items-center gap-2">
          <Sparkles className="size-4" /> Kamu dapat <strong>{reward} coin</strong>!
        </div>
      )}

      <button
        onClick={claim}
        disabled={!canClaim || loading}
        className="w-full h-11 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
      >
        {loading ? "..." : canClaim ? <><Gift className="size-4" /> Klaim {SCHEDULE[(streak % 7)]} Coin</> : <><Check className="size-4" /> Sudah Diklaim Hari Ini</>}
      </button>
    </div>
  );
}

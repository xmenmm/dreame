"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Coins, Bell, Flame } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { formatNumber } from "@/lib/utils";
import { toast } from "@/lib/toast";

type TopBarUser = {
  id: string;
  displayName: string;
  coinBalance: number;
  unreadNotifs?: number;
  readingStreak?: number;
} | null;

const POLL_MS = 30_000;

export function TopBar({ user }: { user: TopBarUser }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");

  // Live-updating values (start from server-rendered props)
  const [coin, setCoin] = useState(user?.coinBalance ?? 0);
  const [unread, setUnread] = useState(user?.unreadNotifs ?? 0);
  const [streak, setStreak] = useState(user?.readingStreak ?? 0);
  const [coinBump, setCoinBump] = useState(false);
  const lastCoinRef = useRef(coin);

  useEffect(() => {
    if (!user) return;
    let abort = false;

    async function poll() {
      try {
        const r = await fetch("/api/me/topbar", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        if (abort || !j?.ok) return;

        // detect coin gain → toast + bump animation
        if (typeof j.coinBalance === "number") {
          const prev = lastCoinRef.current;
          const next = j.coinBalance;
          if (next > prev) {
            const delta = next - prev;
            toast({ kind: "coin", emoji: "🪙", title: `+${delta} coin`, body: `Saldo: ${formatNumber(next)}` });
            setCoinBump(true);
            setTimeout(() => setCoinBump(false), 700);
          }
          lastCoinRef.current = next;
          setCoin(next);
        }
        if (typeof j.unreadNotifs === "number") setUnread(j.unreadNotifs);
        if (typeof j.readingStreak === "number") setStreak(j.readingStreak);
      } catch {}
    }

    // initial poll after 5s, then every POLL_MS
    const i1 = setTimeout(poll, 5000);
    const iv = setInterval(poll, POLL_MS);
    return () => { abort = true; clearTimeout(i1); clearInterval(iv); };
  }, [user]);

  if (pathname.startsWith("/welcome")) return null;

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="h-full px-4 md:px-8 flex items-center gap-4">
        <Link href="/" className="md:hidden flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black text-sm">L</div>
          <span className="font-bold">Lentera</span>
        </Link>

        <form
          className="flex-1 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }}
        >
          <label className="flex items-center gap-2 h-10 px-3 rounded-full bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--primary)] transition">
            <Search className="size-4 text-[var(--muted)] shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari novel, penulis, genre..."
              className="bg-transparent w-full outline-none text-sm placeholder:text-[var(--muted)]"
            />
          </label>
        </form>

        <div className="flex items-center gap-2">
          {user && streak > 0 && (
            <Link
              href="/profile"
              title={`Reading streak: ${streak} hari berturut-turut`}
              className="hidden sm:flex items-center gap-1.5 h-10 px-3 rounded-full bg-orange-500/15 border border-orange-500/30 hover:border-orange-500/60 transition"
            >
              <Flame className="size-4 text-orange-400 flame-flicker" />
              <span className="text-sm font-bold text-orange-300 tabular-nums">{streak}</span>
            </Link>
          )}
          {user && (
            <Link
              href="/notifications"
              className="relative size-10 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] grid place-items-center transition"
              aria-label="Notifikasi"
            >
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-white text-[10px] font-bold grid place-items-center animate-pulse">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <Link
              href="/wallet"
              className="hidden md:flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition"
            >
              <Coins className="size-4 text-[var(--primary)]" />
              <span
                className={`text-sm font-bold tabular-nums transition-colors ${coinBump ? "coin-bump" : ""}`}
                style={{ color: coinBump ? undefined : "var(--primary)" }}
              >
                {formatNumber(coin)}
              </span>
              <span className="text-xs text-[var(--muted)]">coins</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="md:hidden h-9 px-4 rounded-full bg-[var(--primary)] text-black font-semibold text-sm grid place-items-center"
            >
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

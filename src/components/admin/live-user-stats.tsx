"use client";

import { useEffect, useRef, useState } from "react";
import {
  Users, UserPlus, ShieldOff, Crown, Activity, Circle, BookOpen, Feather,
} from "lucide-react";

type Stats = {
  total: number;
  banned: number;
  writers: number;
  admins: number;
  newToday: number;
  activeWeek: number;
  online: number;
  totalNovels: number;
  totalChapters: number;
};

export function LiveUserStats({ initial }: { initial: Stats }) {
  const [stats, setStats] = useState<Stats>(initial);
  const [bumpKey, setBumpKey] = useState<Record<string, number>>({});
  const lastTs = useRef<number>(Date.now());

  // Poll every 8s
  useEffect(() => {
    let abort = false;
    async function poll() {
      try {
        const r = await fetch("/api/admin/users-stats", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as Stats & { ok: boolean; ts: number };
        if (abort || !j.ok) return;
        // Detect changes per field → bump animation
        const changed: Record<string, number> = {};
        for (const k of Object.keys(j) as (keyof Stats)[]) {
          if (typeof j[k] === "number" && j[k] !== stats[k]) {
            changed[k] = Date.now();
          }
        }
        if (Object.keys(changed).length > 0) setBumpKey((b) => ({ ...b, ...changed }));
        setStats(j);
        lastTs.current = j.ts;
      } catch {}
    }
    const iv = setInterval(poll, 8000);
    return () => { abort = true; clearInterval(iv); };
  }, [stats]);

  const cards: Array<{
    key: keyof Stats;
    label: string;
    icon: React.ElementType;
    accent: string;
    sub?: string;
  }> = [
    { key: "total",       label: "Total User",   icon: Users,        accent: "text-[var(--foreground)]" },
    { key: "online",      label: "Online Now",   icon: Circle,       accent: "text-emerald-400", sub: "15 menit terakhir" },
    { key: "newToday",    label: "Baru Hari Ini", icon: UserPlus,    accent: "text-sky-400" },
    { key: "activeWeek",  label: "Aktif Minggu Ini", icon: Activity, accent: "text-[var(--primary)]", sub: "punya reading history 7 hari" },
    { key: "writers",     label: "Penulis",      icon: Feather,      accent: "text-fuchsia-400" },
    { key: "admins",      label: "Admin",        icon: Crown,        accent: "text-amber-400" },
    { key: "banned",      label: "Banned",       icon: ShieldOff,    accent: "text-red-400" },
    { key: "totalChapters", label: "Bab Tayang", icon: BookOpen,     accent: "text-violet-400" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-xs text-[var(--muted)]">
        <span className="relative flex size-2">
          <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        <span>Live · refresh tiap 8 detik</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(({ key, label, icon: Icon, accent, sub }) => {
          const value = stats[key] as number;
          const isBumping = bumpKey[key] && Date.now() - bumpKey[key] < 800;
          return (
            <div
              key={key as string}
              className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 hover:border-[var(--primary)]/40 transition relative overflow-hidden"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">
                <Icon className={`size-3.5 ${accent} ${key === "online" ? "animate-pulse" : ""}`} />
                {label}
              </div>
              <div
                key={`${key as string}-${bumpKey[key] ?? 0}`}
                className={`text-3xl font-black tabular-nums mt-1 ${accent} ${isBumping ? "coin-bump" : ""}`}
              >
                {value.toLocaleString("id-ID")}
              </div>
              {sub && <div className="text-[10px] text-[var(--muted)] mt-0.5 truncate">{sub}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { BookOpen, Quote as QuoteIcon, Sparkles, Heart, Trophy, Star, Coins, Users, Flame, Bell } from "lucide-react";

type PopupKind =
  | "testimonial"
  | "achievement"
  | "live-readers"
  | "trending"
  | "quote"
  | "milestone"
  | "join"
  | "rating"
  | "streak"
  | "coin";

type Popup = {
  id: string;
  kind: PopupKind;
  // position (CSS string %)
  top: string;
  left?: string;
  right?: string;
  // delay before pop-in (s)
  delay: number;
  // duration before pop-out (s) — 0 = persistent
  duration: number;
  rotate: number;
};

const TESTIMONIALS = [
  { name: "Aurora", body: "Akhirnya platform yang fair buat penulis indo!" },
  { name: "Raven", body: "UI-nya cantik, baca dari HP enak banget." },
  { name: "Naya", body: "Daily login reward bikin nagih 🔥" },
  { name: "Kala", body: "Coin economy adil, gak rakus." },
];

const QUOTES = [
  "Setiap cerita layak diceritakan.",
  "Hari ini bab 5, besok jadi obsesi.",
  "Buku adalah portal menuju dunia lain.",
  "Yang baik tetap baik, kata buku.",
];

const MILESTONES = [
  "+1000 reader bulan ini",
  "Bab baru rilis tiap hari",
  "50K kata ditulis minggu ini",
  "100 author aktif",
];

// Curated popup placements — spread across FULL wrapper height (top: 0%–95%).
// Mix of pulse (limited duration) and pop (persistent).
const POPUPS: Popup[] = [
  // ── HERO area (top 30%) ──
  { id: "p1",  kind: "live-readers", top: "5%",   left: "2%",   delay: 0.8,  duration: 0,  rotate: -3 },
  { id: "p2",  kind: "testimonial",  top: "8%",   right: "2%",  delay: 2.0,  duration: 9,  rotate: 2 },
  { id: "p3",  kind: "trending",     top: "14%",  right: "22%", delay: 3.5,  duration: 7,  rotate: 3 },
  { id: "p4",  kind: "achievement",  top: "16%",  left: "2%",   delay: 5.0,  duration: 8,  rotate: -4 },
  { id: "p5",  kind: "milestone",    top: "22%",  right: "10%", delay: 6.5,  duration: 7,  rotate: -2 },
  { id: "p6",  kind: "join",         top: "26%",  left: "20%",  delay: 8.0,  duration: 6,  rotate: 1 },
  { id: "p7",  kind: "quote",        top: "28%",  right: "1%",  delay: 9.5,  duration: 10, rotate: 4 },

  // ── Middle (30%–60%) ──
  { id: "p8",  kind: "rating",       top: "32%",  left: "2%",   delay: 11,   duration: 7,  rotate: 5 },
  { id: "p9",  kind: "coin",         top: "36%",  right: "3%",  delay: 12.5, duration: 6,  rotate: -2 },
  { id: "p10", kind: "streak",       top: "40%",  left: "30%",  delay: 14,   duration: 6,  rotate: 1 },
  { id: "p11", kind: "testimonial",  top: "42%",  right: "1%",  delay: 15,   duration: 9,  rotate: -3 },
  { id: "p12", kind: "achievement",  top: "47%",  left: "5%",   delay: 17,   duration: 8,  rotate: 2 },
  { id: "p13", kind: "milestone",    top: "50%",  right: "20%", delay: 18.5, duration: 6,  rotate: 3 },
  { id: "p14", kind: "trending",     top: "53%",  left: "10%",  delay: 20,   duration: 7,  rotate: -2 },
  { id: "p15", kind: "quote",        top: "57%",  right: "4%",  delay: 21.5, duration: 10, rotate: 4 },

  // ── Lower middle (60%–80%) ──
  { id: "p16", kind: "join",         top: "60%",  left: "2%",   delay: 23,   duration: 6,  rotate: -3 },
  { id: "p17", kind: "coin",         top: "63%",  right: "12%", delay: 24.5, duration: 6,  rotate: 2 },
  { id: "p18", kind: "live-readers", top: "67%",  left: "22%",  delay: 26,   duration: 0,  rotate: -2 },
  { id: "p19", kind: "rating",       top: "70%",  right: "2%",  delay: 27.5, duration: 7,  rotate: 4 },
  { id: "p20", kind: "testimonial",  top: "73%",  left: "3%",   delay: 29,   duration: 9,  rotate: 1 },
  { id: "p21", kind: "achievement",  top: "76%",  right: "25%", delay: 30.5, duration: 8,  rotate: -3 },

  // ── Bottom (80%–95%) ──
  { id: "p22", kind: "streak",       top: "80%",  left: "10%",  delay: 32,   duration: 6,  rotate: 2 },
  { id: "p23", kind: "milestone",    top: "82%",  right: "8%",  delay: 33.5, duration: 6,  rotate: -2 },
  { id: "p24", kind: "trending",     top: "85%",  left: "30%",  delay: 35,   duration: 7,  rotate: 3 },
  { id: "p25", kind: "quote",        top: "87%",  right: "3%",  delay: 36.5, duration: 10, rotate: -4 },
  { id: "p26", kind: "join",         top: "90%",  left: "5%",   delay: 38,   duration: 6,  rotate: 1 },
  { id: "p27", kind: "coin",         top: "92%",  right: "20%", delay: 39.5, duration: 6,  rotate: -2 },
  { id: "p28", kind: "rating",       top: "95%",  left: "20%",  delay: 41,   duration: 7,  rotate: 4 },
];

function pick<T>(arr: T[], seed: number): T { return arr[seed % arr.length]; }

export function WelcomeFloatingPopups() {
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 100));
  const [liveCount, setLiveCount] = useState<number>(8);

  // Honor reduced motion preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const fn = () => setReduced(m.matches);
    m.addEventListener?.("change", fn);
    return () => m.removeEventListener?.("change", fn);
  }, []);

  // Simulate "live readers count" jiggle
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveCount((n) => Math.max(3, Math.min(99, n + Math.round((Math.random() - 0.4) * 5))));
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  if (reduced || hidden) return null;

  return (
    <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden" aria-hidden>
      {POPUPS.map((p, i) => (
        <FloatingItem key={p.id} popup={p} seed={seed + i} liveCount={liveCount} />
      ))}
      {/* Tiny orbs for ambient sparkle */}
      <Orbs />
    </div>
  );
}

function FloatingItem({ popup, seed, liveCount }: { popup: Popup; seed: number; liveCount: number }) {
  const style: React.CSSProperties = {
    top: popup.top,
    ...(popup.left ? { left: popup.left } : {}),
    ...(popup.right ? { right: popup.right } : {}),
    animationDelay: `${popup.delay}s`,
    animationDuration: popup.duration > 0 ? `${popup.duration}s` : undefined,
    transform: `rotate(${popup.rotate}deg)`,
  };

  const cls =
    "absolute pointer-events-none transition-all " +
    (popup.duration > 0 ? "popup-pulse" : "popup-pop");

  switch (popup.kind) {
    case "live-readers":
      return (
        <div style={style} className={`${cls} rounded-2xl bg-[var(--surface)]/90 backdrop-blur-md border border-emerald-500/40 shadow-2xl shadow-black/40 px-4 py-3 max-w-[200px]`}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
            <span className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Online Sekarang
          </div>
          <div className="text-2xl font-black mt-1 tabular-nums">{liveCount * 47 + 213}</div>
          <div className="text-[10px] text-[var(--muted)] mt-0.5">orang lagi baca</div>
        </div>
      );
    case "testimonial": {
      const t = pick(TESTIMONIALS, seed);
      return (
        <div style={style} className={`${cls} rounded-2xl bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--primary)]/30 shadow-2xl shadow-black/40 px-4 py-3 max-w-[230px]`}>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-bold text-sm">
              {t.name.charAt(0)}
            </div>
            <div className="text-xs font-bold">{t.name}</div>
          </div>
          <p className="text-xs text-[var(--foreground)]/80 mt-1.5 italic leading-relaxed">"{t.body}"</p>
        </div>
      );
    }
    case "achievement":
      return (
        <div style={style} className={`${cls} rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/10 backdrop-blur-md border border-fuchsia-500/40 shadow-2xl shadow-fuchsia-500/20 px-4 py-3 inline-flex items-center gap-3`}>
          <div className="size-10 rounded-xl bg-fuchsia-500/30 grid place-items-center">
            <Trophy className="size-5 text-fuchsia-300" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-fuchsia-300 font-bold">Achievement</div>
            <div className="text-sm font-bold">Bookworm 🐛</div>
            <div className="text-[10px] text-[var(--muted)]">Baca 10 bab</div>
          </div>
        </div>
      );
    case "trending":
      return (
        <div style={style} className={`${cls} rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 backdrop-blur-md border border-orange-500/40 shadow-2xl shadow-orange-500/20 px-4 py-3 inline-flex items-center gap-2`}>
          <Flame className="size-5 text-orange-400 flame-flicker" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-orange-300 font-bold">Trending</div>
            <div className="text-xs font-bold">+500 reader hari ini</div>
          </div>
        </div>
      );
    case "quote": {
      const q = pick(QUOTES, seed + 5);
      return (
        <div style={style} className={`${cls} rounded-2xl bg-[var(--surface)]/85 backdrop-blur-md border border-[var(--accent)]/30 shadow-2xl shadow-black/40 px-4 py-3 max-w-[240px]`}>
          <QuoteIcon className="size-4 text-[var(--accent)] mb-1" />
          <p className="font-serif text-sm italic leading-snug text-[var(--foreground)]/90">{q}</p>
        </div>
      );
    }
    case "milestone": {
      const m = pick(MILESTONES, seed + 3);
      return (
        <div style={style} className={`${cls} rounded-full bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--primary)]/40 shadow-2xl shadow-black/40 px-4 py-2 inline-flex items-center gap-2`}>
          <Sparkles className="size-3.5 text-[var(--primary)]" />
          <span className="text-xs font-bold whitespace-nowrap">{m}</span>
        </div>
      );
    }
    case "rating":
      return (
        <div style={style} className={`${cls} rounded-2xl bg-[var(--surface)]/90 backdrop-blur-md border border-amber-500/40 shadow-2xl shadow-black/40 px-4 py-3 inline-flex items-center gap-3`}>
          <div className="flex">
            {[0,1,2,3,4].map((i) => <Star key={i} className="size-3.5 text-amber-400 fill-amber-400" />)}
          </div>
          <div>
            <div className="text-sm font-bold">4.9 / 5.0</div>
            <div className="text-[10px] text-[var(--muted)]">dari 1.2K rating</div>
          </div>
        </div>
      );
    case "join":
      return (
        <div style={style} className={`${cls} rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/10 backdrop-blur-md border border-sky-500/40 shadow-2xl shadow-sky-500/20 px-4 py-3 inline-flex items-center gap-3`}>
          <Users className="size-5 text-sky-300" />
          <div>
            <div className="text-xs font-bold">+24 user gabung</div>
            <div className="text-[10px] text-[var(--muted)]">dalam 1 jam terakhir</div>
          </div>
        </div>
      );
    case "streak":
      return (
        <div style={style} className={`${cls} rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/10 backdrop-blur-md border border-orange-500/40 shadow-2xl shadow-orange-500/20 px-4 py-3 inline-flex items-center gap-3`}>
          <Flame className="size-7 text-orange-400 flame-flicker" />
          <div>
            <div className="text-2xl font-black text-orange-300 tabular-nums leading-none">12</div>
            <div className="text-[10px] uppercase tracking-widest text-orange-300/70 font-bold mt-0.5">hari streak</div>
          </div>
        </div>
      );
    case "coin":
      return (
        <div style={style} className={`${cls} rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 backdrop-blur-md border border-amber-500/40 shadow-2xl shadow-amber-500/20 px-4 py-3 inline-flex items-center gap-3`}>
          <Coins className="size-5 text-amber-400" />
          <div>
            <div className="text-sm font-bold">+50 coin</div>
            <div className="text-[10px] text-[var(--muted)]">welcome gift</div>
          </div>
        </div>
      );
  }
}

function Orbs() {
  // Spread across the FULL wrapper (top 0%-95%) so it feels alive even when scrolled deep.
  const orbs = [
    // Upper third
    { top: "5%",  left: "12%",  size: "w-3 h-3",   delay: "0s",   color: "bg-amber-300/60" },
    { top: "10%", right: "8%",  size: "w-2 h-2",   delay: "1.5s", color: "bg-fuchsia-300/50" },
    { top: "16%", left: "40%",  size: "w-1.5 h-1.5", delay: "0.8s", color: "bg-cyan-300/60" },
    { top: "22%", right: "25%", size: "w-2 h-2",   delay: "2.2s", color: "bg-violet-300/50" },
    { top: "28%", left: "55%",  size: "w-1 h-1",   delay: "3.0s", color: "bg-rose-300/50" },
    // Middle
    { top: "35%", left: "8%",   size: "w-2.5 h-2.5", delay: "1.0s", color: "bg-emerald-300/55" },
    { top: "40%", right: "30%", size: "w-2 h-2",   delay: "2.5s", color: "bg-amber-200/60" },
    { top: "46%", left: "30%",  size: "w-1.5 h-1.5", delay: "0.5s", color: "bg-sky-300/55" },
    { top: "52%", right: "10%", size: "w-2 h-2",   delay: "1.8s", color: "bg-fuchsia-200/55" },
    { top: "58%", left: "60%",  size: "w-1 h-1",   delay: "2.8s", color: "bg-cyan-200/60" },
    // Lower middle
    { top: "63%", left: "15%",  size: "w-3 h-3",   delay: "0.7s", color: "bg-violet-300/55" },
    { top: "68%", right: "40%", size: "w-2 h-2",   delay: "2.0s", color: "bg-amber-300/60" },
    { top: "72%", left: "45%",  size: "w-1.5 h-1.5", delay: "1.3s", color: "bg-rose-200/50" },
    { top: "76%", right: "5%",  size: "w-2 h-2",   delay: "0.4s", color: "bg-emerald-200/55" },
    // Bottom
    { top: "82%", left: "20%",  size: "w-2.5 h-2.5", delay: "2.4s", color: "bg-sky-200/55" },
    { top: "86%", right: "20%", size: "w-1.5 h-1.5", delay: "1.7s", color: "bg-fuchsia-300/55" },
    { top: "90%", left: "8%",   size: "w-2 h-2",   delay: "0.9s", color: "bg-amber-200/60" },
    { top: "93%", right: "45%", size: "w-1 h-1",   delay: "3.2s", color: "bg-cyan-300/60" },
    { top: "96%", left: "55%",  size: "w-1.5 h-1.5", delay: "2.6s", color: "bg-violet-200/55" },
  ];
  return (
    <>
      {orbs.map((o, i) => (
        <span
          key={i}
          style={{
            top: o.top,
            ...(o.left ? { left: o.left } : {}),
            ...((o as { right?: string }).right ? { right: (o as { right?: string }).right } : {}),
            animationDelay: o.delay,
          }}
          className={`absolute ${o.size} ${o.color} rounded-full blur-[1px] orb-float`}
          aria-hidden
        />
      ))}
    </>
  );
}

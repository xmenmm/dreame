"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, AlertCircle, Info, Coins, Trophy, X } from "lucide-react";
import type { ToastInput, ToastKind } from "@/lib/toast";

type ToastItem = ToastInput & { id: string; createdAt: number };

const ICONS: Record<ToastKind, React.ElementType> = {
  success: Check,
  error: AlertCircle,
  info: Info,
  coin: Coins,
  achievement: Trophy,
};
const COLORS: Record<ToastKind, string> = {
  success: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  error:   "border-red-500/40 bg-red-500/15 text-red-300",
  info:    "border-sky-500/40 bg-sky-500/15 text-sky-300",
  coin:    "border-amber-500/40 bg-amber-500/15 text-amber-300",
  achievement: "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastInput>).detail;
      if (!detail) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const dur = detail.duration ?? 4000;
      setItems((cur) => [...cur, { ...detail, id, createdAt: Date.now() }]);
      setTimeout(() => {
        setItems((cur) => cur.filter((t) => t.id !== id));
      }, dur);
    }
    window.addEventListener("lentera:toast", onToast);
    return () => window.removeEventListener("lentera:toast", onToast);
  }, []);

  function dismiss(id: string) {
    setItems((cur) => cur.filter((t) => t.id !== id));
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-20 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
    >
      {items.map((t) => {
        const kind: ToastKind = t.kind ?? "info";
        const Icon = ICONS[kind];
        const Inner = (
          <div className={`pointer-events-auto flex items-start gap-3 max-w-sm rounded-2xl border backdrop-blur-md px-4 py-3 shadow-2xl shadow-black/30 toast-pop ${COLORS[kind]}`}>
            <div className="size-9 rounded-xl bg-black/30 grid place-items-center text-lg shrink-0">
              {t.emoji ?? <Icon className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-[var(--foreground)] truncate">{t.title}</div>
              {t.body && <div className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{t.body}</div>}
            </div>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(t.id); }}
              aria-label="Tutup"
              className="opacity-50 hover:opacity-100 transition shrink-0 mt-0.5"
            >
              <X className="size-4" />
            </button>
          </div>
        );
        return t.href ? (
          <Link key={t.id} href={t.href} className="block">{Inner}</Link>
        ) : (
          <div key={t.id}>{Inner}</div>
        );
      })}
    </div>
  );
}

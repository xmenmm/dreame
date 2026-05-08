"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Play, X } from "lucide-react";

type ContinueData = {
  slug: string;
  title: string;
  coverUrl: string;
  chapter: number;
  chapterTitle: string;
  totalChapters: number;
  scrollPos: number;
  updatedAt: string;
};

const SESSION_DISMISS_KEY = "lentera:continue-dismissed";

export function ContinueReadingFloating() {
  const pathname = usePathname();
  const [data, setData] = useState<ContinueData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Hide on reader page itself, welcome, login/register
  const hide =
    pathname.startsWith("/novel/") && pathname.includes("/read/") ||
    pathname.startsWith("/welcome") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding");

  useEffect(() => {
    if (hide) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_DISMISS_KEY)) {
      setDismissed(true);
      return;
    }
    let abort = false;
    fetch("/api/me/continue-reading")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (abort || !j?.continueReading) return;
        setData(j.continueReading);
        // Trigger visible after small delay (avoid flash on quick nav)
        setTimeout(() => !abort && setVisible(true), 300);
      })
      .catch(() => {});
    return () => { abort = true; };
  }, [pathname, hide]);

  if (hide || dismissed || !data) return null;

  function dismiss(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
    setDismissed(true);
  }

  // Compute "progress %" — chapter-wise + scroll into chapter
  const baseChapterPct = (data.chapter - 1) / Math.max(1, data.totalChapters);
  const scrollIntoChapterEstPct = Math.min(1, data.scrollPos / 4000); // assume avg chapter ~4000px tall
  const totalPct = Math.min(100, Math.round((baseChapterPct + scrollIntoChapterEstPct / data.totalChapters) * 100));

  return (
    <Link
      href={`/novel/${data.slug}/read/${data.chapter}`}
      aria-label={`Lanjut baca ${data.title} bab ${data.chapter}`}
      className={`fixed z-40 bottom-20 md:bottom-6 right-4 md:right-6 max-w-[300px] w-[calc(100vw-2rem)] md:w-[300px] rounded-2xl bg-[var(--surface)]/95 backdrop-blur-md border border-[var(--border)] hover:border-[var(--primary)] shadow-2xl shadow-black/40 p-3 flex items-center gap-3 group transition-all hero-text-fade ${visible ? "opacity-100" : "opacity-0 translate-y-4"}`}
    >
      <div className="relative size-14 shrink-0 rounded-lg overflow-hidden bg-[var(--surface-2)]">
        {data.coverUrl?.includes("pollinations.ai") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <Image src={data.coverUrl} alt="" fill sizes="56px" className="object-cover" />
        )}
        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
          <Play className="size-5 fill-white text-white" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold">▶ Lanjut Baca</div>
        <div className="font-bold text-sm leading-tight truncate">{data.title}</div>
        <div className="text-xs text-[var(--muted)] mt-0.5">
          Bab {data.chapter}/{data.totalChapters} · {totalPct}%
        </div>
        <div className="mt-1 h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${totalPct}%` }} />
        </div>
      </div>

      <button
        onClick={dismiss}
        aria-label="Tutup"
        className="absolute -top-2 -right-2 size-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] hover:bg-red-500 hover:border-red-500 hover:text-white grid place-items-center transition"
      >
        <X className="size-3" />
      </button>
    </Link>
  );
}

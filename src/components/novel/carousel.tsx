"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { NovelCard, NovelCardData } from "./novel-card";

export function NovelCarousel({
  title,
  novels,
  seeAllHref,
}: {
  title: string;
  novels: NovelCardData[];
  seeAllHref?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="hidden md:flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--primary)] transition"
            >
              Lihat semua <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="size-9 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] grid place-items-center transition"
            aria-label="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="size-9 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] grid place-items-center transition"
            aria-label="Scroll right"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:px-8 scroll-smooth"
      >
        {novels.map((n) => (
          <NovelCard key={n.slug} novel={n} />
        ))}
      </div>
    </section>
  );
}

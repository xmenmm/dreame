"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Star, Play, Plus, ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  slug: string;
  title: string;
  synopsis: string;
  rating: number;
  coverUrl: string;
  bannerUrl: string | null;
  author: { displayName: string };
  _count: { chapters: number };
};

const AUTO_INTERVAL_MS = 6000;

export function HeroCarousel({ novels }: { novels: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = novels.length;
  const safeIndex = total > 0 ? index % total : 0;
  const current = novels[safeIndex];

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, AUTO_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, paused]);

  if (!current) return null;

  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  return (
    <section
      className="relative h-[460px] md:h-[560px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides — semuanya dirender, hanya yang aktif yang opaque (smooth crossfade) */}
      {novels.map((n, i) => {
        const src = n.bannerUrl ?? n.coverUrl;
        const usePollinations = src?.includes("pollinations.ai");
        const active = i === safeIndex;
        return (
          <div
            key={n.slug}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            aria-hidden={!active}
          >
            {usePollinations ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={n.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <Image
                src={src}
                alt={n.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/95 via-[var(--background)]/40 to-transparent" />
          </div>
        );
      })}

      {/* Konten (re-render sesuai current; transition di key untuk animasi text) */}
      <div className="absolute inset-0 flex items-end md:items-center">
        <div key={current.slug} className="w-full max-w-2xl px-4 md:px-12 pb-10 md:pb-0 hero-text-fade">
          <div className="text-xs font-bold tracking-[0.2em] text-[var(--primary)] mb-3">⭐ FEATURED NOVEL</div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 leading-[1.05]">{current.title}</h1>
          <div className="flex items-center gap-3 text-sm text-[var(--muted)] mb-4">
            <span className="flex items-center gap-1">
              <Star className="size-4 fill-[var(--primary)] text-[var(--primary)]" />
              <span className="font-bold text-white">{current.rating.toFixed(1)}</span>
            </span>
            <span>·</span>
            <span>oleh {current.author.displayName}</span>
            <span>·</span>
            <span>{current._count.chapters} bab</span>
          </div>
          <p className="text-base md:text-lg text-[var(--muted)] line-clamp-3 mb-6 max-w-xl">{current.synopsis}</p>
          <div className="flex items-center gap-3">
            <Link href={`/novel/${current.slug}`} className="flex items-center gap-2 h-12 px-6 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition">
              <Play className="size-4 fill-black" /> Baca Sekarang
            </Link>
            <button className="size-12 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] grid place-items-center transition" aria-label="Add">
              <Plus className="size-5" />
            </button>
          </div>
        </div>
      </div>

      {total > 1 && (
        <>
          {/* Arrow controls */}
          <button
            onClick={goPrev}
            aria-label="Sebelumnya"
            className="hidden md:grid absolute left-4 top-1/2 -translate-y-1/2 z-10 size-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur text-white place-items-center transition"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={goNext}
            aria-label="Selanjutnya"
            className="hidden md:grid absolute right-4 top-1/2 -translate-y-1/2 z-10 size-11 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur text-white place-items-center transition"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {novels.map((n, i) => (
              <button
                key={n.slug}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === safeIndex ? "w-8 bg-[var(--primary)]" : "w-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

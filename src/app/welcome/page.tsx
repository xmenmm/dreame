import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Coins, Users, Feather, Star, Shield,
  ArrowRight, Quote, Sparkles, LogIn, UserPlus, Play,
  Search, BookMarked, PenLine, TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { getLandingConfig } from "@/lib/site-config";
import { formatNumber } from "@/lib/utils";
import { getGenreColor } from "@/lib/genre-colors";
import { WelcomeFloatingPopups } from "@/components/welcome/floating-popups";
import { StarrySky } from "@/components/welcome/starry-sky";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Lentera — Setiap Cerita Layak Diceritakan",
  description: "Platform baca novel original. Daftar gratis dapat 50 coin.",
};

const ICONS = {
  book: BookOpen,
  coin: Coins,
  users: Users,
  feather: Feather,
  star: Star,
  shield: Shield,
} as const;

export default async function WelcomePage() {
  const [cfg, featured, stats, genres, topAuthors] = await Promise.all([
    getLandingConfig(),
    db.novel.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ rating: "desc" }, { views: "desc" }],
      take: 8,
      include: { author: true, _count: { select: { chapters: true } } },
    }),
    Promise.all([
      db.novel.count({ where: { publishedAt: { not: null } } }),
      db.user.count({ where: { role: { in: ["writer", "admin"] } } }),
      db.chapter.count({ where: { isPublished: true } }),
      db.user.count(),
    ]).then(([novels, writers, chapters, users]) => ({ novels, writers, chapters, users })),
    db.genre.findMany({ take: 10, include: { _count: { select: { novels: true } } } }),
    db.user.findMany({
      where: { role: { in: ["writer", "admin"] }, novels: { some: { publishedAt: { not: null } } } },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { novels: true } } },
    }),
  ]);

  const collection = featured.slice(0, 3);
  const spotlight = featured[3] ?? featured[0];
  const showcase = featured.slice(0, 6);
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="relative isolate min-h-screen welcome-page-root" style={{ backgroundColor: "#000" }}>
      {/* ★ Starry sky background — covers FULL wrapper height */}
      <StarrySky />

      {/* Floating decorative popups — span FULL wrapper height (top: 0% – 95%) */}
      <WelcomeFloatingPopups />

      {/* ════════ HERO ════════ */}
      <section className="relative overflow-hidden">
        {/* HEADER */}
        <header className="relative z-20 w-full mx-auto px-6 lg:px-10 xl:px-14 py-6 flex items-center justify-between">
          <Link href="/welcome" className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black">L</div>
            <span className="text-lg font-bold tracking-tight">Lentera</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/discover" className="text-[var(--foreground)]/70 hover:text-[var(--foreground)]">Jelajah</Link>
            <Link href="/leaderboard" className="text-[var(--foreground)]/70 hover:text-[var(--foreground)]">Leaderboard</Link>
            <Link href="/legal" className="text-[var(--foreground)]/70 hover:text-[var(--foreground)]">Legal</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-4 h-9 rounded-full text-sm font-semibold flex items-center hover:bg-[var(--surface)]/60 transition backdrop-blur-sm">Masuk</Link>
            <Link href="/register" className="px-4 h-9 rounded-full text-sm font-bold flex items-center bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)] transition">Daftar Gratis</Link>
          </div>
        </header>

        {/* HERO CONTENT — centered editorial title + balanced split */}
        <div className="relative z-10 w-full mx-auto px-6 lg:px-10 xl:px-14 pt-8 md:pt-14 pb-20">
          {/* Centered title block */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-[var(--foreground)]/60 mb-6">
              <span className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              Last updated · {today}
            </div>
            <h1 className="font-display tracking-tight leading-[0.9]">
              <span className="block text-7xl md:text-9xl font-black text-[var(--foreground)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                LENTERA
              </span>
              <span className="block text-6xl md:text-8xl italic font-light bg-gradient-to-br from-[var(--primary)] via-[var(--primary-hover)] to-[var(--accent)] bg-clip-text text-transparent mt-2">
                Collection
              </span>
            </h1>
            <p className="mt-8 text-base md:text-lg text-[var(--foreground)]/70 max-w-2xl mx-auto leading-relaxed">
              Ribuan novel original karya penulis Indonesia. Baca gratis, dukung penulis favoritmu dengan coin, atau mulai tulis ceritamu sendiri.
            </p>
          </div>

          {/* Balanced split: kuration list (kiri) ↔ featured + auth (kanan) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-start max-w-[1700px] mx-auto">
            {/* LEFT — curated list */}
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--primary)] font-bold mb-6">Pilihan Editor</div>
              <ol className="space-y-7">
                {collection.map((n, i) => (
                  <li key={n.id}>
                    <Link href={`/novel/${n.slug}`} className="flex gap-5 group">
                      <span className="font-display text-xs text-[var(--foreground)]/50 tracking-widest pt-1 min-w-[24px]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 border-l border-[var(--border)] pl-5 group-hover:border-[var(--primary)] transition">
                        <h3 className="font-display text-2xl md:text-3xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent group-hover:underline underline-offset-4 decoration-[var(--primary)]/40">
                          {n.title}
                        </h3>
                        <p className="text-sm text-[var(--foreground)]/70 leading-relaxed mt-2 line-clamp-2">
                          {n.synopsis ?? `Karya dari ${n.author.displayName}.`}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--foreground)]/50">
                          <span className="flex items-center gap-1">
                            <Star className="size-3 fill-[var(--primary)] text-[var(--primary)]" />
                            {n.rating.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span>{n._count.chapters} bab</span>
                          <span>·</span>
                          <span>{n.author.displayName}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            {/* RIGHT — featured spotlight + login/signup panel */}
            <div className="lg:sticky lg:top-10">
              {spotlight && (
                <div className="rounded-2xl bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] p-5 md:p-6 shadow-2xl shadow-black/40">
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[var(--surface-2)]/85 backdrop-blur-md ring-1 ring-[var(--border)]">
                    <Image
                      src={spotlight.coverUrl}
                      alt={spotlight.title}
                      fill
                      sizes="(min-width: 1024px) 480px, 100vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-white/80 mb-2">
                        <span className="size-1.5 rounded-full bg-[var(--primary)]" />
                        Featured Novel
                      </div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold leading-tight">{spotlight.title}</h2>
                      <p className="text-xs text-white/80 mt-1">oleh {spotlight.author.displayName}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <Link
                      href="/login"
                      className="w-full h-12 rounded-full bg-[var(--primary)] text-black font-bold text-sm hover:bg-[var(--primary-hover)] inline-flex items-center justify-center gap-2 transition shadow-lg shadow-[var(--primary)]/20"
                    >
                      <LogIn className="size-4" /> Masuk
                    </Link>
                    <Link
                      href="/register"
                      className="w-full h-12 rounded-full border-2 border-[var(--border)] text-[var(--foreground)] font-bold text-sm hover:border-[var(--primary)] hover:text-[var(--primary)] inline-flex items-center justify-center gap-2 transition"
                    >
                      <UserPlus className="size-4" /> Daftar Gratis
                    </Link>
                    <p className="text-[11px] text-center text-[var(--foreground)]/60 pt-2">
                      Daftar dapat <span className="text-[var(--primary)] font-bold">50 coin</span> · gratis selamanya
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ STATS BAR ════════ */}
      <section className="w-full mx-auto px-6 lg:px-10 xl:px-14 -mt-2 pb-14">
        <div className="rounded-2xl bg-[var(--surface)]/85 backdrop-blur-md border border-[var(--border)] p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { num: stats.novels, label: "Novel", icon: BookOpen },
            { num: stats.chapters, label: "Bab", icon: BookMarked },
            { num: stats.writers, label: "Penulis", icon: Feather },
            { num: stats.users, label: "Pembaca", icon: Users },
          ].map((s) => {
            const I = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-4 justify-center md:justify-start">
                <div className="size-11 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 grid place-items-center text-[var(--primary)] shrink-0">
                  <I className="size-5" />
                </div>
                <div>
                  <div className="font-display text-3xl font-black bg-gradient-to-br from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent">
                    {formatNumber(s.num)}+
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)] font-semibold">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════ GENRE TAGS ════════ */}
      {genres.length > 0 && (
        <section className="w-full mx-auto px-6 lg:px-10 xl:px-14 py-10 text-center">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--primary)] font-bold mb-4">Jelajah berdasarkan genre</div>
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {genres.map((g) => {
              const c = getGenreColor(g.slug);
              return (
                <Link
                  key={g.id}
                  href={`/genre/${g.slug}`}
                  className={`px-4 py-2 rounded-full border ${c.bg} ${c.border} ${c.text} backdrop-blur-md text-sm font-semibold hover:scale-105 hover:shadow-lg transition-transform inline-flex items-center gap-2`}
                >
                  <span className={`size-1.5 rounded-full ${c.dot}`} aria-hidden />
                  {g.name} <span className="opacity-60 text-xs font-normal">({g._count.novels})</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ════════ FEATURES ════════ */}
      <section className="py-20 md:py-28 max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14">
        <div className="text-center mb-16">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--primary)] font-bold mb-3">Kenapa Lentera</div>
          <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight">
            Dibangun untuk pembaca<br className="hidden md:block" /> <span className="italic font-light text-[var(--muted)]">dan penulis.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cfg.features.map((f, i) => {
            const Icon = ICONS[f.icon];
            return (
              <div key={i} className="rounded-2xl bg-[var(--surface)]/85 backdrop-blur-md border border-[var(--border)] p-6 hover:border-[var(--primary)]/50 hover:-translate-y-1 transition">
                <div className="size-12 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 grid place-items-center text-[var(--primary)] mb-4">
                  <Icon className="size-6" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="py-20 max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14">
        <div className="text-center mb-16">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--primary)] font-bold mb-3">Cara kerja</div>
          <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight">
            Tiga langkah, <span className="italic font-light text-[var(--muted)]">mulai baca.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { icon: UserPlus, step: "01", title: "Daftar Gratis", desc: "Buat akun dalam 30 detik. Otomatis dapat 50 coin sebagai welcome bonus." },
            { icon: Search, step: "02", title: "Temukan Cerita", desc: "Jelajah ribuan novel berbagai genre — romance, fantasi, thriller, dan lainnya." },
            { icon: BookOpen, step: "03", title: "Baca Sepuasnya", desc: "Mode baca premium, sinkron antar device. Dukung penulis favorit dengan coin." },
          ].map((s) => {
            const I = s.icon;
            return (
              <div key={s.step} className="relative rounded-2xl bg-[var(--surface)]/85 backdrop-blur-md border border-[var(--border)] p-8 text-center">
                <div className="font-display text-7xl font-black bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent absolute top-2 right-4 opacity-20">
                  {s.step}
                </div>
                <div className="size-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black mx-auto mb-5">
                  <I className="size-6" />
                </div>
                <h3 className="font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════ SHOWCASE ════════ */}
      {cfg.showFeatured && showcase.length > 0 && (
        <section className="py-16 max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--primary)] font-bold mb-3">Showcase</div>
              <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight">{cfg.showcaseTitle}</h2>
            </div>
            <Link href="/discover" className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline self-start md:self-auto">
              Lihat semua <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {showcase.map((n) => (
              <Link key={n.id} href={`/novel/${n.slug}`} className="group">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--surface-2)]/85 backdrop-blur-md ring-1 ring-[var(--border)] group-hover:ring-[var(--primary)] transition">
                  <Image src={n.coverUrl} alt={n.title} fill sizes="200px" className="object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 text-xs font-bold text-white">
                    <Star className="size-3 fill-[var(--primary)] text-[var(--primary)]" /> {n.rating.toFixed(1)}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-bold">{n.author.displayName}</div>
                  <div className="text-sm font-semibold line-clamp-1 group-hover:text-[var(--primary)] transition mt-1">{n.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ════════ TOP AUTHORS ════════ */}
      {topAuthors.length > 0 && (
        <section className="py-16 max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--primary)] font-bold mb-3">Penulis</div>
              <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight">
                Suara <span className="italic font-light text-[var(--muted)]">yang harus didengar.</span>
              </h2>
            </div>
            <Link href="/leaderboard" className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline self-start md:self-auto">
              Lihat leaderboard <TrendingUp className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topAuthors.map((a) => (
              <Link key={a.id} href={`/u/${a.username}`} className="group rounded-2xl bg-[var(--surface)]/85 backdrop-blur-md border border-[var(--border)] p-5 text-center hover:border-[var(--primary)]/50 transition">
                <div className="size-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black text-xl mx-auto mb-3">
                  {a.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="font-bold text-sm line-clamp-1 group-hover:text-[var(--primary)] transition">{a.displayName}</div>
                <div className="text-xs text-[var(--muted)] mt-1 flex items-center justify-center gap-1">
                  <PenLine className="size-3" /> {a._count.novels} novel
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ════════ TESTIMONIALS ════════ */}
      {cfg.showTestimonials && cfg.testimonials.length > 0 && (
        <section className="py-20 md:py-28 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-[10px] uppercase tracking-[0.4em] text-[var(--primary)] font-bold mb-3">Apa kata mereka</div>
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-tight">Komunitas yang <span className="italic font-light text-[var(--muted)]">growing.</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cfg.testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl bg-[var(--surface)]/85 backdrop-blur-md border border-[var(--border)] p-6 relative">
                <Quote className="absolute top-4 right-4 size-6 text-[var(--primary)]/20" />
                <p className="text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
                  <div className="size-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-bold">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-[var(--muted)]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ════════ FINAL CTA ════════ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-[var(--primary)]/15 via-[var(--accent)]/10 to-transparent border border-[var(--primary)]/30 p-10 md:p-16">
          <Sparkles className="size-8 text-[var(--primary)] mx-auto mb-4" />
          <h2 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-4">{cfg.finalCtaTitle}</h2>
          <p className="text-lg text-[var(--muted)] mb-8">{cfg.finalCtaSubtitle}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition shadow-lg shadow-[var(--primary)]/30"
            >
              <UserPlus className="size-4" /> Daftar Gratis
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition"
            >
              <Play className="size-4" /> Jelajah Dulu
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="border-t border-[var(--border)] py-10 max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-14">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black text-xs">L</div>
            <span>© {new Date().getFullYear()} Lentera. Semua karya milik penulisnya.</span>
          </div>
          <div className="flex gap-4">
            <Link href="/legal" className="hover:text-foreground">Legal</Link>
            <Link href="/discover" className="hover:text-foreground">Jelajah</Link>
            <Link href="/login" className="hover:text-foreground">Masuk</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { NovelCarousel } from "@/components/novel/carousel";
import { DailyRewardCard } from "@/components/daily-reward-card";
import { DailyChallengeCard } from "@/components/daily-challenge-card";
import { getOrCreateTodayChallenge, CHALLENGES } from "@/lib/daily-challenge";
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";
import { getCurrentUser } from "@/lib/auth";
import { getHomeLayout, type HomeSection } from "@/lib/site-config";
import type { NovelCardData } from "@/components/novel/novel-card";

export const dynamic = "force-dynamic";

function dayKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

const cardSelect = {
  include: { _count: { select: { chapters: true } }, author: true },
} as const;

function toCard(n: any): NovelCardData {
  return {
    slug: n.slug, title: n.title, coverUrl: n.coverUrl, rating: n.rating,
    status: n.status, chapterCount: n._count.chapters,
    publishedYear: n.publishedAt?.getFullYear() ?? new Date().getFullYear(),
  };
}

async function fetchHero(section: Extract<HomeSection, { type: "hero" }>) {
  // Carousel: sampai 5 novel. Pinned slug (kalau ada) jadi slide pertama.
  const result: Array<Awaited<ReturnType<typeof fetchOne>>> = [];

  async function fetchOne(slug: string) {
    return db.novel.findUnique({
      where: { slug },
      include: { author: true, _count: { select: { chapters: true } } },
    });
  }

  if (section.novelSlug) {
    const n = await fetchOne(section.novelSlug);
    if (n) result.push(n);
  }

  const orderBy =
    section.auto === "trending"
      ? [{ views: "desc" as const }, { rating: "desc" as const }]
      : [{ isFeatured: "desc" as const }, { rating: "desc" as const }, { views: "desc" as const }];

  const more = await db.novel.findMany({
    where: {
      publishedAt: { not: null },
      ...(section.auto === "featured" ? { isFeatured: true } : {}),
      ...(result[0] ? { id: { not: result[0]!.id } } : {}),
    },
    orderBy,
    take: 5,
    include: { author: true, _count: { select: { chapters: true } } },
  });

  return [...result, ...more].slice(0, 5);
}

async function fetchCarousel(section: Extract<HomeSection, { type: "carousel" }>): Promise<NovelCardData[]> {
  const orderBy =
    section.sort === "popular" ? [{ views: "desc" as const }] :
    section.sort === "new"     ? [{ publishedAt: "desc" as const }] :
    section.sort === "featured" ? [{ isFeatured: "desc" as const }, { rating: "desc" as const }] :
    [{ rating: "desc" as const }, { views: "desc" as const }];

  const novels = await db.novel.findMany({
    where: {
      publishedAt: { not: null },
      ...(section.genreSlug ? { genres: { some: { genre: { slug: section.genreSlug } } } } : {}),
    },
    orderBy,
    take: 12,
    ...cardSelect,
  });
  return novels.map(toCard);
}

async function fetchRecommendations(userId: string): Promise<NovelCardData[]> {
  const [user, history] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { preferredGenres: true } }),
    db.readingHistory.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { novel: { include: { genres: true } } },
    }),
  ]);

  // Genres from reading history
  const historyGenreIds = new Set(history.flatMap((h) => h.novel.genres.map((g) => g.genreId)));

  // Genres user picked at onboarding (slugs → ids)
  let prefGenreIds = new Set<string>();
  if (user?.preferredGenres) {
    try {
      const slugs = JSON.parse(user.preferredGenres) as string[];
      if (Array.isArray(slugs) && slugs.length > 0) {
        const prefs = await db.genre.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
        prefGenreIds = new Set(prefs.map((g) => g.id));
      }
    } catch {}
  }

  const allGenreIds = [...new Set([...historyGenreIds, ...prefGenreIds])];
  if (allGenreIds.length === 0) return [];

  const seenIds = new Set(history.map((h) => h.novelId));
  const recs = await db.novel.findMany({
    where: {
      id: { notIn: [...seenIds] },
      publishedAt: { not: null },
      genres: { some: { genreId: { in: allGenreIds } } },
    },
    orderBy: [{ rating: "desc" }, { views: "desc" }],
    take: 12,
    ...cardSelect,
  });
  return recs.map(toCard);
}

export default async function HomePage() {
  const [user, layout] = await Promise.all([getCurrentUser(), getHomeLayout()]);
  const visibleSections = layout.sections.filter((s) => s.visible !== false);

  // Daily reward state (only fetched if section enabled)
  const dailyEnabled = user && visibleSections.some((s) => s.type === "daily-reward");
  const dailyState = dailyEnabled
    ? await (async () => {
        const fresh = await db.user.findUnique({
          where: { id: user.id },
          select: { lastDailyClaim: true, loginStreak: true },
        });
        const today = new Date();
        const claimedToday = !!(fresh?.lastDailyClaim && dayKey(fresh.lastDailyClaim) === dayKey(today));
        return { canClaim: !claimedToday, streak: fresh?.loginStreak ?? 0 };
      })()
    : null;

  // Daily challenge state (only for logged-in users)
  const challengeState = user
    ? await (async () => {
        const ch = await getOrCreateTodayChallenge(user.id);
        const def = CHALLENGES[ch.kind as keyof typeof CHALLENGES] ?? CHALLENGES.read_chapter;
        return {
          emoji: def.emoji,
          label: def.label,
          reward: ch.reward,
          target: ch.target,
          progress: ch.progress,
          completed: !!ch.completedAt,
          claimed: !!ch.claimedAt,
        };
      })()
    : null;

  // Pre-fetch all sections in parallel
  const sectionData = await Promise.all(visibleSections.map(async (s) => {
    if (s.type === "hero") return { section: s, hero: await fetchHero(s) };
    if (s.type === "carousel") return { section: s, novels: await fetchCarousel(s) };
    if (s.type === "recommendations") return { section: s, novels: user ? await fetchRecommendations(user.id) : [] };
    return { section: s };
  }));

  return (
    <div>
      {sectionData.map((sd) => {
        const s = sd.section;
        if (s.type === "hero") {
          const heroData = (sd as { hero?: Array<HeroSlide> }).hero;
          if (!heroData || heroData.length === 0) return null;
          return <HeroCarousel key={s.id} novels={heroData} />;
        }

        if (s.type === "daily-reward" && dailyState) {
          return (
            <section key={s.id} className="px-4 md:px-8 mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <DailyRewardCard initialCanClaim={dailyState.canClaim} initialStreak={dailyState.streak} />
              {challengeState && <DailyChallengeCard initial={challengeState} />}
            </section>
          );
        }

        if (s.type === "carousel") {
          const novels = (sd as { novels?: NovelCardData[] }).novels ?? [];
          if (novels.length === 0) return null;
          return (
            <div key={s.id} className="mt-6 md:mt-8">
              <NovelCarousel
                title={s.title}
                novels={novels}
                seeAllHref={`/discover?sort=${s.sort}${s.genreSlug ? `&genre=${s.genreSlug}` : ""}`}
              />
            </div>
          );
        }

        if (s.type === "recommendations") {
          const novels = (sd as { novels?: NovelCardData[] }).novels ?? [];
          if (novels.length === 0) return null;
          return (
            <div key={s.id} className="mt-6 md:mt-8">
              <NovelCarousel title={s.title || "Untuk Kamu"} novels={novels} seeAllHref="/discover" />
            </div>
          );
        }

        if (s.type === "banner") {
          return (
            <section key={s.id} className="px-4 md:px-8 mt-8 md:mt-10">
              <Link href={s.link} className="block relative h-40 md:h-56 rounded-2xl overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={s.title || "Banner"} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                {(s.title || s.subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center px-6 md:px-12">
                    <div>
                      {s.title && <h2 className="text-2xl md:text-4xl font-black mb-1">{s.title}</h2>}
                      {s.subtitle && <p className="text-sm md:text-base text-white/80">{s.subtitle}</p>}
                    </div>
                  </div>
                )}
              </Link>
            </section>
          );
        }
        return null;
      })}

      <footer className="text-center text-xs text-[var(--muted)] py-8 px-4 border-t border-[var(--border)] mt-10">
        <p>© {new Date().getFullYear()} Lentera. Semua novel adalah karya original yang dipublikasikan oleh penulisnya.</p>
        <p className="mt-1">
          <Link href="/legal" className="hover:text-[var(--primary)]">Legal</Link>
          {" · "}
          <Link href="/leaderboard" className="hover:text-[var(--primary)]">Leaderboard</Link>
          {" · "}
          <Link href="/wallet" className="hover:text-[var(--primary)]">Wallet</Link>
        </p>
      </footer>
    </div>
  );
}

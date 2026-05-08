import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, BookOpen, Eye, Lock, Coins } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";
import { CommentsSection } from "@/components/novel/comments";
import { RatingStars } from "@/components/novel/rating-stars";
import { ReviewForm } from "@/components/novel/review-form";
import { FollowButton } from "@/components/novel/follow-button";

export const dynamic = "force-dynamic";

export default async function NovelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [novel, user] = await Promise.all([
    db.novel.findUnique({
      where: { slug },
      include: {
        author: true,
        chapters: { orderBy: { number: "asc" }, where: { isPublished: true } },
        genres: { include: { genre: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!novel) notFound();

  const unlockedIds = user
    ? new Set(
        (
          await db.chapterUnlock.findMany({
            where: { userId: user.id, chapterId: { in: novel.chapters.map((c) => c.id) } },
            select: { chapterId: true },
          })
        ).map((u) => u.chapterId),
      )
    : new Set<string>();

  const [userRating, comments, isFollowing, reviews] = await Promise.all([
    user ? db.rating.findUnique({ where: { userId_novelId: { userId: user.id, novelId: novel.id } } }) : null,
    db.comment.findMany({
      where: { novelId: novel.id, parentId: null, isHidden: false },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: { select: { username: true, displayName: true, avatarUrl: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
        },
      },
    }),
    user ? db.follow.findUnique({ where: { followerId_followingId: { followerId: user.id, followingId: novel.author.id } } }) : null,
    // Public reviews (with text body), excluding current user's own
    db.rating.findMany({
      where: {
        novelId: novel.id,
        body: { not: null },
        ...(user ? { userId: { not: user.id } } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
      include: { user: { select: { username: true, displayName: true, avatarUrl: true } } },
    }),
  ]);

  const isAiCover = novel.coverUrl.includes("pollinations.ai") || novel.coverUrl.startsWith("/uploads/");
  const bannerSrc = novel.bannerUrl ?? novel.coverUrl;
  const isAiBanner = bannerSrc.includes("pollinations.ai") || bannerSrc.startsWith("/uploads/");

  return (
    <div>
      <section className="relative h-[280px] md:h-[360px] overflow-hidden">
        {isAiBanner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerSrc} alt={novel.title} className="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-40" />
        ) : (
          <Image src={bannerSrc} alt={novel.title} fill priority sizes="100vw" className="object-cover blur-sm scale-110 opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--background)]" />
      </section>

      <div className="relative -mt-40 md:-mt-48 px-4 md:px-12 pb-10">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="relative w-40 md:w-56 aspect-[2/3] rounded-xl overflow-hidden ring-2 ring-[var(--border)] shrink-0 shadow-2xl">
            {isAiCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={novel.coverUrl} alt={novel.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <Image src={novel.coverUrl} alt={novel.title} fill sizes="240px" className="object-cover" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {novel.genres.map(({ genre }) => (
                <Link
                  key={genre.id}
                  href={`/genre/${genre.slug}`}
                  className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-md bg-[var(--surface-2)] text-[var(--primary)] hover:bg-[var(--primary)]/20 transition"
                >
                  {genre.name}
                </Link>
              ))}
              <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md ${novel.status === "completed" ? "bg-emerald-500/20 text-emerald-400" : novel.status === "hiatus" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                {novel.status === "ongoing" ? "Berlangsung" : novel.status === "completed" ? "Tamat" : "Hiatus"}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2 leading-tight">{novel.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/u/${novel.author.username}`} className="text-sm text-[var(--muted)] hover:text-[var(--primary)] transition">
                oleh <span className="font-semibold text-foreground">{novel.author.displayName}</span>
              </Link>
              {user && user.id !== novel.author.id && (
                <FollowButton authorId={novel.author.id} initialFollowing={!!isFollowing} />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-[var(--primary)] text-[var(--primary)]" />
                <span className="font-bold">{novel.rating.toFixed(1)}</span>
                <span className="text-[var(--muted)]">({formatNumber(novel.ratingCount)})</span>
              </span>
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <BookOpen className="size-4" /> {novel.chapters.length} bab
              </span>
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <Eye className="size-4" /> {formatNumber(novel.views)} dibaca
              </span>
              <span className="flex items-center gap-1.5 text-[var(--muted)]">
                <Coins className="size-4" /> {novel.coinPerChapter} coin/bab · {novel.freeChapters} bab gratis
              </span>
            </div>

            <p className="mt-6 text-[var(--muted)] leading-relaxed max-w-3xl">{novel.synopsis}</p>

            <div className="mt-6 flex items-center gap-3">
              {novel.chapters[0] && (
                <Link
                  href={`/novel/${novel.slug}/read/${novel.chapters[0].number}`}
                  className="h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] grid place-items-center transition"
                >
                  Mulai Baca
                </Link>
              )}
              <button className="h-11 px-6 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] font-semibold transition">
                + Bookmark
              </button>
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold mb-4">Daftar Bab</h2>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
            {novel.chapters.map((c) => {
              const isFree = c.number <= novel.freeChapters;
              const isUnlocked = isFree || unlockedIds.has(c.id);
              return (
                <Link
                  key={c.id}
                  href={`/novel/${novel.slug}/read/${c.number}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-lg bg-[var(--surface-2)] grid place-items-center text-xs font-bold text-[var(--muted)] shrink-0">
                      {c.number}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.title}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {formatNumber(c.wordCount)} kata · {new Date(c.publishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isFree ? (
                      <span className="text-xs font-bold text-emerald-400">GRATIS</span>
                    ) : isUnlocked ? (
                      <span className="text-xs font-bold text-[var(--muted)]">DIBUKA</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-[var(--primary)]">
                        <Lock className="size-3" />
                        {novel.coinPerChapter}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="text-lg font-bold mb-4">Rating & Review</h2>
          <ReviewForm
            novelId={novel.id}
            initial={{
              score: userRating?.score ?? null,
              title: userRating?.title ?? null,
              body: userRating?.body ?? null,
            }}
            averageRating={novel.rating}
            ratingCount={novel.ratingCount}
            isLoggedIn={!!user}
          />
        </section>

        {/* Public reviews list */}
        {reviews.length > 0 && (
          <section className="mt-8">
            <h3 className="text-base font-bold mb-4">
              Review dari Pembaca <span className="text-sm font-normal text-[var(--muted)]">({reviews.length})</span>
            </h3>
            <div className="space-y-3">
              {reviews.map((r) => (
                <article key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <header className="flex items-center justify-between gap-3 mb-2">
                    <Link href={`/u/${r.user.username}`} className="flex items-center gap-2 group">
                      <div className="size-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-bold text-xs">
                        {r.user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold leading-tight group-hover:text-[var(--primary)] transition">{r.user.displayName}</div>
                        <div className="text-[10px] text-[var(--muted)]">@{r.user.username}</div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`size-3.5 ${n <= r.score ? "fill-[var(--primary)] text-[var(--primary)]" : "text-[var(--muted)]/30"}`} />
                      ))}
                    </div>
                  </header>
                  {r.title && <h4 className="font-bold text-sm mb-1">{r.title}</h4>}
                  {r.body && <p className="text-sm text-[var(--foreground)]/85 leading-relaxed whitespace-pre-wrap">{r.body}</p>}
                  <div className="text-[10px] text-[var(--muted)] mt-2">
                    {r.updatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <CommentsSection
          novelId={novel.id}
          initial={comments.map((c) => ({
            id: c.id,
            body: c.body,
            createdAt: c.createdAt.toISOString(),
            isHidden: c.isHidden,
            user: c.user,
            replies: c.replies.map((r) => ({
              id: r.id, body: r.body, createdAt: r.createdAt.toISOString(),
              isHidden: r.isHidden, user: r.user,
            })),
          }))}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}

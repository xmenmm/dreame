import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowLeft, Lock, Coins } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ReaderControls } from "@/components/reader/reader-controls";
import { CommentsSection } from "@/components/novel/comments";
import { getReaderBanners } from "@/lib/site-config";
import { ReaderBannerSlot } from "@/components/reader/reader-banner";
import { ChapterToc, extractSubHeadings, slugifyHeading } from "@/components/reader/chapter-toc";
import { ScrollSaver } from "@/components/reader/scroll-saver";
import { QuoteSelector } from "@/components/reader/quote-selector";

export const dynamic = "force-dynamic";

function renderMarkdownLite(md: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const seen = new Map<string, number>();
  return md
    .split(/\n\n+/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      // Image: ![alt](src) on its own line
      const imgMatch = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const alt = escape(imgMatch[1]);
        const src = imgMatch[2].replace(/"/g, "&quot;");
        return `<figure class="chapter-image"><img src="${src}" alt="${alt}" loading="lazy" /></figure>`;
      }
      if (t.startsWith("# ")) return `<h1>${escape(t.slice(2))}</h1>`;
      if (t.startsWith("## ")) {
        const text = t.slice(3);
        const baseSlug = slugifyHeading(text) || "section";
        const count = (seen.get(baseSlug) ?? 0) + 1;
        seen.set(baseSlug, count);
        const id = count > 1 ? `${baseSlug}-${count}` : baseSlug;
        return `<h2 id="${id}" class="scroll-mt-32">${escape(text)}</h2>`;
      }
      if (t === "---") return "<hr />";
      let inner = escape(t)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br />");
      return `<p>${inner}</p>`;
    })
    .join("\n");
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}) {
  const { slug, number } = await params;
  const num = parseInt(number, 10);
  if (Number.isNaN(num)) notFound();

  const novel = await db.novel.findUnique({
    where: { slug },
    include: {
      chapters: { orderBy: { number: "asc" }, where: { isPublished: true }, select: { id: true, number: true, title: true } },
    },
  });
  if (!novel) notFound();

  const chapter = await db.chapter.findUnique({
    where: { novelId_number: { novelId: novel.id, number: num } },
  });
  if (!chapter) notFound();

  const isFree = num <= novel.freeChapters;
  const user = await getCurrentUser();

  let isUnlocked = isFree;
  if (!isFree && user) {
    const unlock = await db.chapterUnlock.findUnique({
      where: { userId_chapterId: { userId: user.id, chapterId: chapter.id } },
    });
    if (unlock) isUnlocked = true;
  }

  const prevCh = novel.chapters.find((c) => c.number === num - 1);
  const nextCh = novel.chapters.find((c) => c.number === num + 1);

  const banners = await getReaderBanners();
  const subHeadings = isUnlocked ? extractSubHeadings(chapter.content) : [];

  const chapterComments = isUnlocked
    ? await db.comment.findMany({
        where: { chapterId: chapter.id, parentId: null, isHidden: false },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          user: { select: { username: true, displayName: true, avatarUrl: true } },
          replies: { orderBy: { createdAt: "asc" }, include: { user: { select: { username: true, displayName: true, avatarUrl: true } } } },
        },
      })
    : [];

  // increment view (fire-and-forget; in real prod use background job)
  await db.novel.update({ where: { id: novel.id }, data: { views: { increment: 1 } } }).catch(() => {});

  // Reading progress: load existing scroll pos for resume, then update lastChapter
  let initialScrollPos = 0;
  if (user) {
    const existing = await db.readingHistory.findUnique({
      where: { userId_novelId: { userId: user.id, novelId: novel.id } },
    });
    // Only resume scroll if user is on the SAME chapter as last time
    if (existing && existing.lastChapter === num) {
      initialScrollPos = existing.scrollPos;
    }
    await db.readingHistory.upsert({
      where: { userId_novelId: { userId: user.id, novelId: novel.id } },
      update: { lastChapter: num, ...(existing?.lastChapter !== num ? { scrollPos: 0 } : {}) },
      create: { userId: user.id, novelId: novel.id, lastChapter: num, scrollPos: 0 },
    }).catch(() => {});
  }

  return (
    <div className="reader-page min-h-screen">
      {user && isUnlocked && (
        <>
          <ScrollSaver novelId={novel.id} chapterNumber={num} initialScrollPos={initialScrollPos} />
          <QuoteSelector
            novelId={novel.id}
            chapterId={chapter.id}
            novelTitle={novel.title}
            chapterNumber={num}
          />
        </>
      )}
      <header className="sticky top-16 z-10 bg-[var(--reader-bg)]/95 backdrop-blur border-b border-[var(--border)]">
        <div className="px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <Link
            href={`/novel/${novel.slug}`}
            className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground transition min-w-0"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="truncate">{novel.title}</span>
          </Link>
          <ReaderControls />
        </div>
      </header>

      <article className="px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px] gap-6 max-w-[1400px] mx-auto">
        {/* LEFT — Chapter list + ad banner (sticky) */}
        <aside className="hidden lg:block">
          <div className="sticky top-32 space-y-4">
            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur p-3">
              <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-2 px-2">Daftar Bab</div>
              <ul className="space-y-0.5">
                {novel.chapters.map((c) => {
                  const isCurrent = c.number === num;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/novel/${novel.slug}/read/${c.number}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${isCurrent ? "bg-[var(--primary)]/15 text-[var(--primary)] font-bold" : "text-[var(--muted)] hover:text-foreground hover:bg-[var(--surface-2)]"}`}
                      >
                        <span className="font-mono w-6 text-right shrink-0">{c.number}</span>
                        <span className="truncate">{c.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
            {banners.left && (
              <ReaderBannerSlot banner={banners.left} className="aspect-[1/2]" />
            )}
          </div>
        </aside>

        {/* CENTER — Reading content */}
        <div className="min-w-0">
          {/* TOP BANNER — admin-controlled */}
          {banners.top && (
            <ReaderBannerSlot banner={banners.top} className="mb-6 aspect-[4/1] md:aspect-[6/1]" />
          )}

          <div className="text-center mb-6">
            <div className="text-xs font-bold tracking-widest text-[var(--muted)] mb-2">
              BAB {chapter.number} DARI {novel.chapters.length}
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">{chapter.title}</h1>
          </div>

          {/* TOC sub-judul (jika ada `## Heading` di chapter) */}
          {isUnlocked && (
            <ChapterToc
              headings={subHeadings}
              chapterNumber={chapter.number}
              chapterTitle={chapter.title}
            />
          )}

          {isUnlocked ? (
            <div
              className="prose-reader text-[var(--foreground)]"
              dangerouslySetInnerHTML={{ __html: renderMarkdownLite(chapter.content) }}
            />
          ) : (
            <div className="my-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
              <Lock className="size-10 mx-auto mb-3 text-[var(--primary)]" />
              <h2 className="text-xl font-bold mb-2">Bab terkunci</h2>
              <p className="text-[var(--muted)] mb-4">
                Buka bab ini dengan <span className="text-[var(--primary)] font-bold inline-flex items-center gap-1"><Coins className="size-4" />{novel.coinPerChapter} coin</span>.
                {!user && " Masuk dulu untuk membaca."}
              </p>
              {user ? (
                <form action={`/api/chapters/${chapter.id}/unlock`} method="POST">
                  <button className="h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition">
                    Buka dengan {novel.coinPerChapter} Coin
                  </button>
                </form>
              ) : (
                <Link
                  href={`/login?next=/novel/${novel.slug}/read/${num}`}
                  className="inline-block h-11 px-6 leading-[44px] rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
                >
                  Masuk untuk Buka
                </Link>
              )}
            </div>
          )}

          <nav className="mt-12 flex items-center justify-between gap-3 pt-8 border-t border-[var(--border)]">
            {prevCh ? (
              <Link
                href={`/novel/${novel.slug}/read/${prevCh.number}`}
                className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition"
              >
                <ChevronLeft className="size-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Sebelumnya</div>
                  <div className="text-sm font-semibold truncate">{prevCh.title}</div>
                </div>
              </Link>
            ) : <div className="flex-1" />}
            {nextCh ? (
              <Link
                href={`/novel/${novel.slug}/read/${nextCh.number}`}
                className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition justify-end text-right"
              >
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">Selanjutnya</div>
                  <div className="text-sm font-semibold truncate">{nextCh.title}</div>
                </div>
                <ChevronRight className="size-4 shrink-0" />
              </Link>
            ) : (
              <div className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center text-sm text-[var(--muted)]">
                Bab terakhir
              </div>
            )}
          </nav>

          {/* Mobile: comments inline; Desktop: hidden, shown in right sidebar */}
          {isUnlocked && (
            <div className="lg:hidden">
              <CommentsSection
                chapterId={chapter.id}
                isLoggedIn={!!user}
                initial={chapterComments.map((c) => ({
                  id: c.id, body: c.body, createdAt: c.createdAt.toISOString(),
                  isHidden: c.isHidden, user: c.user,
                  replies: c.replies.map((r) => ({
                    id: r.id, body: r.body, createdAt: r.createdAt.toISOString(),
                    isHidden: r.isHidden, user: r.user,
                  })),
                }))}
              />
            </div>
          )}
        </div>

        {/* RIGHT — Banner + Comments + meta info (desktop only) */}
        <aside className="hidden lg:flex flex-col gap-4">
          <div className="sticky top-32 space-y-4">
            {banners.right && (
              <ReaderBannerSlot banner={banners.right} className="aspect-[1/2]" />
            )}
            {/* Mini novel info card */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur p-4">
              <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-2">Sedang Dibaca</div>
              <Link href={`/novel/${novel.slug}`} className="font-bold leading-tight text-sm hover:text-[var(--primary)] transition line-clamp-2">
                {novel.title}
              </Link>
              <div className="mt-2 text-xs text-[var(--muted)] flex items-center gap-2">
                <span>Bab {chapter.number}/{novel.chapters.length}</span>
                <span>·</span>
                <span>{Math.round((chapter.number / novel.chapters.length) * 100)}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                  style={{ width: `${(chapter.number / novel.chapters.length) * 100}%` }} />
              </div>
            </div>

            {/* Comments */}
            {isUnlocked && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur p-4 max-h-[calc(100vh-20rem)] overflow-y-auto">
                <CommentsSection
                  chapterId={chapter.id}
                  isLoggedIn={!!user}
                  initial={chapterComments.map((c) => ({
                    id: c.id, body: c.body, createdAt: c.createdAt.toISOString(),
                    isHidden: c.isHidden, user: c.user,
                    replies: c.replies.map((r) => ({
                      id: r.id, body: r.body, createdAt: r.createdAt.toISOString(),
                      isHidden: r.isHidden, user: r.user,
                    })),
                  }))}
                />
              </div>
            )}
          </div>
        </aside>
      </article>
    </div>
  );
}

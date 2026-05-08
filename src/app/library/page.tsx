import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NovelCard, type NovelCardData } from "@/components/novel/novel-card";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/library");

  const [bookmarks, history] = await Promise.all([
    db.bookmark.findMany({
      where: { userId: user.id },
      include: { novel: { include: { _count: { select: { chapters: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    db.readingHistory.findMany({
      where: { userId: user.id },
      include: { novel: { include: { _count: { select: { chapters: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  const toCard = (n: typeof bookmarks[number]["novel"]): NovelCardData => ({
    slug: n.slug, title: n.title, coverUrl: n.coverUrl, rating: n.rating,
    status: n.status, chapterCount: n._count.chapters,
    publishedYear: n.publishedAt?.getFullYear() ?? new Date().getFullYear(),
  });

  return (
    <div className="px-4 md:px-8 py-8">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">Library</h1>
      <p className="text-[var(--muted)] mt-1 mb-8">Bacaan kamu, semua di satu tempat.</p>

      <section className="mb-12">
        <h2 className="text-lg font-bold mb-4">Sedang Dibaca</h2>
        {history.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Belum ada history. Mulai baca novel apa saja.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {history.map((h) => <NovelCard key={h.id} novel={toCard(h.novel)} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Bookmark</h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Belum ada bookmark.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {bookmarks.map((b) => <NovelCard key={b.id} novel={toCard(b.novel)} />)}
          </div>
        )}
      </section>
    </div>
  );
}

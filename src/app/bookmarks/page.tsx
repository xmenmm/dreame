import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NovelCard, type NovelCardData } from "@/components/novel/novel-card";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/bookmarks");

  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.id },
    include: { novel: { include: { _count: { select: { chapters: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const items: NovelCardData[] = bookmarks.map((b) => ({
    slug: b.novel.slug, title: b.novel.title, coverUrl: b.novel.coverUrl,
    rating: b.novel.rating, status: b.novel.status,
    chapterCount: b.novel._count.chapters,
    publishedYear: b.novel.publishedAt?.getFullYear() ?? new Date().getFullYear(),
  }));

  return (
    <div className="px-4 md:px-8 py-8">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
        <Heart className="size-7 text-[var(--accent)]" /> Bookmark
      </h1>
      <p className="text-[var(--muted)] mt-1 mb-8">{items.length} novel disimpan.</p>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-10 text-center">
          <Heart className="size-10 mx-auto mb-3 text-[var(--muted)]" />
          <h3 className="text-lg font-bold mb-1">Belum ada bookmark</h3>
          <p className="text-sm text-[var(--muted)] mb-5">Tekan tombol bookmark di novel untuk menyimpannya di sini.</p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            Jelajah Novel
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((n) => <NovelCard key={n.slug} novel={n} />)}
        </div>
      )}
    </div>
  );
}

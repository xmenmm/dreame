import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { MarkdownEditor } from "@/components/writer/markdown-editor";
import { AIChapterAssist } from "@/components/writer/ai-chapter-assist";

export const dynamic = "force-dynamic";

export default async function NewChapterPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/writer/${slug}/chapter/new`);

  const novel = await db.novel.findUnique({
    where: { slug },
    include: { _count: { select: { chapters: true } } },
  });
  if (!novel) notFound();
  if (novel.authorId !== user.id && user.role !== "admin") redirect("/writer");

  const nextNumber = novel._count.chapters + 1;

  async function createChapter(formData: FormData) {
    "use server";
    const u = await getCurrentUser();
    if (!u) redirect("/login");
    const cur = await db.novel.findUnique({ where: { slug }, select: { id: true, authorId: true, slug: true } });
    if (!cur || (cur.authorId !== u.id && u.role !== "admin")) redirect("/writer");

    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();
    const isPublishedRaw = String(formData.get("isPublished") || "");
    const isPublished = isPublishedRaw === "true" || isPublishedRaw === "on";

    if (!title || !content) {
      return;
    }

    const last = await db.chapter.findFirst({
      where: { novelId: cur.id }, orderBy: { number: "desc" }, select: { number: true },
    });
    const number = (last?.number ?? 0) + 1;
    const wordCount = content.replace(/[#*_`>-]/g, " ").split(/\s+/).filter((w) => w.length > 0).length;

    await db.chapter.create({
      data: {
        novelId: cur.id,
        number, title, content, wordCount, isPublished,
        publishedAt: isPublished ? new Date() : new Date(0),
      },
    });

    // Notify bookmarkers + past unlockers when chapter is published
    if (isPublished) {
      const novelInfo = await db.novel.findUnique({
        where: { id: cur.id },
        select: { title: true, slug: true },
      });
      const [bookmarks, unlocks] = await Promise.all([
        db.bookmark.findMany({ where: { novelId: cur.id }, select: { userId: true } }),
        db.chapterUnlock.findMany({
          where: { chapter: { novelId: cur.id } },
          select: { userId: true },
          distinct: ["userId"],
        }),
      ]);
      const userIds = [
        ...new Set([
          ...bookmarks.map((b) => b.userId),
          ...unlocks.map((u) => u.userId),
        ]),
      ].filter((id) => id !== u.id); // don't notify the author themselves
      if (userIds.length > 0 && novelInfo) {
        await db.notification.createMany({
          data: userIds.map((uid) => ({
            userId: uid,
            kind: "chapter_new",
            title: `Bab baru di "${novelInfo.title}"`,
            body: `Bab ${number}: ${title}`,
            link: `/novel/${novelInfo.slug}/read/${number}`,
          })),
        });
      }
    }

    redirect(`/writer/${cur.slug}`);
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <Link href={`/writer/${novel.slug}`} className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> {novel.title}
      </Link>

      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Bab {nextNumber}</h1>
        <span className="text-sm text-[var(--muted)]">cerita baru</span>
      </div>

      <AIChapterAssist
        novelSlug={novel.slug}
        chapterNumber={nextNumber}
        novelTitle={novel.title}
        hasPreviousChapters={novel._count.chapters > 0}
      />

      <form action={createChapter} className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-1.5">Judul Bab</label>
          <input
            name="title" required maxLength={120}
            placeholder="Contoh: Awal Mula"
            className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-lg font-semibold"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5">Isi Bab</label>
          <MarkdownEditor name="content" />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="submit"
            name="isPublished" value="true"
            className="h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            Publish Bab
          </button>
          <button
            type="submit"
            name="isPublished" value="false"
            className="h-11 px-6 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] font-semibold transition"
          >
            Simpan Draft
          </button>
          <Link href={`/writer/${novel.slug}`} className="h-11 px-6 leading-[44px] rounded-full text-sm text-[var(--muted)] hover:text-foreground">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { MarkdownEditor } from "@/components/writer/markdown-editor";
import { AIChapterAssist } from "@/components/writer/ai-chapter-assist";

export const dynamic = "force-dynamic";

export default async function EditChapterPage({
  params,
}: { params: Promise<{ slug: string; number: string }> }) {
  const { slug, number } = await params;
  const num = parseInt(number, 10);
  if (Number.isNaN(num)) notFound();

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/writer/${slug}/chapter/${number}/edit`);

  const novel = await db.novel.findUnique({ where: { slug } });
  if (!novel) notFound();
  if (novel.authorId !== user.id && user.role !== "admin") redirect("/writer");

  const chapter = await db.chapter.findUnique({
    where: { novelId_number: { novelId: novel.id, number: num } },
  });
  if (!chapter) notFound();

  async function updateChapter(formData: FormData) {
    "use server";
    const u = await getCurrentUser();
    if (!u) redirect("/login");
    const novel2 = await db.novel.findUnique({ where: { slug }, select: { id: true, authorId: true, slug: true } });
    if (!novel2 || (novel2.authorId !== u.id && u.role !== "admin")) redirect("/writer");

    const title = String(formData.get("title") || "").trim();
    const content = String(formData.get("content") || "").trim();
    const isPublishedRaw = String(formData.get("isPublished") || "");
    const isPublished = isPublishedRaw === "true" || isPublishedRaw === "on";

    if (!title || !content) return;

    const wordCount = content.replace(/[#*_`>-]/g, " ").split(/\s+/).filter((w) => w.length > 0).length;
    const wasPublished = chapter!.isPublished;
    await db.chapter.update({
      where: { id: chapter!.id },
      data: {
        title, content, wordCount, isPublished,
        ...(isPublished && !wasPublished ? { publishedAt: new Date() } : {}),
      },
    });

    // Notify bookmarkers + unlockers on first publish only
    if (isPublished && !wasPublished) {
      const novelInfo = await db.novel.findUnique({
        where: { id: chapter!.novelId },
        select: { title: true, slug: true },
      });
      const [bookmarks, unlocks] = await Promise.all([
        db.bookmark.findMany({ where: { novelId: chapter!.novelId }, select: { userId: true } }),
        db.chapterUnlock.findMany({
          where: { chapter: { novelId: chapter!.novelId } },
          select: { userId: true },
          distinct: ["userId"],
        }),
      ]);
      const userIds = [
        ...new Set([
          ...bookmarks.map((b) => b.userId),
          ...unlocks.map((x) => x.userId),
        ]),
      ].filter((id) => id !== u.id);
      if (userIds.length > 0 && novelInfo) {
        await db.notification.createMany({
          data: userIds.map((uid) => ({
            userId: uid,
            kind: "chapter_new",
            title: `Bab baru di "${novelInfo.title}"`,
            body: `Bab ${chapter!.number}: ${title}`,
            link: `/novel/${novelInfo.slug}/read/${chapter!.number}`,
          })),
        });
      }
    }

    redirect(`/writer/${novel2.slug}`);
  }

  async function deleteChapter() {
    "use server";
    const u = await getCurrentUser();
    if (!u) redirect("/login");
    const novel2 = await db.novel.findUnique({ where: { slug }, select: { id: true, authorId: true, slug: true } });
    if (!novel2 || (novel2.authorId !== u.id && u.role !== "admin")) redirect("/writer");
    await db.chapter.delete({ where: { id: chapter!.id } });
    redirect(`/writer/${novel2.slug}`);
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <Link href={`/writer/${novel.slug}`} className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> {novel.title}
      </Link>

      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Edit Bab {chapter.number}</h1>
        <span className={`text-xs font-bold px-2 py-0.5 rounded ${chapter.isPublished ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
          {chapter.isPublished ? "TAYANG" : "DRAFT"}
        </span>
      </div>

      <AIChapterAssist
        novelSlug={novel.slug}
        chapterNumber={chapter.number}
        novelTitle={novel.title}
        hasPreviousChapters={chapter.number > 1}
      />

      <form action={updateChapter} className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-1.5">Judul Bab</label>
          <input
            name="title" defaultValue={chapter.title} required maxLength={120}
            className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-lg font-semibold"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1.5">Isi Bab</label>
          <MarkdownEditor name="content" defaultValue={chapter.content} />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="submit"
            name="isPublished" value="true"
            className="h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            {chapter.isPublished ? "Simpan & Publish" : "Publish"}
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

      <div className="mt-12 rounded-xl border border-red-500/30 bg-red-500/5 p-5">
        <h3 className="font-bold text-red-400 mb-1">Hapus Bab Ini</h3>
        <p className="text-xs text-[var(--muted)] mb-3">Bab akan dihapus permanen. History pembaca tetap, tapi tidak bisa diakses lagi.</p>
        <form action={deleteChapter}>
          <button type="submit" className="h-9 px-4 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 inline-flex items-center gap-2">
            <Trash2 className="size-3.5" /> Hapus Bab
          </button>
        </form>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const last = await db.readingHistory.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      novel: {
        select: {
          slug: true, title: true, coverUrl: true,
          _count: { select: { chapters: true } },
        },
      },
    },
  });
  if (!last) return NextResponse.json({ ok: true, continueReading: null });

  // current chapter title
  const ch = await db.chapter.findUnique({
    where: { novelId_number: { novelId: last.novelId, number: last.lastChapter } },
    select: { title: true, isPublished: true },
  });

  return NextResponse.json({
    ok: true,
    continueReading: {
      slug: last.novel.slug,
      title: last.novel.title,
      coverUrl: last.novel.coverUrl,
      chapter: last.lastChapter,
      chapterTitle: ch?.title ?? "",
      totalChapters: last.novel._count.chapters,
      scrollPos: last.scrollPos,
      updatedAt: last.updatedAt.toISOString(),
    },
  });
}

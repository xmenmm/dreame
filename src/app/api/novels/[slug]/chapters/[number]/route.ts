import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string; number: string }> },
) {
  const { slug, number } = await params;
  const num = parseInt(number, 10);
  if (Number.isNaN(num)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const novel = await db.novel.findUnique({ where: { slug }, select: { id: true, freeChapters: true, coinPerChapter: true } });
  if (!novel) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const chapter = await db.chapter.findUnique({
    where: { novelId_number: { novelId: novel.id, number: num } },
  });
  if (!chapter) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isFree = num <= novel.freeChapters;
  const user = await getUserFromRequest(req);
  let isUnlocked = isFree;
  if (!isFree && user) {
    const u = await db.chapterUnlock.findUnique({
      where: { userId_chapterId: { userId: user.id, chapterId: chapter.id } },
    });
    if (u) isUnlocked = true;
  }

  return NextResponse.json({
    id: chapter.id,
    novelSlug: slug,
    number: chapter.number,
    title: chapter.title,
    wordCount: chapter.wordCount,
    publishedAt: chapter.publishedAt,
    isFree,
    isUnlocked,
    coinPerChapter: novel.coinPerChapter,
    content: isUnlocked ? chapter.content : null,
  });
}

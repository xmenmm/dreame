import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, getUserFromRequest } from "@/lib/auth";
import { checkCoinSpendAchievements } from "@/lib/achievements";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = (await getCurrentUser()) ?? (await getUserFromRequest(req));
  const isJsonClient = req.headers.get("accept")?.includes("application/json");

  if (!user) {
    if (isJsonClient) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const chapter = await db.chapter.findUnique({
    where: { id },
    include: { novel: true },
  });
  if (!chapter) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (chapter.number <= chapter.novel.freeChapters) {
    return NextResponse.json({ ok: true, alreadyFree: true });
  }

  const existing = await db.chapterUnlock.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId: chapter.id } },
  });
  if (existing) {
    if (isJsonClient) return NextResponse.json({ ok: true, alreadyUnlocked: true });
    return NextResponse.redirect(new URL(`/novel/${chapter.novel.slug}/read/${chapter.number}`, req.url));
  }

  if (user.coinBalance < chapter.novel.coinPerChapter) {
    if (isJsonClient) return NextResponse.json({ error: "insufficient_coins" }, { status: 402 });
    return NextResponse.redirect(new URL(`/wallet?error=insufficient&next=/novel/${chapter.novel.slug}/read/${chapter.number}`, req.url));
  }

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { coinBalance: { decrement: chapter.novel.coinPerChapter } },
    }),
    db.chapterUnlock.create({
      data: { userId: user.id, chapterId: chapter.id, coinsSpent: chapter.novel.coinPerChapter },
    }),
    db.coinTransaction.create({
      data: {
        userId: user.id,
        amount: -chapter.novel.coinPerChapter,
        kind: "unlock",
        reference: chapter.id,
      },
    }),
  ]);

  await checkCoinSpendAchievements(user.id).catch(() => {});

  if (isJsonClient) return NextResponse.json({ ok: true });
  return NextResponse.redirect(new URL(`/novel/${chapter.novel.slug}/read/${chapter.number}`, req.url));
}

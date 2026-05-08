import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { bumpReadingStreak, checkReadingAchievements } from "@/lib/achievements";
import { maybeGrantReferrerBonus } from "@/lib/referral";
import { bumpChallengeProgress } from "@/lib/daily-challenge";

const Body = z.object({
  novelId: z.string().min(1),
  chapterNumber: z.number().int().min(1),
  scrollPos: z.number().int().min(0).max(10_000_000),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
  const { novelId, chapterNumber, scrollPos } = parsed.data;

  await db.readingHistory.upsert({
    where: { userId_novelId: { userId: user.id, novelId } },
    update: { lastChapter: chapterNumber, scrollPos },
    create: { userId: user.id, novelId, lastChapter: chapterNumber, scrollPos },
  });

  // Reading is "real" once user scrolls past 500px in a chapter — bump streak, achievements, daily challenge
  if (scrollPos > 500) {
    await bumpReadingStreak(user.id).catch(() => {});
    await checkReadingAchievements(user.id).catch(() => {});
    await maybeGrantReferrerBonus(user.id).catch(() => {});
    await bumpChallengeProgress(user.id, "read_chapter", 1).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

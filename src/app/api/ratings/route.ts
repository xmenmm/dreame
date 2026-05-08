import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, getUserFromRequest } from "@/lib/auth";
import { grantAchievement } from "@/lib/achievements";
import { moderate } from "@/lib/moderation";

const Schema = z.object({
  novelId: z.string(),
  score: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  body: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = (await getCurrentUser()) ?? (await getUserFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const reviewTitle = parsed.data.title?.trim() || null;
  const reviewBody = parsed.data.body?.trim() || null;

  // Moderate text review (skip if empty)
  if (reviewBody) {
    const mod = moderate(reviewBody);
    if (!mod.ok) return NextResponse.json({ error: "blocked" }, { status: 400 });
  }

  await db.rating.upsert({
    where: { userId_novelId: { userId: user.id, novelId: parsed.data.novelId } },
    update: { score: parsed.data.score, title: reviewTitle, body: reviewBody },
    create: {
      userId: user.id,
      novelId: parsed.data.novelId,
      score: parsed.data.score,
      title: reviewTitle,
      body: reviewBody,
    },
  });

  const agg = await db.rating.aggregate({
    where: { novelId: parsed.data.novelId },
    _avg: { score: true },
    _count: true,
  });

  const average = agg._avg.score ?? 0;
  const count = agg._count;
  await db.novel.update({
    where: { id: parsed.data.novelId },
    data: { rating: average, ratingCount: count },
  });

  // Grant "first_review" if user wrote a real text review
  if (reviewBody && reviewBody.length > 20) {
    await grantAchievement(user.id, "first_review").catch(() => {});
  }

  return NextResponse.json({ average, count });
}

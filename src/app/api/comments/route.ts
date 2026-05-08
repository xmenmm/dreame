import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, getUserFromRequest } from "@/lib/auth";
import { moderate } from "@/lib/moderation";
import { checkCommentAchievements } from "@/lib/achievements";

const Schema = z.object({
  novelId: z.string().optional(),
  chapterId: z.string().optional(),
  parentId: z.string().optional(),
  body: z.string().min(1).max(1000),
});

export async function POST(req: Request) {
  const user = (await getCurrentUser()) ?? (await getUserFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.isBanned) return NextResponse.json({ error: "banned" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!parsed.data.novelId && !parsed.data.chapterId) {
    return NextResponse.json({ error: "missing_target" }, { status: 400 });
  }

  const mod = moderate(parsed.data.body);
  if (!mod.ok) return NextResponse.json({ error: "blocked" }, { status: 400 });

  const comment = await db.comment.create({
    data: {
      userId: user.id,
      novelId: parsed.data.novelId,
      chapterId: parsed.data.chapterId,
      parentId: parsed.data.parentId,
      body: parsed.data.body,
    },
    include: {
      user: { select: { username: true, displayName: true, avatarUrl: true } },
    },
  });

  // notify parent comment author
  if (parsed.data.parentId) {
    const parent = await db.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { userId: true, novelId: true, chapterId: true },
    });
    if (parent && parent.userId !== user.id) {
      const novelSlug = parsed.data.novelId
        ? (await db.novel.findUnique({ where: { id: parsed.data.novelId }, select: { slug: true } }))?.slug
        : null;
      const chapter = parsed.data.chapterId
        ? await db.chapter.findUnique({ where: { id: parsed.data.chapterId }, select: { number: true, novel: { select: { slug: true } } } })
        : null;
      const link = chapter ? `/novel/${chapter.novel.slug}/read/${chapter.number}#c-${comment.id}` : novelSlug ? `/novel/${novelSlug}#c-${comment.id}` : "/";
      await db.notification.create({
        data: {
          userId: parent.userId,
          kind: "comment_reply",
          title: `${user.displayName} membalas komentar kamu`,
          body: parsed.data.body.slice(0, 100),
          link,
        },
      });
    }
  }

  await checkCommentAchievements(user.id).catch(() => {});

  return NextResponse.json({ comment, flag: mod.flag });
}

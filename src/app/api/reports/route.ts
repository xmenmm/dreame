import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, getUserFromRequest } from "@/lib/auth";

const Schema = z.object({
  targetType: z.enum(["novel", "chapter", "comment", "user"]),
  targetId: z.string(),
  reason: z.enum(["spam", "nsfw", "copyright", "hate", "other"]),
  detail: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const user = (await getCurrentUser()) ?? (await getUserFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  let reportedUserId: string | null = null;
  if (parsed.data.targetType === "user") reportedUserId = parsed.data.targetId;
  else if (parsed.data.targetType === "comment") {
    const c = await db.comment.findUnique({ where: { id: parsed.data.targetId }, select: { userId: true } });
    reportedUserId = c?.userId ?? null;
  } else if (parsed.data.targetType === "novel") {
    const n = await db.novel.findUnique({ where: { id: parsed.data.targetId }, select: { authorId: true } });
    reportedUserId = n?.authorId ?? null;
  }

  await db.report.create({
    data: {
      reporterId: user.id,
      reportedUserId,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
      detail: parsed.data.detail,
    },
  });
  return NextResponse.json({ ok: true });
}

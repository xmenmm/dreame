import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const Body = z.object({
  novelId: z.string().min(1),
  chapterId: z.string().min(1),
  body: z.string().min(8).max(800),  // selected text
  note: z.string().max(280).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const { novelId, chapterId, body, note } = parsed.data;
  // sanity: chapter must belong to the novel
  const ch = await db.chapter.findUnique({ where: { id: chapterId }, select: { novelId: true } });
  if (!ch || ch.novelId !== novelId) return NextResponse.json({ ok: false, error: "mismatch" }, { status: 400 });

  // basic: don't save dup of identical body within same chapter
  const dup = await db.quote.findFirst({
    where: { userId: user.id, chapterId, body: body.trim() },
  });
  if (dup) return NextResponse.json({ ok: true, id: dup.id, duplicate: true });

  const q = await db.quote.create({
    data: { userId: user.id, novelId, chapterId, body: body.trim(), note: note?.trim() || null },
  });
  return NextResponse.json({ ok: true, id: q.id });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const list = await db.quote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      novel: { select: { slug: true, title: true, coverUrl: true, author: { select: { displayName: true } } } },
      chapter: { select: { number: true, title: true } },
    },
  });
  return NextResponse.json({ ok: true, quotes: list });
}

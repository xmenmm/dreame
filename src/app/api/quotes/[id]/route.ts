import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  const q = await db.quote.findUnique({ where: { id }, select: { userId: true } });
  if (!q) return NextResponse.json({ ok: false }, { status: 404 });
  if (q.userId !== user.id) return NextResponse.json({ ok: false }, { status: 403 });
  await db.quote.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getUserFromRequest } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = (await getCurrentUser()) ?? (await getUserFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.id === id) return NextResponse.json({ error: "cant_follow_self" }, { status: 400 });

  const target = await db.user.findUnique({ where: { id }, select: { id: true, displayName: true } });
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db.follow.upsert({
    where: { followerId_followingId: { followerId: user.id, followingId: id } },
    update: {},
    create: { followerId: user.id, followingId: id },
  });
  await db.notification.create({
    data: {
      userId: id, kind: "follow",
      title: `${user.displayName} mulai mengikuti kamu`,
      link: `/u/${user.username}`,
    },
  }).catch(() => {});
  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = (await getCurrentUser()) ?? (await getUserFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  await db.follow.deleteMany({
    where: { followerId: user.id, followingId: id },
  });
  return NextResponse.json({ ok: true, following: false });
}

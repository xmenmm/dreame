import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const [fresh, unread] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: { coinBalance: true, readingStreak: true, loginStreak: true, lastReadAt: true },
    }),
    db.notification.count({ where: { userId: user.id, isRead: false } }),
  ]);
  if (!fresh) return NextResponse.json({ ok: false }, { status: 401 });

  // Streak resets to 0 if user hasn't read for >36 hours (handled here for display)
  const now = Date.now();
  const lastRead = fresh.lastReadAt?.getTime() ?? 0;
  const stale = lastRead && (now - lastRead) > 36 * 60 * 60 * 1000;
  const streak = stale ? 0 : fresh.readingStreak;

  return NextResponse.json({
    ok: true,
    coinBalance: fresh.coinBalance,
    unreadNotifs: unread,
    readingStreak: streak,
  });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return NextResponse.json({ ok: false }, { status: 401 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const [total, banned, writers, admins, newToday, activeWeek, online, totalChapters, totalNovels] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { isBanned: true } }),
    db.user.count({ where: { role: "writer" } }),
    db.user.count({ where: { role: "admin" } }),
    db.user.count({ where: { createdAt: { gte: startOfToday } } }),
    db.user.count({ where: { lastReadAt: { gte: sevenDaysAgo } } }),
    db.user.count({ where: { lastLoginAt: { gte: fifteenMinAgo } } }),
    db.chapter.count({ where: { isPublished: true } }),
    db.novel.count({ where: { publishedAt: { not: null } } }),
  ]);

  return NextResponse.json({
    ok: true,
    ts: Date.now(),
    total, banned, writers, admins,
    newToday, activeWeek, online,
    totalNovels, totalChapters,
  });
}

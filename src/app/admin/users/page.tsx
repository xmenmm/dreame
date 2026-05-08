import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Users, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UsersListClient } from "@/components/admin/users-list-client";
import { LiveUserStats } from "@/components/admin/live-user-stats";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string; role?: string; status?: string }> }) {
  const { q = "", role = "", status = "" } = await searchParams;
  const me = await getCurrentUser();
  if (!me) redirect("/login?next=/admin/users");
  if (me.role !== "admin") redirect("/");

  const where: Parameters<typeof db.user.findMany>[0] extends { where?: infer W } ? W : never = {
    ...(role ? { role } : {}),
    ...(status === "banned" ? { isBanned: true } : {}),
    ...(status === "active" ? { isBanned: false } : {}),
    ...(q ? { OR: [
      { username: { contains: q } },
      { email: { contains: q } },
      { displayName: { contains: q } },
    ] } : {}),
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const [users, total, banned, writers, admins, newToday, activeWeek, online, totalChapters, totalNovels] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { _count: { select: { novels: true, followers: true } } },
    }),
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
  const initialStats = { total, banned, writers, admins, newToday, activeWeek, online, totalNovels, totalChapters };

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Admin
      </Link>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
        <Users className="size-7" /> Manajemen User
      </h1>
      <p className="text-[var(--muted)] mt-1 mb-6">Cari, lihat, kelola. Centang multi-user untuk bulk action (kasih coin / ban / set role).</p>

      <div className="mb-6">
        <LiveUserStats initial={initialStats} />
      </div>

      <form className="flex flex-wrap gap-2 mb-6">
        <label className="flex items-center gap-2 h-10 px-3 rounded-full bg-[var(--surface)] border border-[var(--border)] focus-within:border-[var(--primary)] flex-1 min-w-[200px]">
          <Search className="size-4 text-[var(--muted)]" />
          <input name="q" defaultValue={q} placeholder="Cari username, email, atau nama..."
            className="bg-transparent w-full outline-none text-sm" />
        </label>
        <select name="role" defaultValue={role} className="h-10 px-3 rounded-full bg-[var(--surface)] border border-[var(--border)] outline-none text-sm">
          <option value="">Semua role</option>
          <option value="reader">Reader</option>
          <option value="writer">Writer</option>
          <option value="admin">Admin</option>
        </select>
        <select name="status" defaultValue={status} className="h-10 px-3 rounded-full bg-[var(--surface)] border border-[var(--border)] outline-none text-sm">
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="banned">Banned</option>
        </select>
        <button type="submit" className="h-10 px-5 rounded-full bg-[var(--primary)] text-black font-bold text-sm">Filter</button>
        {(q || role || status) && (
          <Link href="/admin/users" className="h-10 px-4 leading-10 text-sm text-[var(--muted)] hover:text-foreground">Reset</Link>
        )}
      </form>

      <UsersListClient
        users={users.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          displayName: u.displayName,
          role: u.role,
          isVerified: u.isVerified,
          isBanned: u.isBanned,
          coinBalance: u.coinBalance,
          createdAt: u.createdAt.toISOString(),
          novelsCount: u._count.novels,
          followersCount: u._count.followers,
        }))}
      />
    </div>
  );
}


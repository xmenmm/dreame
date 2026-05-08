import Link from "next/link";
import { redirect } from "next/navigation";
import { Flag, Users, BookOpen, Eye, Coins, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/");

  const [pendingReports, totalUsers, totalNovels, totalChapters, totalCoinsCirculating, recentReports] = await Promise.all([
    db.report.count({ where: { status: "pending" } }),
    db.user.count(),
    db.novel.count({ where: { publishedAt: { not: null } } }),
    db.chapter.count({ where: { isPublished: true } }),
    db.user.aggregate({ _sum: { coinBalance: true } }),
    db.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        reporter: { select: { username: true, displayName: true } },
        reportedUser: { select: { username: true, displayName: true } },
      },
    }),
  ]);

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
        <ShieldCheck className="size-7" /> Admin
      </h1>
      <p className="text-[var(--muted)] mt-1 mb-8">Moderasi & monitoring platform.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <Stat icon={Flag} label="Laporan Pending" value={pendingReports} accent={pendingReports > 0 ? "amber" : "default"} />
        <Stat icon={Users} label="User" value={totalUsers} />
        <Stat icon={BookOpen} label="Novel Tayang" value={totalNovels} />
        <Stat icon={Eye} label="Bab Tayang" value={totalChapters} />
        <Stat icon={Coins} label="Coin Beredar" value={totalCoinsCirculating._sum.coinBalance ?? 0} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Antrian Laporan</h2>
        <Link href="/admin/reports" className="text-xs text-[var(--primary)] font-semibold hover:underline">Lihat semua →</Link>
      </div>

      {recentReports.length === 0 ? (
        <p className="text-sm text-[var(--muted)] text-center py-12 rounded-xl border border-[var(--border)] bg-[var(--surface)]">Tidak ada laporan masuk. 🎉</p>
      ) : (
        <ul className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
          {recentReports.map((r) => (
            <li key={r.id} className="px-4 py-3 flex items-center gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${r.status === "pending" ? "bg-amber-500/20 text-amber-400" : r.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}>
                {r.status}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">
                  {r.reason} · <span className="text-[var(--muted)]">{r.targetType}#{r.targetId.slice(0, 8)}</span>
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  oleh {r.reporter.displayName}
                  {r.reportedUser && ` · target user: ${r.reportedUser.displayName}`}
                  {" · "} {new Date(r.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                </div>
                {r.detail && <div className="text-xs text-[var(--muted)] mt-1 line-clamp-2">"{r.detail}"</div>}
              </div>
              <Link href={`/admin/reports/${r.id}`} className="text-xs font-semibold text-[var(--primary)] hover:underline shrink-0">
                Tinjau →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent = "default" }: { icon: any; label: string; value: number; accent?: "default" | "amber" }) {
  return (
    <div className={`rounded-xl bg-[var(--surface)] border p-4 ${accent === "amber" ? "border-amber-500/40" : "border-[var(--border)]"}`}>
      <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold">
        <Icon className="size-3" /> {label}
      </div>
      <div className="text-2xl md:text-3xl font-black mt-1">{formatNumber(value)}</div>
    </div>
  );
}

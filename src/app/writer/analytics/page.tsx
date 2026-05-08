import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, TrendingUp, Coins, Users, Eye, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WriterAnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/writer/analytics");

  const novels = await db.novel.findMany({
    where: { authorId: user.id },
    include: {
      _count: { select: { chapters: true, bookmarks: true, ratings: true } },
      chapters: {
        orderBy: { number: "asc" },
        select: { id: true, number: true, title: true, wordCount: true, _count: { select: { unlocks: true } } },
      },
    },
  });

  const totalViews = novels.reduce((s, n) => s + n.views, 0);
  const totalUnlocks = novels.reduce((s, n) => s + n.chapters.reduce((cs, c) => cs + c._count.unlocks, 0), 0);
  const totalEarned = novels.reduce((s, n) => s + n.chapters.reduce((cs, c) => cs + c._count.unlocks * n.coinPerChapter * 0.7, 0), 0);
  const totalBookmarks = novels.reduce((s, n) => s + n._count.bookmarks, 0);
  const followers = await db.follow.count({ where: { followingId: user.id } });

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <Link href="/writer" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Writer Studio
      </Link>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3 mb-2">
        <BarChart3 className="size-7" /> Analytics
      </h1>
      <p className="text-[var(--muted)] mb-8">Performa cerita kamu, terbaru.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <Stat icon={Eye} label="Total Dibaca" value={formatNumber(totalViews)} />
        <Stat icon={BookOpen} label="Bab Unlock" value={formatNumber(totalUnlocks)} />
        <Stat icon={Coins} label="Coin Earned" value={formatNumber(Math.floor(totalEarned))} accent />
        <Stat icon={Users} label="Pengikut" value={formatNumber(followers)} />
        <Stat icon={TrendingUp} label="Bookmark" value={formatNumber(totalBookmarks)} />
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3 mb-6 text-xs text-[var(--muted)]">
        💰 Coin yang kamu dapat = <strong className="text-emerald-400">70%</strong> dari setiap bab unlock × {} {' '}
        Total potensi coin (sebelum platform fee 30%): <strong>{formatNumber(Math.floor(totalEarned / 0.7))}</strong>
      </div>

      <h2 className="text-lg font-bold mb-3">Performa per Cerita</h2>
      {novels.length === 0 ? (
        <p className="text-sm text-[var(--muted)] text-center py-8">Belum ada cerita.</p>
      ) : (
        <div className="space-y-4">
          {novels.map((n) => {
            const novelUnlocks = n.chapters.reduce((s, c) => s + c._count.unlocks, 0);
            const novelEarned = Math.floor(novelUnlocks * n.coinPerChapter * 0.7);
            const maxUnlocks = Math.max(1, ...n.chapters.map((c) => c._count.unlocks));

            return (
              <div key={n.id} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <Link href={`/writer/${n.slug}`} className="font-bold hover:text-[var(--primary)]">{n.title}</Link>
                  <div className="text-xs text-[var(--muted)] flex items-center gap-3">
                    <span>{formatNumber(n.views)} views</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-bold">+{novelEarned} coin</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {n.chapters.slice(0, 8).map((c) => {
                    const pct = (c._count.unlocks / maxUnlocks) * 100;
                    return (
                      <div key={c.id} className="flex items-center gap-2 text-xs">
                        <span className="w-16 truncate text-[var(--muted)]">Bab {c.number}</span>
                        <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-12 text-right text-[var(--muted)]">{c._count.unlocks}</span>
                      </div>
                    );
                  })}
                  {n.chapters.length > 8 && <p className="text-[10px] text-[var(--muted)] text-center pt-1">+{n.chapters.length - 8} bab lagi...</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl bg-[var(--surface)] border p-4 ${accent ? "border-[var(--primary)]" : "border-[var(--border)]"}`}>
      <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold">
        <Icon className="size-3" /> {label}
      </div>
      <div className={`text-2xl md:text-3xl font-black mt-1 ${accent ? "text-[var(--primary)]" : ""}`}>{value}</div>
    </div>
  );
}

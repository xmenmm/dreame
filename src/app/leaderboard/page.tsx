import Link from "next/link";
import Image from "next/image";
import { Trophy, TrendingUp, Star, Eye } from "lucide-react";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

  const [topRated, topViewed, topNewWriters] = await Promise.all([
    db.novel.findMany({
      where: { publishedAt: { not: null }, ratingCount: { gte: 5 } },
      orderBy: [{ rating: "desc" }, { ratingCount: "desc" }],
      take: 10,
      include: { author: true, _count: { select: { chapters: true } } },
    }),
    db.novel.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { views: "desc" },
      take: 10,
      include: { author: true, _count: { select: { chapters: true } } },
    }),
    db.user.findMany({
      where: { role: { in: ["writer", "admin"] }, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { followers: true, novels: true } } },
    }),
  ]);

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Trophy className="size-7 text-[var(--primary)]" />
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Leaderboard</h1>
      </div>
      <p className="text-[var(--muted)] mb-8">Cerita & penulis terbaik minggu ini.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="Top Rated" subtitle="Rating tertinggi (min. 5 voters)" novels={topRated} icon={Star} />
        <Section title="Most Read" subtitle="Paling banyak dibaca" novels={topViewed} icon={Eye} />
      </div>

      {topNewWriters.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <TrendingUp className="size-4 text-[var(--accent)]" /> Penulis Baru
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {topNewWriters.map((u) => (
              <Link key={u.id} href={`/u/${u.username}`} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] p-4 text-center transition">
                <div className="size-14 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black mx-auto mb-2">
                  {u.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="font-semibold text-sm truncate">{u.displayName}</div>
                <div className="text-[10px] text-[var(--muted)] mt-1">
                  {u._count.novels} cerita · {u._count.followers} pengikut
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Section({ title, subtitle, novels, icon: Icon }: { title: string; subtitle: string; novels: any[]; icon: any }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-bold flex items-center gap-2"><Icon className="size-4 text-[var(--primary)]" /> {title}</h2>
        <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{subtitle}</p>
      </div>
      <ol className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
        {novels.map((n, i) => (
          <li key={n.id}>
            <Link href={`/novel/${n.slug}`} className="flex items-center gap-3 px-3 py-3 hover:bg-[var(--surface-2)] transition">
              <span className={`text-lg font-black w-7 text-center shrink-0 ${i < 3 ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>{i + 1}</span>
              <div className="relative w-10 aspect-[2/3] rounded-md overflow-hidden bg-[var(--surface-2)] shrink-0">
                {n.coverUrl && <Image src={n.coverUrl} alt={n.title} fill sizes="40px" className="object-cover" unoptimized />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{n.title}</div>
                <div className="text-[10px] text-[var(--muted)] truncate">oleh {n.author.displayName}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold flex items-center gap-1">
                  <Star className="size-3 fill-[var(--primary)] text-[var(--primary)]" />
                  {n.rating.toFixed(1)}
                </div>
                <div className="text-[10px] text-[var(--muted)]">{formatNumber(n.views)}</div>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

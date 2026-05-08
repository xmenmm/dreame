import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Coins, Calendar, Users, BookOpen, Settings, LogOut, Star, Flame, Trophy, Lock } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";
import { FollowButton } from "@/components/novel/follow-button";
import { NovelCard, type NovelCardData } from "@/components/novel/novel-card";
import { ACHIEVEMENTS, getAchievementDef } from "@/lib/achievements";

export const dynamic = "force-dynamic";

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const [profile, viewer] = await Promise.all([
    db.user.findUnique({
      where: { username },
      include: {
        _count: { select: { novels: true, followers: true, following: true } },
        novels: {
          where: { publishedAt: { not: null } },
          orderBy: [{ rating: "desc" }, { views: "desc" }],
          take: 12,
          include: { _count: { select: { chapters: true } } },
        },
        achievements: { orderBy: { unlockedAt: "desc" } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!profile) notFound();

  const isOwner = viewer?.id === profile.id;
  const isFollowing = viewer && !isOwner
    ? !!(await db.follow.findUnique({ where: { followerId_followingId: { followerId: viewer.id, followingId: profile.id } } }))
    : false;

  const novelCards: NovelCardData[] = profile.novels.map((n) => ({
    slug: n.slug, title: n.title, coverUrl: n.coverUrl, rating: n.rating,
    status: n.status, chapterCount: n._count.chapters,
    publishedYear: n.publishedAt?.getFullYear() ?? new Date().getFullYear(),
  }));

  const totalViews = profile.novels.reduce((s, n) => s + n.views, 0);

  return (
    <div>
      {/* Banner */}
      <div className="h-40 md:h-56 bg-gradient-to-br from-[var(--primary)]/30 via-[var(--accent)]/20 to-[var(--surface)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.3),transparent)]" />
      </div>

      <div className="px-4 md:px-8 -mt-16 md:-mt-20 max-w-5xl mx-auto">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
          <div className="size-28 md:size-36 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black text-5xl md:text-6xl ring-4 ring-[var(--background)] shrink-0">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 md:pb-2">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">{profile.displayName}</h1>
              {profile.isVerified && (
                <span className="text-[10px] font-bold bg-[var(--primary)]/20 text-[var(--primary)] px-2 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
              )}
              {profile.role === "admin" && (
                <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
              )}
              {profile.role === "writer" && (
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Writer</span>
              )}
            </div>
            <p className="text-sm text-[var(--muted)]">@{profile.username}</p>
            {profile.bio && <p className="text-sm mt-3 max-w-2xl text-[var(--foreground)]">{profile.bio}</p>}
          </div>

          <div className="flex flex-col gap-2 self-start md:self-end shrink-0">
            {isOwner ? (
              <>
                <Link
                  href="/wallet"
                  className="h-10 px-5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold inline-flex items-center justify-center gap-2 transition"
                >
                  <Coins className="size-4 text-[var(--primary)]" /> {formatNumber(profile.coinBalance)} coin
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button className="w-full h-10 px-5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-red-500 text-sm font-semibold inline-flex items-center justify-center gap-2 transition text-[var(--muted)] hover:text-red-400">
                    <LogOut className="size-4" /> Keluar
                  </button>
                </form>
              </>
            ) : viewer ? (
              <FollowButton authorId={profile.id} initialFollowing={isFollowing} />
            ) : (
              <Link href="/login" className="h-10 px-5 rounded-full bg-[var(--primary)] text-black font-bold text-sm inline-flex items-center justify-center transition">Masuk untuk Ikuti</Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          <Stat icon={BookOpen} label="Cerita" value={profile._count.novels} />
          <Stat icon={Star} label="Total Dibaca" value={formatNumber(totalViews)} />
          <Stat icon={Flame} label="Streak Baca" value={profile.readingStreak} accent />
          <Stat icon={Users} label="Pengikut" value={profile._count.followers} />
          <Stat icon={Users} label="Mengikuti" value={profile._count.following} />
          <Stat icon={Calendar} label="Bergabung" value={profile.createdAt.toLocaleDateString("id-ID", { month: "short", year: "numeric" })} />
        </div>

        {/* ════════ ACHIEVEMENTS ════════ */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="size-5 text-[var(--primary)]" /> Achievement
              <span className="text-sm font-normal text-[var(--muted)]">
                {profile.achievements.length} / {ACHIEVEMENTS.length}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3">
            {ACHIEVEMENTS.map((def) => {
              const unlocked = profile.achievements.find((a) => a.code === def.code);
              return (
                <div
                  key={def.code}
                  className={`relative rounded-xl border p-3 text-center transition ${
                    unlocked
                      ? "bg-gradient-to-br from-[var(--primary)]/15 via-[var(--accent)]/10 to-transparent border-[var(--primary)]/40"
                      : "bg-[var(--surface)] border-[var(--border)] opacity-50"
                  }`}
                  title={unlocked ? `Diraih: ${unlocked.unlockedAt.toLocaleDateString("id-ID")}` : "Terkunci"}
                >
                  <div className={`text-3xl mb-1 ${unlocked ? "" : "grayscale"}`}>{def.emoji}</div>
                  <div className="text-xs font-bold leading-tight line-clamp-2">{def.title}</div>
                  <div className="text-[10px] text-[var(--muted)] mt-1 line-clamp-2 leading-tight">{def.description}</div>
                  {!unlocked && (
                    <Lock className="absolute top-1.5 right-1.5 size-3 text-[var(--muted)]" />
                  )}
                  {def.rewardCoin && unlocked && (
                    <div className="text-[10px] text-[var(--primary)] font-bold mt-1 flex items-center justify-center gap-0.5">
                      <Coins className="size-2.5" /> +{def.rewardCoin}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Novels by user */}
        <section className="mb-12">
          <h2 className="text-lg font-bold mb-4">
            {profile._count.novels > 0 ? `Cerita oleh ${profile.displayName}` : "Belum ada cerita"}
          </h2>
          {novelCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {novelCards.map((n) => <NovelCard key={n.slug} novel={n} />)}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
              {isOwner ? (
                <>Belum nulis cerita? <Link href="/writer/new" className="text-[var(--primary)] font-semibold">Mulai sekarang →</Link></>
              ) : (
                "User ini belum mempublish cerita."
              )}
            </div>
          )}
        </section>

        {isOwner && (
          <section className="mb-12">
            <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ActionCard href="/library" icon={BookOpen} label="Library" />
              <ActionCard href="/wallet" icon={Coins} label="Wallet" />
              <ActionCard href="/writer" icon={Settings} label="Writer Studio" />
              <ActionCard href="/notifications" icon={Settings} label="Notifikasi" />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "bg-gradient-to-br from-[var(--primary)]/15 to-transparent border-[var(--primary)]/30" : "bg-[var(--surface)] border-[var(--border)]"}`}>
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${accent ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
        <Icon className="size-3" /> {label}
      </div>
      <div className="text-xl md:text-2xl font-black mt-1">{value}</div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition"
    >
      <Icon className="size-5 text-[var(--primary)]" />
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}

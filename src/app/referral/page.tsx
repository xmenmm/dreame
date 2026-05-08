import Link from "next/link";
import { redirect } from "next/navigation";
import { Gift, Users, Coins, Share2, Check, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureReferralCode, REFERRAL } from "@/lib/referral";
import { CopyCodeButton } from "@/components/referral/copy-code-button";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function ReferralPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/referral");

  // Make sure user has a code
  const code = await ensureReferralCode(user.id);

  // Build invite link from request host (so it works on prod too)
  const h = await headers();
  const host = h.get("host") || "lentera.local";
  const proto = h.get("x-forwarded-proto") || "http";
  const inviteUrl = `${proto}://${host}/register?ref=${code}`;

  // Stats
  const referrals = await db.user.findMany({
    where: { referredByUserId: user.id },
    select: {
      id: true, displayName: true, username: true,
      createdAt: true, referralRewardGranted: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalEarned = await db.coinTransaction.aggregate({
    where: {
      userId: user.id,
      kind: "reward",
      reference: { startsWith: "referral:" },
    },
    _sum: { amount: true },
  });

  const earnedCoin = totalEarned._sum.amount ?? 0;
  const totalReferred = referrals.length;
  const totalActive = referrals.filter((r) => r.referralRewardGranted).length;

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3 mb-2">
        <Gift className="size-7 text-[var(--primary)]" /> Undang Teman
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Bagikan kode kamu — kamu dan temanmu sama-sama dapat coin gratis. Bonus referrer dibayar setelah teman baca {REFERRAL.REFEREE_MILESTONE_CHAPTERS} bab.
      </p>

      {/* CARD: code & link */}
      <div className="rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 via-[var(--accent)]/5 to-transparent border border-[var(--primary)]/30 p-6 md:p-8 mb-8">
        <div className="text-[10px] uppercase tracking-widest text-[var(--primary)] font-bold mb-2">Kode kamu</div>
        <div className="font-mono text-4xl md:text-5xl font-black tracking-widest mb-4 text-[var(--foreground)]">{code}</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 px-4 h-11 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center text-sm text-[var(--muted)] truncate">
            {inviteUrl}
          </div>
          <CopyCodeButton code={code} url={inviteUrl} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">Teman dapat</div>
            <div className="font-bold text-lg flex items-center gap-1 mt-0.5">
              <Coins className="size-4 text-[var(--primary)]" /> +{REFERRAL.REWARD_REFEREE_COIN} coin
            </div>
            <div className="text-xs text-[var(--muted)] mt-0.5">Saat daftar pakai kodemu</div>
          </div>
          <div className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">Kamu dapat</div>
            <div className="font-bold text-lg flex items-center gap-1 mt-0.5">
              <Coins className="size-4 text-[var(--primary)]" /> +{REFERRAL.REWARD_REFERRER_COIN} coin
            </div>
            <div className="text-xs text-[var(--muted)] mt-0.5">Setelah teman baca {REFERRAL.REFEREE_MILESTONE_CHAPTERS} bab</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat icon={Users} label="Diundang" value={totalReferred} />
        <Stat icon={Check} label="Aktif" value={totalActive} accent />
        <Stat icon={Coins} label="Coin Dapat" value={earnedCoin} />
      </div>

      {/* List of referrals */}
      <h2 className="text-lg font-bold mb-3">Riwayat Undangan</h2>
      {referrals.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted)]">
          Belum ada teman yang daftar pakai kode kamu. Share di WhatsApp/Twitter biar mulai dapat bonus!
        </div>
      ) : (
        <ul className="space-y-2">
          {referrals.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] p-3">
              <Link href={`/u/${r.username}`} className="flex items-center gap-3 group min-w-0">
                <div className="size-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-bold shrink-0">
                  {r.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate group-hover:text-[var(--primary)] transition">{r.displayName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    @{r.username} · {r.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </Link>
              {r.referralRewardGranted ? (
                <span className="text-xs font-bold bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full inline-flex items-center gap-1 shrink-0">
                  <Check className="size-3" /> +{REFERRAL.REWARD_REFERRER_COIN} coin
                </span>
              ) : (
                <span className="text-xs font-bold bg-amber-500/15 text-amber-400 px-2 py-1 rounded-full inline-flex items-center gap-1 shrink-0">
                  <Clock className="size-3" /> Menunggu aktif
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "bg-gradient-to-br from-[var(--primary)]/15 to-transparent border-[var(--primary)]/30" : "bg-[var(--surface)] border-[var(--border)]"}`}>
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold ${accent ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
        <Icon className="size-3" /> {label}
      </div>
      <div className="text-2xl font-black mt-1">{value}</div>
    </div>
  );
}

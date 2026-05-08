import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Coins, Flag, ShieldAlert, BadgeCheck, BadgeX, Crown, PenLine, Eye, BookOpen, MessageSquare } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { id } = await params;
  const { done } = await searchParams;
  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=/admin/users/${id}`);
  if (me.role !== "admin") redirect("/");

  const user = await db.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: { novels: true, followers: true, following: true, comments: true, reportsReceived: true },
      },
      novels: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { slug: true, title: true, publishedAt: true, views: true, _count: { select: { chapters: true } } },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      notifications: {
        where: { kind: "warning" },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!user) notFound();

  const isSelf = user.id === me.id;

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Manajemen User
      </Link>

      {done && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
          ✓ {done === "coins" ? "Coin diberikan." :
              done === "warn" ? "Warning dikirim." :
              done === "ban" ? "User di-ban." :
              done === "unban" ? "Ban dicabut." :
              done === "verify" ? "Verifikasi diubah." :
              done === "role" ? "Role diubah." : "Berhasil"}
        </div>
      )}

      {/* Profile header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="size-20 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black text-3xl shrink-0">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-black tracking-tight">{user.displayName}</h1>
            {user.isVerified && <BadgeCheck className="size-5 text-[var(--primary)]" />}
            {user.role === "admin" && <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded uppercase tracking-wider">Admin</span>}
            {user.role === "writer" && <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider">Writer</span>}
            {user.isBanned && <span className="text-[10px] font-bold bg-red-500/30 text-red-400 px-2 py-0.5 rounded uppercase tracking-wider">Banned</span>}
          </div>
          <p className="text-sm text-[var(--muted)]">@{user.username}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{user.email}</p>
          {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
        </div>
        <Link href={`/u/${user.username}`} target="_blank" className="text-xs text-[var(--primary)] hover:underline">Lihat publik →</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <Stat icon={Coins} label="Coin" value={formatNumber(user.coinBalance)} highlight />
        <Stat icon={BookOpen} label="Cerita" value={user._count.novels} />
        <Stat icon={Eye} label="Pengikut" value={user._count.followers} />
        <Stat icon={MessageSquare} label="Komentar" value={user._count.comments} />
        <Stat icon={Flag} label="Dilaporkan" value={user._count.reportsReceived} alert={user._count.reportsReceived > 0} />
      </div>

      {/* ACTIONS */}
      {isSelf ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-8 text-sm text-amber-400">
          ⚠ Kamu lihat akun sendiri. Tindakan admin diblok pada diri sendiri (cegah self-lockout).
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 mb-8">
          <h2 className="font-bold mb-4">Tindakan Admin</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Grant Coins */}
            <ActionForm
              title="Kasih Coin"
              icon={Coins}
              accent="primary"
              action={`/api/admin/users/${user.id}/grant-coins`}
              fields={
                <>
                  <input name="amount" type="number" min={1} max={100000} placeholder="Jumlah coin (mis 100)"
                    className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm" required />
                  <input name="reason" type="text" placeholder="Alasan (opsional, mis 'hadiah event')" maxLength={200}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm" />
                </>
              }
              submitLabel="Kirim Coin"
            />

            {/* Send Warning */}
            <ActionForm
              title="Kirim Warning"
              icon={Flag}
              accent="amber"
              action={`/api/admin/users/${user.id}/warn`}
              fields={
                <textarea name="message" placeholder="Pesan peringatan ke user..." maxLength={500} rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm resize-y" required />
              }
              submitLabel="Kirim Warning"
            />

            {/* Verify */}
            <form action={`/api/admin/users/${user.id}/verify`} method="POST" className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-bold">
                <BadgeCheck className="size-4 text-[var(--primary)]" /> Verifikasi User
              </div>
              <p className="text-xs text-[var(--muted)] mb-3">Status: {user.isVerified ? <strong className="text-[var(--primary)]">Terverifikasi</strong> : "Belum"}</p>
              <input type="hidden" name="value" value={user.isVerified ? "false" : "true"} />
              <button className="w-full h-9 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold flex items-center justify-center gap-2">
                {user.isVerified ? <><BadgeX className="size-3.5" /> Cabut Verifikasi</> : <><BadgeCheck className="size-3.5" /> Tandai Verified</>}
              </button>
            </form>

            {/* Change Role */}
            <form action={`/api/admin/users/${user.id}/role`} method="POST" className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3">
              <div className="flex items-center gap-2 mb-2 text-sm font-bold">
                <Crown className="size-4 text-amber-400" /> Ubah Role
              </div>
              <select name="role" defaultValue={user.role} className="w-full h-9 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] outline-none text-sm mb-2">
                <option value="reader">Reader</option>
                <option value="writer">Writer</option>
                <option value="admin">Admin (HATI-HATI)</option>
              </select>
              <button className="w-full h-9 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-semibold">
                Set Role
              </button>
            </form>
          </div>

          {/* DANGER ZONE */}
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
              <ShieldAlert className="size-4" /> Danger Zone
            </h3>
            <form action={`/api/admin/users/${user.id}/ban`} method="POST">
              <input type="hidden" name="value" value={user.isBanned ? "false" : "true"} />
              <button className={`h-10 px-5 rounded-full text-sm font-bold transition ${user.isBanned ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"}`}>
                {user.isBanned ? "Cabut Ban" : "Ban User"}
              </button>
              <p className="text-[11px] text-[var(--muted)] mt-2">
                {user.isBanned
                  ? "User saat ini terlarang komentar/publish. Klik untuk cabut."
                  : "User terbanned tidak bisa komentar atau publish. Bisa di-cabut kapan saja."}
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Recent novels */}
      {user.novels.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3 text-sm">Cerita Terbaru</h2>
          <ul className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {user.novels.map((n) => (
              <li key={n.slug}>
                <Link href={`/novel/${n.slug}`} target="_blank" className="flex items-center gap-3 p-3 hover:bg-[var(--surface-2)] transition">
                  <PenLine className="size-4 text-[var(--muted)]" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{n.title}</div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {n._count.chapters} bab · {formatNumber(n.views)} dibaca
                      {!n.publishedAt && <span className="text-amber-400"> · DRAFT</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Warning history */}
      {user.notifications.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3 text-sm flex items-center gap-2"><Flag className="size-4 text-amber-400" /> Warnings ({user.notifications.length})</h2>
          <ul className="rounded-xl border border-amber-500/30 bg-amber-500/5 divide-y divide-amber-500/20">
            {user.notifications.map((n) => (
              <li key={n.id} className="p-3 text-sm">
                <div className="text-amber-400 font-semibold">{n.title}</div>
                {n.body && <p className="text-xs text-[var(--muted)] mt-1">{n.body}</p>}
                <div className="text-[10px] text-[var(--muted)] mt-1">{new Date(n.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent transactions */}
      {user.transactions.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3 text-sm">Transaksi Coin (10 terakhir)</h2>
          <ul className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] text-xs">
            {user.transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between p-2.5">
                <span className="text-[var(--muted)]">
                  <strong className="text-foreground">{t.kind}</strong> {t.reference ? `· ${t.reference.slice(0, 20)}...` : ""}
                </span>
                <span className={`font-bold ${t.amount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount} coin
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, highlight, alert }: { icon: React.ElementType; label: string; value: string | number; highlight?: boolean; alert?: boolean }) {
  return (
    <div className={`rounded-xl bg-[var(--surface)] border p-3 ${alert ? "border-red-500/40" : highlight ? "border-[var(--primary)]" : "border-[var(--border)]"}`}>
      <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] uppercase tracking-widest font-bold">
        <Icon className="size-3" /> {label}
      </div>
      <div className={`text-xl md:text-2xl font-black mt-1 ${highlight ? "text-[var(--primary)]" : alert ? "text-red-400" : ""}`}>{value}</div>
    </div>
  );
}

function ActionForm({
  title, icon: Icon, accent, action, fields, submitLabel,
}: {
  title: string;
  icon: React.ElementType;
  accent: "primary" | "amber" | "red";
  action: string;
  fields: React.ReactNode;
  submitLabel: string;
}) {
  const colors = accent === "primary"
    ? { iconColor: "text-[var(--primary)]", btn: "bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)]" }
    : accent === "amber"
    ? { iconColor: "text-amber-400", btn: "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" }
    : { iconColor: "text-red-400", btn: "bg-red-500/20 text-red-400 hover:bg-red-500/30" };

  return (
    <form action={action} method="POST" className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Icon className={`size-4 ${colors.iconColor}`} /> {title}
      </div>
      {fields}
      <button className={`w-full h-9 rounded-full text-xs font-semibold ${colors.btn}`}>{submitLabel}</button>
    </form>
  );
}


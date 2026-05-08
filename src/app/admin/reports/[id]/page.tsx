import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, EyeOff, UserX, Check, X } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const r = await db.report.findUnique({
    where: { id },
    include: {
      reporter: { select: { username: true, displayName: true, email: true } },
      reportedUser: { select: { username: true, displayName: true, email: true, isBanned: true } },
    },
  });
  if (!r) notFound();

  // load target detail
  let targetDetail: { type: string; preview: string; link?: string } = { type: r.targetType, preview: "(not found)" };
  if (r.targetType === "comment") {
    const c = await db.comment.findUnique({
      where: { id: r.targetId },
      include: { novel: { select: { slug: true } }, chapter: { select: { number: true, novel: { select: { slug: true } } } } },
    });
    if (c) {
      const link = c.chapter ? `/novel/${c.chapter.novel.slug}/read/${c.chapter.number}` : c.novel ? `/novel/${c.novel.slug}` : undefined;
      targetDetail = { type: c.isHidden ? "comment (hidden)" : "comment", preview: c.body, link };
    }
  } else if (r.targetType === "novel") {
    const n = await db.novel.findUnique({ where: { id: r.targetId } });
    if (n) targetDetail = { type: "novel", preview: `${n.title} — ${n.synopsis.slice(0, 200)}`, link: `/novel/${n.slug}` };
  }

  async function resolve(formData: FormData) {
    "use server";
    const action = String(formData.get("action") || "");
    const u = await getCurrentUser();
    if (!u || u.role !== "admin") redirect("/login");
    const cur = await db.report.findUnique({ where: { id } });
    if (!cur) return;

    if (action === "hide_comment" && cur.targetType === "comment") {
      await db.comment.update({ where: { id: cur.targetId }, data: { isHidden: true } });
    }
    if (action === "ban_user" && cur.reportedUserId) {
      await db.user.update({ where: { id: cur.reportedUserId }, data: { isBanned: true } });
    }
    if (action === "unpublish_novel" && cur.targetType === "novel") {
      await db.novel.update({ where: { id: cur.targetId }, data: { publishedAt: null } });
    }

    const status = action === "dismiss" ? "dismissed" : "resolved";
    await db.report.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolverNote: action,
      },
    });
    redirect("/admin");
  }

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Admin
      </Link>

      <h1 className="text-2xl font-black mb-2">Laporan #{r.id.slice(0, 8)}</h1>
      <div className="flex items-center gap-2 mb-6">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${r.status === "pending" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>{r.status}</span>
        <span className="text-xs text-[var(--muted)]">{r.reason}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-2">Pelapor</div>
          <div className="font-semibold">{r.reporter.displayName}</div>
          <div className="text-xs text-[var(--muted)]">{r.reporter.email}</div>
        </div>
        {r.reportedUser && (
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-2">Pemilik Konten</div>
            <div className="font-semibold">{r.reportedUser.displayName}</div>
            <div className="text-xs text-[var(--muted)]">{r.reportedUser.email}</div>
            {r.reportedUser.isBanned && <div className="text-xs text-red-400 mt-1">⚠ Sudah dibanned</div>}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 mb-6">
        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-2">Konten yang dilaporkan ({targetDetail.type})</div>
        <p className="text-sm whitespace-pre-wrap">"{targetDetail.preview}"</p>
        {targetDetail.link && (
          <Link href={targetDetail.link} target="_blank" className="text-xs text-[var(--primary)] mt-2 inline-block hover:underline">Lihat di site →</Link>
        )}
      </div>

      {r.detail && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 mb-6">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-2">Catatan Pelapor</div>
          <p className="text-sm">{r.detail}</p>
        </div>
      )}

      {r.status === "pending" && (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <h3 className="font-bold mb-3">Tindakan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {r.targetType === "comment" && (
              <form action={resolve}>
                <input type="hidden" name="action" value="hide_comment" />
                <button className="w-full h-10 rounded-lg bg-amber-500/20 text-amber-400 font-semibold text-sm hover:bg-amber-500/30 inline-flex items-center justify-center gap-2 transition">
                  <EyeOff className="size-4" /> Sembunyikan Komentar
                </button>
              </form>
            )}
            {r.targetType === "novel" && (
              <form action={resolve}>
                <input type="hidden" name="action" value="unpublish_novel" />
                <button className="w-full h-10 rounded-lg bg-amber-500/20 text-amber-400 font-semibold text-sm hover:bg-amber-500/30 inline-flex items-center justify-center gap-2 transition">
                  <EyeOff className="size-4" /> Unpublish Novel
                </button>
              </form>
            )}
            {r.reportedUserId && !r.reportedUser?.isBanned && (
              <form action={resolve}>
                <input type="hidden" name="action" value="ban_user" />
                <button className="w-full h-10 rounded-lg bg-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/30 inline-flex items-center justify-center gap-2 transition">
                  <UserX className="size-4" /> Banned User
                </button>
              </form>
            )}
            <form action={resolve}>
              <input type="hidden" name="action" value="resolve" />
              <button className="w-full h-10 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/30 inline-flex items-center justify-center gap-2 transition">
                <Check className="size-4" /> Tandai Selesai
              </button>
            </form>
            <form action={resolve}>
              <input type="hidden" name="action" value="dismiss" />
              <button className="w-full h-10 rounded-lg bg-[var(--surface-2)] text-[var(--muted)] font-semibold text-sm hover:text-foreground inline-flex items-center justify-center gap-2 transition">
                <X className="size-4" /> Abaikan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

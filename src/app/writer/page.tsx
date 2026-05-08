import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus, BookOpen, Eye, Star, FileText, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WriterHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/writer");

  const novels = await db.novel.findMany({
    where: { authorId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { chapters: true } } },
  });

  const totalChapters = novels.reduce((sum, n) => sum + n._count.chapters, 0);
  const totalViews = novels.reduce((sum, n) => sum + n.views, 0);

  return (
    <div className="px-4 md:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Writer Studio</h1>
          <p className="text-[var(--muted)] mt-1">Tulis, edit, dan rilis cerita kamu.</p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <Link
            href="/writer/analytics"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold hover:border-[var(--primary)] transition"
          >
            Analytics
          </Link>
          <Link
            href="/writer/new"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            <Plus className="size-4" /> Cerita Baru
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Cerita</div>
          <div className="text-2xl md:text-3xl font-black mt-1">{novels.length}</div>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Total Bab</div>
          <div className="text-2xl md:text-3xl font-black mt-1">{totalChapters}</div>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">Total Dibaca</div>
          <div className="text-2xl md:text-3xl font-black mt-1">{formatNumber(totalViews)}</div>
        </div>
      </div>

      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-3">Cerita Saya</h2>

      {novels.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-10 text-center">
          <FileText className="size-10 mx-auto mb-3 text-[var(--muted)]" />
          <h3 className="text-lg font-bold mb-1">Belum ada cerita</h3>
          <p className="text-sm text-[var(--muted)] mb-5">Mulai cerita pertamamu hari ini. Coin pertama kamu akan kamu dapatkan saat ada pembaca pertama.</p>
          <Link
            href="/writer/new"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            <Plus className="size-4" /> Tulis Cerita Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {novels.map((n) => (
            <Link
              key={n.id}
              href={`/writer/${n.slug}`}
              className="group flex gap-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] p-3 transition"
            >
              <div className="relative w-20 aspect-[2/3] rounded-lg overflow-hidden shrink-0 bg-[var(--surface-2)]">
                {n.coverUrl && <Image src={n.coverUrl} alt={n.title} fill sizes="80px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold line-clamp-1 group-hover:text-[var(--primary)] transition">{n.title}</h3>
                  <ArrowRight className="size-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${n.publishedAt ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {n.publishedAt ? "Tayang" : "Draft"}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">·</span>
                  <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">{n.status}</span>
                </div>
                <p className="text-xs text-[var(--muted)] line-clamp-2 mt-2">{n.synopsis}</p>
                <div className="mt-auto pt-2 flex items-center gap-3 text-[11px] text-[var(--muted)]">
                  <span className="flex items-center gap-1"><BookOpen className="size-3" /> {n._count.chapters} bab</span>
                  <span className="flex items-center gap-1"><Eye className="size-3" /> {formatNumber(n.views)}</span>
                  <span className="flex items-center gap-1"><Star className="size-3" /> {n.rating.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

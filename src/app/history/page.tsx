import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { History as HistoryIcon, BookOpen, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/history");

  const history = await db.readingHistory.findMany({
    where: { userId: user.id },
    include: { novel: { include: { _count: { select: { chapters: true } } } } },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
        <HistoryIcon className="size-7" /> History
      </h1>
      <p className="text-[var(--muted)] mt-1 mb-8">Riwayat baca kamu, terbaru di atas.</p>

      {history.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-10 text-center">
          <HistoryIcon className="size-10 mx-auto mb-3 text-[var(--muted)]" />
          <h3 className="text-lg font-bold mb-1">Belum ada riwayat</h3>
          <p className="text-sm text-[var(--muted)] mb-5">Mulai baca novel apa saja, history kamu akan muncul di sini.</p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            Jelajah Novel
          </Link>
        </div>
      ) : (
        <ul className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
          {history.map((h) => {
            const totalChapters = h.novel._count.chapters;
            const progress = totalChapters > 0 ? Math.round((h.lastChapter / totalChapters) * 100) : 0;
            return (
              <li key={h.id}>
                <Link
                  href={`/novel/${h.novel.slug}/read/${h.lastChapter}`}
                  className="flex gap-3 p-3 hover:bg-[var(--surface-2)] transition"
                >
                  <div className="relative w-14 aspect-[2/3] rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                    {h.novel.coverUrl && <Image src={h.novel.coverUrl} alt={h.novel.title} fill sizes="56px" className="object-cover" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{h.novel.title}</h3>
                    <div className="text-xs text-[var(--muted)] flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><BookOpen className="size-3" /> Bab {h.lastChapter} dari {totalChapters}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" /> {new Date(h.updatedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="text-[10px] text-[var(--muted)] mt-1">{progress}% selesai</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

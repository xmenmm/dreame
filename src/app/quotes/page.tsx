import Link from "next/link";
import { redirect } from "next/navigation";
import { Quote as QuoteIcon, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { QuoteCard } from "@/components/quotes/quote-card";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/quotes");

  const quotes = await db.quote.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      novel: { select: { slug: true, title: true, coverUrl: true, author: { select: { displayName: true } } } },
      chapter: { select: { number: true, title: true } },
    },
  });

  // group by novel for cleaner UI
  const grouped = new Map<string, typeof quotes>();
  for (const q of quotes) {
    const key = q.novelId;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(q);
  }

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3 mb-1">
        <QuoteIcon className="size-7 text-[var(--primary)]" /> Quote Tersimpan
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Kalimat favorit yang kamu highlight dari berbagai bab. Total {quotes.length} quote.
      </p>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-16 text-center">
          <QuoteIcon className="size-10 mx-auto mb-3 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)] mb-4">
            Belum ada quote. Saat baca novel, <strong>seleksi teks</strong> di chapter — tombol "Save quote" akan muncul.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            <BookOpen className="size-4" /> Mulai Baca
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {[...grouped.entries()].map(([novelId, items]) => {
            const n = items[0].novel;
            return (
              <div key={novelId}>
                <Link
                  href={`/novel/${n.slug}`}
                  className="group flex items-center gap-3 mb-4 hover:opacity-80 transition"
                >
                  <div className="size-10 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.coverUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-lg leading-tight truncate group-hover:text-[var(--primary)] transition">{n.title}</div>
                    <div className="text-xs text-[var(--muted)]">oleh {n.author.displayName} · {items.length} quote</div>
                  </div>
                </Link>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((q) => (
                    <QuoteCard
                      key={q.id}
                      id={q.id}
                      body={q.body}
                      chapterNumber={q.chapter.number}
                      chapterTitle={q.chapter.title}
                      novelSlug={n.slug}
                      novelTitle={n.title}
                      author={n.author.displayName}
                      createdAt={q.createdAt.toISOString()}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { db } from "@/lib/db";
import { NovelCard, type NovelCardData } from "@/components/novel/novel-card";

export const dynamic = "force-dynamic";

export default async function DiscoverPage({
  searchParams,
}: { searchParams: Promise<{ sort?: string; genre?: string }> }) {
  const { sort = "trending", genre } = await searchParams;

  const orderBy =
    sort === "popular" ? [{ views: "desc" as const }] :
    sort === "new" ? [{ publishedAt: "desc" as const }] :
    [{ rating: "desc" as const }, { views: "desc" as const }];

  const [novels, genres] = await Promise.all([
    db.novel.findMany({
      where: genre ? { genres: { some: { genre: { slug: genre } } } } : undefined,
      orderBy,
      take: 60,
      include: { _count: { select: { chapters: true } } },
    }),
    db.genre.findMany({ orderBy: { name: "asc" } }),
  ]);

  const items: NovelCardData[] = novels.map((n) => ({
    slug: n.slug, title: n.title, coverUrl: n.coverUrl, rating: n.rating,
    status: n.status, chapterCount: n._count.chapters,
    publishedYear: n.publishedAt?.getFullYear() ?? new Date().getFullYear(),
  }));

  const sortLabel = sort === "popular" ? "Paling Populer" : sort === "new" ? "Baru Rilis" : "Trending";

  return (
    <div className="px-4 md:px-8 py-8">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">Discover</h1>
      <p className="text-[var(--muted)] mt-1 mb-6">Jelajahi ribuan novel original.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { v: "trending", label: "Trending" },
          { v: "popular", label: "Paling Populer" },
          { v: "new", label: "Baru Rilis" },
        ].map((s) => {
          const active = sort === s.v;
          const params = new URLSearchParams();
          params.set("sort", s.v);
          if (genre) params.set("genre", genre);
          return (
            <a
              key={s.v}
              href={`/discover?${params.toString()}`}
              className={`px-4 h-9 rounded-full text-sm font-semibold flex items-center transition ${active ? "bg-[var(--primary)] text-black" : "bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]"}`}
            >
              {s.label}
            </a>
          );
        })}
        <span className="w-px self-stretch bg-[var(--border)] mx-2" />
        <a
          href={`/discover?sort=${sort}`}
          className={`px-3 h-9 rounded-full text-xs font-semibold flex items-center transition ${!genre ? "bg-[var(--surface-2)] text-foreground" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"}`}
        >
          Semua
        </a>
        {genres.map((g) => {
          const params = new URLSearchParams();
          params.set("sort", sort);
          params.set("genre", g.slug);
          const active = genre === g.slug;
          return (
            <a key={g.id} href={`/discover?${params.toString()}`}
              className={`px-3 h-9 rounded-full text-xs font-semibold flex items-center transition ${active ? "bg-[var(--surface-2)] text-foreground" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-foreground"}`}>
              {g.name}
            </a>
          );
        })}
      </div>

      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4">{sortLabel} {genre ? `· ${genre}` : ""}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((n) => <NovelCard key={n.slug} novel={n} />)}
      </div>
      {items.length === 0 && <p className="text-center text-[var(--muted)] py-12">Belum ada novel di kategori ini.</p>}
    </div>
  );
}

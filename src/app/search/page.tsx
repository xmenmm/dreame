import Link from "next/link";
import { Search, SlidersHorizontal, Star } from "lucide-react";
import { db } from "@/lib/db";
import { NovelCard, type NovelCardData } from "@/components/novel/novel-card";

export const dynamic = "force-dynamic";

type SortKey = "rating" | "popular" | "new" | "chapters";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "rating", label: "Rating" },
  { key: "popular", label: "Populer" },
  { key: "new", label: "Terbaru" },
  { key: "chapters", label: "Terbanyak Bab" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Tamat" },
  { value: "hiatus", label: "Hiatus" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    status?: string;
    minRating?: string;
    freeOnly?: string;
    sort?: SortKey;
  }>;
}) {
  const sp = await searchParams;
  const query = (sp.q ?? "").trim();
  const genre = (sp.genre ?? "").trim();
  const status = (sp.status ?? "").trim();
  const minRating = parseFloat(sp.minRating ?? "0") || 0;
  const freeOnly = sp.freeOnly === "1";
  const sort: SortKey = (["rating", "popular", "new", "chapters"] as SortKey[]).includes(sp.sort as SortKey)
    ? (sp.sort as SortKey) : "rating";

  const allGenres = await db.genre.findMany({ orderBy: { name: "asc" } });

  const orderBy =
    sort === "popular"  ? [{ views: "desc" as const }, { rating: "desc" as const }] :
    sort === "new"      ? [{ publishedAt: "desc" as const }] :
    sort === "chapters" ? [{ chapters: { _count: "desc" as const } }] :
                          [{ rating: "desc" as const }, { views: "desc" as const }];

  const where: Parameters<typeof db.novel.findMany>[0]["where"] = {
    publishedAt: { not: null },
    ...(query ? {
      OR: [
        { title: { contains: query } },
        { synopsis: { contains: query } },
        { author: { displayName: { contains: query } } },
      ],
    } : {}),
    ...(genre ? { genres: { some: { genre: { slug: genre } } } } : {}),
    ...(status ? { status } : {}),
    ...(minRating > 0 ? { rating: { gte: minRating } } : {}),
    ...(freeOnly ? { freeChapters: { gte: 1 } } : {}),
  };

  const novels = await db.novel.findMany({
    where,
    orderBy,
    take: 60,
    include: { _count: { select: { chapters: true } } },
  });

  const items: NovelCardData[] = novels.map((n) => ({
    slug: n.slug, title: n.title, coverUrl: n.coverUrl, rating: n.rating,
    status: n.status, chapterCount: n._count.chapters,
    publishedYear: n.publishedAt?.getFullYear() ?? new Date().getFullYear(),
  }));

  const hasFilter = !!(query || genre || status || minRating > 0 || freeOnly);

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3 mb-1">
        <Search className="size-6" /> Pencarian
      </h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        {hasFilter ? `${items.length} novel ditemukan` : "Cari berdasarkan judul, author, atau filter genre / status / rating."}
      </p>

      {/* FILTER FORM */}
      <form method="GET" className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 md:p-5 mb-6 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Query */}
        <div className="md:col-span-4">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-1">Cari</label>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Judul, sinopsis, atau author..."
            className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
          />
        </div>

        {/* Genre */}
        <div className="md:col-span-3">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-1">Genre</label>
          <select
            name="genre"
            defaultValue={genre}
            className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
          >
            <option value="">Semua genre</option>
            {allGenres.map((g) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-1">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Min rating */}
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-1 flex items-center gap-1">
            <Star className="size-3" /> Min rating
          </label>
          <select
            name="minRating"
            defaultValue={String(minRating)}
            className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
          >
            <option value="0">Apa saja</option>
            <option value="3">3.0+</option>
            <option value="3.5">3.5+</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
          </select>
        </div>

        {/* Sort */}
        <div className="md:col-span-1">
          <label className="block text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-1">Urut</label>
          <select
            name="sort"
            defaultValue={sort}
            className="w-full h-10 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Free + buttons */}
        <div className="md:col-span-12 flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-[var(--border)]">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="freeOnly"
              value="1"
              defaultChecked={freeOnly}
              className="size-4 accent-[var(--primary)]"
            />
            Punya bab gratis
          </label>
          <div className="flex gap-2">
            <Link
              href="/search"
              className="h-10 px-4 rounded-full bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold inline-flex items-center transition"
            >
              Reset
            </Link>
            <button
              type="submit"
              className="h-10 px-6 rounded-full bg-[var(--primary)] text-black font-bold text-sm inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] transition"
            >
              <SlidersHorizontal className="size-4" /> Terapkan Filter
            </button>
          </div>
        </div>
      </form>

      {/* RESULTS */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((n) => <NovelCard key={n.slug} novel={n} />)}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-16 text-center text-sm text-[var(--muted)]">
          {hasFilter ? "Tidak ada novel cocok. Coba longgarkan filter." : "Mulai cari di atas."}
        </div>
      )}
    </div>
  );
}

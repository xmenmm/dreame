import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GenresPage() {
  const genres = await db.genre.findMany({
    include: { _count: { select: { novels: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="px-4 md:px-8 py-8">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight">Genre</h1>
      <p className="text-[var(--muted)] mt-1 mb-8">Telusuri novel berdasarkan kategori favoritmu.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {genres.map((g) => (
          <Link
            key={g.id}
            href={`/discover?genre=${g.slug}`}
            className="group rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] p-6 transition"
          >
            <div className="text-2xl font-black mb-1 group-hover:text-[var(--primary)] transition">{g.name}</div>
            <div className="text-xs text-[var(--muted)]">{g._count.novels} novel</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

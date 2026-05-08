import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Mobile API: GET /api/novels?sort=trending|popular|new&genre=slug&q=query&page=1
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") ?? "trending";
  const genre = url.searchParams.get("genre");
  const q = url.searchParams.get("q");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const perPage = 20;

  const orderBy =
    sort === "popular" ? [{ views: "desc" as const }] :
    sort === "new" ? [{ publishedAt: "desc" as const }] :
    [{ rating: "desc" as const }, { views: "desc" as const }];

  const where: Parameters<typeof db.novel.findMany>[0] extends { where?: infer W } ? W : never = {
    ...(genre ? { genres: { some: { genre: { slug: genre } } } } : {}),
    ...(q ? { OR: [
      { title: { contains: q } },
      { synopsis: { contains: q } },
    ] } : {}),
  };

  const [novels, total] = await Promise.all([
    db.novel.findMany({
      where, orderBy,
      skip: (page - 1) * perPage, take: perPage,
      include: {
        author: { select: { username: true, displayName: true, avatarUrl: true } },
        genres: { include: { genre: true } },
        _count: { select: { chapters: true } },
      },
    }),
    db.novel.count({ where }),
  ]);

  return NextResponse.json({
    page, perPage, total,
    items: novels.map((n) => ({
      id: n.id,
      slug: n.slug,
      title: n.title,
      synopsis: n.synopsis,
      coverUrl: n.coverUrl,
      bannerUrl: n.bannerUrl,
      status: n.status,
      rating: n.rating,
      ratingCount: n.ratingCount,
      views: n.views,
      chapterCount: n._count.chapters,
      coinPerChapter: n.coinPerChapter,
      freeChapters: n.freeChapters,
      genres: n.genres.map((g) => ({ slug: g.genre.slug, name: g.genre.name })),
      author: n.author,
      publishedAt: n.publishedAt,
    })),
  });
}

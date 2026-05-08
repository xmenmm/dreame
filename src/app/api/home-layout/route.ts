import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getHomeLayout } from "@/lib/site-config";
import type { NovelCardData } from "@/components/novel/novel-card";

export const dynamic = "force-dynamic";

// PUBLIC endpoint — Flutter app & web both consume this.
// Returns the home layout config + pre-resolved data for each section so mobile clients
// can render without making N additional calls.

export async function GET() {
  const layout = await getHomeLayout();
  const visible = layout.sections.filter((s) => s.visible !== false);

  const sections = await Promise.all(visible.map(async (s) => {
    if (s.type === "hero") {
      let novel = null;
      if (s.novelSlug) {
        novel = await db.novel.findUnique({
          where: { slug: s.novelSlug },
          include: { author: { select: { username: true, displayName: true } }, _count: { select: { chapters: true } } },
        });
      }
      if (!novel) {
        novel = s.auto === "trending"
          ? await db.novel.findFirst({
              where: { publishedAt: { not: null } },
              orderBy: [{ views: "desc" }, { rating: "desc" }],
              include: { author: { select: { username: true, displayName: true } }, _count: { select: { chapters: true } } },
            })
          : await db.novel.findFirst({
              where: { isFeatured: true, publishedAt: { not: null } },
              orderBy: { rating: "desc" },
              include: { author: { select: { username: true, displayName: true } }, _count: { select: { chapters: true } } },
            });
      }
      return { ...s, hero: novel };
    }

    if (s.type === "carousel") {
      const orderBy =
        s.sort === "popular" ? [{ views: "desc" as const }] :
        s.sort === "new"     ? [{ publishedAt: "desc" as const }] :
        s.sort === "featured" ? [{ isFeatured: "desc" as const }, { rating: "desc" as const }] :
        [{ rating: "desc" as const }, { views: "desc" as const }];

      const novels = await db.novel.findMany({
        where: {
          publishedAt: { not: null },
          ...(s.genreSlug ? { genres: { some: { genre: { slug: s.genreSlug } } } } : {}),
        },
        orderBy,
        take: 12,
        include: { author: { select: { username: true, displayName: true } }, _count: { select: { chapters: true } } },
      });
      return { ...s, novels };
    }

    if (s.type === "recommendations") {
      // Personalized recs require user context — return empty array, mobile/web will fetch separately
      return { ...s, novels: [] as NovelCardData[] };
    }

    return s;
  }));

  return NextResponse.json({ sections });
}

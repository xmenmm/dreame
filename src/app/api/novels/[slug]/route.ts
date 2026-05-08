import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const novel = await db.novel.findUnique({
    where: { slug },
    include: {
      author: { select: { username: true, displayName: true, avatarUrl: true, bio: true } },
      genres: { include: { genre: true } },
      chapters: {
        where: { isPublished: true },
        orderBy: { number: "asc" },
        select: { id: true, number: true, title: true, wordCount: true, publishedAt: true },
      },
    },
  });
  if (!novel) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    ...novel,
    genres: novel.genres.map((g) => ({ slug: g.genre.slug, name: g.genre.name })),
  });
}

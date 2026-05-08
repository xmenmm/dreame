import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateChapter, compressStorySoFar, type StoryContext, type NovelMeta } from "@/lib/ai-novelist";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

const Schema = z.object({
  novelSlug: z.string(),
  chapterNumber: z.number().int().min(1).max(50),
  tone: z.enum(["dramatic", "light", "romantic", "dark", "mysterious", "comedic"]).default("dramatic"),
  hint: z.string().max(300).optional(),
});

// Get last 2-3 sentences of text (after stripping markdown image+headers)
function extractLastSentences(content: string, count = 3): string {
  const stripped = content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/^#+\s+.*$/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/---/g, "")
    .trim();
  const sentences = stripped.split(/(?<=[.!?])\s+/).filter((s) => s.length > 5);
  return sentences.slice(-count).join(" ").slice(0, 600);
}

// Quick summary: first 30 words of chapter (after stripping)
function quickSummary(content: string): string {
  const stripped = content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/^#+\s+.*$/gm, "")
    .replace(/[*_`]/g, "")
    .replace(/---/g, "")
    .trim();
  return stripped.split(/\s+/).slice(0, 30).join(" ").slice(0, 250);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { novelSlug, chapterNumber, tone, hint } = parsed.data;

  const novel = await db.novel.findUnique({
    where: { slug: novelSlug },
    include: {
      author: true,
      genres: { include: { genre: true } },
      chapters: {
        where: { number: { lt: chapterNumber } },
        orderBy: { number: "asc" },
        select: { number: true, title: true, content: true },
      },
    },
  });
  if (!novel) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (novel.authorId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const meta: NovelMeta = {
    title: novel.title,
    synopsis: novel.synopsis,
    protagonist: hint || "(berdasarkan bab sebelumnya)",
    setting: "(berdasarkan bab sebelumnya)",
    centralConflict: novel.synopsis,
    coverPrompt: "",
  };

  // Build context from existing chapters
  let context: StoryContext | undefined;
  if (chapterNumber > 1 && novel.chapters.length > 0) {
    const summaries = novel.chapters.map((c) => `Bab ${c.number} ("${c.title}"): ${quickSummary(c.content)}`);
    const lastChapter = novel.chapters[novel.chapters.length - 1];
    context = {
      storySoFar: compressStorySoFar(summaries),
      lastEnding: extractLastSentences(lastChapter.content, 3),
      knownCharacters: [],
      unresolvedThreads: hint ? [hint] : [],
    };
  }

  const language: "id" | "en" = novel.language === "en" ? "en" : "id";
  const totalGuess = Math.max(chapterNumber, novel.chapters.length + 5);

  try {
    const draft = await generateChapter({
      meta,
      genres: novel.genres.map((g) => g.genre.name),
      tone, language,
      chapterNumber, totalChapters: totalGuess,
      context,
    });

    return NextResponse.json({
      title: draft.title,
      content: draft.content,
      imagePrompt: draft.imagePrompt,
      summary: draft.summary,
    });
  } catch (e) {
    return NextResponse.json({ error: "ai_failed", detail: String(e).slice(0, 200) }, { status: 502 });
  }
}

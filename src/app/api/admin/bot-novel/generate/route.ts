import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import {
  generateNovelMeta, generateChapter, compressStorySoFar,
  isValidChapterDraft, isValidNovelMeta,
  templateNovelMeta, templateChapter,
  type GenerateInput, type StoryContext,
} from "@/lib/ai-novelist";
import { pickCover, pickBanner, pickChapterScene } from "@/lib/photo-pool";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function ensureBotUser() {
  const existing = await db.user.findUnique({ where: { username: "dreame_ai" } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  return db.user.create({
    data: {
      email: "ai@dreame.local",
      username: "dreame_ai",
      passwordHash,
      displayName: "Lentera AI Storyteller",
      bio: "Cerita yang dirajut oleh AI. Tiap bab dilukis ulang oleh imaginasi mesin.",
      role: "writer",
      isVerified: true,
      coinBalance: 0,
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as GenerateInput;
  const chapters = Math.max(3, Math.min(15, body.chapterCount || 5));
  const input: GenerateInput = {
    genres: body.genres,
    tone: body.tone,
    language: body.language,
    theme: body.theme,
    chapterCount: chapters,
  };

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ kind: "status", message: "Menyiapkan author bot..." });
        const author = await ensureBotUser();

        send({ kind: "status", message: "Bot mengarang konsep cerita & story bible..." });
        let meta;
        let metaAttempts = 0;
        let usedFallback = false;
        while (metaAttempts < 3) {
          try {
            const m = await generateNovelMeta(input);
            if (!isValidNovelMeta(m)) {
              throw new Error("AI mengembalikan konsep tidak lengkap.");
            }
            meta = m;
            break;
          } catch (e) {
            metaAttempts += 1;
            const isRateLimit = String(e).includes("rate-limit") || String(e).includes("429");
            if (metaAttempts >= 3) {
              // FALLBACK: pakai template (no AI) — bot tetap berhasil generate sesuatu
              send({
                kind: "warning",
                message: isRateLimit
                  ? "AI rate-limit / gagal 3x. Pakai template fallback (no AI) buat konsep."
                  : `AI gagal 3x: ${String(e).slice(0, 80)}. Pakai template fallback.`,
              });
              meta = templateNovelMeta(input);
              usedFallback = true;
              break;
            }
            const waitMs = isRateLimit ? 20_000 : 4_000;
            send({ kind: "status", message: `Konsep gagal, retry (${metaAttempts}/3) — tunggu ${waitMs / 1000}s${isRateLimit ? " (rate-limit)" : ""}...` });
            await new Promise((r) => setTimeout(r, waitMs));
          }
        }
        if (!meta) return;

        send({ kind: "meta-ready", title: meta.title, protagonist: meta.protagonist, setting: meta.setting });

        let baseSlug = slugify(meta.title) || `ai-${Date.now()}`;
        let slug = baseSlug;
        let suffix = 1;
        while (await db.novel.findUnique({ where: { slug } })) {
          suffix += 1;
          slug = `${baseSlug}-${suffix}`;
        }

        send({ kind: "status", message: "Memilih cover..." });
        // Pakai Unsplash curated pool — selalu loading, gak akan rate-limit kayak Pollinations
        const seed = `${meta.title}-${input.genres.join("-")}`;
        const coverUrl = pickCover(input.genres, seed);
        const bannerUrl = pickBanner(seed);

        const genreRows = await db.genre.findMany({
          where: { name: { in: input.genres } },
        });

        const novel = await db.novel.create({
          data: {
            slug,
            title: meta.title,
            synopsis: meta.synopsis,
            coverUrl, bannerUrl,
            status: "ongoing",
            language: input.language,
            contentRating: "everyone",
            authorId: author.id,
            freeChapters: 3,
            coinPerChapter: 2,
            isFeatured: false,
            publishedAt: null,
            genres: { create: genreRows.map((g) => ({ genreId: g.id })) },
          },
        });

        send({ kind: "novel-created", id: novel.id, slug: novel.slug, title: meta.title, coverUrl });

        // Story context — accumulates across chapters
        const summaries: string[] = [];
        const knownCharacters: Set<string> = new Set();
        // Seed protagonist as known
        if (meta.protagonist) {
          const protagName = meta.protagonist.split(/[,\s—\-:]/)[0].trim();
          if (protagName) knownCharacters.add(protagName);
        }
        const unresolvedThreads: string[] = [];
        let lastEnding = "";

        for (let n = 1; n <= chapters; n++) {
          // Pause between chapters to avoid hammering Pollinations rate-limit
          if (n > 1) {
            send({ kind: "status", message: "Jeda 5 detik biar Pollinations gak rate-limit..." });
            await new Promise((r) => setTimeout(r, 5000));
          }

          send({
            kind: "status",
            message: `Menulis bab ${n}/${chapters}${n > 1 ? " (melanjutkan dari bab sebelumnya)" : ""}...`,
          });

          const ctx: StoryContext | undefined = n === 1 ? undefined : {
            storySoFar: compressStorySoFar(summaries),
            lastEnding,
            knownCharacters: Array.from(knownCharacters),
            unresolvedThreads: unresolvedThreads.slice(-5),
          };

          let draft;
          let attempts = 0;
          while (attempts < 3) {
            try {
              const d = await generateChapter({
                meta, genres: input.genres, tone: input.tone, language: input.language,
                chapterNumber: n, totalChapters: chapters, context: ctx,
              });
              if (!isValidChapterDraft(d)) {
                throw new Error("AI output incomplete.");
              }
              draft = d;
              break;
            } catch (e) {
              attempts += 1;
              const isRateLimit = String(e).includes("rate-limit") || String(e).includes("429");
              if (attempts >= 3) {
                // FALLBACK: template chapter (no AI)
                send({
                  kind: "warning",
                  message: `Bab ${n} AI gagal 3x → pakai template fallback. ${isRateLimit ? "(rate-limit)" : `(${String(e).slice(0, 50)})`}`,
                });
                draft = templateChapter({
                  meta,
                  chapterNumber: n,
                  totalChapters: chapters,
                  language: input.language,
                });
                break;
              }
              const waitMs = isRateLimit ? 20_000 : 4_000;
              send({ kind: "status", message: `Bab ${n} retry (${attempts}/3) — tunggu ${waitMs / 1000}s${isRateLimit ? " (rate-limit)" : ""}...` });
              await new Promise((r) => setTimeout(r, waitMs));
            }
          }
          if (!draft) continue;

          // Pakai Unsplash scene per bab — deterministic, selalu loading
          const sceneImg = pickChapterScene(novel.slug, n);
          const contentWithImage = `![Bab ${n}](${sceneImg})\n\n${draft.content}`;
          const wordCount = contentWithImage
            .replace(/[#*_`>!\[\]()]/g, " ")
            .split(/\s+/).filter(Boolean).length;

          await db.chapter.create({
            data: {
              novelId: novel.id,
              number: n,
              title: draft.title,
              content: contentWithImage,
              wordCount,
              isPublished: true,
              publishedAt: new Date(),
            },
          });

          // Update context for next chapter
          summaries.push(draft.summary);
          lastEnding = draft.ending || draft.summary;
          (draft.newCharacters || []).forEach((c) => c && knownCharacters.add(c.trim()));
          // Replace unresolved threads with the new list (model curates)
          if (draft.unresolvedThreads && draft.unresolvedThreads.length > 0) {
            unresolvedThreads.length = 0;
            unresolvedThreads.push(...draft.unresolvedThreads.filter(Boolean));
          }

          send({
            kind: "chapter",
            number: n,
            title: draft.title,
            summary: draft.summary,
            knownCharacters: Array.from(knownCharacters),
          });
        }

        await db.novel.update({
          where: { id: novel.id },
          data: { publishedAt: new Date() },
        });

        send({
          kind: "done",
          slug: novel.slug,
          title: meta.title,
          message: usedFallback
            ? "Selesai! (Sebagian pakai template fallback karena AI sibuk — quality basic, tapi novel siap di-edit/expand di Writer Studio.)"
            : "Selesai! Novel siap dibaca, semua bab nyambung satu sama lain.",
        });
      } catch (e) {
        send({ kind: "error", message: String(e).slice(0, 300) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

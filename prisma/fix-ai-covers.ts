import { PrismaClient } from "@prisma/client";
import { pickCover, pickBanner, pickChapterScene } from "../src/lib/photo-pool";

const db = new PrismaClient();

async function main() {
  const aiBot = await db.user.findUnique({ where: { username: "dreame_ai" } });
  if (!aiBot) { console.log("No AI bot user yet, nothing to fix."); return; }

  const novels = await db.novel.findMany({
    where: { authorId: aiBot.id },
    include: { genres: { include: { genre: true } }, chapters: true },
  });

  console.log(`Found ${novels.length} AI-generated novels to fix.`);

  for (const n of novels) {
    const genres = n.genres.map((g) => g.genre.name);
    const seed = `${n.title}-${genres.join("-")}`;
    const newCover = pickCover(genres, seed);
    const newBanner = pickBanner(seed);

    await db.novel.update({
      where: { id: n.id },
      data: { coverUrl: newCover, bannerUrl: newBanner },
    });

    // Update chapters: replace `![Bab N](pollinations_url)` with Unsplash scene
    for (const c of n.chapters) {
      const newSceneImg = pickChapterScene(n.slug, c.number);
      const updated = c.content.replace(
        /^!\[Bab \d+\]\([^)]+\)/m,
        `![Bab ${c.number}](${newSceneImg})`,
      );
      // Also handle case where there's no leading image — prepend one
      const finalContent = updated === c.content && !c.content.startsWith("![")
        ? `![Bab ${c.number}](${newSceneImg})\n\n${c.content}`
        : updated;
      await db.chapter.update({
        where: { id: c.id },
        data: { content: finalContent },
      });
    }

    console.log(`✓ Fixed: ${n.title} (${n.chapters.length} chapters)`);
  }
  console.log("Done.");
}

main().finally(() => db.$disconnect());

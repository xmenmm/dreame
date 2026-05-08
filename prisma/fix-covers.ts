import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const COVERS_BY_VIBE: Record<string, string[]> = {
  romance: [
    "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=600&q=80",
    "https://images.unsplash.com/photo-1490723286627-4b66e6b2882a?w=600&q=80",
    "https://images.unsplash.com/photo-1517022812141-23620dba5c23?w=600&q=80",
    "https://images.unsplash.com/photo-1494319827402-c4b839ce0e75?w=600&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
  ],
  fantasy: [
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=600&q=80",
    "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?w=600&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
    "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=600&q=80",
    "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=600&q=80",
  ],
  scifi: [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&q=80",
    "https://images.unsplash.com/photo-1515630278258-407f66498911?w=600&q=80",
    "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=600&q=80",
    "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=600&q=80",
  ],
  mystery: [
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80",
    "https://images.unsplash.com/photo-1502920514313-52581002a659?w=600&q=80",
    "https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=600&q=80",
    "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&q=80",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
  ],
  thriller: [
    "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=600&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
    "https://images.unsplash.com/photo-1519408469771-2586093c3f14?w=600&q=80",
    "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=600&q=80",
  ],
  horror: [
    "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=600&q=80",
    "https://images.unsplash.com/photo-1505635552518-3448ff116af3?w=600&q=80",
    "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=600&q=80",
    "https://images.unsplash.com/photo-1572731266020-1f7d02a72540?w=600&q=80",
    "https://images.unsplash.com/photo-1518370275938-7f6dffea6fa3?w=600&q=80",
  ],
  drama: [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&q=80",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80",
    "https://images.unsplash.com/photo-1527090862629-4b69aaf65ff8?w=600&q=80",
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
  ],
  action: [
    "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&q=80",
    "https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=600&q=80",
    "https://images.unsplash.com/photo-1518930259200-3e5b6c0a9b8e?w=600&q=80",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80",
  ],
  ya: [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80",
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80",
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80",
  ],
  historical: [
    "https://images.unsplash.com/photo-1509909756405-be0199881695?w=600&q=80",
    "https://images.unsplash.com/photo-1471666875520-c75081f42081?w=600&q=80",
    "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&q=80",
  ],
};

const ALL = Object.values(COVERS_BY_VIBE).flat();

function pickCoverForGenres(genres: string[]): string {
  const map: Record<string, keyof typeof COVERS_BY_VIBE> = {
    Romance: "romance", Fantasy: "fantasy", "Sci-Fi": "scifi",
    Mystery: "mystery", Thriller: "thriller", Horror: "horror",
    Drama: "drama", "Slice of Life": "drama", Action: "action",
    Adventure: "action", "Young Adult": "ya", Historical: "historical",
    Comedy: "drama",
  };
  const primary = genres[0];
  const bucket = map[primary] ? COVERS_BY_VIBE[map[primary]] : ALL;
  return bucket[Math.floor(Math.random() * bucket.length)];
}

async function main() {
  console.log("⌛ Mengupdate cover novel-novel demo (Pollinations → Unsplash kurated)...");

  const novels = await db.novel.findMany({
    where: { coverUrl: { contains: "pollinations.ai" } },
    include: { genres: { include: { genre: true } } },
  });

  console.log(`   Ditemukan ${novels.length} novel dengan cover Pollinations.`);

  let updated = 0;
  for (const n of novels) {
    const genres = n.genres.map((g) => g.genre.name);
    const newCover = pickCoverForGenres(genres);
    await db.novel.update({
      where: { id: n.id },
      data: { coverUrl: newCover, bannerUrl: newCover },
    });
    updated += 1;
  }

  console.log(`✅ Selesai. ${updated} cover di-update ke Unsplash.`);
  console.log(`   Note: AI cover generator (Pollinations) tetap tersedia di Writer Studio buat user yang nulis cerita baru.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });

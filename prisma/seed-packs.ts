import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const PACKS = [
  { slug: "starter", name: "Starter Pack", coins: 60, bonus: 0, priceIDR: 15000, sortOrder: 1 },
  { slug: "popular", name: "Popular Pack", coins: 200, bonus: 20, priceIDR: 49000, sortOrder: 2 },
  { slug: "best",    name: "Best Value", coins: 500, bonus: 80, priceIDR: 99000, sortOrder: 3 },
  { slug: "mega",    name: "Mega Pack", coins: 1200, bonus: 300, priceIDR: 199000, sortOrder: 4 },
];

async function main() {
  for (const p of PACKS) {
    await db.coinPack.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`✅ ${PACKS.length} coin packs seeded.`);
}

main().finally(() => db.$disconnect());

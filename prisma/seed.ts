import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const GENRES = [
  "Romance", "Fantasy", "Sci-Fi", "Mystery", "Thriller",
  "Horror", "Adventure", "Drama", "Comedy", "Slice of Life",
  "Historical", "Action", "Young Adult",
];

const COVERS = [
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80",
  "https://images.unsplash.com/photo-1531901599143-df5010ab9438?w=600&q=80",
  "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600&q=80",
  "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
  "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&q=80",
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&q=80",
  "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80",
  "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=600&q=80",
  "https://images.unsplash.com/photo-1518373714866-3f1478910cc0?w=600&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
  "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=600&q=80",
  "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80",
  "https://images.unsplash.com/photo-1490633874781-1c63cc424610?w=600&q=80",
  "https://images.unsplash.com/photo-1553729784-e91953dec042?w=600&q=80",
  "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600&q=80",
];

const NOVELS: Array<{
  title: string;
  synopsis: string;
  genres: string[];
  rating: number;
  status: "ongoing" | "completed" | "hiatus";
  featured?: boolean;
}> = [
  {
    title: "The Moonlit Heir",
    synopsis: "Ketika malam pertama warisannya tiba, Lyra harus memilih antara takhta yang mencurinya dan pria yang ditakdirkan untuk menghancurkannya.",
    genres: ["Romance", "Fantasy"], rating: 4.7, status: "ongoing", featured: true,
  },
  {
    title: "Stardust Protocol",
    synopsis: "Tahun 2099. Setelah kontak alien diretas, satu insinyur muda menemukan bahwa sinyal itu bukan dari luar angkasa — tapi dari masa depan dirinya sendiri.",
    genres: ["Sci-Fi", "Thriller"], rating: 4.8, status: "ongoing", featured: true,
  },
  {
    title: "Twelve Letters to a Stranger",
    synopsis: "Setiap bulan, satu surat datang dari pengirim yang tidak ia kenal. Dan setiap surat membongkar satu kebohongan tentang hidupnya.",
    genres: ["Mystery", "Drama"], rating: 4.6, status: "completed",
  },
  {
    title: "Crown of Thorns",
    synopsis: "Putri yang dibuang kembali ke kerajaan yang dulunya menolaknya — kali ini bukan untuk diampuni, tapi untuk membakarnya rata.",
    genres: ["Fantasy", "Action"], rating: 4.9, status: "ongoing", featured: true,
  },
  {
    title: "Café Pagi Pukul Lima",
    synopsis: "Sebuah kedai kopi yang hanya muncul saat orang merasa paling sendiri. Dan barista-nya tahu setiap rahasiamu.",
    genres: ["Slice of Life", "Drama"], rating: 4.5, status: "ongoing",
  },
  {
    title: "The Devil's Bargain",
    synopsis: "Untuk menyelamatkan adiknya, Naya menandatangani kontrak dengan iblis yang ternyata adalah teman sekelasnya.",
    genres: ["Romance", "Horror"], rating: 4.4, status: "ongoing",
  },
  {
    title: "Last Train at Dawn",
    synopsis: "Setiap pagi, kereta yang sama membawa orang yang sama. Sampai suatu hari, satu penumpang menghilang — dan tak seorang pun ingat namanya.",
    genres: ["Mystery", "Thriller"], rating: 4.7, status: "completed",
  },
  {
    title: "Rebirth: I Was the Villain",
    synopsis: "Setelah meninggal di novel yang ia baca, Mira terbangun sebagai antagonis yang ditakdirkan mati di chapter 47.",
    genres: ["Fantasy", "Comedy"], rating: 4.8, status: "ongoing", featured: true,
  },
  {
    title: "Whispers of the Old Gods",
    synopsis: "Arkeolog muda menemukan reruntuhan yang seharusnya tidak ada — dan dewa-dewa lama mulai berbisik kembali.",
    genres: ["Adventure", "Horror"], rating: 4.3, status: "ongoing",
  },
  {
    title: "Petals & Steel",
    synopsis: "Florist siang hari, pembunuh bayaran malam hari. Sampai targetnya berikutnya adalah pelanggan tetapnya.",
    genres: ["Action", "Romance"], rating: 4.6, status: "ongoing",
  },
  {
    title: "The Cartographer's Daughter",
    synopsis: "Peta yang ayahnya tinggalkan menggambarkan dunia yang belum ditemukan. Atau dunia yang sudah dilupakan.",
    genres: ["Adventure", "Historical"], rating: 4.5, status: "completed",
  },
  {
    title: "Echoes from Apartment 7B",
    synopsis: "Tetangga baru di lantai atas selalu mengetuk pukul 3 pagi. Tapi apartemen itu sudah kosong selama 12 tahun.",
    genres: ["Horror", "Mystery"], rating: 4.7, status: "ongoing",
  },
  {
    title: "Codename: Sparrow",
    synopsis: "Mata-mata muda dengan ingatan sempurna ditugaskan untuk membunuh atasannya — yang ternyata adalah kakaknya.",
    genres: ["Thriller", "Action"], rating: 4.8, status: "ongoing",
  },
  {
    title: "The Garden Between Worlds",
    synopsis: "Setiap pintu di taman tua itu mengarah ke dunia berbeda. Dan satu pintu mengarah ke rumah yang ia sebut milik sebelum lupa.",
    genres: ["Fantasy", "Young Adult"], rating: 4.4, status: "ongoing",
  },
  {
    title: "Married to the CEO by Accident",
    synopsis: "Mabuk satu malam berakhir dengan tanda tangan akta nikah. Dan suaminya kebetulan bos yang akan ia wawancarai besok pagi.",
    genres: ["Romance", "Comedy"], rating: 4.5, status: "ongoing",
  },
  {
    title: "Until the Stars Forget Us",
    synopsis: "Dua kekasih dipisahkan oleh perang antar-galaksi. Surat mereka membutuhkan 12 tahun cahaya untuk sampai.",
    genres: ["Sci-Fi", "Romance"], rating: 4.9, status: "ongoing", featured: true,
  },
];

function makeChapterContent(novelTitle: string, chapterNumber: number): string {
  return `# Bab ${chapterNumber}

Angin musim gugur berhembus pelan menyapu jendela. Di luar, cahaya jingga senja perlahan menyerah pada malam yang menanti.

Aku menatap surat itu untuk kesepuluh kalinya, mencoba memahami kata demi kata yang seakan-akan ditulis dalam bahasa lain. *"${novelTitle}"* — judul yang seharusnya hanya kukenal lewat mimpi, kini terpampang nyata di hadapanku.

"Kau yakin ingin membukanya?"

Suara itu datang dari belakang. Aku tidak perlu menoleh untuk tahu siapa yang berbicara. Setelah sekian lama, ada hal-hal yang tidak perlu dijelaskan lagi.

"Aku harus tahu," jawabku pelan. Jari-jariku gemetar saat menyentuh segel di amplop tua itu — segel yang seharusnya hancur ratusan tahun lalu, namun masih utuh seakan baru saja ditekan.

Detak jantungku berpacu. Setiap detik terasa seperti satu jam, dan setiap nafas terasa seperti pengkhianatan terhadap janji yang pernah kuucapkan pada diri sendiri.

"Kalau kau membukanya," katanya lagi, kali ini lebih lembut, "tidak akan ada jalan kembali. Kau paham itu, kan?"

Aku tersenyum tipis. Tentu saja aku paham. Sejak hari pertama aku menerima surat ini, aku sudah tahu bahwa pilihan ini bukan benar-benar pilihan. Hanya ilusi yang dibuat agar aku merasa punya kendali.

Dengan satu gerakan tegas, aku merobek segel itu.

Dan dunia, untuk pertama kalinya dalam hidupku, benar-benar terdiam.

---

*Bab ${chapterNumber + 1} segera tayang. Pembaca premium dapat akses awal 24 jam sebelum rilis publik.*`;
}

async function main() {
  console.log("⌛ Membersihkan database...");
  await db.coinTransaction.deleteMany();
  await db.chapterUnlock.deleteMany();
  await db.bookmark.deleteMany();
  await db.readingHistory.deleteMany();
  await db.comment.deleteMany();
  await db.chapter.deleteMany();
  await db.novelGenre.deleteMany();
  await db.novel.deleteMany();
  await db.genre.deleteMany();
  await db.user.deleteMany();

  console.log("👤 Membuat user...");
  const passwordHash = await bcrypt.hash("password123", 10);
  const admin = await db.user.create({
    data: {
      email: "admin@dreame.local",
      username: "admin",
      passwordHash,
      displayName: "Dreame Admin",
      role: "admin",
      coinBalance: 9999,
      isVerified: true,
    },
  });

  const writers = await Promise.all(
    ["aurora_pen", "midnight_quill", "sunhaven", "ravenwriter"].map((u, i) =>
      db.user.create({
        data: {
          email: `${u}@dreame.local`,
          username: u,
          passwordHash,
          displayName: ["Aurora Wijaya", "Midnight Quill", "Sun Haven", "Raven Adriana"][i],
          role: "writer",
          coinBalance: 100,
          isVerified: true,
          bio: "Penulis fiksi yang gemar bermain dengan hujan dan rahasia.",
        },
      }),
    ),
  );

  const reader = await db.user.create({
    data: {
      email: "reader@dreame.local",
      username: "reader",
      passwordHash,
      displayName: "Pembaca Demo",
      role: "reader",
      coinBalance: 50,
    },
  });

  console.log("🏷️  Membuat genre...");
  const genres = await Promise.all(
    GENRES.map((name) =>
      db.genre.create({
        data: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      }),
    ),
  );
  const genreByName = Object.fromEntries(genres.map((g) => [g.name, g]));

  console.log("📖 Membuat novel + chapter...");
  for (let i = 0; i < NOVELS.length; i++) {
    const n = NOVELS[i];
    const author = writers[i % writers.length];
    const slug = n.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const novel = await db.novel.create({
      data: {
        slug,
        title: n.title,
        synopsis: n.synopsis,
        coverUrl: COVERS[i % COVERS.length],
        bannerUrl: COVERS[(i + 5) % COVERS.length],
        status: n.status,
        rating: n.rating,
        ratingCount: 100 + Math.floor(Math.random() * 5000),
        views: 1000 + Math.floor(Math.random() * 200000),
        isFeatured: !!n.featured,
        publishedAt: new Date(Date.now() - i * 86400000),
        authorId: author.id,
        freeChapters: 3,
        coinPerChapter: 2,
      },
    });

    for (const g of n.genres) {
      await db.novelGenre.create({
        data: { novelId: novel.id, genreId: genreByName[g].id },
      });
    }

    const chapterCount = 8 + Math.floor(Math.random() * 12);
    for (let c = 1; c <= chapterCount; c++) {
      await db.chapter.create({
        data: {
          novelId: novel.id,
          number: c,
          title: `Bab ${c}: ${["Awal Mula", "Pertemuan", "Bayangan", "Janji", "Pengkhianatan", "Hujan", "Cermin", "Gerbang", "Diam", "Pulang", "Lentera", "Bara", "Senja", "Surat", "Bisikan", "Akhir Pertama", "Pilihan", "Kembali", "Cahaya", "Kunci"][c % 20]}`,
          content: makeChapterContent(novel.title, c),
          wordCount: 1500 + Math.floor(Math.random() * 1000),
          publishedAt: new Date(Date.now() - (chapterCount - c) * 86400000),
        },
      });
    }
  }

  console.log("🎁 Demo bookmark + history untuk reader...");
  const someNovels = await db.novel.findMany({ take: 3 });
  for (const n of someNovels) {
    await db.bookmark.create({ data: { userId: reader.id, novelId: n.id } });
  }
  await db.readingHistory.create({
    data: { userId: reader.id, novelId: someNovels[0].id, lastChapter: 2 },
  });

  console.log(`✅ Selesai. ${NOVELS.length} novel, ${writers.length + 2} user.`);
  console.log(`   Login admin: admin@dreame.local / password123`);
  console.log(`   Login reader: reader@dreame.local / password123`);
  console.log(`   Login writer: aurora_pen@dreame.local / password123`);
  void admin;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });

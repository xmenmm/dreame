import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const POLLI = "https://image.pollinations.ai/prompt/";
function cover(prompt: string, seed: number) {
  return `${POLLI}${encodeURIComponent(prompt)}?width=512&height=768&nologo=true&model=flux&seed=${seed}`;
}

type N = {
  title: string;
  synopsis: string;
  genres: string[];
  prompt: string;
  status?: "ongoing" | "completed" | "hiatus";
  rating?: number;
  featured?: boolean;
};

const NEW_NOVELS: N[] = [
  // ── Romance ─────────────────────────────────────────────
  {
    title: "Senja di Kafe Lampu Kuning",
    synopsis: "Setiap senja, ia datang ke kafe yang sama, memesan kopi yang sama, duduk di meja yang sama. Sampai suatu hari, kursi di seberangnya tidak lagi kosong.",
    genres: ["Romance", "Slice of Life"],
    prompt: "warm romantic novel cover, indonesian cafe at sunset, golden hour, painterly, cinematic, book cover art",
    status: "ongoing", rating: 4.6, featured: true,
  },
  {
    title: "Kontrak Pernikahan 365 Hari",
    synopsis: "Untuk warisan kakeknya, Arsa harus menikahi seseorang dalam 24 jam. Pilihannya jatuh ke perempuan yang baru saja menumpahkan kopi di kemejanya.",
    genres: ["Romance", "Comedy"],
    prompt: "wedding ring contract paper, romantic comedy book cover, modern indonesian, soft palette",
    status: "ongoing", rating: 4.5,
  },
  {
    title: "Surat untuk Mantan di Tahun 2089",
    synopsis: "Bumi sudah hancur. Tapi Lara baru membaca surat dari mantannya — surat yang dititipkan 60 tahun yang lalu, dikirim hanya jika dunia kiamat.",
    genres: ["Romance", "Sci-Fi"],
    prompt: "post-apocalyptic romance, lone woman reading letter, ruined city background, cinematic dramatic lighting, book cover",
    status: "ongoing", rating: 4.8, featured: true,
  },
  {
    title: "Bukan Cinta Pertama, Tapi Terakhir",
    synopsis: "Tujuh tahun setelah perpisahan, Riana bertemu lagi dengan Ardian — sebagai dokter yang menangani kakaknya yang sekarat.",
    genres: ["Romance", "Drama"],
    prompt: "indonesian hospital romantic drama, two figures by window, soft melancholic light, painterly book cover",
    status: "ongoing", rating: 4.7,
  },
  {
    title: "Pernikahan Setelah Kontrak Berakhir",
    synopsis: "Mereka menikah karena kontrak. Mereka berpisah karena kontrak. Tapi kenapa hatinya masih menolak untuk move on?",
    genres: ["Romance", "Drama"],
    prompt: "romantic novel cover, two silhouettes back to back, monochrome with red accent, modern minimal book cover",
    status: "completed", rating: 4.4,
  },

  // ── Fantasy ─────────────────────────────────────────────
  {
    title: "Sang Pewaris Bulan Hitam",
    synopsis: "Setiap seratus tahun, satu anak dari klan terlarang lahir dengan bulan hitam di matanya. Tahun ini, anak itu adalah Aren — yang baru saja membunuh ayahnya.",
    genres: ["Fantasy", "Action"],
    prompt: "dark fantasy novel cover, young man with glowing eye, black moon background, cinematic, dramatic, painterly",
    status: "ongoing", rating: 4.9, featured: true,
  },
  {
    title: "Akademi Penyihir Senandung",
    synopsis: "Di akademi tempat semua sihir membutuhkan nyanyian, satu siswa lahir tanpa suara — dan justru ia yang ditakdirkan menyelamatkan dunia.",
    genres: ["Fantasy", "Young Adult"],
    prompt: "magical academy novel cover, gothic castle, students with floating books, mystical glow, fantasy book cover art",
    status: "ongoing", rating: 4.7,
  },
  {
    title: "Tujuh Naga, Satu Janji",
    synopsis: "Janji nenek moyangnya sudah kadaluarsa selama 800 tahun. Tapi minggu ini, naga pertama kembali — dan ia datang menagih.",
    genres: ["Fantasy", "Adventure"],
    prompt: "epic dragon fantasy book cover, seven dragons in stormy sky, lone warrior with sword, cinematic dramatic",
    status: "ongoing", rating: 4.8,
  },
  {
    title: "Reinkarnasi Sebagai Pelayan Iblis",
    synopsis: "Bunuh diri di umur 27. Bangun lagi di tubuh anak 12 tahun yang baru saja dibeli oleh raja iblis sebagai pelayan.",
    genres: ["Fantasy", "Comedy"],
    prompt: "isekai fantasy book cover, young servant in demon castle, anime style painted, dramatic torch lighting",
    status: "ongoing", rating: 4.6, featured: true,
  },
  {
    title: "Pedang yang Mengingat",
    synopsis: "Pedang itu menolak diangkat oleh siapa pun selain dia. Dan setiap kali ia mengangkatnya, ia melihat kematian seseorang — dari masa depan.",
    genres: ["Fantasy", "Mystery"],
    prompt: "ancient magic sword glowing, mysterious warrior holding sword, mystical fog, fantasy book cover painterly",
    status: "ongoing", rating: 4.5,
  },

  // ── Sci-Fi ─────────────────────────────────────────────
  {
    title: "Kota di Bawah Awan",
    synopsis: "Ratusan tahun lalu, manusia naik ke atas awan agar selamat dari banjir. Sekarang awan mulai surut — dan apa yang ada di bawah, ternyata masih hidup.",
    genres: ["Sci-Fi", "Adventure"],
    prompt: "floating city above clouds, dystopian sci-fi book cover, dramatic atmospheric lighting, cinematic concept art",
    status: "ongoing", rating: 4.7,
  },
  {
    title: "Algoritma yang Mencintaiku",
    synopsis: "Aplikasi kencan barunya berfungsi terlalu sempurna — sampai ia sadar AI itu bukan mencarikan jodoh, tapi mencintainya sendiri.",
    genres: ["Sci-Fi", "Romance"],
    prompt: "cyberpunk romance novel cover, woman with smartphone, neon lights, holographic ai face, atmospheric",
    status: "ongoing", rating: 4.8,
  },
  {
    title: "Memori Dijual Per Detik",
    synopsis: "Di tahun 2078, kau bisa menjual memori untuk uang. Vio menjual semua memori bahagianya — sampai ia tidak ingat kenapa ia mulai menabung.",
    genres: ["Sci-Fi", "Drama"],
    prompt: "futuristic dystopian person with neural implants, melancholic blue lighting, sci-fi book cover painterly",
    status: "completed", rating: 4.9,
  },

  // ── Mystery / Thriller ────────────────────────────────
  {
    title: "13 Pesan dari Nomor Mati",
    synopsis: "Setiap pukul 3 pagi, ia menerima pesan dari nomor yang seharusnya sudah dimatikan satu tahun lalu — nomor adiknya yang meninggal.",
    genres: ["Mystery", "Horror"],
    prompt: "phone screen at night with creepy text, mystery thriller book cover, dark atmospheric, suspense",
    status: "ongoing", rating: 4.7,
  },
  {
    title: "Pulau yang Tidak Ada di Peta",
    synopsis: "Tujuh peneliti datang ke pulau yang tidak tercantum di peta mana pun. Pulang ke daratan, hanya ada enam — dan tidak satu pun bisa menjelaskan ke mana yang ketujuh hilang.",
    genres: ["Mystery", "Thriller"],
    prompt: "mysterious foggy island from boat perspective, suspense thriller book cover, atmospheric cinematic",
    status: "ongoing", rating: 4.8, featured: true,
  },
  {
    title: "Detektif yang Tidak Pernah Tidur",
    synopsis: "Insomnia kronis membuatnya bisa kerja 18 jam sehari memecahkan kasus. Sampai ia harus menyelidiki sebuah pembunuhan — di mana ia sendiri adalah saksi utama.",
    genres: ["Mystery", "Thriller"],
    prompt: "noir detective in dark office, indonesian setting, neon rain at window, thriller book cover painterly",
    status: "ongoing", rating: 4.6,
  },
  {
    title: "Pesan Terakhir yang Belum Dikirim",
    synopsis: "Ponsel istrinya yang meninggal tiba-tiba mengirim pesan ke dirinya. Tertulis: 'Aku belum mati. Tolong jangan kubur aku besok.'",
    genres: ["Thriller", "Horror"],
    prompt: "phone in graveyard at night, dramatic suspense book cover, dark atmospheric thriller",
    status: "ongoing", rating: 4.7,
  },

  // ── Horror ─────────────────────────────────────────────
  {
    title: "Rumah yang Memilih Penghuninya",
    synopsis: "Rumah itu kosong selama 40 tahun. Setiap kali ada keluarga pindah, dalam seminggu mereka kabur. Tapi keluarga Wijaya... mereka tinggal.",
    genres: ["Horror", "Mystery"],
    prompt: "creepy old indonesian house at night, haunted horror book cover, full moon, atmospheric dark painterly",
    status: "ongoing", rating: 4.5,
  },
  {
    title: "Nyanyian dari Sumur Tua",
    synopsis: "Sumur di belakang pesantren itu sudah ditutup sejak 1962. Tapi minggu ini, anak-anak santri mulai menirukan lagu yang naik dari dalamnya — lagu yang tidak ada yang pernah ajarkan.",
    genres: ["Horror", "Drama"],
    prompt: "indonesian rural well at twilight, eerie folk horror book cover, mystical atmospheric, dark green palette",
    status: "ongoing", rating: 4.8, featured: true,
  },
  {
    title: "Dia yang Berdiri di Belakangmu",
    synopsis: "Setiap foto yang ia ambil dalam seminggu terakhir — ada satu sosok yang sama berdiri di belakangnya. Sosok yang dari luar foto, tidak pernah ada.",
    genres: ["Horror", "Mystery"],
    prompt: "shadowy figure behind woman in mirror, horror book cover, dark unsettling atmosphere, polaroid photo style",
    status: "ongoing", rating: 4.7,
  },

  // ── Action / Adventure ────────────────────────────────
  {
    title: "Pencuri Bayangan Jakarta",
    synopsis: "Di Jakarta, ia legenda urban — pencuri yang tidak pernah tertangkap. Tapi target malam ini berbeda: brankas yang tidak boleh dibuka, di rumah seseorang yang seharusnya sudah mati.",
    genres: ["Action", "Thriller"],
    prompt: "jakarta skyline at night, hooded thief on rooftop, action thriller book cover, neon city lights, cinematic",
    status: "ongoing", rating: 4.6,
  },
  {
    title: "Pendekar Terakhir Pulau Karang",
    synopsis: "Setelah perang antar kerajaan menghancurkan tujuh pulau, hanya satu pendekar yang masih hidup — dan ia bersumpah balas dendam.",
    genres: ["Action", "Adventure", "Historical"],
    prompt: "ancient indonesian warrior on rocky coast, historical action book cover, dramatic stormy sky, cinematic painterly",
    status: "ongoing", rating: 4.7,
  },
  {
    title: "Operasi Burung Hantu",
    synopsis: "Sebuah unit khusus, lima anggota, satu misi rahasia. Yang dikirim ke daerah yang dalam peta resmi tidak pernah ada.",
    genres: ["Action", "Thriller"],
    prompt: "military special forces team, jungle operation, action thriller book cover, dark dramatic atmosphere",
    status: "ongoing", rating: 4.5,
  },

  // ── Drama / Slice of Life ────────────────────────────
  {
    title: "Anak Sulung",
    synopsis: "Sebagai anak sulung, ia pikir tugasnya hanya menjaga adik-adiknya. Sampai ayah meninggal, dan ia harus jadi ibu, ayah, dan dirinya sendiri sekaligus — pada usia 22.",
    genres: ["Drama", "Slice of Life"],
    prompt: "young indonesian woman holding sibling at sunset, family drama book cover, warm emotional, painterly",
    status: "ongoing", rating: 4.9, featured: true,
  },
  {
    title: "Warung Kopi Pukul Dua Pagi",
    synopsis: "Setiap orang yang datang ke warung itu punya cerita. Dan pemilik warung — yang tidak pernah bicara — punya cerita paling besar dari semuanya.",
    genres: ["Drama", "Slice of Life"],
    prompt: "cozy indonesian coffee shop at midnight, lone barista, warm soft lighting, slice of life book cover",
    status: "ongoing", rating: 4.6,
  },
  {
    title: "Surat Kepada Diriku yang Belum Lahir",
    synopsis: "Setiap tahun, Bunga menulis surat untuk anak yang belum dilahirkan. Tahun ini, untuk pertama kalinya, suratnya dijawab.",
    genres: ["Drama"],
    prompt: "woman writing letter by window, melancholic family drama book cover, soft warm light, emotional painterly",
    status: "completed", rating: 4.8,
  },

  // ── Young Adult ────────────────────────────────
  {
    title: "Kelas 12-A, Reuni 10 Tahun",
    synopsis: "10 tahun setelah lulus, mereka kumpul reuni. Tapi salah satu dari mereka tidak pernah hadir — karena dialah yang mengirim undangan dari kuburnya.",
    genres: ["Young Adult", "Mystery"],
    prompt: "indonesian high school reunion vintage photo, mysterious empty seat, ya thriller book cover, nostalgic",
    status: "ongoing", rating: 4.5,
  },
  {
    title: "Pelukis Mimpi Buruk",
    synopsis: "Iza bisa melukis mimpi orang lain. Sampai suatu hari, ia melukis mimpi buruk seorang anak — dan keesokan harinya, mimpi itu terjadi.",
    genres: ["Young Adult", "Fantasy", "Horror"],
    prompt: "young artist with paintbrush, surreal nightmare painting, ya fantasy book cover, mystical atmospheric",
    status: "ongoing", rating: 4.7,
  },
  {
    title: "Pacar Pinjaman",
    synopsis: "Dia menyewa Faza jadi pacar pinjaman buat reuni keluarga. Aturan main: tiga hari, tidak ada perasaan, tidak ada cium. Aturan ini bertahan sampai jam ke-tujuh.",
    genres: ["Young Adult", "Romance", "Comedy"],
    prompt: "cute young couple at family gathering, romantic comedy book cover, indonesian setting, warm sunny",
    status: "ongoing", rating: 4.6,
  },

  // ── Historical ────────────────────────────────
  {
    title: "Surabaya, 1945",
    synopsis: "Tiga hari sebelum pertempuran 10 November, seorang gadis pribumi jatuh cinta pada seorang tentara — yang ternyata dari pihak yang salah.",
    genres: ["Historical", "Romance", "Drama"],
    prompt: "1940s surabaya old town, historical romance book cover, sepia warm tones, vintage indonesia painterly",
    status: "completed", rating: 4.9,
  },
  {
    title: "Pawang Hujan Terakhir",
    synopsis: "Tradisi pawang hujan turun-temurun dari kakek buyutnya. Di pernikahan terbesar abad ini, ia ditugaskan menjaga langit. Tapi sesuatu di langit itu marah.",
    genres: ["Historical", "Fantasy"],
    prompt: "indonesian rain shaman ritual, traditional ceremony, mystical historical book cover, dramatic stormy sky",
    status: "ongoing", rating: 4.7,
  },

  // ── Adventure ────────────────────────────────
  {
    title: "Peta yang Mencari Pemiliknya",
    synopsis: "Peta itu muncul di tas ranselnya pagi ini. Bukan ditaruh siapa pun. Dan tanda 'X' di petanya, persis di bawah tempat tidurnya.",
    genres: ["Adventure", "Mystery", "Young Adult"],
    prompt: "ancient treasure map glowing, adventure mystery book cover, young explorer with backpack, golden warm",
    status: "ongoing", rating: 4.6,
  },

  // ── Reincarnation/Isekai ────────────────────────────
  {
    title: "Aku Adalah Villain Cantik di Novel Kakak Tiriku",
    synopsis: "Mira terbangun sebagai antagonis novel populer karangan kakak tirinya — tepat tiga hari sebelum tokoh utamanya membunuhnya di chapter 47.",
    genres: ["Fantasy", "Comedy", "Romance"],
    prompt: "elegant villainess in fantasy ballroom, anime painted style book cover, dramatic gothic glamour, ornate gown",
    status: "ongoing", rating: 4.8, featured: true,
  },
];

const NEW_WRITERS = [
  { username: "kala_senja", displayName: "Kala Senja", bio: "Suka menulis tentang yang dipendam dan tidak pernah dikatakan." },
  { username: "asha_lentera", displayName: "Asha Lentera", bio: "Penulis fiksi spekulatif. Lahir di Bandung, tinggal di kepala karakternya." },
  { username: "nara_kusuma", displayName: "Nara Kusuma", bio: "Romance dengan luka sehari-hari." },
  { username: "elang_huma", displayName: "Elang Huma", bio: "Misteri & thriller. Sehari-hari kerja kantoran. Malam menulis." },
];

function generateChapter(novel: { title: string; genres: string[] }, num: number, total: number): { title: string; content: string; words: number } {
  const titles = [
    "Awal", "Bayangan", "Janji", "Pengkhianatan", "Hujan Pertama",
    "Cermin", "Gerbang", "Diam yang Pecah", "Pulang", "Lentera Terakhir",
    "Bara di Dada", "Senja yang Sama", "Surat", "Bisikan", "Akhir Pertama",
    "Pilihan Sulit", "Kembali", "Cahaya", "Kunci", "Nama yang Dilupakan",
    "Saat Mereka Diam", "Yang Tidak Pernah Diucapkan", "Hari Itu", "Selamanya",
  ];
  const title = `Bab ${num}: ${titles[(num - 1) % titles.length]}`;

  const openers = [
    "Hujan turun lagi malam itu, seakan langit menolak diam.",
    "Aku tidak tahu kapan tepatnya kami berhenti saling memandang.",
    "Pintu itu seharusnya terkunci selama tujuh tahun.",
    "Suaranya datang sebelum dirinya sendiri tiba.",
    "Aku terbangun dengan rasa bahwa hari ini akan berbeda.",
    "Setiap malam, mimpi itu kembali dengan satu detail baru.",
    "Kalau saja aku tidak menjawab telepon itu, mungkin semuanya akan baik-baik saja.",
    "Dunia yang dia tinggalkan, dan dunia yang aku temui, ternyata bukan dunia yang sama.",
    "Aroma kopi pagi itu adalah kebohongan paling jujur yang pernah kuhirup.",
    "Tiga hari. Aku hanya butuh tiga hari untuk mengerti — dan tiga puluh tahun untuk melupakan.",
  ];

  const middles = [
    "Aku menatap jendela yang sama setiap pagi, dan setiap pagi pemandangannya terasa lebih jauh dari sebelumnya. Bukan karena ada yang berubah di luar — tapi karena ada yang terus berubah di dalam diriku.",
    "Ia berbicara seakan setiap kata adalah pintu yang ditutupnya pelan-pelan. Dan aku, bodohnya, masih berdiri di luar.",
    "Yang paling menakutkan dari sebuah keputusan bukan hasilnya. Tapi mengetahui bahwa setelah ini, semua kemungkinan lain akan mati pelan-pelan dalam dirimu.",
    "Aku selalu pikir keberanian itu seperti baju zirah — semakin tebal semakin baik. Sampai aku belajar, terkadang keberanian justru artinya melepas semua zirah, dan masuk ke ruangan itu dengan dada terbuka.",
    "Ada yang bilang waktu menyembuhkan segalanya. Mereka belum pernah kehilangan orang yang mereka cintai sejak sebelum mereka tahu cara mencintai dengan benar.",
  ];

  const closers = [
    "Dan untuk pertama kalinya dalam hidupku, aku merasa sebentar lagi semuanya akan tergulung — entah baik, entah buruk.",
    "Pintu itu terbuka. Dan dunia, untuk sekejap, terdiam.",
    "Aku tahu, mulai detik itu, tidak akan ada jalan kembali. Bahkan jika aku berlari secepat-cepatnya.",
    "Suaranya menyebut namaku — pelan, hampir tidak terdengar — tapi cukup untuk menghancurkan semua yang aku pikir aku tahu tentang diriku.",
    "Esok pagi adalah misteri yang aku tidak yakin ingin pecahkan. Tapi malam itu, aku tertidur dengan satu janji: aku tidak akan lari lagi.",
  ];

  const content = `# ${title.split(":")[0]}

${openers[(num + total) % openers.length]}

${middles[num % middles.length]}

"${["Apa yang sebenarnya kau cari?", "Kenapa kau masih di sini?", "Siapa kau, sebenarnya?", "Kapan ini akan berakhir?", "Apa kau yakin?"][num % 5]}"

Pertanyaan itu menggantung di udara seperti asap rokok yang menolak hilang. Aku tidak punya jawaban. Atau, lebih tepatnya, aku punya terlalu banyak jawaban dan tidak tahu mana yang benar.

${middles[(num + 2) % middles.length]}

Di luar, hari mulai berubah warna. Cahaya jingga senja perlahan menyerah pada malam yang menanti — sama seperti hari-hari sebelumnya, tapi entah kenapa, kali ini terasa lebih lambat. Lebih berat.

*"${novel.title}"* — judul yang seharusnya hanya kukenal lewat mimpi, kini terpampang nyata di hadapan jiwaku. Dan aku, untuk pertama kalinya, mengerti kenapa.

${closers[(num * 3) % closers.length]}

---

*Bab ${num + 1} segera tayang. Pembaca premium dapat akses awal 24 jam sebelum rilis publik.*`;

  const words = content.replace(/[#*_`>-]/g, " ").split(/\s+/).filter((w) => w.length > 0).length;
  return { title, content, words };
}

async function main() {
  console.log("⌛ Menambah konten demo (additive — tidak menghapus data lama)...");

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("👤 Tambah penulis demo...");
  const writers: Array<Awaited<ReturnType<typeof db.user.findFirst>>> = [];
  for (const w of NEW_WRITERS) {
    const existing = await db.user.findUnique({ where: { username: w.username } });
    if (existing) {
      writers.push(existing);
      continue;
    }
    const u = await db.user.create({
      data: {
        email: `${w.username}@dreame.local`,
        username: w.username,
        passwordHash,
        displayName: w.displayName,
        bio: w.bio,
        role: "writer",
        coinBalance: 100,
        isVerified: true,
      },
    });
    writers.push(u);
  }

  const allWriters = await db.user.findMany({ where: { role: { in: ["writer", "admin"] } } });
  const genres = await db.genre.findMany();
  const genreByName = Object.fromEntries(genres.map((g) => [g.name, g]));

  console.log(`📖 Membuat ${NEW_NOVELS.length} novel + bab...`);
  let added = 0;
  let coverSeed = 1000;

  for (let i = 0; i < NEW_NOVELS.length; i++) {
    const n = NEW_NOVELS[i];
    const slug = n.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    const exists = await db.novel.findUnique({ where: { slug } });
    if (exists) {
      console.log(`   ⊘ skip duplicate: ${n.title}`);
      continue;
    }

    const author = allWriters[i % allWriters.length];
    const coverUrl = cover(n.prompt, ++coverSeed);
    const bannerUrl = cover(n.prompt + ", wide cinematic banner", ++coverSeed);

    const novel = await db.novel.create({
      data: {
        slug,
        title: n.title,
        synopsis: n.synopsis,
        coverUrl, bannerUrl,
        status: n.status ?? "ongoing",
        rating: n.rating ?? 4.5,
        ratingCount: 50 + Math.floor(Math.random() * 4500),
        views: 800 + Math.floor(Math.random() * 150_000),
        isFeatured: !!n.featured,
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
        authorId: author.id,
        freeChapters: 3,
        coinPerChapter: 2,
      },
    });

    for (const g of n.genres) {
      const genre = genreByName[g];
      if (!genre) continue;
      await db.novelGenre.create({ data: { novelId: novel.id, genreId: genre.id } });
    }

    const chapterCount = 6 + Math.floor(Math.random() * 10);
    for (let c = 1; c <= chapterCount; c++) {
      const ch = generateChapter(n, c, chapterCount);
      await db.chapter.create({
        data: {
          novelId: novel.id,
          number: c,
          title: ch.title,
          content: ch.content,
          wordCount: ch.words,
          publishedAt: new Date(Date.now() - (chapterCount - c) * 86400000 - Math.floor(Math.random() * 3) * 86400000),
        },
      });
    }
    added += 1;
    if (added % 5 === 0) console.log(`   ✓ ${added} novel ditambahkan...`);
  }

  const total = await db.novel.count();
  const totalCh = await db.chapter.count();
  console.log(`\n✅ Selesai. Tambahan: ${added} novel.`);
  console.log(`   Total di database: ${total} novel, ${totalCh} bab.`);
  console.log(`   Buka http://localhost:3030 untuk lihat hasilnya.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });

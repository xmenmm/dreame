// Curated Unsplash photo pools — reliable image source untuk AI-generated novels.
// Pollinations sering 429, jadi pakai Unsplash sebagai default. Photo dipilih deterministik
// berdasarkan hash supaya konsisten antar render.

// Cover-style portraits (rasio 2:3 friendly via Unsplash crop)
const COVERS_BY_GENRE: Record<string, string[]> = {
  Romance: [
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    "https://images.unsplash.com/photo-1484608856193-968d2be4080e?w=600&q=80",
    "https://images.unsplash.com/photo-1500049242364-5f500807f438?w=600&q=80",
  ],
  Fantasy: [
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=600&q=80",
    "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=600&q=80",
  ],
  Mystery: [
    "https://images.unsplash.com/photo-1531901599143-df5010ab9438?w=600&q=80",
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=600&q=80",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80",
  ],
  Thriller: [
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
    "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&q=80",
    "https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=600&q=80",
    "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=600&q=80",
  ],
  Horror: [
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    "https://images.unsplash.com/photo-1487546331507-fcf8a5d27ab3?w=600&q=80",
    "https://images.unsplash.com/photo-1505159940484-eb2b9f2588e2?w=600&q=80",
    "https://images.unsplash.com/photo-1518176258769-f227c798150e?w=600&q=80",
  ],
  "Sci-Fi": [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=80",
    "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=600&q=80",
    "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=600&q=80",
  ],
  Drama: [
    "https://images.unsplash.com/photo-1483691278019-cb7253bee49d?w=600&q=80",
    "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=600&q=80",
    "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=600&q=80",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
  ],
  Adventure: [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
    "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=600&q=80",
    "https://images.unsplash.com/photo-1486520299386-6d106b22014b?w=600&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
  ],
  Action: [
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80",
    "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=600&q=80",
    "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&q=80",
    "https://images.unsplash.com/photo-1541417904950-b855846fe074?w=600&q=80",
  ],
  Comedy: [
    "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80",
    "https://images.unsplash.com/photo-1511376777868-611b54f68947?w=600&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&q=80",
  ],
  Historical: [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80",
    "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80",
    "https://images.unsplash.com/photo-1485628390555-1a7bd3c2f97c?w=600&q=80",
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
  ],
  "Slice of Life": [
    "https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=600&q=80",
    "https://images.unsplash.com/photo-1481833761820-0509d3217039?w=600&q=80",
    "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&q=80",
  ],
  "Young Adult": [
    "https://images.unsplash.com/photo-1488229297570-58520851e868?w=600&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
    "https://images.unsplash.com/photo-1509909756405-be0199881695?w=600&q=80",
  ],
};

const COVERS_DEFAULT = [
  "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&q=80",
  "https://images.unsplash.com/photo-1531901599143-df5010ab9438?w=600&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80",
];

// Diverse photos suitable as chapter scene illustrations
const CHAPTER_SCENES = [
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=900&q=80",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=900&q=80",
  "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=900&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=900&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=80",
  "https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=900&q=80",
  "https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?w=900&q=80",
  "https://images.unsplash.com/photo-1483691278019-cb7253bee49d?w=900&q=80",
  "https://images.unsplash.com/photo-1495546968767-f0573cca821e?w=900&q=80",
  "https://images.unsplash.com/photo-1481833761820-0509d3217039?w=900&q=80",
  "https://images.unsplash.com/photo-1487546331507-fcf8a5d27ab3?w=900&q=80",
  "https://images.unsplash.com/photo-1518176258769-f227c798150e?w=900&q=80",
  "https://images.unsplash.com/photo-1500049242364-5f500807f438?w=900&q=80",
  "https://images.unsplash.com/photo-1505159940484-eb2b9f2588e2?w=900&q=80",
  "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=900&q=80",
  "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=900&q=80",
  "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=900&q=80",
  "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=900&q=80",
];

// Banner-style wide images (16:9)
const BANNERS = [
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200&q=80",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=1200&q=80",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80",
  "https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1200&q=80",
];

// Simple deterministic hash → number
function hashToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickCover(genres: string[], seed: string): string {
  const h = hashToInt(seed);
  // Prefer first genre's pool, fallback to default
  for (const g of genres) {
    const pool = COVERS_BY_GENRE[g];
    if (pool && pool.length) {
      return pool[h % pool.length];
    }
  }
  return COVERS_DEFAULT[h % COVERS_DEFAULT.length];
}

export function pickBanner(seed: string): string {
  const h = hashToInt(seed);
  return BANNERS[h % BANNERS.length];
}

// Different scene per chapter, deterministic by (novelSlug + chapterNumber).
// Pakai Picsum (Lorem Picsum) — guaranteed selalu loading, deterministic by seed.
// Tiap bab dapat foto unik tapi konsisten kalau page di-refresh.
export function pickChapterScene(novelSlug: string, chapterNumber: number): string {
  const seed = `${novelSlug}-ch${chapterNumber}`;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/500`;
}

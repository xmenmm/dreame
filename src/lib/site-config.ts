import { db } from "./db";

// ── Home layout config ───────────────────────────────────────

export type HomeSection =
  | { id: string; type: "hero"; auto: "featured" | "trending"; novelSlug?: string; visible?: boolean }
  | { id: string; type: "carousel"; title: string; sort: "trending" | "popular" | "new" | "featured"; genreSlug?: string; visible?: boolean }
  | { id: string; type: "banner"; image: string; link: string; title?: string; subtitle?: string; visible?: boolean }
  | { id: string; type: "daily-reward"; visible?: boolean }
  | { id: string; type: "recommendations"; title?: string; visible?: boolean };

export type HomeLayout = { sections: HomeSection[] };

export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  sections: [
    { id: "hero-1",       type: "hero",            auto: "featured", visible: true },
    { id: "daily-1",      type: "daily-reward",    visible: true },
    { id: "rec-1",        type: "recommendations", title: "Untuk Kamu", visible: true },
    { id: "trend-1",      type: "carousel",        title: "Trending Sekarang", sort: "trending", visible: true },
    { id: "pop-1",        type: "carousel",        title: "Paling Populer",    sort: "popular",  visible: true },
    { id: "new-1",        type: "carousel",        title: "Baru Rilis",        sort: "new",      visible: true },
  ],
};

const HOME_KEY = "home_layout";

export async function getHomeLayout(): Promise<HomeLayout> {
  const row = await db.siteConfig.findUnique({ where: { key: HOME_KEY } });
  if (!row) return DEFAULT_HOME_LAYOUT;
  try {
    const parsed = JSON.parse(row.value);
    if (parsed?.sections && Array.isArray(parsed.sections)) return parsed as HomeLayout;
  } catch {}
  return DEFAULT_HOME_LAYOUT;
}

export async function saveHomeLayout(layout: HomeLayout) {
  await db.siteConfig.upsert({
    where: { key: HOME_KEY },
    update: { value: JSON.stringify(layout) },
    create: { key: HOME_KEY, value: JSON.stringify(layout) },
  });
  return layout;
}

// ── Landing page config ──────────────────────────────────────


export type LandingConfig = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaPrimary: { label: string; href: string };
  heroCtaSecondary: { label: string; href: string };
  features: Array<{ icon: "book" | "coin" | "users" | "feather" | "star" | "shield"; title: string; description: string }>;
  testimonials: Array<{ quote: string; name: string; role: string }>;
  showcaseTitle: string;
  finalCtaTitle: string;
  finalCtaSubtitle: string;
  finalCtaButton: { label: string; href: string };
  showFeatured: boolean;
  showTestimonials: boolean;
};

export const DEFAULT_LANDING: LandingConfig = {
  heroEyebrow: "Platform Novel #1 untuk Pembaca & Penulis",
  heroTitle: "Setiap Cerita\nLayak Diceritakan",
  heroSubtitle:
    "Lentera mempertemukan ribuan pembaca dengan penulis berbakat. Mulai baca novel original favorit kamu hari ini, atau publish karya pertamamu dalam 5 menit.",
  heroCtaPrimary: { label: "Daftar Gratis — Dapat 50 Coin", href: "/register" },
  heroCtaSecondary: { label: "Jelajah Novel", href: "/discover" },
  features: [
    { icon: "book",  title: "Ribuan Novel Original", description: "Romance, fantasy, mystery, sci-fi — pilih genre favorit kamu, baca tanpa iklan." },
    { icon: "coin",  title: "Coin Economy yang Adil", description: "Bab gratis untuk mulai, coin terjangkau untuk lanjut. Penulis dapat 70%." },
    { icon: "feather", title: "Mudah Publish Cerita", description: "Editor markdown live preview, AI cover generator, langsung tayang dalam menit." },
    { icon: "users", title: "Komunitas Aktif", description: "Komentar di tiap bab, follow penulis favorit, ranking mingguan." },
  ],
  testimonials: [
    { quote: "Akhirnya platform yang fair buat penulis Indo. Sebulan udah dapat 200 pembaca aktif.", name: "Aurora Wijaya", role: "Penulis 'Crown of Thorns'" },
    { quote: "UI-nya cantik, baca novel dari HP atau laptop sama nyaman. Sepia mode juara!", name: "Pembaca Demo", role: "Pembaca aktif sejak 2026" },
    { quote: "Daily login reward bikin nagih. Sudah dapat 500 coin gratis bulan ini.", name: "Raven Adriana", role: "Penulis 'Codename: Sparrow'" },
  ],
  showcaseTitle: "Cerita yang Sedang Dibicarakan",
  finalCtaTitle: "Mulai Petualanganmu Hari Ini",
  finalCtaSubtitle: "Gabung 10K+ pembaca & penulis yang sudah pindah ke Lentera.",
  finalCtaButton: { label: "Buat Akun Gratis", href: "/register" },
  showFeatured: true,
  showTestimonials: true,
};

const KEY = "landing";

export async function getLandingConfig(): Promise<LandingConfig> {
  const row = await db.siteConfig.findUnique({ where: { key: KEY } });
  if (!row) return DEFAULT_LANDING;
  try {
    const parsed = JSON.parse(row.value);
    return { ...DEFAULT_LANDING, ...parsed };
  } catch {
    return DEFAULT_LANDING;
  }
}

export async function saveLandingConfig(cfg: Partial<LandingConfig>) {
  const merged = { ...DEFAULT_LANDING, ...cfg };
  await db.siteConfig.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: KEY, value: JSON.stringify(merged) },
  });
  return merged;
}

// ── Reader banners (admin-controlled ads/promos in reader page) ──

export type ReaderBanner = {
  imageUrl: string;
  linkUrl: string;
  alt?: string;
} | null;

export type ReaderBannersConfig = {
  top: ReaderBanner;
  left: ReaderBanner;
  right: ReaderBanner;
};

export const DEFAULT_READER_BANNERS: ReaderBannersConfig = {
  top: null,
  left: null,
  right: null,
};

const READER_BANNERS_KEY = "reader_banners";

export async function getReaderBanners(): Promise<ReaderBannersConfig> {
  const row = await db.siteConfig.findUnique({ where: { key: READER_BANNERS_KEY } });
  if (!row) return DEFAULT_READER_BANNERS;
  try {
    const parsed = JSON.parse(row.value);
    return { ...DEFAULT_READER_BANNERS, ...parsed };
  } catch {
    return DEFAULT_READER_BANNERS;
  }
}

export async function saveReaderBanners(cfg: Partial<ReaderBannersConfig>) {
  const current = await getReaderBanners();
  const merged = { ...current, ...cfg };
  await db.siteConfig.upsert({
    where: { key: READER_BANNERS_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: READER_BANNERS_KEY, value: JSON.stringify(merged) },
  });
  return merged;
}

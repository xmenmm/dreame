import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { CoverPicker } from "@/components/writer/cover-picker";
import { AISuggestButton } from "@/components/writer/ai-suggest-button";

export const dynamic = "force-dynamic";

export default async function NewNovelPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/writer/new");

  const genres = await db.genre.findMany({ orderBy: { name: "asc" } });

  async function createNovel(formData: FormData) {
    "use server";
    const title = String(formData.get("title") || "").trim();
    const synopsis = String(formData.get("synopsis") || "").trim();
    const coverUrl = String(formData.get("coverUrl") || "").trim();
    const status = String(formData.get("status") || "ongoing");
    const language = String(formData.get("language") || "id");
    const contentRating = String(formData.get("contentRating") || "everyone");
    const freeChapters = parseInt(String(formData.get("freeChapters") || "3"), 10);
    const coinPerChapter = parseInt(String(formData.get("coinPerChapter") || "2"), 10);
    const genreIds = formData.getAll("genres").map(String);

    const u = await getCurrentUser();
    if (!u) redirect("/login");

    if (!title || !synopsis || !coverUrl) {
      redirect("/writer/new?error=missing");
    }

    let baseSlug = slugify(title) || `cerita-${Date.now()}`;
    let slug = baseSlug;
    let suffix = 1;
    while (await db.novel.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const novel = await db.novel.create({
      data: {
        slug, title, synopsis, coverUrl,
        bannerUrl: coverUrl,
        status, language, contentRating,
        freeChapters: Math.max(0, Math.min(20, freeChapters)),
        coinPerChapter: Math.max(1, Math.min(20, coinPerChapter)),
        authorId: u.id,
        publishedAt: null,
        genres: { create: genreIds.map((gid) => ({ genreId: gid })) },
      },
    });

    if (u.role === "reader") {
      await db.user.update({ where: { id: u.id }, data: { role: "writer" } });
    }

    redirect(`/writer/${novel.slug}`);
  }

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
      <Link href="/writer" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Writer Studio
      </Link>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight">Cerita Baru</h1>
      <p className="text-[var(--muted)] mt-1 mb-8">Lengkapi info dasar dulu — bisa diedit kapan saja.</p>

      {error === "missing" && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          Lengkapi judul, sinopsis, dan cover dulu ya.
        </div>
      )}

      <AISuggestButton availableGenres={genres.map((g) => ({ name: g.name }))} />

      <form action={createNovel} className="space-y-6">
        <Field label="Judul" hint="Contoh: 'The Moonlit Heir'. Yang menarik perhatian dalam 5 detik.">
          <input
            name="title" required maxLength={100}
            placeholder="Judul cerita kamu..."
            className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition text-lg font-semibold"
          />
        </Field>

        <Field label="Sinopsis" hint="2–4 kalimat yang bikin pembaca penasaran. Hindari spoiler besar.">
          <textarea
            name="synopsis" required maxLength={500} rows={4}
            placeholder="Ceritakan premis cerita kamu..."
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition resize-y"
          />
        </Field>

        <Field label="Cover" hint="Cover yang bagus = pembaca lebih banyak.">
          <CoverPicker name="coverUrl" />
        </Field>

        <Field label="Genre" hint="Pilih maksimal 3. Pembaca cari cerita lewat genre.">
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <label
                key={g.id}
                className="cursor-pointer px-3 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm has-[:checked]:bg-[var(--primary)] has-[:checked]:text-black has-[:checked]:border-transparent has-[:checked]:font-bold transition flex items-center"
              >
                <input type="checkbox" name="genres" value={g.id} className="hidden" />
                {g.name}
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Status">
            <select name="status" defaultValue="ongoing" className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none">
              <option value="ongoing">Berlangsung</option>
              <option value="completed">Tamat</option>
              <option value="hiatus">Hiatus</option>
            </select>
          </Field>
          <Field label="Bahasa">
            <select name="language" defaultValue="id" className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none">
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label="Rating Konten">
            <select name="contentRating" defaultValue="everyone" className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none">
              <option value="everyone">Semua Umur</option>
              <option value="teen">Remaja (13+)</option>
              <option value="mature">Dewasa (18+)</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Bab Gratis" hint="Jumlah bab pertama yang gratis dibaca.">
            <input
              name="freeChapters" type="number" min={0} max={20} defaultValue={3}
              className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
            />
          </Field>
          <Field label="Coin per Bab" hint="Berapa coin untuk buka bab berbayar.">
            <input
              name="coinPerChapter" type="number" min={1} max={20} defaultValue={2}
              className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="submit"
            className="h-12 px-8 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            Simpan & Lanjut Tulis Bab
          </button>
          <Link href="/writer" className="h-12 px-6 rounded-full border border-[var(--border)] text-sm font-semibold flex items-center hover:bg-[var(--surface)] transition">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[var(--muted)] mb-2">{hint}</p>}
      {children}
    </div>
  );
}

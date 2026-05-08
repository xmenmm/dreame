import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus, Eye, BookOpen, Star, ExternalLink, Edit, Trash2, Send, ArrowDownToLine } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber, slugify } from "@/lib/utils";
import { CoverPicker } from "@/components/writer/cover-picker";

export const dynamic = "force-dynamic";

export default async function ManageNovelPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; tab?: string }>;
}) {
  const { slug } = await params;
  const { saved, tab = "chapters" } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/writer/${slug}`);

  const novel = await db.novel.findUnique({
    where: { slug },
    include: {
      chapters: { orderBy: { number: "asc" } },
      genres: { include: { genre: true } },
    },
  });
  if (!novel) notFound();
  if (novel.authorId !== user.id && user.role !== "admin") {
    redirect("/writer");
  }

  const allGenres = await db.genre.findMany({ orderBy: { name: "asc" } });
  const novelGenreIds = new Set(novel.genres.map((g) => g.genreId));

  async function updateNovel(formData: FormData) {
    "use server";
    const u = await getCurrentUser();
    if (!u) redirect("/login");

    const title = String(formData.get("title") || "").trim();
    const synopsis = String(formData.get("synopsis") || "").trim();
    const coverUrl = String(formData.get("coverUrl") || "").trim();
    const status = String(formData.get("status") || "ongoing");
    const contentRating = String(formData.get("contentRating") || "everyone");
    const freeChapters = parseInt(String(formData.get("freeChapters") || "3"), 10);
    const coinPerChapter = parseInt(String(formData.get("coinPerChapter") || "2"), 10);
    const genreIds = formData.getAll("genres").map(String);

    const cur = await db.novel.findUnique({ where: { slug }, select: { id: true, slug: true, authorId: true, title: true } });
    if (!cur || (cur.authorId !== u.id && u.role !== "admin")) redirect("/writer");

    let nextSlug = cur.slug;
    if (title && title !== cur.title) {
      let base = slugify(title) || cur.slug;
      let s = base, suf = 1;
      while ((await db.novel.findUnique({ where: { slug: s } }))?.id && s !== cur.slug) {
        suf += 1;
        s = `${base}-${suf}`;
      }
      nextSlug = s;
    }

    await db.$transaction([
      db.novel.update({
        where: { id: cur.id },
        data: {
          slug: nextSlug, title, synopsis, coverUrl, bannerUrl: coverUrl,
          status, contentRating,
          freeChapters: Math.max(0, Math.min(20, freeChapters)),
          coinPerChapter: Math.max(1, Math.min(20, coinPerChapter)),
        },
      }),
      db.novelGenre.deleteMany({ where: { novelId: cur.id } }),
      ...genreIds.map((gid) => db.novelGenre.create({ data: { novelId: cur.id, genreId: gid } })),
    ]);

    redirect(`/writer/${nextSlug}?saved=1&tab=details`);
  }

  async function togglePublish() {
    "use server";
    const u = await getCurrentUser();
    if (!u) redirect("/login");
    const cur = await db.novel.findUnique({ where: { slug }, select: { id: true, authorId: true, publishedAt: true, slug: true } });
    if (!cur || (cur.authorId !== u.id && u.role !== "admin")) redirect("/writer");
    await db.novel.update({
      where: { id: cur.id },
      data: { publishedAt: cur.publishedAt ? null : new Date() },
    });
    redirect(`/writer/${cur.slug}?saved=1`);
  }

  async function deleteNovel() {
    "use server";
    const u = await getCurrentUser();
    if (!u) redirect("/login");
    const cur = await db.novel.findUnique({ where: { slug }, select: { id: true, authorId: true } });
    if (!cur || (cur.authorId !== u.id && u.role !== "admin")) redirect("/writer");
    await db.novel.delete({ where: { id: cur.id } });
    redirect("/writer");
  }

  const chapterCount = novel.chapters.length;
  const publishedChapters = novel.chapters.filter((c) => c.isPublished).length;

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <Link href="/writer" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Writer Studio
      </Link>

      <div className="flex flex-col md:flex-row gap-6 items-start mb-8">
        <div className="relative w-32 md:w-44 aspect-[2/3] rounded-xl overflow-hidden ring-1 ring-[var(--border)] shrink-0 bg-[var(--surface-2)]">
          {novel.coverUrl && <Image src={novel.coverUrl} alt={novel.title} fill sizes="180px" className="object-cover" unoptimized />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md ${novel.publishedAt ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
              {novel.publishedAt ? "Tayang" : "Draft"}
            </span>
            {novel.genres.map(({ genre }) => (
              <span key={genre.id} className="text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-md bg-[var(--surface-2)] text-[var(--muted)]">
                {genre.name}
              </span>
            ))}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{novel.title}</h1>
          <p className="text-sm text-[var(--muted)] mt-2 line-clamp-3 max-w-2xl">{novel.synopsis}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1"><BookOpen className="size-3" /> {publishedChapters}/{chapterCount} bab tayang</span>
            <span className="flex items-center gap-1"><Eye className="size-3" /> {formatNumber(novel.views)} dibaca</span>
            <span className="flex items-center gap-1"><Star className="size-3" /> {novel.rating.toFixed(1)} ({novel.ratingCount} rating)</span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <form action={togglePublish}>
              <button
                type="submit"
                disabled={chapterCount === 0 && !novel.publishedAt}
                className="h-10 px-4 rounded-full bg-[var(--primary)] text-black text-sm font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50 inline-flex items-center gap-2 transition"
              >
                {novel.publishedAt ? (<><ArrowDownToLine className="size-4" /> Unpublish</>) : (<><Send className="size-4" /> Publish</>)}
              </button>
            </form>
            {novel.publishedAt && (
              <Link
                href={`/novel/${novel.slug}`}
                target="_blank"
                className="h-10 px-4 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold inline-flex items-center gap-2 transition"
              >
                <ExternalLink className="size-4" /> Lihat di Site
              </Link>
            )}
          </div>

          {chapterCount === 0 && !novel.publishedAt && (
            <p className="text-[11px] text-amber-400 mt-2">Tambahkan minimal 1 bab dulu sebelum publish.</p>
          )}
          {saved && <p className="text-xs text-emerald-400 mt-2">✓ Tersimpan</p>}
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] mb-6 w-fit">
        <Link href={`/writer/${novel.slug}?tab=chapters`} className={`px-4 h-9 rounded-lg text-sm font-bold flex items-center transition ${tab === "chapters" ? "bg-[var(--surface-2)] text-foreground" : "text-[var(--muted)] hover:text-foreground"}`}>Bab</Link>
        <Link href={`/writer/${novel.slug}?tab=details`} className={`px-4 h-9 rounded-lg text-sm font-bold flex items-center transition ${tab === "details" ? "bg-[var(--surface-2)] text-foreground" : "text-[var(--muted)] hover:text-foreground"}`}>Detail</Link>
        <Link href={`/writer/${novel.slug}?tab=danger`} className={`px-4 h-9 rounded-lg text-sm font-bold flex items-center transition ${tab === "danger" ? "bg-red-500/20 text-red-400" : "text-[var(--muted)] hover:text-red-400"}`}>Hapus</Link>
      </div>

      {tab === "chapters" && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Daftar Bab</h2>
              <p className="text-xs text-[var(--muted)]">Bab 1-{novel.freeChapters} otomatis gratis. Sisanya {novel.coinPerChapter} coin/bab.</p>
            </div>
            <Link
              href={`/writer/${novel.slug}/chapter/new`}
              className="h-10 px-4 rounded-full bg-[var(--primary)] text-black text-sm font-bold hover:bg-[var(--primary-hover)] inline-flex items-center gap-2 transition"
            >
              <Plus className="size-4" /> Bab Baru
            </Link>
          </div>

          {chapterCount === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-10 text-center">
              <p className="text-sm text-[var(--muted)] mb-4">Belum ada bab. Mulai tulis bab pertama.</p>
              <Link
                href={`/writer/${novel.slug}/chapter/new`}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
              >
                <Plus className="size-4" /> Tulis Bab 1
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)] bg-[var(--surface)]">
              {novel.chapters.map((c) => {
                const isFree = c.number <= novel.freeChapters;
                return (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-lg bg-[var(--surface-2)] grid place-items-center text-xs font-bold text-[var(--muted)] shrink-0">
                        {c.number}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.title}</div>
                        <div className="text-xs text-[var(--muted)] flex items-center gap-2">
                          <span>{formatNumber(c.wordCount)} kata</span>
                          <span>·</span>
                          <span className={isFree ? "text-emerald-400" : "text-[var(--primary)]"}>
                            {isFree ? "GRATIS" : `${novel.coinPerChapter} coin`}
                          </span>
                          {!c.isPublished && <><span>·</span><span className="text-amber-400">DRAFT</span></>}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/writer/${novel.slug}/chapter/${c.number}/edit`}
                      className="size-9 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-2)] hover:text-[var(--primary)] grid place-items-center transition"
                    >
                      <Edit className="size-4" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "details" && (
        <section>
          <h2 className="text-lg font-bold mb-4">Edit Detail Cerita</h2>
          <form action={updateNovel} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-1.5">Judul</label>
              <input name="title" defaultValue={novel.title} required maxLength={100}
                className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">Sinopsis</label>
              <textarea name="synopsis" defaultValue={novel.synopsis} required maxLength={500} rows={4}
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">Cover</label>
              <CoverPicker name="coverUrl" defaultValue={novel.coverUrl} novelTitle={novel.title} novelGenres={novel.genres.map(g => g.genre.name)} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Genre</label>
              <div className="flex flex-wrap gap-2">
                {allGenres.map((g) => (
                  <label key={g.id} className="cursor-pointer px-3 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm has-[:checked]:bg-[var(--primary)] has-[:checked]:text-black has-[:checked]:border-transparent has-[:checked]:font-bold transition flex items-center">
                    <input type="checkbox" name="genres" value={g.id} defaultChecked={novelGenreIds.has(g.id)} className="hidden" />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1.5">Status</label>
                <select name="status" defaultValue={novel.status} className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none">
                  <option value="ongoing">Berlangsung</option>
                  <option value="completed">Tamat</option>
                  <option value="hiatus">Hiatus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">Rating Konten</label>
                <select name="contentRating" defaultValue={novel.contentRating} className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none">
                  <option value="everyone">Semua Umur</option>
                  <option value="teen">Remaja (13+)</option>
                  <option value="mature">Dewasa (18+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">Bab Gratis</label>
                <input name="freeChapters" type="number" min={0} max={20} defaultValue={novel.freeChapters}
                  className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1.5">Coin per Bab</label>
                <input name="coinPerChapter" type="number" min={1} max={20} defaultValue={novel.coinPerChapter}
                  className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" />
              </div>
            </div>
            <button type="submit" className="h-12 px-8 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition">
              Simpan Perubahan
            </button>
          </form>
        </section>
      )}

      {tab === "danger" && (
        <section>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
            <h2 className="text-lg font-bold text-red-400 mb-2">Hapus Cerita</h2>
            <p className="text-sm text-[var(--muted)] mb-4">
              Tindakan ini permanen. Semua bab, bookmark pembaca, dan history akan ikut terhapus.
            </p>
            <form action={deleteNovel}>
              <button
                type="submit"
                className="h-10 px-5 rounded-full bg-red-500 text-foreground font-bold hover:bg-red-600 inline-flex items-center gap-2 transition"
              >
                <Trash2 className="size-4" /> Hapus Permanen
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

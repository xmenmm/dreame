import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, LayoutGrid } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getHomeLayout, DEFAULT_HOME_LAYOUT } from "@/lib/site-config";
import { HomeLayoutEditor } from "@/components/admin/home-layout-editor";

export const dynamic = "force-dynamic";

export default async function AdminHomeLayoutPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/home-layout");
  if (user.role !== "admin") redirect("/");

  const [layout, novels, genres] = await Promise.all([
    getHomeLayout(),
    db.novel.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { rating: "desc" },
      take: 30,
      select: { slug: true, title: true },
    }),
    db.genre.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  return (
    <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Admin
      </Link>

      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
          <LayoutGrid className="size-7" /> Home Layout
        </h1>
        <Link href="/" target="_blank" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold transition">
          <ExternalLink className="size-4" /> Lihat Live
        </Link>
      </div>
      <p className="text-[var(--muted)] mb-6">
        Atur urutan & tipe section di halaman Home. Perubahan langsung tayang di <strong>Web + Android + iOS</strong> (semua client baca konfigurasi yang sama).
      </p>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4 mb-6 text-xs text-[var(--muted)]">
        💡 <strong className="text-foreground">Server-driven UI:</strong> Section di-render dari konfigurasi ini.
        Mau pasang banner promo? Atau tukar urutan? Edit di sini → sekali save, 3 platform sync.
      </div>

      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
          ✓ Tersimpan. Refresh <Link href="/" target="_blank" className="underline">Home</Link> untuk lihat hasil.
        </div>
      )}

      <HomeLayoutEditor
        initialLayout={layout}
        defaultLayout={DEFAULT_HOME_LAYOUT}
        novels={novels}
        genres={genres}
      />
    </div>
  );
}

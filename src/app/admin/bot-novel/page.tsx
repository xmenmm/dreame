import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bot } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { BotNovelForm } from "@/components/admin/bot-novel-form";

export const dynamic = "force-dynamic";

export default async function BotNovelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/bot-novel");
  if (user.role !== "admin") redirect("/");

  const genres = await db.genre.findMany({ orderBy: { name: "asc" } });

  // History: novels by AI bot
  const aiBot = await db.user.findUnique({ where: { username: "dreame_ai" } });
  const recentNovels = aiBot
    ? await db.novel.findMany({
        where: { authorId: aiBot.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { _count: { select: { chapters: true } } },
      })
    : [];

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Admin
      </Link>

      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
        <Bot className="size-7 text-[var(--primary)]" /> AI Novelist Bot
      </h1>
      <p className="text-[var(--muted)] mt-1 mb-8">
        Bot generate novel original lengkap dengan cover & gambar tiap bab. Powered by Pollinations.ai (gratis, tanpa API key).
      </p>

      <div className="rounded-2xl bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 border border-[var(--primary)]/30 p-5 mb-8 text-sm">
        <h3 className="font-bold mb-2">Cara kerja:</h3>
        <ol className="list-decimal list-inside space-y-1 text-[var(--muted)]">
          <li>Pilih genre + jumlah bab + tone</li>
          <li>Klik <strong className="text-[var(--primary)]">Generate</strong> → bot mulai bekerja (~1-3 menit untuk 5-10 bab)</li>
          <li>Bot bikin <strong className="text-cyan-400">"story bible"</strong> dulu (tokoh utama, setting, konflik utama) — ini jadi referensi semua bab</li>
          <li>Cover novel → bab 1 dengan gambar adegan</li>
          <li>Bab 2+: bot dapat <strong className="text-cyan-400">ringkasan cerita sejauh ini + ending bab sebelumnya</strong> → tiap bab nyambung</li>
          <li>Selesai → novel auto-publish, muncul di Discover</li>
        </ol>
        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
          <strong className="text-emerald-400">✨ Continuity v2:</strong>
          <ul className="list-disc list-inside text-[var(--muted)] mt-1 space-y-0.5">
            <li>Tokoh konsisten — bot inget nama dari bab pertama</li>
            <li>Plot threads di-track — yang belum selesai dilanjutkan, yang udah selesai jangan diulang</li>
            <li>Arc 3 babak — bab awal hook, tengah eskalasi, terakhir klimaks + resolusi</li>
            <li>Bab terakhir gak boleh buka plot baru — wajib resolve</li>
          </ul>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          ⚠️ Pollinations rate-limit kadang aktif kalau spam. Tunggu beberapa menit kalau gagal.
          Author bot: <strong>"Lentera AI Storyteller"</strong> (@dreame_ai)
        </p>
      </div>

      <BotNovelForm genres={genres.map((g) => ({ id: g.id, name: g.name }))} />

      {recentNovels.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold mb-3">Riwayat Novel Bot</h2>
          <ul className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {recentNovels.map((n) => (
              <li key={n.id}>
                <Link href={`/novel/${n.slug}`} target="_blank" className="flex items-center gap-3 p-3 hover:bg-[var(--surface-2)] transition">
                  <div className="size-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black shrink-0">
                    <Bot className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{n.title}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {n._count.chapters} bab · {new Date(n.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                      {!n.publishedAt && <span className="text-amber-400"> · DRAFT</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Sparkles, Loader2, Bot } from "lucide-react";

const TONES = [
  { v: "dramatic",   label: "Dramatis" },
  { v: "light",      label: "Ringan" },
  { v: "romantic",   label: "Romantis" },
  { v: "dark",       label: "Gelap" },
  { v: "mysterious", label: "Misterius" },
  { v: "comedic",    label: "Komedi" },
] as const;

function setReactValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function AIChapterAssist({
  novelSlug,
  chapterNumber,
  novelTitle,
  hasPreviousChapters,
}: {
  novelSlug: string;
  chapterNumber: number;
  novelTitle: string;
  hasPreviousChapters: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<typeof TONES[number]["v"]>("dramatic");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function generate() {
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const r = await fetch("/api/writer/ai-suggest-chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novelSlug, chapterNumber, tone, hint: hint || undefined }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.detail || j.error || `Server error ${r.status}`);
        setLoading(false);
        return;
      }
      const data = await r.json();

      const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
      const contentInput = document.querySelector<HTMLTextAreaElement>('textarea[name="content"]');
      if (titleInput) setReactValue(titleInput, data.title);
      if (contentInput) setReactValue(contentInput, data.content);

      setSuccess(true);
      setOpen(false);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-br from-[var(--primary)]/8 to-[var(--accent)]/5 p-4 mb-6">
      {!open ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-[var(--primary)]/20 grid place-items-center text-[var(--primary)] shrink-0">
              <Bot className="size-5" />
            </div>
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-[var(--primary)]" /> Bot bantu tulis Bab {chapterNumber}
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {hasPreviousChapters
                  ? `Bot baca "${novelTitle}" + bab sebelumnya → bikin bab yang nyambung.`
                  : `Bot baca sinopsis "${novelTitle}" → bikin bab pembuka yang nge-hook.`}
                {success && <span className="text-emerald-400 ml-2">✓ Bab terisi</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-10 px-5 rounded-full bg-[var(--primary)] text-black font-bold text-sm inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] transition self-start md:self-auto shrink-0"
          >
            <Sparkles className="size-4" /> Generate Bab dengan AI
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Bot className="size-4 text-[var(--primary)]" /> Generate Bab {chapterNumber}
            <span className="text-xs font-normal text-[var(--muted)]">
              {hasPreviousChapters ? "(nyambung dari bab sebelumnya)" : "(bab pembuka)"}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as typeof tone)}
                className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
              >
                {TONES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Petunjuk plot (opsional)</label>
              <input
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder={hasPreviousChapters ? "Mis: tokoh utama ketemu villain..." : "Mis: protagonis menemukan surat misterius..."}
                maxLength={250}
                className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-[var(--muted)]">
            ⚠ Akan timpa isi Judul Bab + Isi Bab kalau sudah ada. Bisa edit setelah generate.
          </p>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error.includes("rate") || error.includes("429")
                ? "AI sedang sibuk (rate limit Pollinations). Tunggu 1-2 menit, coba lagi."
                : error.includes("not_found")
                ? "Novel tidak ditemukan."
                : error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="h-10 px-5 rounded-full bg-[var(--primary)] text-black font-bold text-sm inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] disabled:opacity-50 transition"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {loading ? "Bot lagi mengarang... (15-40 detik)" : "Generate Bab Ini"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="h-10 px-4 rounded-full text-sm text-[var(--muted)] hover:text-foreground"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

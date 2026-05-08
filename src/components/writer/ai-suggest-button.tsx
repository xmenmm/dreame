"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

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

export function AISuggestButton({ availableGenres }: { availableGenres: Array<{ name: string }> }) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<typeof TONES[number]["v"]>("dramatic");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);

    const checkedGenres = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="genres"]:checked'))
      .map((el) => el.parentElement?.textContent?.trim())
      .filter((x): x is string => !!x);

    let genres = checkedGenres;
    if (genres.length === 0) {
      genres = ["Romance"];
    }

    try {
      const r = await fetch("/api/writer/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genres: genres.slice(0, 3), tone, language: "id", theme: theme || undefined }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.detail || j.error || `Server error ${r.status}`);
        setLoading(false);
        return;
      }
      const data = await r.json();

      const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
      const synopsisInput = document.querySelector<HTMLTextAreaElement>('textarea[name="synopsis"]');
      if (titleInput) setReactValue(titleInput, data.title);
      if (synopsisInput) setReactValue(synopsisInput, data.synopsis);

      // Try to populate cover picker prompt + auto-generate
      const coverPromptInput = document.querySelector<HTMLTextAreaElement>('textarea[data-cover-prompt="true"]');
      if (coverPromptInput) setReactValue(coverPromptInput, data.coverPrompt);
      const coverGenerateBtn = document.querySelector<HTMLButtonElement>('button[data-cover-generate="true"]');
      if (coverGenerateBtn) {
        // small delay so the textarea state propagates
        setTimeout(() => coverGenerateBtn.click(), 100);
      }

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
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="size-4 text-[var(--primary)]" /> Bantuan AI
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">Bot bantuin bikin konsep cerita — judul, sinopsis, dan cover otomatis.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-10 px-5 rounded-full bg-[var(--primary)] text-black font-bold text-sm inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] transition self-start md:self-auto"
          >
            <Sparkles className="size-4" /> Generate Konsep dengan AI
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--primary)]" /> Generate Konsep
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Pilih genre dulu di bawah (kalau belum) supaya bot punya arah. Bot akan isi judul + sinopsis + cover.
          </p>

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
              <label className="block text-xs font-bold mb-1">Tema (opsional)</label>
              <input
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Mis: cinta beda agama, pengkhianatan kerajaan..."
                maxLength={150}
                className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error.includes("rate") || error.includes("429")
                ? "AI sedang sibuk (rate limit). Tunggu 1-2 menit, coba lagi."
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
              {loading ? "Generating... (10-30 detik)" : "Generate"}
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

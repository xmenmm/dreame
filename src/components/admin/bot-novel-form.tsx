"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Sparkles, Loader2, ExternalLink, AlertTriangle, Check } from "lucide-react";

type Props = { genres: Array<{ id: string; name: string }> };

type LogEntry = { kind: "status" | "meta-ready" | "novel-created" | "chapter" | "warning" | "error" | "done"; message?: string; [k: string]: unknown };

const TONES = [
  { v: "dramatic",    label: "Dramatis"     },
  { v: "light",       label: "Ringan"       },
  { v: "romantic",    label: "Romantis"     },
  { v: "dark",        label: "Gelap"        },
  { v: "mysterious",  label: "Misterius"    },
  { v: "comedic",     label: "Komedi"       },
] as const;

export function BotNovelForm({ genres }: Props) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [done, setDone] = useState<{ slug: string; title: string } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const append = (entry: LogEntry) => {
    setLogs((l) => [...l, entry]);
    setTimeout(() => logRef.current?.scrollTo({ top: 99999 }), 50);
  };

  async function start(formData: FormData) {
    setLogs([]);
    setDone(null);
    setRunning(true);

    const selectedGenres = formData.getAll("genres").map(String);
    if (selectedGenres.length === 0) {
      append({ kind: "error", message: "Pilih minimal 1 genre." });
      setRunning(false);
      return;
    }

    const body = {
      genres: selectedGenres,
      tone: String(formData.get("tone") || "dramatic"),
      language: String(formData.get("language") || "id"),
      chapterCount: parseInt(String(formData.get("chapterCount") || "5"), 10),
      theme: String(formData.get("theme") || "").trim() || undefined,
    };

    try {
      const res = await fetch("/api/admin/bot-novel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok || !res.body) {
        append({ kind: "error", message: `Server error: ${res.status}` });
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = chunk.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as LogEntry;
            append(data);
            if (data.kind === "done") {
              setDone({ slug: String(data.slug), title: String(data.title) });
            }
          } catch {}
        }
      }
    } catch (e) {
      append({ kind: "error", message: String(e) });
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <form action={start} className={running ? "pointer-events-none opacity-60" : ""}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">Genre</label>
            <p className="text-xs text-[var(--muted)] mb-2">Pilih 1-3 genre. Bot akan menggabungkan ide-nya.</p>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <label key={g.id} className="cursor-pointer px-3 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm has-[:checked]:bg-[var(--primary)] has-[:checked]:text-black has-[:checked]:border-transparent has-[:checked]:font-bold transition flex items-center">
                  <input type="checkbox" name="genres" value={g.name} className="hidden" />
                  {g.name}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1.5">Tone</label>
              <select name="tone" defaultValue="dramatic" className="w-full h-11 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none">
                {TONES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">Bahasa</label>
              <select name="language" defaultValue="id" className="w-full h-11 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none">
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5">Jumlah Bab</label>
              <input
                type="number" name="chapterCount" min={3} max={15} defaultValue={5}
                className="w-full h-11 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5">Tema / Inspirasi <span className="text-[var(--muted)] font-normal">(opsional)</span></label>
            <p className="text-xs text-[var(--muted)] mb-2">Kasih bot petunjuk tema. Mis: "perpisahan SMA", "perang antar kerajaan", "love at first sight di kafe".</p>
            <input
              name="theme"
              placeholder="Bebas, kosongkan kalau mau bot freestyle..."
              maxLength={200}
              className="w-full h-11 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={running}
            className="h-12 px-8 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] inline-flex items-center gap-2 transition disabled:opacity-50"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {running ? "Generating..." : "Generate Novel"}
          </button>
        </div>
      </form>

      {(running || logs.length > 0) && (
        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2 text-sm font-bold">
            {running ? <Loader2 className="size-4 animate-spin text-[var(--primary)]" /> : done ? <Check className="size-4 text-emerald-400" /> : null}
            {running ? "Bot sedang bekerja..." : done ? "Selesai!" : "Log"}
          </div>
          <div ref={logRef} className="max-h-80 overflow-y-auto p-4 space-y-1.5 text-sm font-mono">
            {logs.map((entry, i) => {
              if (entry.kind === "error") {
                const msg = String(entry.message);
                const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate-limit") || msg.toLowerCase().includes("rate limit");
                return (
                  <div key={i} className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm font-sans">
                    <div className="flex items-start gap-2 text-red-400">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <strong>{isRateLimit ? "Pollinations Rate Limit" : "Error"}</strong>
                    </div>
                    {isRateLimit ? (
                      <div className="mt-2 text-xs text-[var(--muted)] space-y-1.5">
                        <p>🪫 Server AI gratis (Pollinations.ai) lagi <strong className="text-red-400">kelelahan</strong> — kebanyakan user pake bareng-bareng.</p>
                        <p className="font-semibold text-foreground">Cara fix:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li><strong className="text-amber-400">Tunggu 2-5 menit</strong> lalu klik "Generate Novel" lagi</li>
                          <li>Coba kurangi jumlah bab (3 bab dulu, baru tambah)</li>
                          <li>Coba di jam lebih sepi (malam Indonesia jam 22:00+)</li>
                        </ul>
                        <p className="text-[10px] text-[var(--muted)] pt-1">
                          Pollinations gratis tanpa API key — tradeoff-nya kadang antri. Untuk produksi, switch ke OpenAI/Claude API berbayar (gak akan kena rate-limit).
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-[var(--muted)]">{msg}</p>
                    )}
                  </div>
                );
              }
              if (entry.kind === "warning") {
                return <div key={i} className="text-amber-400">⚠ {String(entry.message)}</div>;
              }
              if (entry.kind === "meta-ready") {
                return (
                  <div key={i} className="text-cyan-400">
                    📚 Story bible: <strong>{String(entry.title)}</strong>
                    <br/>
                    <span className="text-xs text-[var(--muted)]">
                      &nbsp;&nbsp;&nbsp;Tokoh: {String(entry.protagonist || "—")} · Setting: {String(entry.setting || "—")}
                    </span>
                  </div>
                );
              }
              if (entry.kind === "novel-created") {
                return <div key={i} className="text-emerald-400">✓ Novel dibuat: <strong>{String(entry.title)}</strong></div>;
              }
              if (entry.kind === "chapter") {
                return (
                  <div key={i} className="text-[var(--muted)]">
                    └ <span className="text-emerald-400">Bab {String(entry.number)}</span>: {String(entry.title)}
                    {entry.summary ? <div className="ml-4 text-[10px] italic">"{String(entry.summary)}"</div> : null}
                  </div>
                );
              }
              if (entry.kind === "done") {
                return <div key={i} className="text-emerald-400 font-bold">✓ {String(entry.message)}</div>;
              }
              return <div key={i} className="text-[var(--muted)]">{String(entry.message)}</div>;
            })}
          </div>
          {done && (
            <div className="border-t border-[var(--border)] p-4 flex items-center gap-3 bg-[var(--surface-2)]">
              <Link
                href={`/novel/${done.slug}`}
                target="_blank"
                className="flex-1 h-10 rounded-full bg-[var(--primary)] text-black font-bold inline-flex items-center justify-center gap-2 hover:bg-[var(--primary-hover)] transition"
              >
                <ExternalLink className="size-4" /> Lihat "{done.title}"
              </Link>
              <button
                onClick={() => { setLogs([]); setDone(null); }}
                className="h-10 px-4 rounded-full text-sm text-[var(--muted)] hover:text-foreground"
              >
                Generate Lagi
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

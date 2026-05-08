"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Sparkles, Link as LinkIcon, RefreshCcw, Check, Loader2, Upload } from "lucide-react";

const POLLINATIONS = "https://image.pollinations.ai/prompt/";

function buildPollinationsUrl(prompt: string, seed?: number) {
  const p = encodeURIComponent(prompt);
  const s = seed ?? Math.floor(Math.random() * 1_000_000);
  return `${POLLINATIONS}${p}?width=512&height=768&nologo=true&model=flux&seed=${s}`;
}

export function CoverPicker({
  name,
  defaultValue,
  novelTitle,
  novelGenres,
}: {
  name: string;
  defaultValue?: string;
  novelTitle?: string;
  novelGenres?: string[];
}) {
  const [tab, setTab] = useState<"ai" | "url" | "upload">(defaultValue ? "url" : "ai");
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [prompt, setPrompt] = useState(
    novelTitle && novelGenres?.length
      ? `${novelGenres.join(", ")} novel cover, "${novelTitle}", cinematic, dramatic lighting, painterly, book cover art`
      : "fantasy novel cover, cinematic, painterly, book cover art",
  );
  const [genUrl, setGenUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const finalUrl = tab === "ai" ? genUrl : tab === "upload" ? uploadedUrl : url;

  // Pool of Unsplash fallback covers if Pollinations fails
  const FALLBACK_COVERS = [
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&q=80",
    "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=600&q=80",
    "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=600&q=80",
  ];

  function useFallback() {
    setLoading(false);
    setImageError(false);
    const u = FALLBACK_COVERS[Math.floor(Math.random() * FALLBACK_COVERS.length)];
    setGenUrl(u);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", f);
    const r = await fetch("/api/writer/upload-cover", { method: "POST", body: fd });
    if (r.ok) {
      const d = await r.json();
      setUploadedUrl(d.url);
    } else {
      alert("Upload gagal. Pastikan file < 5MB & format jpg/png/webp.");
    }
    setUploading(false);
  }

  function generate() {
    setLoading(true);
    setImageError(false);
    setConfirmed(false);
    const u = buildPollinationsUrl(prompt);
    setGenUrl(u);
  }

  function regenerate() {
    setLoading(true);
    setImageError(false);
    setConfirmed(false);
    setGenUrl(buildPollinationsUrl(prompt));
  }

  return (
    <div>
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-2)] mb-3 w-fit">
        <button
          type="button"
          onClick={() => setTab("ai")}
          className={`px-3 h-8 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${tab === "ai" ? "bg-[var(--primary)] text-black" : "text-[var(--muted)] hover:text-foreground"}`}
        >
          <Sparkles className="size-3" /> Generate AI
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`px-3 h-8 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${tab === "upload" ? "bg-[var(--primary)] text-black" : "text-[var(--muted)] hover:text-foreground"}`}
        >
          <Upload className="size-3" /> Upload
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`px-3 h-8 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${tab === "url" ? "bg-[var(--primary)] text-black" : "text-[var(--muted)] hover:text-foreground"}`}
        >
          <LinkIcon className="size-3" /> URL
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <div className="relative w-32 md:w-40 aspect-[2/3] rounded-xl overflow-hidden bg-[var(--surface-2)] ring-1 ring-[var(--border)] shrink-0">
          {finalUrl ? (
            tab === "ai" ? (
              // Plain img for Pollinations to handle slow loads gracefully
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={finalUrl}
                src={finalUrl}
                alt="Cover preview"
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => { setLoading(false); setImageError(false); }}
                onError={() => { setLoading(false); setImageError(true); }}
              />
            ) : (
              <Image
                key={finalUrl}
                src={finalUrl}
                alt="Cover preview"
                fill
                sizes="160px"
                className="object-cover"
                unoptimized
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            )
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[10px] text-[var(--muted)] text-center px-2">
              {tab === "ai" ? "Generate cover dengan AI" : tab === "upload" ? "Upload gambar" : "Tempel URL gambar"}
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm">
              <div className="text-center px-2">
                <Loader2 className="size-6 animate-spin text-[var(--primary)] mx-auto mb-1" />
                <div className="text-[9px] text-white/80 font-semibold">AI melukis...</div>
                <div className="text-[8px] text-[var(--muted)]">10-30 detik</div>
              </div>
            </div>
          )}
          {confirmed && (
            <div className="absolute top-2 right-2 size-6 rounded-full bg-emerald-500 grid place-items-center">
              <Check className="size-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          {tab === "ai" ? (
            <>
              <label className="text-xs text-[var(--muted)]">
                Deskripsikan cover yang kamu mau (genre, suasana, gaya)
              </label>
              <textarea
                data-cover-prompt="true"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm resize-none"
              />
              <div className="flex gap-2">
                {!genUrl ? (
                  <button
                    type="button"
                    data-cover-generate="true"
                    onClick={generate}
                    disabled={!prompt.trim()}
                    className="h-9 px-4 rounded-lg bg-[var(--primary)] text-black text-sm font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50 inline-flex items-center gap-2 transition"
                  >
                    <Sparkles className="size-3.5" /> Generate
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={regenerate}
                      className="h-9 px-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold inline-flex items-center gap-2 transition"
                    >
                      <RefreshCcw className="size-3.5" /> Ulang
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmed(true)}
                      className="h-9 px-4 rounded-lg bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 inline-flex items-center gap-2 transition"
                    >
                      <Check className="size-3.5" /> Pakai Cover Ini
                    </button>
                  </>
                )}
              </div>
              {imageError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs space-y-2">
                  <p className="text-red-400">⚠ Gambar gagal dimuat. Pollinations sedang sibuk / rate-limit.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={regenerate} className="h-7 px-3 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface)] text-xs font-semibold inline-flex items-center gap-1">
                      <RefreshCcw className="size-3" /> Coba lagi
                    </button>
                    <button type="button" onClick={useFallback} className="h-7 px-3 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-semibold">
                      Pakai cover Unsplash
                    </button>
                  </div>
                </div>
              )}
              <p className="text-[10px] text-[var(--muted)]">
                Powered by Pollinations.ai (gratis, 10-30 detik first time). Kalau gagal, klik "Coba lagi" atau pakai cover Unsplash.
              </p>
            </>
          ) : tab === "upload" ? (
            <>
              <label className="text-xs text-[var(--muted)]">Upload file gambar (max 5MB, jpg/png/webp)</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFile}
                className="block w-full text-sm text-[var(--muted)] file:mr-3 file:h-9 file:px-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--surface)] file:text-foreground file:font-semibold file:hover:bg-[var(--surface-2)] file:cursor-pointer"
              />
              {uploading && <p className="text-xs text-[var(--muted)] flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Mengupload...</p>}
              {uploadedUrl && <p className="text-xs text-emerald-400">✓ Cover terupload</p>}
              <p className="text-[10px] text-[var(--muted)]">File akan disimpan di server. Pastikan kamu punya hak cipta atau lisensi commercial-use.</p>
            </>
          ) : (
            <>
              <label className="text-xs text-[var(--muted)]">URL gambar cover (jpg/png/webp)</label>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setConfirmed(false); }}
                placeholder="https://images.unsplash.com/..."
                className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
              />
              <p className="text-[10px] text-[var(--muted)]">
                Direkomendasikan rasio 2:3 (mis. 600×900px). Pakai gambar yang kamu punya hak cipta-nya.
              </p>
            </>
          )}
        </div>
      </div>

      <input type="hidden" name={name} value={finalUrl} required />
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2, Eye, EyeOff, RefreshCcw, Star, Image as ImageIcon, Gift, Sparkles, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import type { HomeLayout, HomeSection } from "@/lib/site-config";

const TYPE_LABELS: Record<HomeSection["type"], { label: string; icon: React.ElementType }> = {
  "hero":            { label: "Hero (Banner Atas)", icon: Star },
  "carousel":        { label: "Carousel Novel",     icon: BookOpen },
  "banner":          { label: "Banner Promo",       icon: ImageIcon },
  "daily-reward":    { label: "Hadiah Harian",      icon: Gift },
  "recommendations": { label: "Rekomendasi",        icon: Sparkles },
};

function makeSection(type: HomeSection["type"]): HomeSection {
  const id = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  switch (type) {
    case "hero":            return { id, type: "hero", auto: "featured", visible: true };
    case "carousel":        return { id, type: "carousel", title: "Trending Sekarang", sort: "trending", visible: true };
    case "banner":          return { id, type: "banner", image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80", link: "/discover", title: "Banner Title", subtitle: "Sub-title", visible: true };
    case "daily-reward":    return { id, type: "daily-reward", visible: true };
    case "recommendations": return { id, type: "recommendations", title: "Untuk Kamu", visible: true };
  }
}

export function HomeLayoutEditor({
  initialLayout,
  defaultLayout,
  novels,
  genres,
}: {
  initialLayout: HomeLayout;
  defaultLayout: HomeLayout;
  novels: Array<{ slug: string; title: string }>;
  genres: Array<{ slug: string; name: string }>;
}) {
  const [sections, setSections] = useState<HomeSection[]>(initialLayout.sections);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function move(idx: number, dir: -1 | 1) {
    const next = [...sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setSections(next);
  }

  function update<K extends HomeSection["type"]>(idx: number, patch: Partial<Extract<HomeSection, { type: K }>>) {
    setSections((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch } as HomeSection;
      return next;
    });
  }

  function remove(idx: number) {
    if (!confirm("Hapus section ini?")) return;
    setSections((prev) => prev.filter((_, i) => i !== idx));
  }

  function add(type: HomeSection["type"]) {
    setSections((prev) => [...prev, makeSection(type)]);
  }

  function reset() {
    if (!confirm("Reset ke default? Semua perubahan kamu hilang.")) return;
    setSections(defaultLayout.sections);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const r = await fetch("/api/admin/home-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || `Server error ${r.status}`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      setError(String(e));
    }
    setSaving(false);
  }

  return (
    <div>
      <ul className="space-y-3 mb-6">
        {sections.map((s, idx) => {
          const Meta = TYPE_LABELS[s.type];
          const isOpen = expanded[s.id] ?? false;
          return (
            <li
              key={s.id}
              className={`rounded-xl border bg-[var(--surface)] ${s.visible === false ? "border-[var(--border)] opacity-60" : "border-[var(--border)]"}`}
            >
              <div className="flex items-center gap-2 p-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-0.5 rounded text-[var(--muted)] hover:text-foreground disabled:opacity-30">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button onClick={() => move(idx, 1)} disabled={idx === sections.length - 1} className="p-0.5 rounded text-[var(--muted)] hover:text-foreground disabled:opacity-30">
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <Meta.icon className="size-5 text-[var(--primary)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{Meta.label}</div>
                  <div className="text-[10px] text-[var(--muted)] truncate">
                    {s.type === "carousel" && `"${s.title}" · ${s.sort}${s.genreSlug ? ` · ${s.genreSlug}` : ""}`}
                    {s.type === "hero" && (s.novelSlug ? `pilih: ${s.novelSlug}` : `auto: ${s.auto}`)}
                    {s.type === "banner" && (s.title || "(banner promo)")}
                    {s.type === "recommendations" && `"${s.title || "Untuk Kamu"}" · personalized`}
                    {s.type === "daily-reward" && "auto"}
                  </div>
                </div>
                <button
                  onClick={() => update(idx, { visible: s.visible === false ? true : false })}
                  className="size-8 rounded-lg hover:bg-[var(--surface-2)] grid place-items-center text-[var(--muted)]"
                  title={s.visible === false ? "Tampilkan" : "Sembunyikan"}
                >
                  {s.visible === false ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
                {(s.type === "hero" || s.type === "carousel" || s.type === "banner" || s.type === "recommendations") && (
                  <button
                    onClick={() => setExpanded((p) => ({ ...p, [s.id]: !isOpen }))}
                    className="size-8 rounded-lg hover:bg-[var(--surface-2)] grid place-items-center text-[var(--muted)]"
                    title={isOpen ? "Tutup edit" : "Edit"}
                  >
                    {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                )}
                <button
                  onClick={() => remove(idx)}
                  className="size-8 rounded-lg hover:bg-red-500/20 grid place-items-center text-[var(--muted)] hover:text-red-400"
                  title="Hapus"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-[var(--border)] p-4 space-y-3 text-sm bg-[var(--surface-2)]/30">
                  {s.type === "hero" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold mb-1">Mode</label>
                        <select
                          value={s.novelSlug ? "manual" : s.auto}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "manual") update(idx, { novelSlug: novels[0]?.slug, auto: "featured" } as any);
                            else update(idx, { novelSlug: undefined, auto: v as "featured" | "trending" } as any);
                          }}
                          className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                        >
                          <option value="featured">Auto: Featured (highest rated)</option>
                          <option value="trending">Auto: Trending (most viewed)</option>
                          <option value="manual">Pilih novel manual</option>
                        </select>
                      </div>
                      {s.novelSlug !== undefined && (
                        <div>
                          <label className="block text-xs font-bold mb-1">Novel</label>
                          <select
                            value={s.novelSlug}
                            onChange={(e) => update(idx, { novelSlug: e.target.value } as any)}
                            className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                          >
                            {novels.map((n) => <option key={n.slug} value={n.slug}>{n.title}</option>)}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {s.type === "carousel" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold mb-1">Judul section</label>
                        <input
                          value={s.title}
                          onChange={(e) => update(idx, { title: e.target.value } as any)}
                          className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                          maxLength={60}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1">Sort</label>
                          <select
                            value={s.sort}
                            onChange={(e) => update(idx, { sort: e.target.value as any } as any)}
                            className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                          >
                            <option value="trending">Trending (rating + views)</option>
                            <option value="popular">Popular (views)</option>
                            <option value="new">Baru Rilis</option>
                            <option value="featured">Featured</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1">Filter genre (opsional)</label>
                          <select
                            value={s.genreSlug || ""}
                            onChange={(e) => update(idx, { genreSlug: e.target.value || undefined } as any)}
                            className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                          >
                            <option value="">Semua genre</option>
                            {genres.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {s.type === "banner" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold mb-1">URL Gambar</label>
                        <input
                          value={s.image}
                          onChange={(e) => update(idx, { image: e.target.value } as any)}
                          className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold mb-1">Judul</label>
                          <input value={s.title || ""} onChange={(e) => update(idx, { title: e.target.value } as any)}
                            className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" maxLength={80} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1">Subtitle</label>
                          <input value={s.subtitle || ""} onChange={(e) => update(idx, { subtitle: e.target.value } as any)}
                            className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" maxLength={150} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Link</label>
                        <input value={s.link} onChange={(e) => update(idx, { link: e.target.value } as any)}
                          className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" placeholder="/discover" />
                      </div>
                    </>
                  )}

                  {s.type === "recommendations" && (
                    <div>
                      <label className="block text-xs font-bold mb-1">Judul section</label>
                      <input
                        value={s.title || ""}
                        onChange={(e) => update(idx, { title: e.target.value } as any)}
                        className="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                        maxLength={60}
                        placeholder="Untuk Kamu"
                      />
                      <p className="text-[10px] text-[var(--muted)] mt-1">Otomatis personalized berdasarkan history baca user.</p>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 p-4 mb-6">
        <div className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-3">Tambah Section</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as Array<HomeSection["type"]>).map((t) => {
            const M = TYPE_LABELS[t];
            return (
              <button
                key={t}
                onClick={() => add(t)}
                className="h-9 px-3 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-semibold inline-flex items-center gap-1.5 transition"
              >
                <Plus className="size-3" />
                <M.icon className="size-3.5" />
                {M.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="sticky bottom-0 bg-[var(--background)]/95 backdrop-blur border-t border-[var(--border)] p-4 -mx-4 md:-mx-8 flex items-center justify-between gap-3">
        <button onClick={reset} className="text-sm text-[var(--muted)] hover:text-foreground inline-flex items-center gap-1">
          <RefreshCcw className="size-3" /> Reset ke default
        </button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-400">✓ Tersimpan</span>}
          <button
            onClick={save}
            disabled={saving}
            className="h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50 transition"
          >
            {saving ? "Menyimpan..." : "Simpan Layout"}
          </button>
        </div>
      </div>
    </div>
  );
}

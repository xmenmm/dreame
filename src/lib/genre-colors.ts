/** Per-genre color theme (background tint, border, text). Tailwind classes — kept inline so they are detectable by JIT. */
type ColorSet = { bg: string; border: string; text: string; dot: string };

// Curated palette — one tone per genre slug. Fallback to neutral.
const PALETTES: Record<string, ColorSet> = {
  romance:   { bg: "bg-pink-500/15",   border: "border-pink-500/40",   text: "text-pink-400",   dot: "bg-pink-400" },
  fantasy:   { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400", dot: "bg-violet-400" },
  "sci-fi":  { bg: "bg-cyan-500/15",   border: "border-cyan-500/40",   text: "text-cyan-400",   dot: "bg-cyan-400" },
  scifi:     { bg: "bg-cyan-500/15",   border: "border-cyan-500/40",   text: "text-cyan-400",   dot: "bg-cyan-400" },
  thriller:  { bg: "bg-red-500/15",    border: "border-red-500/40",    text: "text-red-400",    dot: "bg-red-400" },
  horror:    { bg: "bg-rose-700/20",   border: "border-rose-700/50",   text: "text-rose-400",   dot: "bg-rose-500" },
  mystery:   { bg: "bg-indigo-500/15", border: "border-indigo-500/40", text: "text-indigo-400", dot: "bg-indigo-400" },
  drama:     { bg: "bg-amber-500/15",  border: "border-amber-500/40",  text: "text-amber-400",  dot: "bg-amber-400" },
  comedy:    { bg: "bg-yellow-500/15", border: "border-yellow-500/40", text: "text-yellow-400", dot: "bg-yellow-400" },
  adventure: { bg: "bg-emerald-500/15",border: "border-emerald-500/40",text: "text-emerald-400",dot: "bg-emerald-400" },
  historical:{ bg: "bg-stone-500/15",  border: "border-stone-500/40",  text: "text-stone-300",  dot: "bg-stone-400" },
  "slice-of-life": { bg: "bg-teal-500/15", border: "border-teal-500/40", text: "text-teal-400", dot: "bg-teal-400" },
  sliceoflife:     { bg: "bg-teal-500/15", border: "border-teal-500/40", text: "text-teal-400", dot: "bg-teal-400" },
  action:    { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-400", dot: "bg-orange-400" },
  isekai:    { bg: "bg-purple-500/15", border: "border-purple-500/40", text: "text-purple-400", dot: "bg-purple-400" },
  shoujo:    { bg: "bg-fuchsia-500/15",border: "border-fuchsia-500/40",text: "text-fuchsia-400",dot: "bg-fuchsia-400" },
  shounen:   { bg: "bg-blue-500/15",   border: "border-blue-500/40",   text: "text-blue-400",   dot: "bg-blue-400" },
};

const FALLBACK: ColorSet = { bg: "bg-[var(--surface)]", border: "border-[var(--border)]", text: "text-[var(--foreground)]", dot: "bg-[var(--muted)]" };

export function getGenreColor(slug: string): ColorSet {
  const key = slug.toLowerCase().trim();
  return PALETTES[key] ?? FALLBACK;
}

/** Joined class string for a pill/chip styled to genre. */
export function genrePillClass(slug: string, extra = ""): string {
  const c = getGenreColor(slug);
  return `${c.bg} ${c.border} ${c.text} border ${extra}`.trim();
}

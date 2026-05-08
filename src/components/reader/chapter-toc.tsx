import Link from "next/link";

export type SubHeading = { id: string; text: string };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/** Scan markdown content for `## Heading` lines and return list with slugged ids. */
export function extractSubHeadings(markdown: string): SubHeading[] {
  const out: SubHeading[] = [];
  const lines = markdown.split(/\r?\n/);
  const seen = new Map<string, number>();
  for (const raw of lines) {
    const line = raw.trim();
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (!m) continue;
    const text = m[1];
    const baseSlug = slugifyHeading(text) || "section";
    const count = (seen.get(baseSlug) ?? 0) + 1;
    seen.set(baseSlug, count);
    const id = count > 1 ? `${baseSlug}-${count}` : baseSlug;
    out.push({ id, text });
  }
  return out;
}

export function ChapterToc({
  headings,
  chapterNumber,
  chapterTitle,
}: {
  headings: SubHeading[];
  chapterNumber: number;
  chapterTitle: string;
}) {
  if (headings.length === 0) return null;
  return (
    <nav
      className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur p-5"
      aria-label="Daftar isi bab"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold">Daftar Isi Bab</div>
          <div className="text-sm font-semibold mt-0.5">
            Bab {chapterNumber} · <span className="text-[var(--muted)] font-normal">{chapterTitle}</span>
          </div>
        </div>
        <span className="text-xs text-[var(--muted)]">{headings.length} bagian</span>
      </div>
      <ol className="space-y-1.5 list-decimal list-inside">
        {headings.map((h) => (
          <li key={h.id} className="text-sm">
            <Link
              href={`#${h.id}`}
              className="text-[var(--foreground)] hover:text-[var(--primary)] transition underline-offset-4 hover:underline decoration-[var(--primary)]/40"
            >
              {h.text}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

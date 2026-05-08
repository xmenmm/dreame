"use client";

import { useState, useEffect } from "react";
import { Eye, Edit3 } from "lucide-react";

function renderPreview(md: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return md
    .split(/\n\n+/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (t.startsWith("# ")) return `<h1>${escape(t.slice(2))}</h1>`;
      if (t.startsWith("## ")) return `<h2>${escape(t.slice(3))}</h2>`;
      if (t === "---") return "<hr />";
      const inner = escape(t)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br />");
      return `<p>${inner}</p>`;
    })
    .join("\n");
}

function countWords(md: string): number {
  return md
    .replace(/[#*_`>-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function MarkdownEditor({
  name, defaultValue = "",
}: { name: string; defaultValue?: string }) {
  const [text, setText] = useState(defaultValue);
  const [view, setView] = useState<"edit" | "preview" | "split">("split");
  const [wc, setWc] = useState(countWords(defaultValue));

  useEffect(() => { setWc(countWords(text)); }, [text]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--surface-2)] w-fit">
          <button type="button" onClick={() => setView("edit")} className={`px-3 h-8 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${view === "edit" ? "bg-[var(--surface)] text-foreground" : "text-[var(--muted)] hover:text-foreground"}`}>
            <Edit3 className="size-3" /> Edit
          </button>
          <button type="button" onClick={() => setView("split")} className={`px-3 h-8 rounded-md text-xs font-bold flex items-center transition ${view === "split" ? "bg-[var(--surface)] text-foreground" : "text-[var(--muted)] hover:text-foreground"}`}>
            Split
          </button>
          <button type="button" onClick={() => setView("preview")} className={`px-3 h-8 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${view === "preview" ? "bg-[var(--surface)] text-foreground" : "text-[var(--muted)] hover:text-foreground"}`}>
            <Eye className="size-3" /> Preview
          </button>
        </div>
        <span className="text-xs text-[var(--muted)]">
          {wc} kata · ~{Math.ceil(wc / 200)} menit baca
        </span>
      </div>

      <div className={`grid gap-3 ${view === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {(view === "edit" || view === "split") && (
          <textarea
            name={name}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mulai tulis bab kamu di sini.

Pakai markdown:
# Judul Besar
## Sub-judul
**tebal**, *miring*, --- buat pemisah."
            rows={view === "split" ? 22 : 28}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-base leading-relaxed font-mono resize-none"
          />
        )}
        {(view === "preview" || view === "split") && (
          <div className={`px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] ${view === "split" ? "max-h-[600px] overflow-y-auto" : "min-h-[600px]"}`}>
            <div className="prose-reader" dangerouslySetInnerHTML={{ __html: renderPreview(text || "*Preview akan muncul di sini...*") }} />
          </div>
        )}
      </div>

      {view !== "edit" && view !== "split" && (
        <input type="hidden" name={name} value={text} />
      )}
    </div>
  );
}

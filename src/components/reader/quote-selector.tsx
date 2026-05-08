"use client";

import { useEffect, useRef, useState } from "react";
import { Quote, Check, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

type SelectionState = {
  text: string;
  x: number;
  y: number;
};

const MIN_LEN = 8;
const MAX_LEN = 800;

export function QuoteSelector({
  novelId,
  chapterId,
  novelTitle,
  chapterNumber,
}: {
  novelId: string;
  chapterId: string;
  novelTitle: string;
  chapterNumber: number;
}) {
  const [sel, setSel] = useState<SelectionState | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onSelectionChange() {
      const s = window.getSelection();
      if (!s || s.isCollapsed || s.rangeCount === 0) {
        // small delay so click on our button doesn't immediately close
        setTimeout(() => {
          const cur = window.getSelection();
          if (!cur || cur.isCollapsed) setSel(null);
        }, 50);
        return;
      }
      const text = s.toString().trim();
      if (text.length < MIN_LEN || text.length > MAX_LEN) { setSel(null); return; }

      // Confirm selection is INSIDE the chapter content (.prose-reader)
      const range = s.getRangeAt(0);
      const startEl = range.startContainer.parentElement;
      const insideReader = startEl?.closest(".prose-reader");
      if (!insideReader) { setSel(null); return; }

      const rect = range.getBoundingClientRect();
      // position above the selection, centered
      const x = rect.left + rect.width / 2;
      const y = rect.top - 8;
      setSel({ text, x, y });
    }
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  async function save() {
    if (!sel || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novelId, chapterId, body: sel.text }),
      });
      const data = await res.json();
      if (data.ok) {
        setSavedFlash(true);
        toast({
          kind: "success",
          emoji: "📝",
          title: data.duplicate ? "Sudah disimpan sebelumnya" : "Quote tersimpan!",
          body: `${novelTitle} — Bab ${chapterNumber}`,
          href: "/quotes",
        });
        // clear selection
        window.getSelection()?.removeAllRanges();
        setTimeout(() => { setSel(null); setSavedFlash(false); }, 800);
      } else {
        toast({ kind: "error", title: "Gagal simpan quote", body: data.error });
      }
    } catch {
      toast({ kind: "error", title: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  if (!sel) return null;

  // clamp x to viewport
  const vw = typeof window !== "undefined" ? window.innerWidth : 1000;
  const clampedX = Math.max(70, Math.min(vw - 70, sel.x));

  return (
    <div
      ref={containerRef}
      className="fixed z-[150] -translate-x-1/2 -translate-y-full pointer-events-none"
      style={{ left: clampedX, top: sel.y }}
    >
      <button
        onMouseDown={(e) => e.preventDefault()}  // don't lose selection
        onClick={save}
        disabled={saving}
        className={`pointer-events-auto inline-flex items-center gap-2 h-10 px-4 rounded-full font-bold text-sm shadow-2xl shadow-black/40 border border-[var(--primary)] backdrop-blur-md transition-all toast-pop ${
          savedFlash
            ? "bg-emerald-500 text-white border-emerald-500"
            : "bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)] hover:scale-105"
        }`}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : savedFlash ? <Check className="size-4" /> : <Quote className="size-4" />}
        {savedFlash ? "Tersimpan" : saving ? "Menyimpan..." : "Save quote"}
      </button>
      {/* arrow tail */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 size-3 rotate-45 -mt-1.5 border-r border-b ${savedFlash ? "bg-emerald-500 border-emerald-500" : "bg-[var(--primary)] border-[var(--primary)]"}`}
        aria-hidden
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Trash2, Share2, Check, ExternalLink } from "lucide-react";
import { toast } from "@/lib/toast";

export function QuoteCard({
  id, body, chapterNumber, chapterTitle, novelSlug, novelTitle, author, createdAt,
}: {
  id: string;
  body: string;
  chapterNumber: number;
  chapterTitle: string;
  novelSlug: string;
  novelTitle: string;
  author: string;
  createdAt: string;
}) {
  const [deleted, setDeleted] = useState(false);
  const [copied, setCopied] = useState(false);

  if (deleted) return null;

  async function copy() {
    const text = `"${body}"\n\n— ${author}, ${novelTitle} (Bab ${chapterNumber})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ kind: "success", title: "Tersalin ke clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy:", text);
    }
  }

  async function share() {
    const text = `"${body}"\n\n— ${author}, ${novelTitle}`;
    const url = `${location.origin}/novel/${novelSlug}/read/${chapterNumber}`;
    if (navigator.share) {
      try { await navigator.share({ title: novelTitle, text, url }); return; } catch {}
    }
    copy();
  }

  async function remove() {
    if (!confirm("Hapus quote ini?")) return;
    try {
      const r = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (r.ok) {
        setDeleted(true);
        toast({ kind: "success", title: "Quote dihapus" });
      } else {
        toast({ kind: "error", title: "Gagal hapus" });
      }
    } catch {
      toast({ kind: "error", title: "Network error" });
    }
  }

  const date = new Date(createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)] border border-[var(--border)] p-5 relative group hover:border-[var(--primary)]/50 transition">
      <div className="text-4xl text-[var(--primary)]/30 leading-none font-serif absolute top-3 left-4" aria-hidden>"</div>
      <blockquote className="font-serif text-base md:text-lg leading-relaxed text-[var(--foreground)] pt-4 px-2">
        {body}
      </blockquote>

      <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={`/novel/${novelSlug}/read/${chapterNumber}`}
          className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition inline-flex items-center gap-1.5 min-w-0"
        >
          <ExternalLink className="size-3 shrink-0" />
          <span className="truncate">Bab {chapterNumber}: {chapterTitle}</span>
        </Link>
        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{date}</div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={copy}
          aria-label="Salin quote"
          title="Salin"
          className="size-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] grid place-items-center transition"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        </button>
        <button
          onClick={share}
          aria-label="Bagikan"
          title="Bagikan"
          className="size-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] grid place-items-center transition"
        >
          <Share2 className="size-3.5" />
        </button>
        <button
          onClick={remove}
          aria-label="Hapus"
          title="Hapus"
          className="size-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-red-500 hover:text-red-400 grid place-items-center transition"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

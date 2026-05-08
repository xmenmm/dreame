"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

export function CopyCodeButton({ code, url }: { code: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
      window.prompt("Copy link:", url);
    }
  }

  async function share() {
    const text = `Hai! Aku invite kamu ke Lentera, baca novel original Indonesia. Pakai kode ${code} pas daftar dapat 50 coin gratis: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Lentera", text, url }); return; } catch {}
    }
    copyLink();
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={copyLink}
        className="h-11 px-5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold inline-flex items-center gap-2 transition"
      >
        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
        {copied ? "Tersalin!" : "Salin"}
      </button>
      <button
        onClick={share}
        className="h-11 px-5 rounded-full bg-[var(--primary)] text-black font-bold text-sm inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] transition"
      >
        <Share2 className="size-4" /> Bagikan
      </button>
    </div>
  );
}

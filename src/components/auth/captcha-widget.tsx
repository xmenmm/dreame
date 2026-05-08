"use client";

import { useState } from "react";
import { RefreshCcw, ShieldCheck } from "lucide-react";

export function CaptchaWidget() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-2">
      <label className="text-xs text-[var(--muted)] flex items-center gap-1">
        <ShieldCheck className="size-3 text-[var(--primary)]" /> Ketik kode di gambar (anti-bot)
      </label>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/captcha?r=${refreshKey}`}
          alt="CAPTCHA"
          className="h-14 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"
          width={180}
          height={60}
        />
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="size-10 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] grid place-items-center"
          title="Refresh CAPTCHA"
        >
          <RefreshCcw className="size-4" />
        </button>
      </div>
      <input
        name="captcha"
        required
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="Ketik kode di gambar"
        maxLength={5}
        className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none uppercase tracking-widest font-mono"
      />
    </div>
  );
}

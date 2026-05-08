"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("dreame-cookie-ok")) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 shadow-2xl">
      <h3 className="text-sm font-bold mb-1">🍪 Kami pakai cookie</h3>
      <p className="text-xs text-[var(--muted)] leading-relaxed">
        Kami simpan session login & preferensi baca (tema, ukuran teks) di browser kamu. Tidak ada data dijual ke pihak ketiga.
        Lihat <Link href="/legal" className="text-[var(--primary)] underline">kebijakan privasi</Link>.
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => { localStorage.setItem("dreame-cookie-ok", "1"); setShow(false); }}
          className="h-9 px-4 rounded-full bg-[var(--primary)] text-black text-xs font-bold hover:bg-[var(--primary-hover)] transition"
        >
          Setuju
        </button>
        <Link href="/legal" className="h-9 px-4 leading-9 rounded-full text-xs font-semibold text-[var(--muted)] hover:text-foreground">
          Detail
        </Link>
      </div>
    </div>
  );
}

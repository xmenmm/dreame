"use client";

import { useEffect, useState } from "react";
import { Type, Minus, Plus, Palette, Volume2, VolumeX, Share2, Check } from "lucide-react";

const SIZES = [16, 17, 18, 19, 20, 22, 24, 26];
const THEMES = [
  { id: "dark",   label: "Dark",   bg: "#0b0b0f", fg: "#f5f5f7" },
  { id: "amoled", label: "AMOLED", bg: "#000000", fg: "#e5e5ea" },
  { id: "sepia",  label: "Sepia",  bg: "#f4ecd8", fg: "#3a2e1f" },
  { id: "light",  label: "Light",  bg: "#ffffff", fg: "#1a1a1a" },
] as const;
type ThemeId = typeof THEMES[number]["id"];

function applyTheme(id: ThemeId) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  document.documentElement.style.setProperty("--reader-bg", t.bg);
  document.documentElement.style.setProperty("--reader-fg", t.fg);
  document.body.dataset.readerTheme = id;
}

export function ReaderControls() {
  const [sizeIdx, setSizeIdx] = useState(2);
  const [theme, setTheme] = useState<ThemeId>("dark");
  const [open, setOpen] = useState<"none" | "theme">("none");
  const [speaking, setSpeaking] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("dreame-reader-size");
    if (s) setSizeIdx(parseInt(s, 10));
    const t = (localStorage.getItem("dreame-reader-theme") as ThemeId) || "dark";
    setTheme(t);
    applyTheme(t);
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>(".prose-reader").forEach((el) => {
      el.style.fontSize = `${SIZES[sizeIdx]}px`;
    });
    localStorage.setItem("dreame-reader-size", String(sizeIdx));
  }, [sizeIdx]);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("dreame-reader-theme", theme);
  }, [theme]);

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Browser kamu tidak support Audio TTS.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = document.querySelector(".prose-reader")?.textContent ?? "";
    if (!text.trim()) return;
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const id = voices.find((v) => v.lang.startsWith("id"));
    utter.voice = id ?? voices[0];
    utter.lang = id ? "id-ID" : "en-US";
    utter.rate = 1.0;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }

  async function share() {
    const url = window.location.href;
    const title = document.title;
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="flex items-center gap-1 relative">
      <div className="flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] p-1">
        <button onClick={() => setSizeIdx((i) => Math.max(0, i - 1))} className="size-7 grid place-items-center rounded-full hover:bg-[var(--surface-2)]" aria-label="Kecil">
          <Minus className="size-3" />
        </button>
        <Type className="size-4 text-[var(--muted)]" />
        <button onClick={() => setSizeIdx((i) => Math.min(SIZES.length - 1, i + 1))} className="size-7 grid place-items-center rounded-full hover:bg-[var(--surface-2)]" aria-label="Besar">
          <Plus className="size-3" />
        </button>
      </div>

      <button
        onClick={() => setOpen(open === "theme" ? "none" : "theme")}
        className="size-9 rounded-full bg-[var(--surface)] border border-[var(--border)] grid place-items-center hover:border-[var(--primary)] transition"
        aria-label="Tema"
      >
        <Palette className="size-4" />
      </button>

      <button
        onClick={speak}
        className={`size-9 rounded-full bg-[var(--surface)] border grid place-items-center transition ${speaking ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] hover:border-[var(--primary)]"}`}
        aria-label="Audio narration"
      >
        {speaking ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>

      <button
        onClick={share}
        className="size-9 rounded-full bg-[var(--surface)] border border-[var(--border)] grid place-items-center hover:border-[var(--primary)] transition"
        aria-label="Share"
      >
        {shareCopied ? <Check className="size-4 text-emerald-400" /> : <Share2 className="size-4" />}
      </button>

      {open === "theme" && (
        <div className="absolute top-12 right-0 z-30 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xl w-44">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] px-2 py-1">Tema Baca</div>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen("none"); }}
              className={`w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-sm hover:bg-[var(--surface-2)] ${theme === t.id ? "bg-[var(--surface-2)]" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="size-5 rounded border border-[var(--border)] grid place-items-center text-[10px] font-bold" style={{ background: t.bg, color: t.fg }}>A</span>
                {t.label}
              </div>
              {theme === t.id && <Check className="size-3 text-[var(--primary)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

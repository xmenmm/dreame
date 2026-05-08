"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, BookOpen } from "lucide-react";

type Theme = "light" | "dark" | "sepia";

const THEMES: { id: Theme; icon: React.ElementType; label: string }[] = [
  { id: "light",  icon: Sun,      label: "Light" },
  { id: "dark",   icon: Moon,     label: "Dark" },
  { id: "sepia",  icon: BookOpen, label: "Sepia" },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("lentera-theme") as Theme) || "dark";
    setTheme(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  function apply(t: Theme) {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("lentera-theme", t);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-[var(--surface-2)] p-0.5">
      {THEMES.map((t) => {
        const Icon = t.icon;
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => apply(t.id)}
            className={`size-7 grid place-items-center rounded-full transition ${active ? "bg-[var(--primary)] text-black" : "text-[var(--muted)] hover:text-foreground hover:bg-[var(--surface)]"}`}
            title={t.label}
            aria-label={t.label}
          >
            <Icon className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}

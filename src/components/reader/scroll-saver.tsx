"use client";

import { useEffect, useRef } from "react";

export function ScrollSaver({
  novelId,
  chapterNumber,
  initialScrollPos,
}: {
  novelId: string;
  chapterNumber: number;
  initialScrollPos: number;
}) {
  const lastSaved = useRef<number>(initialScrollPos);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore scroll position on mount (but only if it's substantial, ignore tiny <100px)
  useEffect(() => {
    if (initialScrollPos > 200) {
      // wait for layout/images to render
      const t = setTimeout(() => {
        window.scrollTo({ top: initialScrollPos, behavior: "auto" });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [initialScrollPos]);

  // Debounced save while scrolling
  useEffect(() => {
    function send(pos: number) {
      lastSaved.current = pos;
      fetch("/api/reading-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novelId, chapterNumber, scrollPos: pos }),
        keepalive: true,
      }).catch(() => {});
    }
    function onScroll() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const y = Math.round(window.scrollY);
        if (Math.abs(y - lastSaved.current) > 50) send(y);
      }, 800);
    }
    function flushOnLeave() {
      const y = Math.round(window.scrollY);
      if (Math.abs(y - lastSaved.current) > 20) {
        // sendBeacon for reliable flush on page unload
        try {
          const data = JSON.stringify({ novelId, chapterNumber, scrollPos: y });
          navigator.sendBeacon?.("/api/reading-progress", new Blob([data], { type: "application/json" }));
        } catch {}
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", flushOnLeave);
    window.addEventListener("beforeunload", flushOnLeave);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", flushOnLeave);
      window.removeEventListener("beforeunload", flushOnLeave);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [novelId, chapterNumber]);

  return null;
}

export type ToastKind = "success" | "info" | "error" | "coin" | "achievement";

export type ToastInput = {
  kind?: ToastKind;
  title: string;
  body?: string;
  emoji?: string;
  duration?: number;     // ms, default 4000
  href?: string;          // optional click target
};

/** Trigger a toast from anywhere on the client. Safe in SSR (no-op). */
export function toast(input: ToastInput) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lentera:toast", { detail: input }));
}

/** Convenience helpers */
export const toasts = {
  success: (title: string, body?: string) => toast({ kind: "success", title, body }),
  error:   (title: string, body?: string) => toast({ kind: "error", title, body }),
  info:    (title: string, body?: string) => toast({ kind: "info", title, body }),
  coin:    (amount: number, body?: string) => toast({ kind: "coin", emoji: "🪙", title: `+${amount} coin`, body }),
  badge:   (label: string, body?: string) => toast({ kind: "achievement", emoji: "🏆", title: label, body }),
};

// Simple custom CAPTCHA — no external service.
// Generates a 5-char code, stores hash in httpOnly cookie, renders as SVG with strikethrough lines.

import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "captcha_session";
const TTL_SEC = 600; // 10 min
const SECRET = process.env.JWT_SECRET || "captcha-dev-secret";

function hash(code: string, salt: string) {
  return crypto.createHmac("sha256", SECRET).update(`${code}|${salt}`).digest("hex");
}

export function generateCode(): string {
  // Avoid confusable characters (0/O, 1/I/L)
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function issueCaptcha(): Promise<{ code: string; salt: string }> {
  const code = generateCode();
  const salt = crypto.randomBytes(8).toString("hex");
  const c = await cookies();
  c.set(COOKIE_NAME, `${salt}.${hash(code, salt)}.${Date.now()}`, {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: TTL_SEC,
  });
  return { code, salt };
}

export async function verifyCaptcha(input: string): Promise<boolean> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return false;
  const [salt, expectedHash, tsRaw] = raw.split(".");
  if (!salt || !expectedHash || !tsRaw) return false;
  const ts = parseInt(tsRaw, 10);
  if (!ts || Date.now() - ts > TTL_SEC * 1000) return false;
  const guess = (input || "").trim().toUpperCase();
  if (guess.length !== 5) return false;
  return hash(guess, salt) === expectedHash;
}

// SVG renderer — text with overlapping noise lines (defeats simple OCR)
export function renderCaptchaSvg(code: string): string {
  const W = 180, H = 60;
  const colors = ["#f59e0b", "#ec4899", "#a78bfa", "#34d399", "#60a5fa"];
  // Draw 8 random strikethrough lines
  const lines = Array.from({ length: 10 }, () => {
    const x1 = Math.random() * W;
    const y1 = Math.random() * H;
    const x2 = Math.random() * W;
    const y2 = Math.random() * H;
    const c = colors[Math.floor(Math.random() * colors.length)];
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${c}" stroke-width="${(0.6 + Math.random() * 1.4).toFixed(1)}" opacity="0.55" />`;
  }).join("");

  // Render each char with random rotation/skew
  const chars = code.split("").map((ch, i) => {
    const x = 18 + i * 30;
    const y = 38 + (Math.random() * 8 - 4);
    const rot = (Math.random() * 30 - 15).toFixed(1);
    return `<text x="${x}" y="${y.toFixed(1)}" font-family="Georgia,serif" font-size="28" font-weight="900" fill="#f5f5f7" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
  }).join("");

  // Random dots noise
  const dots = Array.from({ length: 40 }, () => {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 0.5 + Math.random() * 1;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#8b8b96" opacity="0.5" />`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#1c1c25" rx="8" />
    ${dots}
    ${chars}
    ${lines}
  </svg>`;
}

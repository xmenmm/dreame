// Lightweight content moderation: bad-word filter + auto-flag
const BANNED = [
  // common Indonesian/English profanity stems — extend as needed
  "anjing", "bangsat", "kontol", "memek", "ngentot", "pepek", "kampret", "babi",
  "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy",
];

// Soft-flag terms (require human review, not auto-block)
const SOFT_FLAG = [
  "bunuh diri", "self harm", "suicide", "kill myself",
];

const re = (words: string[]) =>
  new RegExp(`\\b(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i");

const HARD_RE = re(BANNED);
const SOFT_RE = re(SOFT_FLAG);

export function moderate(text: string): {
  ok: boolean;
  flag: "clean" | "soft" | "hard";
  cleaned: string;
} {
  if (HARD_RE.test(text)) {
    return { ok: false, flag: "hard", cleaned: text.replace(HARD_RE, (m) => "*".repeat(m.length)) };
  }
  if (SOFT_RE.test(text)) {
    return { ok: true, flag: "soft", cleaned: text };
  }
  return { ok: true, flag: "clean", cleaned: text };
}

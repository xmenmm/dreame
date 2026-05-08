// AI Novelist — generate full novels via Pollinations.ai (free, no API key).
// v2 — continuity-aware: maintains story bible across chapters so plot stays coherent.

const TEXT_BASE = "https://text.pollinations.ai";
const IMG_BASE  = "https://image.pollinations.ai/prompt";

export type GenerateInput = {
  genres: string[];
  tone: "dramatic" | "light" | "romantic" | "dark" | "mysterious" | "comedic";
  language: "id" | "en";
  theme?: string;
  chapterCount: number;
};

export type NovelMeta = {
  title: string;
  synopsis: string;
  coverPrompt: string;
  protagonist: string;       // main character name + 1-line description
  setting: string;           // primary location/world
  centralConflict: string;   // the core conflict driving the story
};

export type ChapterDraft = {
  title: string;
  content: string;
  imagePrompt: string;
  summary: string;       // 1-sentence: what happened in this chapter
  ending: string;        // last 2-3 sentences verbatim — used by next chapter
  newCharacters?: string[];  // characters introduced this chapter
  unresolvedThreads?: string[]; // questions left open for next chapter
};

export type StoryContext = {
  storySoFar: string;          // accumulated plot summary across all prior chapters
  lastEnding: string;          // verbatim ending of previous chapter
  knownCharacters: string[];   // running roster
  unresolvedThreads: string[]; // open questions/conflicts
};

function extractJson<T>(text: string): T {
  // 1. Direct parse
  try { return JSON.parse(text); } catch {}

  // 2. Fenced code block
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) try { return JSON.parse(fenced[1]); } catch {}

  // 3. First { ... last } pair
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }

  // 4. JSON looks TRUNCATED — try to repair
  if (start >= 0) {
    let chunk = text.slice(start);
    const quoteCount = (chunk.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 === 1) chunk += '"';
    const opens = (chunk.match(/\{/g) || []).length;
    const closes = (chunk.match(/\}/g) || []).length;
    chunk += "}".repeat(Math.max(0, opens - closes));
    chunk = chunk.replace(/,\s*\}/g, "}").replace(/,\s*\]/g, "]");
    try { return JSON.parse(chunk); } catch {}
  }

  throw new Error(`Failed to parse JSON. Sample: ${text.slice(0, 200)}`);
}

export function isValidNovelMeta(m: unknown): m is NovelMeta {
  if (!m || typeof m !== "object") return false;
  const x = m as Record<string, unknown>;
  return typeof x.title === "string" && x.title.trim().length >= 1
    && typeof x.synopsis === "string" && x.synopsis.trim().length >= 10;
}

export function isValidChapterDraft(d: unknown): d is ChapterDraft {
  if (!d || typeof d !== "object") return false;
  const x = d as Record<string, unknown>;
  return typeof x.title === "string" && x.title.trim().length >= 1
    && typeof x.content === "string" && x.content.trim().length >= 100;
}

// ────────── Template-based fallback (when AI fails completely) ──────────

const TITLE_PARTS_ID = {
  prefix: ["Bisikan", "Cahaya", "Senja di", "Kabut", "Janji", "Bayangan", "Lentera", "Pulau", "Surat dari", "Hujan di", "Detik", "Mimpi"],
  suffix: ["Terakhir", "yang Hilang", "Patah", "Pertama", "Tersembunyi", "Kembali", "Sunyi", "Malam", "Padam", "Terlarang"],
} as const;

const TONE_ATMOSPHERE: Record<GenerateInput["tone"], { id: string; en: string }> = {
  dramatic:    { id: "tegang dan emosional", en: "tense and emotional" },
  light:       { id: "hangat dan ringan",     en: "warm and easy-going" },
  romantic:    { id: "lembut dan penuh rindu", en: "tender and longing" },
  dark:        { id: "kelam dan suram",        en: "dark and atmospheric" },
  mysterious:  { id: "misterius dan berlapis", en: "mysterious and layered" },
  comedic:     { id: "ringan dan jenaka",      en: "playful and witty" },
};

export function templateNovelMeta(input: GenerateInput): NovelMeta {
  const r = (a: readonly string[]) => a[Math.floor(Math.random() * a.length)];
  const title = `${r(TITLE_PARTS_ID.prefix)} ${r(TITLE_PARTS_ID.suffix)}`;
  const lang = input.language;
  const atmos = TONE_ATMOSPHERE[input.tone][lang];
  const genres = input.genres.join(", ");
  const protagName = ["Lia", "Nara", "Aksa", "Kara", "Bima", "Maya", "Reza"][Math.floor(Math.random() * 7)];

  const synopsis = lang === "id"
    ? `Sebuah cerita ${atmos} tentang ${protagName} yang harus menghadapi masa lalu yang tak ingin diingat. ${input.theme ? `Berlatar ${input.theme}, ` : ""}Bertanya: seberapa jauh seseorang akan pergi untuk menemukan kebenaran yang tak ingin ditemukan?`
    : `A ${atmos} tale of ${protagName} confronting a past they tried to forget. ${input.theme ? `Set in ${input.theme}, ` : ""}Asking: how far will someone go to find a truth they don't want to find?`;

  return {
    title,
    synopsis,
    protagonist: lang === "id"
      ? `${protagName} — sosok yang sederhana di luar tapi menyimpan luka dalam`
      : `${protagName} — quiet on the outside, carrying deep scars`,
    setting: input.theme || (lang === "id" ? "kota kecil di Indonesia, masa kini" : "small town, modern day"),
    centralConflict: lang === "id"
      ? `${protagName} dipaksa pilih antara melindungi rahasia atau mengungkap kebenaran yang menghancurkan banyak orang.`
      : `${protagName} is forced to choose between guarding a secret or revealing a truth that will hurt many.`,
    coverPrompt: `${genres} novel cover, ${TONE_ATMOSPHERE[input.tone].en}, painterly book cover art, dramatic lighting, cinematic`,
  };
}

export function templateChapter(input: {
  meta: NovelMeta;
  chapterNumber: number;
  totalChapters: number;
  language: "id" | "en";
}): ChapterDraft {
  const n = input.chapterNumber;
  const lang = input.language;
  const titles = lang === "id"
    ? ["Awal yang Asing", "Bayangan", "Pertemuan", "Janji", "Pengkhianatan", "Hujan di Stasiun", "Cermin", "Gerbang", "Diam", "Pulang"]
    : ["A Strange Beginning", "Shadows", "Encounter", "Promise", "Betrayal", "Rain at the Station", "Mirror", "Gate", "Silence", "Coming Home"];
  const title = `Bab ${n}: ${titles[(n - 1) % titles.length]}`;

  const para = lang === "id"
    ? `${input.meta.protagonist.split(/[—,]/)[0].trim()} berdiri di depan jendela. Hujan mulai turun, perlahan, seperti memori yang menolak hilang.\n\nIa tahu, ada hal yang harus ia lakukan malam ini. Tapi tangannya masih ragu.\n\n*"Kamu yakin?"* Suara itu datang dari belakang.\n\nIa menarik napas dalam-dalam. ${input.meta.centralConflict.slice(0, 100)}\n\nDan untuk pertama kalinya, ia merasa tidak punya pilihan.`
    : `${input.meta.protagonist.split(/[—,]/)[0].trim()} stood at the window. The rain began to fall, slowly, like memories that refuse to fade.\n\nThere was something he had to do tonight. But his hand still hesitated.\n\n*"Are you sure?"* The voice came from behind.\n\nHe took a deep breath. ${input.meta.centralConflict.slice(0, 100)}\n\nFor the first time, he felt he had no choice.`;

  const content = `# ${title}\n\n${para}\n\n---\n\n*Bab berikutnya segera tayang.*`;
  return {
    title,
    content,
    imagePrompt: `${input.meta.coverPrompt}, scene from chapter ${n}`,
    summary: lang === "id" ? `${input.meta.protagonist.split(/[—,]/)[0].trim()} menghadapi pilihan sulit di malam hujan.` : `${input.meta.protagonist.split(/[—,]/)[0].trim()} faces a hard choice in the rain.`,
    ending: lang === "id" ? "Untuk pertama kalinya, ia merasa tidak punya pilihan." : "For the first time, he felt he had no choice.",
    newCharacters: [],
    unresolvedThreads: [lang === "id" ? "Apa keputusan yang harus diambil?" : "What is the decision to make?"],
  };
}

// Pollinations rate-limit-aware text generator.
// Tries multiple models + handles 429 with exponential backoff.
const MODELS = ["openai", "mistral", "llama"] as const;

class RateLimitError extends Error {
  constructor() { super("rate_limit"); }
}

async function tryGenWithModel(prompt: string, model?: string): Promise<string> {
  const params = new URLSearchParams({ json: "true" });
  if (model) params.set("model", model);
  const url = `${TEXT_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (r.status === 429 || r.status === 503) throw new RateLimitError();
  if (!r.ok) throw new Error(`text gen failed: ${r.status}`);
  const text = await r.text();
  if (!text || text.length < 10) throw new Error("empty response");
  return text;
}

async function genText(prompt: string): Promise<string> {
  // 1. Try default model first
  try { return await tryGenWithModel(prompt); }
  catch (e) {
    if (!(e instanceof RateLimitError)) throw e;
  }

  // 2. Try alternate models (might use different quota)
  for (const m of MODELS) {
    try { return await tryGenWithModel(prompt, m); }
    catch (e) {
      if (!(e instanceof RateLimitError)) throw e;
    }
  }

  // 3. All rate-limited → backoff & retry once with longest wait
  await new Promise((r) => setTimeout(r, 30_000));
  try { return await tryGenWithModel(prompt); }
  catch {
    throw new Error("Pollinations.ai rate-limit aktif (semua model 429). Tunggu 1-2 menit lalu coba lagi.");
  }
}

export function imageUrl(prompt: string, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 1_000_000);
  return `${IMG_BASE}/${encodeURIComponent(prompt)}?width=512&height=768&model=flux&nologo=true&seed=${s}`;
}

export function bannerImageUrl(prompt: string, seed?: number): string {
  const s = seed ?? Math.floor(Math.random() * 1_000_000);
  return `${IMG_BASE}/${encodeURIComponent(prompt + ", wide cinematic banner")}?width=1024&height=512&model=flux&nologo=true&seed=${s}`;
}

const TONE_DESC: Record<GenerateInput["tone"], string> = {
  dramatic:    "intense, emotional, high-stakes",
  light:       "warm, hopeful, easy-reading",
  romantic:    "tender, longing, character-focused",
  dark:        "gritty, atmospheric, tension-filled",
  mysterious:  "suspenseful, layered, slow reveals",
  comedic:     "playful, witty, lighthearted",
};

function arcGuidance(chapterNumber: number, total: number, language: "id" | "en"): string {
  const pct = (chapterNumber - 1) / Math.max(1, total - 1);
  if (chapterNumber === 1) {
    return language === "id"
      ? "INI BAB PERTAMA. Hook pembaca cepat. Perkenalkan tokoh utama dan konflik awal. Tutup bab dengan momen yang bikin penasaran."
      : "FIRST CHAPTER. Hook fast. Introduce protagonist + initial conflict. End with a curiosity hook.";
  }
  if (chapterNumber === total) {
    return language === "id"
      ? "INI BAB TERAKHIR. Selesaikan konflik utama dengan klimaks yang memuaskan. JANGAN buka plot baru. Beri penutup yang tuntas."
      : "FINAL CHAPTER. Climax + resolution. NO new threads. Give a satisfying close.";
  }
  if (pct < 0.3) return language === "id"
    ? "TAHAP AWAL. Bangun dunia + perdalam karakter. Tambah komplikasi yang relevan dengan konflik utama."
    : "EARLY ACT. Build world + deepen characters. Add complications.";
  if (pct < 0.7) return language === "id"
    ? "TAHAP TENGAH. Naikkan taruhan. Bawa karakter ke titik tersulit. Bisa buka 1 plot twist."
    : "MIDDLE ACT. Raise stakes. Push characters to their hardest moment. One twist OK.";
  return language === "id"
    ? "MENJELANG KLIMAKS. Pertajam konflik utama. Mulai konvergensi semua benang cerita."
    : "PRE-CLIMAX. Sharpen main conflict. Converge open threads.";
}

export async function generateNovelMeta(input: GenerateInput): Promise<NovelMeta> {
  const lang = input.language === "id" ? "Indonesian" : "English";
  const prompt = `You are a professional novelist creating a structured novel concept for a digital reading platform.

Generate a fresh, original novel concept that can sustain ${input.chapterCount} coherent chapters.

Genres: ${input.genres.join(", ")}
Tone: ${TONE_DESC[input.tone]}
${input.theme ? `Inspiration / theme: ${input.theme}` : ""}
Language for output: ${lang}

The "centralConflict" must be specific enough to drive ${input.chapterCount} chapters of plot — not just vague "find love" or "save world", but concrete & with clear escalation potential.

Return ONLY valid JSON, no preamble, no fences:
{
"title":"<creative title in ${lang}, max 60 chars, no quotes>",
"synopsis":"<2-3 sentence hook in ${lang}, max 300 chars>",
"protagonist":"<name + 1-line description in ${lang}, max 150 chars>",
"setting":"<primary location/era/world in ${lang}, max 100 chars>",
"centralConflict":"<the specific conflict that drives the whole novel in ${lang}, max 200 chars>",
"coverPrompt":"<image prompt in ENGLISH for cover art, painterly book cover style, dramatic lighting, max 200 chars>"
}`;

  const raw = await genText(prompt);
  return extractJson<NovelMeta>(raw);
}

export async function generateChapter(input: {
  meta: NovelMeta;
  genres: string[];
  tone: GenerateInput["tone"];
  language: "id" | "en";
  chapterNumber: number;
  totalChapters: number;
  context?: StoryContext;
}): Promise<ChapterDraft> {
  const lang = input.language === "id" ? "Indonesian" : "English";
  const arc = arcGuidance(input.chapterNumber, input.totalChapters, input.language);
  const ctx = input.context;

  const continuityBlock = ctx && input.chapterNumber > 1
    ? `STORY BIBLE (Wajib dipakai untuk konsistensi):
- Tokoh dikenal sejauh ini: ${ctx.knownCharacters.length ? ctx.knownCharacters.join(", ") : "(belum ada)"}
- Plot threads belum terselesaikan: ${ctx.unresolvedThreads.length ? ctx.unresolvedThreads.join(" | ") : "(none)"}
- Cerita sejauh ini (rangkuman): ${ctx.storySoFar || "(awal cerita)"}

ENDING BAB SEBELUMNYA (lanjutkan secara natural — boleh refer balik adegan ini):
"${ctx.lastEnding}"

⚠️ WAJIB:
- Pakai tokoh & nama yang SAMA dari story bible (jangan bikin tokoh duplikat)
- Hormati apa yang sudah terjadi — jangan kontradiksi fakta
- Sambungkan adegan dari ending bab sebelumnya secara natural
- Setidaknya RESOLVE atau ADVANCE 1 plot thread`
    : "";

  const prompt = `You are writing chapter ${input.chapterNumber} of ${input.totalChapters} for a serial novel.

NOVEL BIBLE:
- Title: "${input.meta.title}"
- Synopsis: ${input.meta.synopsis}
- Protagonist: ${input.meta.protagonist}
- Setting: ${input.meta.setting}
- Central conflict: ${input.meta.centralConflict}
- Genres: ${input.genres.join(", ")}
- Tone: ${TONE_DESC[input.tone]}
- Language: ${lang}

${continuityBlock}

ARC POSITION: ${arc}

WRITE NOW — output a full chapter (700-1100 words) in ${lang} as MARKDOWN.
- Use # at top for chapter heading
- Use **bold** for emphasis, *italic* for inner thoughts/whispers
- Use --- for scene breaks
- Include dialogue. Show, don't tell.
- The chapter MUST be a continuation of the previous one (if any), not a fresh start.

Return ONLY valid JSON, no preamble, no fences. Inside content, use \\n for line breaks (so JSON parses):
{
"title":"<chapter title in ${lang}, max 80 chars, no quotes>",
"content":"<full markdown chapter, escaped for JSON>",
"imagePrompt":"<image prompt in ENGLISH for a key scene from THIS chapter, painterly cinematic, max 200 chars>",
"summary":"<one-sentence summary of what happened in ${lang}, max 200 chars>",
"ending":"<COPY VERBATIM the last 2-3 sentences of your chapter — the next chapter will continue from this>",
"newCharacters":["<any new character introduced this chapter, name only, can be empty array>"],
"unresolvedThreads":["<plot threads/questions left open for next chapter>"]
}`;

  const raw = await genText(prompt);
  return extractJson<ChapterDraft>(raw);
}

// Helper: compress story-so-far when it grows too long
export function compressStorySoFar(parts: string[]): string {
  // Keep last 6 chapter summaries verbatim, summarize older as "..."
  if (parts.length <= 6) return parts.map((s, i) => `[Bab ${i + 1}] ${s}`).join(" → ");
  const recent = parts.slice(-6);
  const older = parts.slice(0, -6);
  return `[Bab 1-${older.length}] (...sebelumnya: ${older.length} bab tentang konflik berkembang) → ` +
    recent.map((s, i) => `[Bab ${parts.length - 6 + i + 1}] ${s}`).join(" → ");
}

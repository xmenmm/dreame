import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { generateNovelMeta, type GenerateInput } from "@/lib/ai-novelist";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const Schema = z.object({
  genres: z.array(z.string()).min(1).max(3),
  tone: z.enum(["dramatic", "light", "romantic", "dark", "mysterious", "comedic"]).default("dramatic"),
  language: z.enum(["id", "en"]).default("id"),
  theme: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const input: GenerateInput = {
    genres: parsed.data.genres,
    tone: parsed.data.tone,
    language: parsed.data.language,
    theme: parsed.data.theme,
    chapterCount: 5,
  };

  try {
    const meta = await generateNovelMeta(input);
    return NextResponse.json(meta);
  } catch (e) {
    return NextResponse.json({ error: "ai_failed", detail: String(e).slice(0, 200) }, { status: 502 });
  }
}

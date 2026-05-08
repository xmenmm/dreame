import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { saveHomeLayout, type HomeLayout } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const SectionSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("hero"),            auto: z.enum(["featured", "trending"]).default("featured"), novelSlug: z.string().optional(), visible: z.boolean().optional() }),
  z.object({ id: z.string(), type: z.literal("carousel"),        title: z.string().max(80), sort: z.enum(["trending", "popular", "new", "featured"]).default("trending"), genreSlug: z.string().optional(), visible: z.boolean().optional() }),
  z.object({ id: z.string(), type: z.literal("banner"),          image: z.string().url().or(z.string().startsWith("/")), link: z.string().min(1), title: z.string().max(80).optional(), subtitle: z.string().max(200).optional(), visible: z.boolean().optional() }),
  z.object({ id: z.string(), type: z.literal("daily-reward"),    visible: z.boolean().optional() }),
  z.object({ id: z.string(), type: z.literal("recommendations"), title: z.string().max(80).optional(), visible: z.boolean().optional() }),
]);

const Schema = z.object({
  sections: z.array(SectionSchema).max(20),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", detail: parsed.error.issues }, { status: 400 });
  }

  const saved = await saveHomeLayout(parsed.data as HomeLayout);
  return NextResponse.json({ ok: true, layout: saved });
}

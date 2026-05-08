import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALES } from "@/lib/i18n";

export async function POST(req: Request) {
  const fd = await req.formData();
  const locale = String(fd.get("locale") || "");
  if (!LOCALES.includes(locale as any)) {
    return NextResponse.redirect(new URL(req.headers.get("referer") ?? "/", req.url));
  }
  const c = await cookies();
  c.set("dreame_locale", locale, {
    path: "/", maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return NextResponse.redirect(new URL(req.headers.get("referer") ?? "/", req.url));
}

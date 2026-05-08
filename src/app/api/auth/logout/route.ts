import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  await clearAuthCookie();
  if (req.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/", req.url));
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimChallenge } from "@/lib/daily-challenge";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const result = await claimChallenge(user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: user.id, email: user.email, username: user.username,
    displayName: user.displayName, avatarUrl: user.avatarUrl,
    role: user.role, coinBalance: user.coinBalance,
  });
}

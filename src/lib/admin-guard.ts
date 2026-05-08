import { NextResponse } from "next/server";
import { db } from "./db";
import { getCurrentUser } from "./auth";

// Helper: ensures admin auth + loads target user.
export async function requireAdminTarget(targetId: string) {
  const me = await getCurrentUser();
  if (!me) {
    return { error: NextResponse.redirect(new URL("/login", "http://localhost:3030")) };
  }
  if (me.role !== "admin") {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  if (me.id === targetId) {
    return { error: NextResponse.json({ error: "self_action_blocked" }, { status: 400 }) };
  }
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }
  return { me, target };
}

export function adminRedirect(req: Request, targetId: string, status: string) {
  return NextResponse.redirect(new URL(`/admin/users/${targetId}?done=${status}`, req.url));
}

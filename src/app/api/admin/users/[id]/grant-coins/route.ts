import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminTarget, adminRedirect } from "@/lib/admin-guard";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminTarget(id);
  if ("error" in guard) return guard.error;
  const { me, target } = guard;

  const fd = await req.formData();
  const amount = parseInt(String(fd.get("amount") || "0"), 10);
  const reason = String(fd.get("reason") || "").trim().slice(0, 200);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) {
    return NextResponse.redirect(new URL(`/admin/users/${id}?error=invalid_amount`, req.url));
  }

  await db.$transaction([
    db.user.update({
      where: { id: target.id },
      data: { coinBalance: { increment: amount } },
    }),
    db.coinTransaction.create({
      data: {
        userId: target.id, amount,
        kind: "reward",
        reference: `admin_grant_by_${me.id}`,
        provider: "admin",
        meta: JSON.stringify({ reason: reason || "Admin grant", grantedBy: me.username }),
      },
    }),
    db.notification.create({
      data: {
        userId: target.id, kind: "reward",
        title: `🎁 Kamu dapat ${amount} coin dari admin!`,
        body: reason || "Hadiah dari tim Lentera.",
        link: "/wallet",
      },
    }),
  ]);

  return adminRedirect(req, id, "coins");
}

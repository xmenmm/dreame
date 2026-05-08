import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// Midtrans HTTP Notification (server-to-server) handler
// Expects POST with JSON body containing order_id, status_code, gross_amount, signature_key, transaction_status

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    console.warn("Midtrans webhook hit but MIDTRANS_SERVER_KEY not set — ignoring.");
    return NextResponse.json({ ok: true, ignored: "no_server_key" });
  }

  const expected = crypto
    .createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${serverKey}`)
    .digest("hex");

  if (expected !== body.signature_key) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 403 });
  }

  const order = await db.paymentOrder.findUnique({ where: { id: body.order_id } });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ ok: true, already: true });

  const settled = body.transaction_status === "settlement" || body.transaction_status === "capture";
  if (!settled) {
    await db.paymentOrder.update({
      where: { id: order.id },
      data: { status: body.transaction_status === "expire" ? "expired" : "pending" },
    });
    return NextResponse.json({ ok: true });
  }

  await db.$transaction([
    db.user.update({
      where: { id: order.userId },
      data: { coinBalance: { increment: order.coinsAmount } },
    }),
    db.coinTransaction.create({
      data: {
        userId: order.userId, amount: order.coinsAmount,
        kind: "topup", reference: order.id,
        provider: "midtrans",
        providerRef: body.transaction_id ?? body.order_id,
      },
    }),
    db.paymentOrder.update({
      where: { id: order.id },
      data: { status: "paid", paidAt: new Date() },
    }),
    db.notification.create({
      data: {
        userId: order.userId, kind: "reward",
        title: `🪙 ${order.coinsAmount} coin masuk ke wallet kamu`,
        body: `Top-up sukses lewat Midtrans.`,
        link: "/wallet",
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

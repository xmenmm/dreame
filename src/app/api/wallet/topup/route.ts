import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;
const MIDTRANS_IS_PROD = process.env.MIDTRANS_IS_PROD === "true";

// Skeleton flow:
// - If MIDTRANS_SERVER_KEY is set, request a Snap token from Midtrans and redirect to checkout.
// - If not set (dev mode), simulate a successful payment (auto-credit coins) and redirect.

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/wallet", req.url));

  const fd = await req.formData();
  const packId = String(fd.get("packId") || "");
  const pack = await db.coinPack.findUnique({ where: { id: packId } });
  if (!pack) return NextResponse.redirect(new URL("/wallet?error=pack", req.url));

  const order = await db.paymentOrder.create({
    data: {
      userId: user.id,
      packId: pack.id,
      amountIDR: pack.priceIDR,
      coinsAmount: pack.coins + pack.bonus,
      provider: MIDTRANS_SERVER_KEY ? "midtrans" : "midtrans_simulated",
    },
  });

  if (!MIDTRANS_SERVER_KEY) {
    // DEV MODE: simulate instant success so the flow is testable without keys
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { coinBalance: { increment: pack.coins + pack.bonus } },
      }),
      db.coinTransaction.create({
        data: {
          userId: user.id, amount: pack.coins + pack.bonus,
          kind: "topup", reference: order.id,
          provider: "midtrans_simulated",
          providerRef: `SIMULATED-${order.id}`,
          meta: JSON.stringify({ packSlug: pack.slug, simulation: true }),
        },
      }),
      db.paymentOrder.update({
        where: { id: order.id },
        data: { status: "paid", paidAt: new Date(), providerRef: `SIMULATED-${order.id}` },
      }),
      db.notification.create({
        data: {
          userId: user.id, kind: "reward",
          title: `🪙 ${pack.coins + pack.bonus} coin masuk ke wallet kamu`,
          body: `Top-up ${pack.name}. Selamat membaca!`,
          link: "/wallet",
        },
      }),
    ]);
    return NextResponse.redirect(new URL("/wallet?status=success", req.url));
  }

  // PROD MODE: request Midtrans Snap token
  try {
    const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
    const baseUrl = MIDTRANS_IS_PROD
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const r = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Authorization": `Basic ${auth}` },
      body: JSON.stringify({
        transaction_details: { order_id: order.id, gross_amount: pack.priceIDR },
        item_details: [{ id: pack.id, price: pack.priceIDR, quantity: 1, name: pack.name }],
        customer_details: {
          first_name: user.displayName, email: user.email, user_id: user.id,
        },
        callbacks: {
          finish: `${new URL(req.url).origin}/wallet?status=success`,
          error: `${new URL(req.url).origin}/wallet?status=failed`,
        },
      }),
    });
    const data = await r.json();
    if (!data.redirect_url) return NextResponse.redirect(new URL("/wallet?status=failed", req.url));
    await db.paymentOrder.update({
      where: { id: order.id },
      data: { providerRef: data.token, meta: JSON.stringify(data) },
    });
    return NextResponse.redirect(data.redirect_url);
  } catch (e) {
    console.error("Midtrans error:", e);
    return NextResponse.redirect(new URL("/wallet?status=failed", req.url));
  }
}

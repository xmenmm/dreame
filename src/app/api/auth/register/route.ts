import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { ensureReferralCode, findReferrerByCode, REFERRAL } from "@/lib/referral";

const Schema = z.object({
  email: z.string().email(),
  username: z.string().regex(/^[a-z0-9_]{3,30}$/),
  displayName: z.string().min(1).max(60),
  password: z.string().min(8).max(200),
  ref: z.string().max(16).optional(),    // referral code from invite link
});

const WELCOME_COIN = 50;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { email, username, displayName, password, ref } = parsed.data;
  const dup = await db.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { username }] },
  });
  if (dup) return NextResponse.json({ error: "duplicate" }, { status: 409 });

  // Validate referral (if any)
  let referredByUserId: string | null = null;
  let bonusCoin = 0;
  if (ref) {
    const referrer = await findReferrerByCode(ref);
    if (referrer) {
      referredByUserId = referrer.id;
      bonusCoin = REFERRAL.REWARD_REFEREE_COIN;
    }
  }

  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      displayName,
      passwordHash: await hashPassword(password),
      role: "reader",
      coinBalance: WELCOME_COIN + bonusCoin,
      referredByUserId,
    },
  });

  // Auto-generate the user's own shareable code
  await ensureReferralCode(user.id).catch(() => {});

  // Log the referral bonus as a transaction (so wallet history shows it)
  if (bonusCoin > 0) {
    await db.coinTransaction.create({
      data: {
        userId: user.id, kind: "reward", amount: bonusCoin,
        reference: `referral_signup`,
      },
    }).catch(() => {});
    await db.notification.create({
      data: {
        userId: user.id, kind: "reward",
        title: `🎁 +${bonusCoin} coin bonus referral`,
        body: `Selamat bergabung lewat undangan teman!`,
        link: "/wallet",
      },
    }).catch(() => {});
  }

  const token = signToken({ sub: user.id, role: user.role });
  return NextResponse.json({
    token,
    user: {
      id: user.id, email: user.email, username: user.username,
      displayName: user.displayName, role: user.role, coinBalance: user.coinBalance,
    },
  });
}

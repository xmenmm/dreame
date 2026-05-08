import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getUserFromRequest } from "@/lib/auth";

const DAILY_COINS = [5, 10, 15, 20, 25, 30, 50]; // by streak day (1..7)

function dayKey(d: Date) {
  const x = new Date(d);
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
}

export async function GET(req: Request) {
  const user = (await getCurrentUser()) ?? (await getUserFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const today = new Date();
  const claimedToday = !!(user.lastDailyClaim && dayKey(user.lastDailyClaim) === dayKey(today));
  const streakDay = ((user.loginStreak || 0) % 7) + 1;
  const nextReward = DAILY_COINS[(streakDay - 1) % 7];
  return NextResponse.json({
    canClaim: !claimedToday,
    streak: user.loginStreak ?? 0,
    nextReward,
    todayDay: streakDay,
    schedule: DAILY_COINS,
  });
}

export async function POST(req: Request) {
  const user = (await getCurrentUser()) ?? (await getUserFromRequest(req));
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const today = new Date();
  if (user.lastDailyClaim && dayKey(user.lastDailyClaim) === dayKey(today)) {
    return NextResponse.json({ error: "already_claimed_today" }, { status: 400 });
  }

  // streak: if last claim was yesterday, increment; otherwise reset
  let newStreak = 1;
  if (user.lastDailyClaim) {
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (dayKey(user.lastDailyClaim) === dayKey(y)) {
      newStreak = (user.loginStreak ?? 0) + 1;
    }
  }
  const dayInCycle = ((newStreak - 1) % 7) + 1;
  const reward = DAILY_COINS[dayInCycle - 1];

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { lastDailyClaim: today, loginStreak: newStreak, coinBalance: { increment: reward } },
    }),
    db.coinTransaction.create({
      data: { userId: user.id, amount: reward, kind: "reward", reference: `daily:day${dayInCycle}` },
    }),
    db.notification.create({
      data: {
        userId: user.id,
        kind: "reward",
        title: `🎁 Kamu dapat ${reward} coin gratis!`,
        body: `Streak day ${newStreak}. Lanjutkan login besok untuk dapat lebih banyak.`,
        link: "/wallet",
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    reward,
    newBalance: user.coinBalance + reward,
    streak: newStreak,
    nextReward: DAILY_COINS[newStreak % 7],
  });
}

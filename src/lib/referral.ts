import { db } from "./db";

const REWARD_REFERRER_COIN = 50; // bonus to person who referred
const REWARD_REFEREE_COIN = 50;  // bonus to new user (granted at register, separate from welcome)
const REFEREE_MILESTONE_CHAPTERS = 3; // referee must read this many chapters before referrer gets bonus

/** Generate a 8-char alphanumeric referral code (no ambiguous chars). */
export function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** Ensure a unique code; retry on collision. */
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      await db.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
      return code;
    } catch {
      // unique violation, retry
    }
  }
  throw new Error("Failed to generate unique referral code");
}

/**
 * Look up a user by referral code (case-insensitive). Returns null if invalid.
 */
export async function findReferrerByCode(code: string): Promise<{ id: string } | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed || trimmed.length < 4 || trimmed.length > 16) return null;
  const u = await db.user.findUnique({
    where: { referralCode: trimmed },
    select: { id: true },
  });
  return u;
}

/**
 * Called when a referee makes meaningful progress. If they hit milestone and
 * referrer hasn't been rewarded yet, grant the referrer +coin and create notif.
 * Idempotent.
 */
export async function maybeGrantReferrerBonus(refereeId: string) {
  const referee = await db.user.findUnique({
    where: { id: refereeId },
    select: {
      id: true, displayName: true, username: true,
      referredByUserId: true, referralRewardGranted: true,
    },
  });
  if (!referee || !referee.referredByUserId || referee.referralRewardGranted) return false;

  // Check milestone
  const chaptersRead = await db.readingHistory.count({ where: { userId: refereeId } });
  if (chaptersRead < REFEREE_MILESTONE_CHAPTERS) return false;

  // Atomically: mark granted + give coin to referrer + log + notify
  await db.user.update({
    where: { id: refereeId },
    data: { referralRewardGranted: true },
  });
  await db.user.update({
    where: { id: referee.referredByUserId },
    data: { coinBalance: { increment: REWARD_REFERRER_COIN } },
  });
  await db.coinTransaction.create({
    data: {
      userId: referee.referredByUserId,
      kind: "reward",
      amount: REWARD_REFERRER_COIN,
      reference: `referral:${refereeId}`,
    },
  }).catch(() => {});
  await db.notification.create({
    data: {
      userId: referee.referredByUserId,
      kind: "reward",
      title: `🎉 Bonus referral +${REWARD_REFERRER_COIN} coin`,
      body: `${referee.displayName} (@${referee.username}) yang kamu undang sudah mulai aktif baca!`,
      link: `/referral`,
    },
  }).catch(() => {});

  return true;
}

export const REFERRAL = {
  REWARD_REFERRER_COIN,
  REWARD_REFEREE_COIN,
  REFEREE_MILESTONE_CHAPTERS,
};

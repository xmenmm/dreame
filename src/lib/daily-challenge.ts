import { db } from "./db";

export type ChallengeKind = "read_chapter";

const CHALLENGE_DEFS: Record<ChallengeKind, { target: number; reward: number; label: string; emoji: string }> = {
  read_chapter: { target: 1, reward: 5, label: "Baca 1 bab hari ini", emoji: "📖" },
};

/** YYYY-MM-DD in user local time (UTC for now; can be tz-aware later). */
function todayKey(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Returns today's challenge, creating it if missing. */
export async function getOrCreateTodayChallenge(userId: string, kind: ChallengeKind = "read_chapter") {
  const date = todayKey();
  const existing = await db.dailyChallenge.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (existing) return existing;

  const def = CHALLENGE_DEFS[kind];
  return db.dailyChallenge.create({
    data: { userId, date, kind, target: def.target, reward: def.reward, progress: 0 },
  });
}

/**
 * Increment today's challenge progress. If completed by this update, mark completedAt.
 * Idempotent within a session — caller can spam-call without skewing counts.
 */
export async function bumpChallengeProgress(userId: string, kind: ChallengeKind = "read_chapter", amount = 1) {
  const today = await getOrCreateTodayChallenge(userId, kind);
  if (today.completedAt) return today; // already done

  const newProgress = Math.min(today.target, today.progress + amount);
  const completed = newProgress >= today.target;

  return db.dailyChallenge.update({
    where: { id: today.id },
    data: {
      progress: newProgress,
      ...(completed ? { completedAt: new Date() } : {}),
    },
  });
}

/**
 * Claim reward. Returns null if already claimed or not yet completed.
 */
export async function claimChallenge(userId: string): Promise<{ ok: boolean; reward?: number; reason?: string }> {
  const date = todayKey();
  const ch = await db.dailyChallenge.findUnique({ where: { userId_date: { userId, date } } });
  if (!ch) return { ok: false, reason: "no_challenge" };
  if (!ch.completedAt) return { ok: false, reason: "not_completed" };
  if (ch.claimedAt) return { ok: false, reason: "already_claimed" };

  await db.$transaction([
    db.dailyChallenge.update({ where: { id: ch.id }, data: { claimedAt: new Date() } }),
    db.user.update({ where: { id: userId }, data: { coinBalance: { increment: ch.reward } } }),
    db.coinTransaction.create({
      data: { userId, kind: "reward", amount: ch.reward, reference: `daily_challenge:${date}` },
    }),
  ]);
  return { ok: true, reward: ch.reward };
}

export const CHALLENGES = CHALLENGE_DEFS;

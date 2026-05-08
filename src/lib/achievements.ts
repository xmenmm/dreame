import { db } from "./db";

export type AchievementDef = {
  code: string;
  title: string;
  description: string;
  emoji: string;
  rewardCoin?: number;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // Reading
  { code: "first_read",   title: "Halaman Pertama",  description: "Baca bab pertamamu",                emoji: "📖", rewardCoin: 5 },
  { code: "bookworm",     title: "Bookworm",         description: "Baca 10 bab",                       emoji: "🐛", rewardCoin: 15 },
  { code: "bibliophile",  title: "Bibliophile",      description: "Baca 100 bab",                      emoji: "📚", rewardCoin: 50 },
  // Streak
  { code: "streak_3",     title: "Konsisten",        description: "Streak baca 3 hari berturut-turut", emoji: "🔥", rewardCoin: 10 },
  { code: "streak_7",     title: "Mingguan",         description: "Streak baca 7 hari",                emoji: "🔥", rewardCoin: 25 },
  { code: "streak_30",    title: "Sebulan Penuh",    description: "Streak baca 30 hari",               emoji: "🏆", rewardCoin: 100 },
  // Bookmark
  { code: "bookmark_first", title: "Pertama Tersimpan", description: "Bookmark novel pertamamu",        emoji: "🔖", rewardCoin: 5 },
  { code: "bookmark_10",  title: "Kolektor",         description: "Punya 10 bookmark",                 emoji: "📌", rewardCoin: 20 },
  // Comment
  { code: "comment_first", title: "Bersuara",         description: "Posting komentar pertama",          emoji: "💬", rewardCoin: 5 },
  { code: "commentator",  title: "Commentator",      description: "Posting 10 komentar",               emoji: "🗣️", rewardCoin: 20 },
  // Coin
  { code: "supporter",    title: "Supporter",        description: "Habiskan coin pertamamu",           emoji: "🪙", rewardCoin: 5 },
  { code: "patron",       title: "Patron",           description: "Habiskan 100 coin total",           emoji: "💎", rewardCoin: 30 },
  // Rating
  { code: "first_review", title: "Reviewer",         description: "Tulis review pertamamu",            emoji: "⭐", rewardCoin: 10 },
];

const BY_CODE = new Map(ACHIEVEMENTS.map((a) => [a.code, a]));

export function getAchievementDef(code: string): AchievementDef | undefined {
  return BY_CODE.get(code);
}

/**
 * Try to unlock an achievement for user. If newly unlocked, grants coin reward
 * and creates a notification. Idempotent (safe to call repeatedly).
 */
export async function grantAchievement(userId: string, code: string) {
  const def = BY_CODE.get(code);
  if (!def) return false;

  try {
    await db.achievement.create({ data: { userId, code } });
  } catch {
    // unique constraint violation = already unlocked
    return false;
  }

  if (def.rewardCoin) {
    await db.user.update({
      where: { id: userId },
      data: { coinBalance: { increment: def.rewardCoin } },
    });
    await db.coinTransaction.create({
      data: {
        userId,
        kind: "reward",
        amount: def.rewardCoin,
        reference: `achievement:${code}`,
      },
    }).catch(() => {});
  }

  await db.notification.create({
    data: {
      userId,
      kind: "reward",
      title: `🏆 Achievement: ${def.title}`,
      body: `${def.emoji} ${def.description}${def.rewardCoin ? ` · +${def.rewardCoin} coin` : ""}`,
      link: `/u/${userId}`, // user profile
    },
  }).catch(() => {});

  return true;
}

/**
 * Check & unlock reading-related achievements based on user's chapter unlock count.
 * Call after a chapter read/unlock.
 */
export async function checkReadingAchievements(userId: string) {
  const count = await db.readingHistory.count({ where: { userId } });
  if (count >= 1)   await grantAchievement(userId, "first_read");
  if (count >= 10)  await grantAchievement(userId, "bookworm");
  if (count >= 100) await grantAchievement(userId, "bibliophile");
}

export async function checkStreakAchievements(userId: string, streak: number) {
  if (streak >= 3)  await grantAchievement(userId, "streak_3");
  if (streak >= 7)  await grantAchievement(userId, "streak_7");
  if (streak >= 30) await grantAchievement(userId, "streak_30");
}

export async function checkBookmarkAchievements(userId: string) {
  const count = await db.bookmark.count({ where: { userId } });
  if (count >= 1)  await grantAchievement(userId, "bookmark_first");
  if (count >= 10) await grantAchievement(userId, "bookmark_10");
}

export async function checkCommentAchievements(userId: string) {
  const count = await db.comment.count({ where: { userId } });
  if (count >= 1)  await grantAchievement(userId, "comment_first");
  if (count >= 10) await grantAchievement(userId, "commentator");
}

export async function checkCoinSpendAchievements(userId: string) {
  const total = await db.coinTransaction.aggregate({
    where: { userId, kind: "unlock" },
    _sum: { amount: true },
  });
  const spent = Math.abs(total._sum.amount ?? 0);
  if (spent >= 1)   await grantAchievement(userId, "supporter");
  if (spent >= 100) await grantAchievement(userId, "patron");
}

/**
 * Update user's reading streak based on lastReadAt vs now. Returns the new streak.
 */
export async function bumpReadingStreak(userId: string): Promise<number> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { readingStreak: true, lastReadAt: true },
  });
  if (!user) return 0;

  const last = user.lastReadAt ? new Date(user.lastReadAt) : null;
  const lastDay = last ? new Date(last.getFullYear(), last.getMonth(), last.getDate()) : null;

  let streak = user.readingStreak;
  if (!lastDay) {
    streak = 1;
  } else if (lastDay.getTime() === today.getTime()) {
    // already counted today, no change
    return streak;
  } else if (lastDay.getTime() === yesterday.getTime()) {
    streak = streak + 1;
  } else {
    streak = 1; // missed a day, reset
  }

  await db.user.update({
    where: { id: userId },
    data: { readingStreak: streak, lastReadAt: now },
  });

  await checkStreakAchievements(userId, streak).catch(() => {});
  return streak;
}

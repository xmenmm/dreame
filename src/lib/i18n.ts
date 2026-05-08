// Lightweight i18n: cookie-based locale, server-side dict resolution.
// No external deps. Add new strings in DICT below.

import { cookies } from "next/headers";

export type Locale = "id" | "en";

export const DEFAULT_LOCALE: Locale = "id";
export const LOCALES: Locale[] = ["id", "en"];

const DICT = {
  // navigation
  "nav.home":           { id: "Home",            en: "Home" },
  "nav.discover":       { id: "Discover",        en: "Discover" },
  "nav.genre":          { id: "Genre",           en: "Genres" },
  "nav.library":        { id: "Library",         en: "Library" },
  "nav.bookmarks":      { id: "Bookmark",        en: "Bookmarks" },
  "nav.history":        { id: "History",         en: "History" },
  "nav.writerStudio":   { id: "Writer Studio",   en: "Writer Studio" },
  "nav.admin":          { id: "Admin",           en: "Admin" },
  "nav.legal":          { id: "Legal / DMCA",    en: "Legal / DMCA" },
  "nav.section.browse": { id: "Telusuri",        en: "Browse" },
  "nav.section.mine":   { id: "Punya Saya",      en: "Mine" },
  "nav.section.writer": { id: "Penulis",         en: "Writer" },
  "nav.section.more":   { id: "Lainnya",         en: "More" },

  // common
  "common.login":       { id: "Masuk",           en: "Sign in" },
  "common.register":    { id: "Daftar",          en: "Register" },
  "common.logout":      { id: "Keluar",          en: "Sign out" },
  "common.save":        { id: "Simpan",          en: "Save" },
  "common.cancel":      { id: "Batal",           en: "Cancel" },
  "common.delete":      { id: "Hapus",           en: "Delete" },
  "common.coins":       { id: "coin",            en: "coins" },
  "common.search":      { id: "Cari novel, penulis, genre...", en: "Search novels, authors, genres..." },
  "common.seeAll":      { id: "Lihat semua",     en: "See all" },
  "common.viewSite":    { id: "Lihat di Site",   en: "View on Site" },

  // home
  "home.featured":      { id: "FEATURED NOVEL",  en: "FEATURED NOVEL" },
  "home.read":          { id: "Baca Sekarang",   en: "Read Now" },
  "home.forYou":        { id: "Untuk Kamu",      en: "For You" },
  "home.trending":      { id: "Trending Sekarang", en: "Trending Now" },
  "home.popular":       { id: "Paling Populer",  en: "Most Popular" },
  "home.newest":        { id: "Baru Rilis",      en: "New Releases" },

  // novel
  "novel.startReading": { id: "Mulai Baca",      en: "Start Reading" },
  "novel.bookmark":     { id: "Bookmark",        en: "Bookmark" },
  "novel.chapters":     { id: "Daftar Bab",      en: "Chapter List" },
  "novel.free":         { id: "GRATIS",          en: "FREE" },
  "novel.unlocked":     { id: "DIBUKA",          en: "UNLOCKED" },
  "novel.giveRating":   { id: "Kasih Rating",    en: "Give Rating" },
  "novel.comments":     { id: "Komentar",        en: "Comments" },
  "novel.follow":       { id: "Ikuti",           en: "Follow" },
  "novel.following":    { id: "Mengikuti",       en: "Following" },
  "novel.byAuthor":     { id: "oleh",            en: "by" },
  "novel.status.ongoing":   { id: "Berlangsung", en: "Ongoing" },
  "novel.status.completed": { id: "Tamat",       en: "Completed" },
  "novel.status.hiatus":    { id: "Hiatus",      en: "Hiatus" },

  // reader
  "reader.lockedTitle":  { id: "Bab terkunci",   en: "Chapter locked" },
  "reader.unlockWith":   { id: "Buka dengan",    en: "Unlock with" },
  "reader.loginToUnlock":{ id: "Masuk untuk Buka", en: "Sign in to Unlock" },
  "reader.previous":     { id: "Sebelumnya",     en: "Previous" },
  "reader.next":         { id: "Selanjutnya",    en: "Next" },
  "reader.lastChapter":  { id: "Bab terakhir",   en: "Last chapter" },

  // wallet
  "wallet.title":        { id: "Wallet",         en: "Wallet" },
  "wallet.subtitle":     { id: "Kelola coin kamu untuk buka bab premium.", en: "Manage your coins to unlock premium chapters." },
  "wallet.balance":      { id: "Saldo Coin",     en: "Coin Balance" },
  "wallet.topup":        { id: "Top-up Coin",    en: "Top up Coins" },
  "wallet.history":      { id: "Riwayat Transaksi", en: "Transaction History" },
  "wallet.bestValue":    { id: "Best Value",     en: "Best Value" },

  // daily reward
  "reward.title":        { id: "Hadiah Login Harian", en: "Daily Login Reward" },
  "reward.claim":        { id: "Klaim",          en: "Claim" },
  "reward.claimed":      { id: "Sudah Diklaim Hari Ini", en: "Already Claimed Today" },
  "reward.streak":       { id: "Streak",         en: "Streak" },

  // notifications
  "notif.title":         { id: "Notifikasi",     en: "Notifications" },
  "notif.empty":         { id: "Belum ada notifikasi.", en: "No notifications yet." },
} as const;

type Key = keyof typeof DICT;

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get("dreame_locale")?.value as Locale | undefined;
  return v && LOCALES.includes(v) ? v : DEFAULT_LOCALE;
}

export async function getT(): Promise<(key: Key) => string> {
  const locale = await getLocale();
  return (key: Key) => DICT[key][locale];
}

export function tFor(locale: Locale, key: Key): string {
  return DICT[key][locale];
}

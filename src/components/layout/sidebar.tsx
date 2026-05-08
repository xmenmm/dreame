"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Compass, BookOpen, Heart, History, PenLine,
  Sparkles, User2, Coins, ShieldCheck, FileText, Layout, Bot, LayoutGrid, Users, Flame, Gift, Quote,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type SidebarUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  coinBalance: number;
  readingStreak?: number;
} | null;

const NAV: Array<{ section: string; items: Array<{ href: string; label: string; icon: React.ElementType; auth?: boolean; admin?: boolean; writer?: boolean }> }> = [
  {
    section: "Telusuri",
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/discover", label: "Discover", icon: Compass },
      { href: "/genre", label: "Genre", icon: Sparkles },
    ],
  },
  {
    section: "Punya Saya",
    items: [
      { href: "/library", label: "Library", icon: BookOpen, auth: true },
      { href: "/bookmarks", label: "Bookmarks", icon: Heart, auth: true },
      { href: "/history", label: "History", icon: History, auth: true },
      { href: "/quotes", label: "Quote", icon: Quote, auth: true },
    ],
  },
  {
    section: "Penulis",
    items: [
      { href: "/writer", label: "Writer Studio", icon: PenLine, auth: true },
    ],
  },
  {
    section: "Komunitas",
    items: [
      { href: "/referral", label: "Undang Teman", icon: Gift, auth: true },
    ],
  },
  {
    section: "Lainnya",
    items: [
      { href: "/admin", label: "Admin", icon: ShieldCheck, admin: true },
      { href: "/admin/users", label: "Manajemen User", icon: Users, admin: true },
      { href: "/admin/bot-novel", label: "AI Novelist", icon: Bot, admin: true },
      { href: "/admin/home-layout", label: "Home Layout", icon: LayoutGrid, admin: true },
      { href: "/admin/landing", label: "Landing Page", icon: Layout, admin: true },
      { href: "/admin/reader-banners", label: "Banner Reader", icon: Layout, admin: true },
      { href: "/legal", label: "Legal / DMCA", icon: FileText },
    ],
  },
];

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  if (pathname.startsWith("/welcome")) return null;

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 h-screen w-60 flex-col border-r border-[var(--border)] bg-[var(--surface)] z-30"
    >
      <Link href="/" className="flex items-center gap-2 px-5 h-16 border-b border-[var(--border)]">
        <div className="size-8 rounded-lg bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black">L</div>
        <span className="text-lg font-bold tracking-tight">Lentera</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => {
          const visible = group.items.filter((it) => {
            if (it.admin && user?.role !== "admin") return false;
            if (it.writer && !(user?.role === "writer" || user?.role === "admin")) return false;
            if (it.auth && !user) return false;
            return true;
          });
          if (!visible.length) return null;

          return (
            <div key={group.section} className="mb-5">
              <div className="px-3 pb-2 text-[10px] font-semibold tracking-widest text-[var(--muted)] uppercase">
                {group.section}
              </div>
              <ul className="space-y-1">
                {visible.map((it) => {
                  const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
                  const Icon = it.icon;
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition",
                          active
                            ? "bg-[var(--surface-2)] text-foreground"
                            : "text-[var(--muted)] hover:text-foreground hover:bg-[var(--surface-2)]/50",
                        )}
                      >
                        <Icon className="size-[18px]" />
                        <span>{it.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3 flex items-center justify-between gap-2">
        <ThemeToggle />
        <div className="flex items-center gap-1">
          <form action="/api/locale" method="POST" className="contents">
            <button name="locale" value="id" className="px-2 h-6 rounded text-[10px] font-bold text-[var(--muted)] hover:text-[var(--foreground)]">ID</button>
          </form>
          <span className="text-[10px] text-[var(--muted)]">·</span>
          <form action="/api/locale" method="POST" className="contents">
            <button name="locale" value="en" className="px-2 h-6 rounded text-[10px] font-bold text-[var(--muted)] hover:text-[var(--foreground)]">EN</button>
          </form>
        </div>
      </div>

      <div className="border-t border-[var(--border)] p-3">
        {user ? (
          <Link
            href={`/u/${user.username}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] transition"
          >
            <div className="size-9 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-bold">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{user.displayName}</div>
              <div className="text-xs text-[var(--muted)] flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Coins className="size-3 text-[var(--primary)]" />
                  {formatNumber(user.coinBalance)}
                </span>
                {(user.readingStreak ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-400 font-bold">
                    <Flame className="size-3" />
                    {user.readingStreak}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 h-9 rounded-lg bg-[var(--primary)] text-black font-semibold text-sm hover:bg-[var(--primary-hover)]"
            >
              <User2 className="size-4" /> Masuk
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 h-9 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--surface-2)]"
            >
              Daftar
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, BookOpen, User2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/profile", label: "Profile", icon: User2 },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/welcome")) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)]">
      <ul className="h-full grid grid-cols-4">
        {ITEMS.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname.startsWith(it.href));
          const Icon = it.icon;
          return (
            <li key={it.href} className="flex">
              <Link
                href={it.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 transition",
                  active ? "text-[var(--primary)]" : "text-[var(--muted)]",
                )}
              >
                <Icon className="size-5" />
                <span className="text-[10px] font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

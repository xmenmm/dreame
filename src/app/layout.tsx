import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Abril_Fatface } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { TopBar } from "@/components/layout/topbar";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { MainContent } from "@/components/layout/main-content";
import { Toaster } from "@/components/ui/toaster";
import { ContinueReadingFloating } from "@/components/floating/continue-reading";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const abril = Abril_Fatface({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"], // Abril Fatface only ships in Regular
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lentera — Discover. Read. Dream.",
  description: "Platform baca novel — temukan kisah baru setiap hari, web & mobile.",
  applicationName: "Lentera",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const unreadNotifs = user
    ? await db.notification.count({ where: { userId: user.id, isRead: false } })
    : 0;
  // Apply 36-hour staleness to display streak
  const now = Date.now();
  const lastRead = (user as { lastReadAt?: Date | null } | null)?.lastReadAt?.getTime() ?? 0;
  const stale = lastRead && (now - lastRead) > 36 * 60 * 60 * 1000;
  const readingStreak = stale ? 0 : (user as { readingStreak?: number } | null)?.readingStreak ?? 0;
  const userWithCount = user ? { ...user, unreadNotifs, readingStreak } : null;

  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} ${abril.variable} min-h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* FOUC prevention — apply theme BEFORE React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('lentera-theme');if(!t||(t!=='light'&&t!=='dark'&&t!=='sepia'))t='dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-full">
        <div className="flex min-h-screen">
          <Sidebar user={user} />
          <MainContent>
            <TopBar user={userWithCount} />
            <main className="flex-1 pb-24 md:pb-8">{children}</main>
          </MainContent>
        </div>
        <MobileBottomNav />
        <CookieBanner />
        <Toaster />
        {user && <ContinueReadingFloating />}
      </body>
    </html>
  );
}

"use client";

import { usePathname } from "next/navigation";

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicLanding = pathname.startsWith("/welcome");

  if (isPublicLanding) {
    return <div className="flex-1 min-w-0">{children}</div>;
  }

  return <div className="flex-1 min-w-0 flex flex-col md:pl-60">{children}</div>;
}

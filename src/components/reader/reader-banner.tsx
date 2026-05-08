import type { ReaderBanner } from "@/lib/site-config";

export function ReaderBannerSlot({
  banner,
  className = "",
  children,
}: {
  banner: ReaderBanner;
  className?: string;
  children?: React.ReactNode;
}) {
  if (!banner) return children ? <>{children}</> : null;
  const isExternal = /^https?:\/\//i.test(banner.linkUrl);
  return (
    <a
      href={banner.linkUrl}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer sponsored" : undefined}
      className={`block rounded-xl overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] transition group ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imageUrl}
        alt={banner.alt ?? "banner"}
        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        loading="lazy"
      />
    </a>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Star, BookOpen } from "lucide-react";

export type NovelCardData = {
  slug: string;
  title: string;
  coverUrl: string;
  rating: number;
  status: string;
  chapterCount: number;
  publishedYear: number;
};

export function NovelCard({ novel }: { novel: NovelCardData }) {
  const isAiCover = novel.coverUrl.includes("pollinations.ai") || novel.coverUrl.startsWith("/uploads/");
  return (
    <Link
      href={`/novel/${novel.slug}`}
      className="group block w-[150px] md:w-[170px] shrink-0"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[var(--surface-2)] ring-1 ring-[var(--border)] group-hover:ring-[var(--primary)] transition">
        {isAiCover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={novel.coverUrl}
            alt={novel.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <Image
            src={novel.coverUrl}
            alt={novel.title}
            fill
            sizes="170px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-xs font-semibold">
          <Star className="size-3 fill-[var(--primary)] text-[var(--primary)]" />
          {novel.rating.toFixed(1)}
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-bold">
          <BookOpen className="size-3" />
          {novel.chapterCount} CH
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] uppercase tracking-wider">
          <span className="font-bold">NOVEL</span>
          <span>·</span>
          <span>{novel.publishedYear}</span>
        </div>
        <div className="mt-1 text-sm font-semibold line-clamp-2 group-hover:text-[var(--primary)] transition">
          {novel.title}
        </div>
      </div>
    </Link>
  );
}

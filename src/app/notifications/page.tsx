import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, MessageSquare, UserPlus, BookOpen, Gift, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ICONS: Record<string, React.ElementType> = {
  comment_reply: MessageSquare,
  follow: UserPlus,
  chapter_new: BookOpen,
  reward: Gift,
  system: AlertCircle,
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  const notifs = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return (
    <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
        <Bell className="size-7" /> Notifikasi
      </h1>
      <p className="text-[var(--muted)] mt-1 mb-8">{notifs.length} pemberitahuan terbaru.</p>

      {notifs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-10 text-center">
          <Bell className="size-10 mx-auto mb-3 text-[var(--muted)]" />
          <p className="text-sm text-[var(--muted)]">Belum ada notifikasi. Aktivitasmu akan muncul di sini.</p>
        </div>
      ) : (
        <ul className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
          {notifs.map((n) => {
            const Icon = ICONS[n.kind] ?? Bell;
            const inner = (
              <div className="flex gap-3 px-4 py-3 hover:bg-[var(--surface-2)] transition">
                <div className={`size-10 rounded-full grid place-items-center shrink-0 ${n.isRead ? "bg-[var(--surface-2)] text-[var(--muted)]" : "bg-[var(--primary)]/20 text-[var(--primary)]"}`}>
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{n.title}</div>
                  {n.body && <div className="text-xs text-[var(--muted)] line-clamp-2 mt-0.5">{n.body}</div>}
                  <div className="text-[10px] text-[var(--muted)] mt-1">{new Date(n.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</div>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? <Link href={n.link}>{inner}</Link> : <div>{inner}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

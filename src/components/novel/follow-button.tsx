"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";

export function FollowButton({
  authorId,
  initialFollowing,
}: { authorId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/follow/${authorId}`, { method: following ? "DELETE" : "POST" });
    if (res.ok) setFollowing(!following);
    else if (res.status === 401) window.location.href = "/login?next=" + window.location.pathname;
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`h-7 px-3 rounded-full text-xs font-bold inline-flex items-center gap-1 transition ${following ? "bg-[var(--surface-2)] text-[var(--muted)]" : "bg-[var(--primary)] text-black hover:bg-[var(--primary-hover)]"} disabled:opacity-50`}
    >
      {following ? <><UserCheck className="size-3" /> Mengikuti</> : <><UserPlus className="size-3" /> Ikuti</>}
    </button>
  );
}

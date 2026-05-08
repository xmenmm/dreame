"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageSquare, Send, Flag, ChevronDown } from "lucide-react";

type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  isHidden: boolean;
  user: { username: string; displayName: string; avatarUrl: string | null };
  replies?: CommentItem[];
};

export function CommentsSection({
  novelId,
  chapterId,
  initial,
  isLoggedIn,
}: {
  novelId?: string;
  chapterId?: string;
  initial: CommentItem[];
  isLoggedIn: boolean;
}) {
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ novelId, chapterId, body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error === "blocked" ? "Komentar mengandung kata terlarang." : j.error === "unauthorized" ? "Login dulu" : "Gagal mengirim");
        return;
      }
      const data = await res.json();
      setComments([data.comment, ...comments]);
      setBody("");
    });
  }

  async function submitReply(parentId: string) {
    if (!replyBody.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ novelId, chapterId, body: replyBody, parentId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setComments((cs) => cs.map((c) => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), data.comment] } : c));
    setReplyBody("");
    setReplyTo(null);
  }

  async function reportComment(id: string) {
    if (!confirm("Laporkan komentar ini? Akan ditinjau moderator.")) return;
    const reason = prompt("Alasan? (spam | nsfw | hate | other)") || "other";
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "comment", targetId: id, reason }),
    });
    if (res.ok) alert("Terima kasih. Laporan kamu akan ditinjau.");
    else alert("Gagal melaporkan.");
  }

  return (
    <section className="mt-10">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="size-4" /> Komentar <span className="text-[var(--muted)] font-normal">({comments.length})</span>
      </h3>

      {isLoggedIn ? (
        <form onSubmit={submit} className="mb-6">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Apa pendapat kamu?"
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--muted)]">{body.length}/1000</span>
            <button
              type="submit"
              disabled={pending || !body.trim()}
              className="h-9 px-4 rounded-full bg-[var(--primary)] text-black text-sm font-bold inline-flex items-center gap-2 hover:bg-[var(--primary-hover)] disabled:opacity-50 transition"
            >
              <Send className="size-3" /> Kirim
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)] text-center">
          <Link href="/login" className="text-[var(--primary)] font-semibold">Masuk</Link> untuk meninggalkan komentar.
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-[var(--muted)] text-center py-8">Belum ada komentar. Jadi yang pertama!</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl bg-[var(--surface)] border border-[var(--border)] p-4">
              <CommentBody c={c} onReport={reportComment} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} canReply={isLoggedIn} />

              {replyTo === c.id && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-[var(--border)]">
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Balas..."
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => submitReply(c.id)} className="h-8 px-3 rounded-full bg-[var(--primary)] text-black text-xs font-bold">Balas</button>
                    <button onClick={() => { setReplyTo(null); setReplyBody(""); }} className="h-8 px-3 rounded-full text-xs text-[var(--muted)]">Batal</button>
                  </div>
                </div>
              )}

              {c.replies && c.replies.length > 0 && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-[var(--border)] space-y-3">
                  {c.replies.map((r) => (
                    <CommentBody key={r.id} c={r} onReport={reportComment} compact />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentBody({
  c, onReport, onReply, canReply, compact,
}: {
  c: CommentItem;
  onReport: (id: string) => void;
  onReply?: () => void;
  canReply?: boolean;
  compact?: boolean;
}) {
  if (c.isHidden) {
    return <div className="text-xs italic text-[var(--muted)]">[Komentar disembunyikan oleh moderator]</div>;
  }
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/u/${c.user.username}`} className="flex items-center gap-2 hover:underline">
          <div className={`${compact ? "size-7" : "size-8"} rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-bold text-xs`}>
            {c.user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold">{c.user.displayName}</div>
            <div className="text-[10px] text-[var(--muted)]">{new Date(c.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</div>
          </div>
        </Link>
        <button onClick={() => onReport(c.id)} className="text-[var(--muted)] hover:text-red-400 transition" title="Laporkan">
          <Flag className="size-3.5" />
        </button>
      </div>
      <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">{c.body}</p>
      {onReply && canReply && (
        <button onClick={onReply} className="text-xs text-[var(--muted)] hover:text-[var(--primary)] mt-2 transition">
          Balas
        </button>
      )}
    </div>
  );
}

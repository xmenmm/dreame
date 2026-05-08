"use client";

import { useState } from "react";
import Link from "next/link";
import { Coins, BadgeCheck, ShieldAlert, Crown, ChevronRight, Check, X } from "lucide-react";

type User = {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  isVerified: boolean;
  isBanned: boolean;
  coinBalance: number;
  createdAt: string;
  novelsCount: number;
  followersCount: number;
};

export function UsersListClient({ users }: { users: User[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<"none" | "coins" | "ban" | "role">("none");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ ok: number; fail: number } | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll() {
    if (selected.size === users.length) setSelected(new Set());
    else setSelected(new Set(users.map((u) => u.id)));
  }

  async function execute(formData: FormData) {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`Jalankan ke ${ids.length} user?`)) return;

    setRunning(true);
    setProgress(0);
    setResults(null);
    let ok = 0, fail = 0;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const fd = new FormData();
      formData.forEach((v, k) => fd.append(k, v));

      let endpoint = "";
      if (action === "coins") endpoint = `/api/admin/users/${id}/grant-coins`;
      else if (action === "ban") endpoint = `/api/admin/users/${id}/ban`;
      else if (action === "role") endpoint = `/api/admin/users/${id}/role`;

      try {
        const r = await fetch(endpoint, { method: "POST", body: fd, redirect: "manual" });
        if (r.type === "opaqueredirect" || r.ok) ok += 1;
        else fail += 1;
      } catch { fail += 1; }
      setProgress(i + 1);
    }

    setRunning(false);
    setResults({ ok, fail });
    setAction("none");
    setSelected(new Set());
    if (ok > 0) {
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {/* Header with select-all */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-2)]/50 text-xs">
          <button onClick={selectAll} className="size-5 rounded border border-[var(--border)] grid place-items-center hover:border-[var(--primary)]">
            {selected.size === users.length && users.length > 0 ? <Check className="size-3 text-[var(--primary)]" /> : null}
          </button>
          <span className="text-[var(--muted)] font-semibold">
            {selected.size > 0 ? <span className="text-[var(--primary)]">{selected.size} dipilih</span> : `${users.length} user`}
          </span>
        </div>

        {users.length === 0 ? (
          <p className="text-sm text-[var(--muted)] text-center py-12">Tidak ada user yang cocok.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {users.map((u) => {
              const isSelected = selected.has(u.id);
              return (
                <li key={u.id} className={`flex items-center gap-3 p-3 hover:bg-[var(--surface-2)]/50 transition ${isSelected ? "bg-[var(--primary)]/5" : ""}`}>
                  <button
                    onClick={() => toggle(u.id)}
                    className={`size-5 rounded border grid place-items-center shrink-0 transition ${
                      isSelected
                        ? "bg-[var(--primary)] border-[var(--primary)]"
                        : "border-[var(--border)] hover:border-[var(--primary)]"
                    }`}
                    aria-label={isSelected ? "Unselect" : "Select"}
                  >
                    {isSelected && <Check className="size-3 text-black" />}
                  </button>
                  <div className="size-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-bold shrink-0">
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <Link href={`/admin/users/${u.id}`} className="flex-1 min-w-0 group">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate group-hover:text-[var(--primary)] transition">{u.displayName}</span>
                      {u.isVerified && <BadgeCheck className="size-3.5 text-[var(--primary)]" />}
                      {u.role === "admin" && (
                        <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                      )}
                      {u.role === "writer" && (
                        <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Writer</span>
                      )}
                      {u.isBanned && (
                        <span className="text-[9px] font-bold bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Banned</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] truncate">@{u.username} · {u.email}</div>
                    <div className="text-[10px] text-[var(--muted)] flex items-center gap-3 mt-0.5">
                      <span className="inline-flex items-center gap-1"><Coins className="size-3 text-[var(--primary)]" /> {u.coinBalance}</span>
                      <span>· {u.novelsCount} cerita</span>
                      <span>· {u.followersCount} pengikut</span>
                    </div>
                  </Link>
                  <Link href={`/admin/users/${u.id}`} className="text-[var(--muted)] hover:text-foreground">
                    <ChevronRight className="size-5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Bulk action bar (sticky bottom) */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 mt-4 bg-[var(--background)]/95 backdrop-blur border-t border-[var(--border)] -mx-4 md:-mx-8 px-4 md:px-8 py-3 z-10">
          {action === "none" && !running && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold mr-2">
                <strong className="text-[var(--primary)]">{selected.size}</strong> dipilih:
              </span>
              <button onClick={() => setAction("coins")} className="h-9 px-3 rounded-full bg-[var(--primary)] text-black text-xs font-bold inline-flex items-center gap-1.5">
                <Coins className="size-3.5" /> Kasih Coin
              </button>
              <button onClick={() => setAction("ban")} className="h-9 px-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-bold inline-flex items-center gap-1.5">
                <ShieldAlert className="size-3.5" /> Ban / Cabut
              </button>
              <button onClick={() => setAction("role")} className="h-9 px-3 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5">
                <Crown className="size-3.5" /> Set Role
              </button>
              <button onClick={() => setSelected(new Set())} className="h-9 px-3 text-xs text-[var(--muted)] hover:text-foreground inline-flex items-center gap-1">
                <X className="size-3" /> Clear
              </button>
            </div>
          )}

          {action !== "none" && !running && (
            <form onSubmit={(e) => { e.preventDefault(); execute(new FormData(e.currentTarget)); }}
              className="flex flex-wrap items-center gap-2">
              {action === "coins" && (
                <>
                  <input name="amount" type="number" min={1} max={100000} required placeholder="Coin"
                    className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm w-28" />
                  <input name="reason" type="text" placeholder="Alasan"
                    className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm flex-1 min-w-[200px]" />
                </>
              )}
              {action === "ban" && (
                <select name="value" defaultValue="true" className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm">
                  <option value="true">Ban {selected.size} user</option>
                  <option value="false">Cabut ban {selected.size} user</option>
                </select>
              )}
              {action === "role" && (
                <select name="role" defaultValue="reader" className="h-9 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm">
                  <option value="reader">Set ke Reader</option>
                  <option value="writer">Set ke Writer</option>
                  <option value="admin">Set ke Admin</option>
                </select>
              )}
              <button type="submit" className="h-9 px-4 rounded-full bg-[var(--primary)] text-black text-xs font-bold">
                Jalankan ({selected.size})
              </button>
              <button type="button" onClick={() => setAction("none")} className="h-9 px-3 text-xs text-[var(--muted)]">Batal</button>
            </form>
          )}

          {running && (
            <div className="text-sm flex items-center gap-3">
              <div className="flex-1 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--primary)] transition-all" style={{ width: `${(progress / selected.size) * 100}%` }} />
              </div>
              <span><strong>{progress}/{selected.size}</strong></span>
            </div>
          )}
        </div>
      )}

      {results && (
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400 text-center">
          ✓ Berhasil: {results.ok} {results.fail > 0 && <span className="text-red-400 ml-2">⚠ Gagal: {results.fail}</span>} · Refreshing...
        </div>
      )}
    </>
  );
}

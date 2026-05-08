import Link from "next/link";
import { redirect } from "next/navigation";
import { Coins, ArrowDownToLine, ArrowUpFromLine, Sparkles, Clock } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WalletPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wallet");

  const [packs, txs] = await Promise.all([
    db.coinPack.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.coinTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
        <Coins className="size-7 text-[var(--primary)]" /> Wallet
      </h1>
      <p className="text-[var(--muted)] mb-8">Kelola coin kamu untuk buka bab premium.</p>

      {status === "success" && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          ✓ Pembayaran berhasil! Coin sudah ditambahkan ke akun kamu.
        </div>
      )}
      {status === "pending" && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
          ⏳ Pembayaran sedang diproses. Coin akan masuk dalam 1–5 menit setelah konfirmasi.
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-[var(--primary)]/15 via-[var(--accent)]/10 to-transparent border border-[var(--primary)]/30 p-6 mb-8">
        <div className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-2">Saldo Coin</div>
        <div className="flex items-center gap-3">
          <Coins className="size-10 text-[var(--primary)]" />
          <div className="text-5xl font-black">{formatNumber(user.coinBalance)}</div>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3">Top-up Coin</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        {packs.map((p) => {
          const pricePerCoin = p.priceIDR / (p.coins + p.bonus);
          const isBest = p.slug === "best";
          return (
            <form key={p.id} action="/api/wallet/topup" method="POST" className="contents">
              <input type="hidden" name="packId" value={p.id} />
              <button
                type="submit"
                className={`relative rounded-2xl border p-4 text-left transition ${isBest ? "bg-[var(--primary)]/10 border-[var(--primary)]" : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]"}`}
              >
                {isBest && (
                  <div className="absolute -top-2 right-2 px-2 py-0.5 bg-[var(--primary)] text-black text-[9px] font-black rounded uppercase tracking-wider">Best Value</div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Coins className={`size-5 ${isBest ? "text-[var(--primary)]" : "text-[var(--muted)]"}`} />
                  <div className="text-xl font-black">{formatNumber(p.coins)}</div>
                </div>
                {p.bonus > 0 && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mb-2">
                    <Sparkles className="size-3" /> +{p.bonus} bonus
                  </div>
                )}
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-lg font-bold mt-1">Rp {p.priceIDR.toLocaleString("id-ID")}</div>
                <div className="text-[10px] text-[var(--muted)] mt-1">≈ Rp {pricePerCoin.toFixed(0)}/coin</div>
              </button>
            </form>
          );
        })}
      </div>

      <div className="text-xs text-[var(--muted)] mb-6 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
        💡 Pembayaran via <strong>Midtrans</strong> (Indonesia: GoPay, OVO, Dana, transfer bank, kartu).
        Untuk Android/iOS app, top-up wajib lewat Google Play Billing / Apple StoreKit.
      </div>

      <h2 className="text-lg font-bold mb-3">Riwayat Transaksi</h2>
      {txs.length === 0 ? (
        <p className="text-sm text-[var(--muted)] text-center py-8">Belum ada transaksi.</p>
      ) : (
        <ul className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden">
          {txs.map((t) => {
            const isCredit = t.amount > 0;
            const Icon = isCredit ? ArrowDownToLine : ArrowUpFromLine;
            const label = ({
              topup: "Top-up coin",
              unlock: "Buka bab",
              reward: "Hadiah",
              refund: "Refund",
              payout: "Withdraw",
            } as const)[t.kind] ?? t.kind;
            return (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`size-9 rounded-full grid place-items-center shrink-0 ${isCredit ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                    <Clock className="size-3" /> {new Date(t.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
                <div className={`font-bold text-sm ${isCredit ? "text-emerald-400" : "text-red-400"}`}>
                  {isCredit ? "+" : ""}{t.amount} coin
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

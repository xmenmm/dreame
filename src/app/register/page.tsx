import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie, getCurrentUser } from "@/lib/auth";
import { verifyCaptcha } from "@/lib/captcha";
import { CaptchaWidget } from "@/components/auth/captcha-widget";
import { ensureReferralCode, findReferrerByCode, REFERRAL } from "@/lib/referral";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; ref?: string }> }) {
  const { error, ref } = await searchParams;
  const u = await getCurrentUser();
  if (u) redirect(u.onboardedAt ? "/" : "/onboarding");

  // Preview referrer if `?ref=CODE` provided
  const referrerPreview = ref ? await findReferrerByCode(ref) : null;
  const validRefCode = referrerPreview ? ref!.trim().toUpperCase() : null;
  let referrerName: string | null = null;
  if (referrerPreview) {
    const ref_user = await db.user.findUnique({
      where: { id: referrerPreview.id },
      select: { displayName: true, username: true },
    });
    referrerName = ref_user ? `${ref_user.displayName} (@${ref_user.username})` : null;
  }

  async function handleRegister(formData: FormData) {
    "use server";
    const username = String(formData.get("username") || "").toLowerCase().trim();
    const displayName = String(formData.get("displayName") || "").trim();
    const password = String(formData.get("password") || "");
    const captcha = String(formData.get("captcha") || "");
    const honeypot = String(formData.get("website") || "");
    const refCode = String(formData.get("refCode") || "").trim();
    const startedAt = parseInt(String(formData.get("started_at") || "0"), 10);
    const elapsed = Date.now() - startedAt;

    if (honeypot) redirect("/register?error=bot");
    if (!startedAt || elapsed < 2000) redirect("/register?error=too_fast");
    if (!(await verifyCaptcha(captcha))) redirect("/register?error=captcha");

    if (!username || !password || password.length < 8) {
      redirect("/register?error=invalid");
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      redirect("/register?error=username_format");
    }

    const dup = await db.user.findUnique({ where: { username } });
    if (dup) redirect("/register?error=duplicate");

    // Resolve referral
    let referredByUserId: string | null = null;
    let bonusCoin = 0;
    if (refCode) {
      const r = await findReferrerByCode(refCode);
      if (r) {
        referredByUserId = r.id;
        bonusCoin = REFERRAL.REWARD_REFEREE_COIN;
      }
    }

    const baseEmail = `${username}@lentera.local`;
    let email = baseEmail;
    let suffix = 0;
    while (await db.user.findUnique({ where: { email } })) {
      suffix += 1;
      email = `${username}+${suffix}@lentera.local`;
    }

    const user = await db.user.create({
      data: {
        email,
        username,
        displayName: displayName || username,
        passwordHash: await hashPassword(password),
        role: "reader",
        coinBalance: 50 + bonusCoin,
        referredByUserId,
      },
    });
    await ensureReferralCode(user.id).catch(() => {});

    if (bonusCoin > 0) {
      await db.coinTransaction.create({
        data: { userId: user.id, kind: "reward", amount: bonusCoin, reference: "referral_signup" },
      }).catch(() => {});
      await db.notification.create({
        data: {
          userId: user.id, kind: "reward",
          title: `🎁 +${bonusCoin} coin bonus referral`,
          body: `Selamat bergabung lewat undangan teman!`,
          link: "/wallet",
        },
      }).catch(() => {});
    }

    const token = signToken({ sub: user.id, role: user.role });
    await setAuthCookie(token);
    redirect("/onboarding");
  }

  const startedAt = Date.now();

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black text-2xl mb-3">L</div>
          <h1 className="text-2xl font-bold">Buat akun baru</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Gabung & dapat 50 coin gratis</p>
        </div>

        {error === "duplicate" && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            Username sudah dipakai.
          </div>
        )}
        {error === "username_format" && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            Username: 3–30 karakter, huruf kecil/angka/underscore saja.
          </div>
        )}
        {error === "invalid" && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            Lengkapi form (password min. 8 karakter).
          </div>
        )}
        {error === "captcha" && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            CAPTCHA salah, coba lagi.
          </div>
        )}
        {(error === "bot" || error === "too_fast") && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            Verifikasi gagal. Pastikan kamu bukan bot.
          </div>
        )}

        {referrerName && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-[var(--primary)]/15 to-[var(--accent)]/10 border border-[var(--primary)]/30 text-sm text-center">
            🎁 Diundang oleh <span className="font-bold">{referrerName}</span> · kamu dapat <span className="text-[var(--primary)] font-bold">+{REFERRAL.REWARD_REFEREE_COIN} coin</span> bonus
          </div>
        )}
        <form action={handleRegister} className="space-y-3">
          <input type="hidden" name="started_at" value={startedAt} />
          {validRefCode && <input type="hidden" name="refCode" value={validRefCode} />}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
          />

          <input
            name="displayName" required placeholder="Nama tampilan" maxLength={60}
            className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition"
          />
          <input
            name="username" required placeholder="Username (huruf kecil, no spasi)" pattern="^[a-z0-9_]+$"
            className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition"
          />
          <input
            type="password" name="password" required minLength={8} placeholder="Password (min 8)"
            className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition"
          />

          <CaptchaWidget />

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            Daftar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[var(--primary)] font-semibold">Masuk</Link>
        </p>

        <p className="mt-4 text-[10px] text-[var(--muted)] text-center">
          Dengan daftar, kamu setuju dengan <Link href="/legal" className="underline">Ketentuan & Privasi</Link>.
        </p>
      </div>
    </div>
  );
}

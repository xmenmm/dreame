import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword, signToken, setAuthCookie, getCurrentUser } from "@/lib/auth";

const MAX_FAILS = 3;
const LOCK_SECONDS = 30;

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ next?: string; error?: string; lock?: string }> }) {
  const { next = "/", error, lock } = await searchParams;
  const u = await getCurrentUser();
  if (u) redirect(next);

  async function handleLogin(formData: FormData) {
    "use server";
    const identifier = String(formData.get("identifier") || "").toLowerCase().trim();
    const password = String(formData.get("password") || "");
    const next = String(formData.get("next") || "/");

    // Allow login by email OR username
    const user = await db.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
    if (!user) {
      redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const seconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      redirect(`/login?error=locked&lock=${seconds}&next=${encodeURIComponent(next)}`);
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      const newCount = (user.failedLoginCount || 0) + 1;
      const shouldLock = newCount >= MAX_FAILS;
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: shouldLock ? 0 : newCount,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_SECONDS * 1000) : user.lockedUntil,
        },
      });
      if (shouldLock) {
        redirect(`/login?error=locked&lock=${LOCK_SECONDS}&next=${encodeURIComponent(next)}`);
      }
      const remaining = MAX_FAILS - newCount;
      redirect(`/login?error=invalid&attempts=${remaining}&next=${encodeURIComponent(next)}`);
    }

    if (user.isBanned) {
      redirect(`/login?error=banned&next=${encodeURIComponent(next)}`);
    }

    // Success — reset counter
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const token = signToken({ sub: user.id, role: user.role });
    await setAuthCookie(token);

    if (!user.onboardedAt) redirect("/onboarding");
    redirect(next);
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black text-2xl mb-3">L</div>
          <h1 className="text-2xl font-bold">Selamat datang kembali</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Masuk ke akun Lentera kamu</p>
        </div>

        {error === "invalid" && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
            Email/username atau password salah.
          </div>
        )}
        {error === "locked" && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-sm text-red-400 text-center">
            ⛔ Akun terkunci sementara karena terlalu banyak percobaan salah. Tunggu <strong>{lock || LOCK_SECONDS} detik</strong>, lalu coba lagi.
          </div>
        )}
        {error === "banned" && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-sm text-red-400 text-center">
            Akun kamu di-banned. Hubungi <span className="text-[var(--primary)]">support@lentera.local</span>.
          </div>
        )}

        <form action={handleLogin} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <input
            type="text" name="identifier" required placeholder="Email atau username"
            autoComplete="username"
            className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition"
          />
          <input
            type="password" name="password" required placeholder="Password"
            autoComplete="current-password"
            className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none transition"
          />
          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition"
          >
            Masuk
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Belum punya akun?{" "}
          <Link href="/register" className="text-[var(--primary)] font-semibold">Daftar gratis</Link>
        </p>

        <div className="mt-8 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)] text-center">
          <strong>Demo admin:</strong> admin@dreame.local · <strong>Reader:</strong> reader@dreame.local <br />
          Password: <code className="text-[var(--primary)]">password123</code>
          <br />
          <span className="text-[10px]">3x salah password → akun di-lock 30 detik.</span>
        </div>
      </div>
    </div>
  );
}

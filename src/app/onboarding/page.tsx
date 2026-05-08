import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.onboardedAt) redirect("/");

  const genres = await db.genre.findMany({ orderBy: { name: "asc" } });

  async function complete(formData: FormData) {
    "use server";
    const me = await getCurrentUser();
    if (!me) redirect("/login");

    const birthYearRaw = parseInt(String(formData.get("birthYear") || "0"), 10);
    const gender = String(formData.get("gender") || "").trim();
    const favRaw = formData.getAll("favoriteGenres").map(String);

    if (!birthYearRaw || birthYearRaw < 1920 || birthYearRaw > new Date().getFullYear() - 5) {
      redirect("/onboarding?error=birth");
    }
    if (!["male", "female", "other", "prefer-not-to-say"].includes(gender)) {
      redirect("/onboarding?error=gender");
    }
    if (favRaw.length < 3) {
      redirect("/onboarding?error=genres");
    }

    const favSlugs = favRaw.slice(0, 5);

    await db.user.update({
      where: { id: me.id },
      data: {
        birthYear: birthYearRaw,
        gender,
        preferredGenres: JSON.stringify(favSlugs),
        onboardedAt: new Date(),
      },
    });

    redirect("/");
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto size-14 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] grid place-items-center text-black font-black text-2xl mb-3">L</div>
          <h1 className="text-2xl font-bold">Halo, {user.displayName}! 👋</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Sedikit info biar kami bisa rekomendasikan cerita yang pas buat kamu.</p>
        </div>

        <OnboardingForm action={complete} genres={genres.map((g) => ({ slug: g.slug, name: g.name }))} />
      </div>
    </div>
  );
}

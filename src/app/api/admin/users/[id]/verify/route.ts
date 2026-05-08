import { db } from "@/lib/db";
import { requireAdminTarget, adminRedirect } from "@/lib/admin-guard";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminTarget(id);
  if ("error" in guard) return guard.error;
  const { target } = guard;

  const fd = await req.formData();
  const value = String(fd.get("value") || "true") === "true";

  await db.user.update({
    where: { id: target.id },
    data: { isVerified: value },
  });

  if (value) {
    await db.notification.create({
      data: {
        userId: target.id,
        kind: "system",
        title: "✓ Akun kamu sudah diverifikasi",
        body: "Selamat! Badge verified sekarang muncul di profil kamu.",
        link: `/u/${target.username}`,
      },
    });
  }

  return adminRedirect(req, id, "verify");
}

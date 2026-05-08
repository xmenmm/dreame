import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminTarget, adminRedirect } from "@/lib/admin-guard";

const VALID_ROLES = ["reader", "writer", "admin"];

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminTarget(id);
  if ("error" in guard) return guard.error;
  const { target } = guard;

  const fd = await req.formData();
  const role = String(fd.get("role") || "");
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.redirect(new URL(`/admin/users/${id}?error=invalid_role`, req.url));
  }

  await db.user.update({
    where: { id: target.id },
    data: { role },
  });

  await db.notification.create({
    data: {
      userId: target.id,
      kind: "system",
      title: `🛡 Role akun kamu diubah jadi ${role}`,
      body: role === "writer" ? "Sekarang kamu bisa publish cerita di Writer Studio." :
            role === "admin"  ? "Kamu sekarang admin. Akses panel admin di sidebar." :
                                "Role kamu di-set ulang ke reader.",
      link: role === "writer" ? "/writer" : role === "admin" ? "/admin" : "/",
    },
  });

  return adminRedirect(req, id, "role");
}

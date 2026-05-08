import { NextResponse } from "next/server";
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
    data: { isBanned: value },
  });

  // Also notify the user
  if (value) {
    await db.notification.create({
      data: {
        userId: target.id,
        kind: "warning",
        title: "🚫 Akun kamu di-banned",
        body: "Akun kamu telah dibatasi karena pelanggaran ketentuan layanan. Hubungi support kalau ini kesalahan.",
        link: "/legal",
      },
    });
  }

  return adminRedirect(req, id, value ? "ban" : "unban");
}

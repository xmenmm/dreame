import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminTarget, adminRedirect } from "@/lib/admin-guard";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminTarget(id);
  if ("error" in guard) return guard.error;
  const { me, target } = guard;

  const fd = await req.formData();
  const message = String(fd.get("message") || "").trim().slice(0, 500);
  if (!message) return NextResponse.redirect(new URL(`/admin/users/${id}?error=empty_warning`, req.url));

  await db.notification.create({
    data: {
      userId: target.id,
      kind: "warning",
      title: "⚠️ Peringatan dari Tim Lentera",
      body: message,
      link: "/legal",
    },
  });

  return adminRedirect(req, id, "warn");
}

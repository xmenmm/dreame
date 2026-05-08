import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const file = fd.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "bad_mime" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png"
    : file.type === "image/webp" ? "webp"
    : file.type === "image/avif" ? "avif"
    : "jpg";
  const filename = `${user.id}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "covers");
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buf);

  return NextResponse.json({ url: `/uploads/covers/${filename}` });
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ArrowLeft, Image as ImageIcon, ExternalLink, Save, Upload } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getReaderBanners,
  saveReaderBanners,
  type ReaderBanner,
} from "@/lib/site-config";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

async function persistUpload(file: File, slotKey: string): Promise<string> {
  if (file.size > MAX_BYTES) throw new Error(`File ${slotKey} terlalu besar (max 5MB)`);
  if (!ALLOWED_MIME.includes(file.type)) throw new Error(`File ${slotKey} bukan gambar yang valid`);
  const ext =
    file.type === "image/png" ? "png" :
    file.type === "image/webp" ? "webp" :
    file.type === "image/avif" ? "avif" :
    file.type === "image/gif" ? "gif" : "jpg";
  const filename = `banner-${slotKey}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buf);
  return `/uploads/banners/${filename}`;
}

export default async function AdminReaderBannersPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/reader-banners");
  if (user.role !== "admin") redirect("/");

  const cfg = await getReaderBanners();

  async function save(formData: FormData) {
    "use server";
    const u = await getCurrentUser();
    if (!u || u.role !== "admin") redirect("/");

    async function readSlot(prefix: "top" | "left" | "right"): Promise<ReaderBanner> {
      const file = formData.get(`${prefix}File`);
      const urlField = String(formData.get(`${prefix}Image`) || "").trim();
      const linkUrl = String(formData.get(`${prefix}Link`) || "").trim();
      const alt = String(formData.get(`${prefix}Alt`) || "").trim();

      let imageUrl = urlField;
      if (file && typeof file !== "string" && file.size > 0) {
        imageUrl = await persistUpload(file, prefix);
      }
      if (!imageUrl || !linkUrl) return null;
      return { imageUrl, linkUrl, alt: alt || undefined };
    }

    const top = await readSlot("top");
    const left = await readSlot("left");
    const right = await readSlot("right");
    await saveReaderBanners({ top, left, right });
    redirect("/admin/reader-banners?saved=1");
  }

  const slots: Array<{ key: "top" | "left" | "right"; label: string; hint: string }> = [
    { key: "top", label: "Banner Atas", hint: "Tampil di atas judul bab. Aspect ~ 4:1 (mis. 1200×300)." },
    { key: "left", label: "Banner Kiri", hint: "Tampil di sidebar kiri reader. Aspect ~ 1:2 (mis. 200×400)." },
    { key: "right", label: "Banner Kanan", hint: "Tampil di sidebar kanan reader. Aspect ~ 1:2 (mis. 200×400)." },
  ];

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Admin
      </Link>

      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
          <ImageIcon className="size-7" /> Banner Reader
        </h1>
      </div>
      <p className="text-[var(--muted)] mb-8">
        Banner promosi/iklan yang muncul saat user baca novel. Tinggalkan kosong untuk hilangkan slot.
      </p>

      {saved && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          ✓ Tersimpan
        </div>
      )}

      <form action={save} encType="multipart/form-data" className="space-y-8">
        {slots.map((s) => {
          const current = cfg[s.key];
          return (
            <div key={s.key} className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6">
              <h2 className="text-xl font-bold mb-1">{s.label}</h2>
              <p className="text-xs text-[var(--muted)] mb-4">{s.hint}</p>

              {/* UPLOAD FILE */}
              <label className="block mb-4">
                <span className="text-xs font-bold tracking-wider uppercase text-[var(--muted)] flex items-center gap-1.5">
                  <Upload className="size-3" /> Upload File <span className="font-normal normal-case text-[var(--muted)]/70">(max 5MB · jpg/png/webp/gif)</span>
                </span>
                <input
                  type="file"
                  name={`${s.key}File`}
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  className="mt-1 block w-full text-sm text-[var(--foreground)] file:mr-3 file:h-10 file:px-4 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--primary)] file:text-black file:font-bold file:cursor-pointer file:hover:bg-[var(--primary-hover)] file:transition"
                />
              </label>

              <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">— atau —</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold tracking-wider uppercase text-[var(--muted)]">Image URL</span>
                  <input
                    type="url"
                    name={`${s.key}Image`}
                    defaultValue={current?.imageUrl ?? ""}
                    placeholder="https://... atau /banner.png"
                    className="mt-1 w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold tracking-wider uppercase text-[var(--muted)]">Link Tujuan</span>
                  <input
                    type="url"
                    name={`${s.key}Link`}
                    defaultValue={current?.linkUrl ?? ""}
                    placeholder="https://example.com"
                    className="mt-1 w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
                  />
                </label>
              </div>

              <label className="block mt-4">
                <span className="text-xs font-bold tracking-wider uppercase text-[var(--muted)]">Alt text (opsional)</span>
                <input
                  type="text"
                  name={`${s.key}Alt`}
                  defaultValue={current?.alt ?? ""}
                  placeholder="Promo Lentera Premium"
                  className="mt-1 w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm"
                />
              </label>

              {current?.imageUrl && (
                <div className="mt-4">
                  <div className="text-xs font-bold tracking-wider uppercase text-[var(--muted)] mb-2">Preview</div>
                  <a href={current.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg overflow-hidden border border-[var(--border)] hover:border-[var(--primary)] transition">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={current.imageUrl} alt={current.alt ?? ""} className="max-w-full max-h-48 object-contain bg-[var(--surface-2)]" />
                  </a>
                  <a href={current.linkUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline align-top">
                    <ExternalLink className="size-3" /> {current.linkUrl}
                  </a>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="submit"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition shadow-lg shadow-[var(--primary)]/20"
        >
          <Save className="size-4" /> Simpan
        </button>
      </form>
    </div>
  );
}

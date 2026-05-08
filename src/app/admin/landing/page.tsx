import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Layout } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getLandingConfig, saveLandingConfig, type LandingConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const ICON_OPTIONS = ["book", "coin", "users", "feather", "star", "shield"] as const;

export default async function AdminLandingPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/landing");
  if (user.role !== "admin") redirect("/");

  const cfg = await getLandingConfig();

  async function save(formData: FormData) {
    "use server";
    const u = await getCurrentUser();
    if (!u || u.role !== "admin") redirect("/");

    const features: LandingConfig["features"] = [];
    for (let i = 0; i < 4; i++) {
      const t = String(formData.get(`featureTitle${i}`) || "").trim();
      if (!t) continue;
      features.push({
        icon: (formData.get(`featureIcon${i}`) || "book") as LandingConfig["features"][number]["icon"],
        title: t,
        description: String(formData.get(`featureDesc${i}`) || "").trim(),
      });
    }

    const testimonials: LandingConfig["testimonials"] = [];
    for (let i = 0; i < 3; i++) {
      const q = String(formData.get(`testimonialQuote${i}`) || "").trim();
      if (!q) continue;
      testimonials.push({
        quote: q,
        name: String(formData.get(`testimonialName${i}`) || "").trim(),
        role: String(formData.get(`testimonialRole${i}`) || "").trim(),
      });
    }

    await saveLandingConfig({
      heroEyebrow: String(formData.get("heroEyebrow") || ""),
      heroTitle: String(formData.get("heroTitle") || ""),
      heroSubtitle: String(formData.get("heroSubtitle") || ""),
      heroCtaPrimary: {
        label: String(formData.get("heroCtaPrimaryLabel") || ""),
        href: String(formData.get("heroCtaPrimaryHref") || ""),
      },
      heroCtaSecondary: {
        label: String(formData.get("heroCtaSecondaryLabel") || ""),
        href: String(formData.get("heroCtaSecondaryHref") || ""),
      },
      features,
      testimonials,
      showcaseTitle: String(formData.get("showcaseTitle") || ""),
      finalCtaTitle: String(formData.get("finalCtaTitle") || ""),
      finalCtaSubtitle: String(formData.get("finalCtaSubtitle") || ""),
      finalCtaButton: {
        label: String(formData.get("finalCtaButtonLabel") || ""),
        href: String(formData.get("finalCtaButtonHref") || ""),
      },
      showFeatured: formData.get("showFeatured") === "on",
      showTestimonials: formData.get("showTestimonials") === "on",
    });
    redirect("/admin/landing?saved=1");
  }

  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Admin
      </Link>

      <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
          <Layout className="size-7" /> Edit Landing Page
        </h1>
        <Link href="/welcome" target="_blank" className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold transition">
          <ExternalLink className="size-4" /> Lihat Live
        </Link>
      </div>
      <p className="text-[var(--muted)] mb-8">Atur konten landing page yang dilihat visitor. Perubahan langsung tayang setelah Save.</p>

      {saved && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400">
          ✓ Tersimpan. Buka <Link href="/welcome" target="_blank" className="underline">/welcome</Link> untuk lihat hasil.
        </div>
      )}

      <form action={save} className="space-y-8">
        {/* HERO */}
        <Section title="Hero" subtitle="Bagian paling atas — yang pertama dilihat visitor.">
          <Field label="Eyebrow text" hint="Teks kecil di atas judul (uppercase)">
            <input name="heroEyebrow" defaultValue={cfg.heroEyebrow} maxLength={100}
              className="w-full h-11 px-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" />
          </Field>
          <Field label="Judul utama" hint="Pakai \n untuk pisah baris (mis. 'Setiap Cerita\\nLayak Diceritakan')">
            <textarea name="heroTitle" defaultValue={cfg.heroTitle} rows={2} maxLength={200}
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none resize-y text-lg font-semibold" />
          </Field>
          <Field label="Sub-judul" hint="Deskripsi 1-3 kalimat di bawah judul">
            <textarea name="heroSubtitle" defaultValue={cfg.heroSubtitle} rows={3} maxLength={400}
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none resize-y" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CtaField name="heroCtaPrimary" label="Tombol Utama" defaultValue={cfg.heroCtaPrimary} />
            <CtaField name="heroCtaSecondary" label="Tombol Sekunder" defaultValue={cfg.heroCtaSecondary} />
          </div>
        </Section>

        {/* FEATURES */}
        <Section title="Fitur Highlight" subtitle="Maksimal 4 card. Kosongkan judulnya untuk skip.">
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => {
              const f = cfg.features[i];
              return (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-3">Card {i + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <label className="block text-xs text-[var(--muted)] mb-1">Icon</label>
                      <select name={`featureIcon${i}`} defaultValue={f?.icon ?? "book"}
                        className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm">
                        {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-[var(--muted)] mb-1">Judul</label>
                      <input name={`featureTitle${i}`} defaultValue={f?.title ?? ""} maxLength={60}
                        className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm" />
                    </div>
                  </div>
                  <label className="block text-xs text-[var(--muted)] mb-1 mt-3">Deskripsi</label>
                  <textarea name={`featureDesc${i}`} defaultValue={f?.description ?? ""} rows={2} maxLength={200}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none resize-y text-sm" />
                </div>
              );
            })}
          </div>
        </Section>

        {/* SHOWCASE */}
        <Section title="Showcase Cerita" subtitle="Tampilkan 6 cerita top-rated di landing page.">
          <Field label="Judul section">
            <input name="showcaseTitle" defaultValue={cfg.showcaseTitle} maxLength={100}
              className="w-full h-11 px-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" />
          </Field>
          <label className="flex items-center gap-2 mt-3 cursor-pointer">
            <input type="checkbox" name="showFeatured" defaultChecked={cfg.showFeatured} className="size-4" />
            <span className="text-sm">Tampilkan section showcase</span>
          </label>
        </Section>

        {/* TESTIMONIALS */}
        <Section title="Testimoni" subtitle="Maksimal 3 testimoni. Kosongkan quote untuk skip.">
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" name="showTestimonials" defaultChecked={cfg.showTestimonials} className="size-4" />
            <span className="text-sm">Tampilkan section testimoni</span>
          </label>
          <div className="space-y-4">
            {[0, 1, 2].map((i) => {
              const t = cfg.testimonials[i];
              return (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-3">Testimoni {i + 1}</div>
                  <label className="block text-xs text-[var(--muted)] mb-1">Quote</label>
                  <textarea name={`testimonialQuote${i}`} defaultValue={t?.quote ?? ""} rows={2} maxLength={250}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none resize-y text-sm mb-3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--muted)] mb-1">Nama</label>
                      <input name={`testimonialName${i}`} defaultValue={t?.name ?? ""} maxLength={60}
                        className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted)] mb-1">Role / Deskripsi</label>
                      <input name={`testimonialRole${i}`} defaultValue={t?.role ?? ""} maxLength={80}
                        className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* FINAL CTA */}
        <Section title="Call-to-Action Akhir" subtitle="Section terakhir sebelum footer.">
          <Field label="Judul">
            <input name="finalCtaTitle" defaultValue={cfg.finalCtaTitle} maxLength={100}
              className="w-full h-11 px-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" />
          </Field>
          <Field label="Sub-judul">
            <input name="finalCtaSubtitle" defaultValue={cfg.finalCtaSubtitle} maxLength={200}
              className="w-full h-11 px-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none" />
          </Field>
          <CtaField name="finalCtaButton" label="Tombol" defaultValue={cfg.finalCtaButton} />
        </Section>

        <div className="sticky bottom-0 bg-[var(--background)]/95 backdrop-blur border-t border-[var(--border)] p-4 -mx-4 md:-mx-8 flex items-center justify-end gap-3">
          <Link href="/welcome" target="_blank" className="text-sm text-[var(--muted)] hover:text-foreground">Preview</Link>
          <button type="submit" className="h-11 px-6 rounded-full bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] transition">
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold mb-1">{label}</label>
      {hint && <p className="text-xs text-[var(--muted)] mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function CtaField({ name, label, defaultValue }: { name: string; label: string; defaultValue: { label: string; href: string } }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
      <div className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold">{label}</div>
      <input name={`${name}Label`} defaultValue={defaultValue.label} placeholder="Label tombol" maxLength={60}
        className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm" />
      <input name={`${name}Href`} defaultValue={defaultValue.href} placeholder="/register" maxLength={200}
        className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--primary)] outline-none text-sm" />
    </div>
  );
}

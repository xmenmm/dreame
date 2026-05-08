"use client";

import { useState } from "react";
import { Cake, User, Heart, ArrowRight, ArrowLeft, Check } from "lucide-react";

type Genre = { slug: string; name: string };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => CURRENT_YEAR - 12 - i);

const GENDERS = [
  { v: "male",  label: "Laki-laki" },
  { v: "female", label: "Perempuan" },
  { v: "other", label: "Lainnya" },
  { v: "prefer-not-to-say", label: "Tidak dijawab" },
] as const;

export function OnboardingForm({
  action,
  genres,
}: {
  action: (formData: FormData) => Promise<void>;
  genres: Genre[];
}) {
  const [step, setStep] = useState(1);
  const [birthYear, setBirthYear] = useState<number | "">("");
  const [gender, setGender] = useState<string>("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggleGenre(slug: string) {
    if (selected.includes(slug)) {
      setSelected((p) => p.filter((s) => s !== slug));
    } else if (selected.length < 5) {
      setSelected((p) => [...p, slug]);
    }
  }

  const canStep1 = birthYear && gender;
  const canSubmit = selected.length >= 3;

  return (
    <form action={action} className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? "w-12 bg-[var(--primary)]" : s < step ? "w-6 bg-emerald-400" : "w-6 bg-[var(--border)]"}`} />
        ))}
      </div>

      {step === 1 && (
        <>
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <Cake className="size-4 text-[var(--primary)]" /> Tahun Lahir
            </label>
            <select
              required
              value={birthYear}
              onChange={(e) => setBirthYear(parseInt(e.target.value, 10) || "")}
              className="w-full h-12 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
            >
              <option value="">Pilih tahun...</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <p className="text-[10px] text-[var(--muted)] mt-1">Untuk konten rating yang sesuai (13+, 18+).</p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <User className="size-4 text-[var(--primary)]" /> Jenis Kelamin
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.v}
                  type="button"
                  onClick={() => setGender(g.v)}
                  className={`h-12 px-3 rounded-xl text-sm font-semibold border transition ${
                    gender === g.v
                      ? "bg-[var(--primary)] text-black border-transparent"
                      : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!canStep1}
            onClick={() => setStep(2)}
            className="w-full h-12 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
          >
            Lanjut <ArrowRight className="size-4" />
          </button>

          {/* Hidden values for step 1 (to be carried to submission) */}
          <input type="hidden" name="birthYear" value={birthYear} />
          <input type="hidden" name="gender" value={gender} />
        </>
      )}

      {step === 2 && (
        <>
          <input type="hidden" name="birthYear" value={birthYear} />
          <input type="hidden" name="gender" value={gender} />

          <div>
            <label className="block text-sm font-bold mb-1 flex items-center gap-2">
              <Heart className="size-4 text-[var(--primary)]" /> Pilih 3-5 Genre Favorit
            </label>
            <p className="text-xs text-[var(--muted)] mb-3">
              Buat home page kamu personalized. {selected.length}/5 dipilih.
              {selected.length < 3 && <span className="text-amber-400"> Minimal 3.</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => {
                const active = selected.includes(g.slug);
                return (
                  <button
                    key={g.slug}
                    type="button"
                    onClick={() => toggleGenre(g.slug)}
                    className={`px-4 h-10 rounded-full text-sm font-semibold border transition inline-flex items-center gap-1.5 ${
                      active
                        ? "bg-[var(--primary)] text-black border-transparent"
                        : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary)]"
                    } ${!active && selected.length >= 5 ? "opacity-50" : ""}`}
                  >
                    {active && <Check className="size-3" />}
                    {g.name}
                  </button>
                );
              })}
            </div>
            {/* Hidden inputs carrying selected slugs */}
            {selected.map((s) => (
              <input key={s} type="hidden" name="favoriteGenres" value={s} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 px-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] text-sm font-semibold inline-flex items-center gap-2"
            >
              <ArrowLeft className="size-4" /> Kembali
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 h-12 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50 transition inline-flex items-center justify-center gap-2"
            >
              Selesai & Mulai
            </button>
          </div>
        </>
      )}
    </form>
  );
}

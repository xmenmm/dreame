export const metadata = {
  title: "Legal & Kebijakan — Lentera",
};

export default function LegalPage() {
  return (
    <div className="px-4 md:px-8 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Legal & Kebijakan</h1>
      <p className="text-[var(--muted)] mb-10">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>

      <nav className="flex flex-wrap gap-2 mb-10">
        <a href="#tos" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition">Ketentuan Layanan</a>
        <a href="#privacy" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition">Privasi</a>
        <a href="#content" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition">Kebijakan Konten</a>
        <a href="#dmca" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition">DMCA</a>
        <a href="#refund" className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] transition">Refund</a>
      </nav>

      <article className="space-y-12 text-[var(--foreground)] leading-relaxed">
        <section id="tos">
          <h2 className="text-2xl font-bold mb-3">Ketentuan Layanan (TOS)</h2>
          <p className="text-[var(--muted)] mb-3">Dengan menggunakan Lentera, kamu setuju dengan ketentuan berikut:</p>
          <ol className="list-decimal list-inside space-y-2 text-[var(--muted)] text-sm">
            <li><strong className="text-foreground">Akun:</strong> Satu akun per orang. Kamu bertanggung jawab atas keamanan password.</li>
            <li><strong className="text-foreground">Konten:</strong> Penulis memiliki hak cipta atas karyanya & memberikan Lentera lisensi non-eksklusif untuk distribusi.</li>
            <li><strong className="text-foreground">Dilarang:</strong> Plagiat, scraping konten orang lain, hate speech, konten ilegal, doxxing, spam, multi-akun untuk vote-manipulation.</li>
            <li><strong className="text-foreground">Banned:</strong> Pelanggaran serius = banned permanen tanpa refund coin.</li>
            <li><strong className="text-foreground">Coin:</strong> Coin tidak punya nilai uang nyata sampai di-payout (writer ≥ 100K rupiah). Tidak bisa di-transfer antar akun.</li>
            <li><strong className="text-foreground">Mobile:</strong> Top-up di aplikasi Android/iOS via Google Play Billing & Apple StoreKit dengan harga yang mungkin berbeda dari web (karena fee 30%).</li>
          </ol>
        </section>

        <section id="privacy">
          <h2 className="text-2xl font-bold mb-3">Privasi</h2>
          <p className="text-[var(--muted)] text-sm mb-3">Data yang kami simpan:</p>
          <ul className="list-disc list-inside text-[var(--muted)] text-sm space-y-1">
            <li>Email, username, display name, avatar (kalau di-set)</li>
            <li>Riwayat baca, bookmark, rating, komentar</li>
            <li>Transaksi coin (untuk audit & refund)</li>
            <li>Login session token (httpOnly cookie, 30 hari)</li>
            <li>Preferensi UI (tema baca, font size — di localStorage browser, bukan server)</li>
          </ul>
          <p className="text-[var(--muted)] text-sm mt-3">
            Kami <strong className="text-emerald-400">tidak</strong> jual data ke pihak ketiga. Data hanya kami pakai untuk operasional platform.
            Kamu bisa request hapus akun via menu Profil atau email <span className="text-[var(--primary)]">privacy@dreame.local</span>.
          </p>
        </section>

        <section id="content">
          <h2 className="text-2xl font-bold mb-3">Kebijakan Konten & Age Gate</h2>
          <p className="text-[var(--muted)] text-sm mb-3">Kategori konten:</p>
          <ul className="list-disc list-inside text-[var(--muted)] text-sm space-y-1">
            <li><strong className="text-emerald-400">Semua Umur</strong> — bebas akses</li>
            <li><strong className="text-amber-400">13+ (Teen)</strong> — kekerasan ringan, romansa non-eksplisit</li>
            <li><strong className="text-red-400">18+ (Mature)</strong> — adegan dewasa, kekerasan grafis. <strong>Hanya di web</strong>, di-disable di mobile demi compliance Apple/Google. Wajib konfirmasi umur ≥ 18.</li>
          </ul>
          <p className="text-[var(--muted)] text-sm mt-3">
            <strong className="text-foreground">Yang dilarang total:</strong> CSAM, glorifikasi self-harm, hate speech, doxxing, ajakan kekerasan nyata, scraping novel dari platform lain.
          </p>
        </section>

        <section id="dmca">
          <h2 className="text-2xl font-bold mb-3">Klaim DMCA / Hak Cipta</h2>
          <p className="text-[var(--muted)] text-sm">
            Kalau kamu yakin konten di Lentera melanggar hak ciptamu, kirim klaim ke{" "}
            <span className="text-[var(--primary)] font-semibold">dmca@dreame.local</span> dengan: identitas kamu, bukti kepemilikan, URL konten yang dilanggar, dan pernyataan good faith.
          </p>
          <p className="text-[var(--muted)] text-sm mt-3">
            Respons dalam <strong className="text-foreground">24 jam kerja</strong>. Konten melanggar = takedown + akun pelanggar di-suspend.
          </p>
        </section>

        <section id="refund">
          <h2 className="text-2xl font-bold mb-3">Refund Coin</h2>
          <p className="text-[var(--muted)] text-sm">
            Coin yang sudah dibeli tidak bisa di-refund kecuali: kesalahan teknis (double-charge), akun di-banned setelah baru top-up, atau konten yang di-unlock di-takedown karena pelanggaran writer.
          </p>
          <p className="text-[var(--muted)] text-sm mt-3">Klaim refund: email <span className="text-[var(--primary)]">support@dreame.local</span> dengan order ID.</p>
        </section>

        <section className="border-t border-[var(--border)] pt-6">
          <p className="text-xs text-[var(--muted)]">
            Lentera v0.1 — Web platform. Mobile app (Play Store + App Store) sedang dalam development.<br />
            Kontak: <span className="text-[var(--primary)]">hello@dreame.local</span>
          </p>
        </section>
      </article>
    </div>
  );
}

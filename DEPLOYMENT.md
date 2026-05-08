# Dreame Deployment Guide

Web platform: **Next.js 16 + Prisma + Postgres on Vercel**.
Mobile app: **Flutter** (in `dream_app/`) — see `dream_app/README.md`.

## Quick deploy (~30 menit kalau akun udah siap)

### 1. Akun yang dibutuhkan (gratis)

| Service | Untuk | Free tier |
|---|---|---|
| **Vercel** | Hosting Next.js | unlimited deploy, 100GB bandwidth/bulan |
| **Supabase** | Postgres database | 500MB DB, 2GB bandwidth |
| **Cloudflare R2** | Storage cover/avatar (opsional) | 10GB |
| **Resend** | Email verifikasi (opsional) | 3K email/bulan |
| **Midtrans** | Payment gateway Indonesia | flat 2.9% per tx |

### 2. Setup database (Supabase)

```bash
# 1. signup di supabase.com → New project
# 2. Copy DATABASE_URL dari Settings → Database → Connection String → URI
# 3. di local:
cp prisma/schema.postgres.prisma prisma/schema.prisma
echo 'DATABASE_URL="postgresql://..."' > .env.production.local

# 4. Migrate & seed
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npx tsx prisma/seed-extra.ts
npx tsx prisma/seed-packs.ts
```

### 3. Deploy ke Vercel

```bash
# Push code ke GitHub dulu
git init && git add . && git commit -m "init"
git remote add origin <your-repo>
git push -u origin main

# Di vercel.com:
# - Import GitHub repo
# - Add environment variables (lihat .env.example):
#   * DATABASE_URL = postgresql://... (Supabase connection pooler URL)
#   * JWT_SECRET = (generate: openssl rand -base64 32)
# - Deploy
```

### 4. Setelah deploy

- Set domain custom di Vercel → DNS → CNAME
- Update `NEXT_PUBLIC_APP_URL` env var ke domain final
- Test: `https://yourdomain.com/api/auth/login` → dapat token? OK.

## Optional integrations

### Midtrans payment
1. Daftar di [midtrans.com](https://midtrans.com/) → ambil `Server Key` (Sandbox dulu)
2. Set env vars:
   - `MIDTRANS_SERVER_KEY=<key>`
   - `MIDTRANS_IS_PROD=false`
3. Set webhook URL di Midtrans dashboard: `https://yourdomain.com/api/wallet/midtrans-webhook`
4. Test top-up — tanpa key, system jalan di simulated mode (auto-success).

### Email verification (Resend)
1. Sign up di [resend.com](https://resend.com/), verify domain
2. Set `RESEND_API_KEY=re_xxx` & `EMAIL_FROM`
3. Email sender code stub ada di `src/lib/email.ts` (TODO)

### File upload (R2)
Saat ini upload disimpan di `public/uploads/covers/`. Untuk prod:
1. Buat R2 bucket di Cloudflare dashboard
2. Set env vars (lihat `.env.example`)
3. Update `src/app/api/writer/upload-cover/route.ts` ganti `writeFile` → S3 client

### Push notifications (Firebase)
Untuk Flutter app:
1. Buat Firebase project
2. Generate service account JSON
3. Set `FCM_SERVICE_ACCOUNT_JSON` (single-line JSON)
4. API endpoint stub: `src/app/api/push/send/route.ts` (TODO)

## Pricing reality check

| Skala | Database | Hosting | Total/bulan |
|---|---|---|---|
| **MVP** (~100 user, 1K novel, 10K bab) | Supabase free | Vercel Hobby | **$0** |
| **Growing** (~10K user, 100K bab) | Supabase Pro $25 | Vercel Pro $20 | **$45** |
| **Scaling** (~100K user) | Neon scale $69+ | Vercel Pro $20 | **$90+** + bandwidth |

App Store + Play Store one-time:
- Apple Developer: $99/tahun
- Google Play Console: $25 sekali

## Rolling back

Migrasi Postgres yang gagal:
```bash
npx prisma migrate reset    # WARNING: drop all data
npx prisma migrate dev      # re-apply
```

Sebelum production, **selalu** `npx prisma migrate deploy` di staging dulu.

## Backup

Supabase: auto daily backup di Pro tier. Free tier: manual export via SQL editor.
```sql
-- export user table
COPY (SELECT * FROM "User") TO STDOUT WITH CSV HEADER;
```

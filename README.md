# 📖 Dreame

> Platform baca novel modern dengan AI Writer Assistant, sistem koin premium, daily challenge, dan reader pengalaman immersive.

Dibangun dengan **Next.js 16** + **TypeScript** + **Tailwind CSS v4** + **Prisma**. Web platform dengan rencana mobile app (Flutter).

---

## ✨ Fitur Utama

### 📚 Reader
- Browse koleksi novel (genre, popularity, latest)
- Reader mode immersive (font size, line height, dark/light)
- Continue reading floating widget
- Bookmark + reading history
- Quote selector — sorot teks → save quote
- Rating & review per novel
- Comment per chapter
- Daily reading challenge → reward koin
- Daily login reward

### ✍️ Writer Tools
- Tulis novel dengan markdown editor
- AI suggest chapter — kasih outline, AI bantu develop
- AI suggest plot ideas
- Cover picker (upload sendiri atau AI generate)
- Chapter analytics (views, reads, drop-off)
- Premium chapter unlock (per-chapter coin pricing)
- Earnings dashboard

### 💰 Wallet & Premium
- Coin system — beli koin, unlock premium chapter
- Top-up via **Midtrans** payment gateway
- Webhook integration
- Transaction history
- Referral program — invite friend dapet bonus koin

### 🛡 Admin Dashboard
- User management (ban, warn, verify, grant coins, role)
- Live user stats
- Bot novel generator (AI-generated novel for content seeding)
- Reader banner / home layout editor
- Reports moderation queue

### 🎨 UX Polish
- Hero carousel di landing page
- Floating popups & welcome animations
- Cookie banner GDPR-compliant
- Mobile bottom nav
- Theme toggle dark/light
- Captcha widget anti-bot
- Toast notifications

---

## 🛠 Tech Stack

| Category | Tech |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) + React 19 |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Database | [Prisma](https://www.prisma.io/) (SQLite dev → PostgreSQL prod) |
| Auth | bcrypt + JWT |
| Validation | [Zod](https://zod.dev/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Payment | Midtrans (Indonesia) |
| Deploy | [Vercel](https://vercel.com/) |

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/xmenmm/dreame.git
cd dreame

# Install
npm install

# Setup database
echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
npm run db:push        # Apply schema
npm run db:seed        # Seed sample novels

# Run dev server (port 3030)
npm run dev

# Open http://localhost:3030
```

### Production Deploy (Vercel + PostgreSQL)

```bash
# 1. Switch schema to PostgreSQL
mv prisma/schema.prisma prisma/schema.sqlite.prisma
mv prisma/schema.postgres.prisma prisma/schema.prisma

# 2. Set env vars di Vercel dashboard
# DATABASE_URL="postgresql://..."
# JWT_SECRET="..."
# MIDTRANS_SERVER_KEY="..."
# MIDTRANS_CLIENT_KEY="..."

# 3. Deploy
vercel --prod
```

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) buat detail.

---

## 📂 Struktur Project

```
dr-real/
├── prisma/
│   ├── schema.prisma           # Active schema (sqlite untuk dev)
│   ├── schema.postgres.prisma  # Production schema
│   ├── seed.ts                 # Sample novels
│   ├── seed-extra.ts
│   └── seed-packs.ts
├── src/
│   ├── app/
│   │   ├── admin/              # Admin pages
│   │   ├── api/                # 50+ API routes
│   │   ├── novel/[slug]/       # Novel detail + reader
│   │   ├── writer/             # Writer dashboard
│   │   ├── wallet/             # Coin & topup
│   │   └── ...
│   ├── components/
│   │   ├── admin/
│   │   ├── novel/
│   │   ├── reader/
│   │   ├── writer/
│   │   └── ui/
│   └── lib/
│       ├── auth.ts
│       ├── db.ts
│       ├── ai-novelist.ts      # AI writer integration
│       ├── i18n.ts
│       ├── moderation.ts
│       └── ...
└── public/
```

---

## 🔑 Key Models (Prisma Schema)

- **User** — reader/writer/admin role, coin balance, verified, banned
- **Novel** — title, slug, cover, genre, author
- **Chapter** — content, premium price, view count
- **Comment / Rating / Bookmark / ReadingProgress**
- **DailyChallenge / DailyReward** — gamification
- **Transaction** — coin top-up via Midtrans
- **Report** — content moderation
- **Referral** — invite friend bonus

---

## 🎯 Mobile App (Flutter)

Mobile app development di-share REST API dengan web. Repo terpisah di local: `C:\dream_app\` (Flutter, butuh `flutter create .` sekali untuk generate android/ios scaffold).

---

## 📄 License

Private project. Untuk demo & pembelajaran.

---

**Built with ❤️ in Indonesia.**

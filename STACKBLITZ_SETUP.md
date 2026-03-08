# 🚀 StackBlitz Setup Guide — GRE NOC Dashboard

## Cara Upload ke StackBlitz (5 menit)

---

### Langkah 1 — Buka StackBlitz
Buka: https://stackblitz.com/fork/vite-react-ts

Ini akan membuat project Vite + React + TypeScript baru secara instan, gratis, tanpa signup.

---

### Langkah 2 — Upload semua file

Di panel kiri StackBlitz ada file explorer.
**Hapus semua file default**, lalu upload / buat ulang struktur berikut:

```
📁 project root
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .env                        ← buat manual, isi kredensial Supabase
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── lib/
    │   └── supabase.ts
    ├── hooks/
    │   └── useNOCData.ts
    ├── components/
    │   ├── NOCHeader.tsx
    │   ├── SiteCards.tsx
    │   ├── TrendCharts.tsx
    │   └── AvailabilityAndAlerts.tsx
    └── pages/
        └── NOCDashboard.tsx
```

**Tips tercepat:** Drag & drop folder `src/` langsung ke panel file explorer StackBlitz.

---

### Langkah 3 — Buat file .env

Di StackBlitz, klik **New File** → beri nama `.env` → isi:

```
VITE_SUPABASE_URL=https://XXXXXXXXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXXXXX
```

Ambil nilai ini dari:
**Supabase Dashboard → Settings → API**
- Project URL → `VITE_SUPABASE_URL`
- `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

⚠️ Jangan pakai `service_role` key di sini — itu hanya untuk GitHub Actions!

---

### Langkah 4 — Install dependencies

Di terminal StackBlitz (panel bawah), jalankan:
```bash
npm install
```

StackBlitz biasanya auto-install saat mendeteksi `package.json` baru.

---

### Langkah 5 — Jalankan dev server

```bash
npm run dev
```

Dashboard akan muncul di panel preview kanan. ✅

---

### Langkah 6 — Seed data awal (jika tabel masih kosong)

Jalankan backfill dari local / GitHub Actions:
```bash
# Di terminal local kamu
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhbGci..."   # service_role key

python scripts/backfill_stream.py --hours 168
```

Atau trigger manual di GitHub Actions:
**Actions tab → GRE Tunnel Stream Generator → Run workflow → backfill_hours: 168**

---

## Untuk NOC Wall Display

1. Di StackBlitz klik tombol **"Open in new tab"** (icon di pojok preview)
2. Tekan **F11** untuk fullscreen
3. Dashboard auto-refresh tiap 60 detik ✅

## Untuk Mobile (Higher Management)

Klik **Share** di StackBlitz → copy URL → buka di smartphone.
Layout otomatis responsive ke single-column. ✅

---

## Alternatif: Deploy ke Netlify / Vercel (permanent URL)

Setelah project berjalan di StackBlitz:

**Via Netlify Drop:**
1. Jalankan `npm run build` di terminal StackBlitz
2. Download folder `dist/`
3. Drag & drop ke https://app.netlify.com/drop
4. Dapat URL permanent gratis

**Via Vercel:**
1. Push project ke GitHub
2. Import di https://vercel.com/new
3. Set environment variables: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
4. Deploy → dapat URL permanent + HTTPS ✅

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `Cannot find module '@/...'` | Pastikan `vite.config.ts` sudah ada dengan alias `@` |
| `VITE_SUPABASE_URL undefined` | Cek file `.env` sudah dibuat dan diisi |
| Chart kosong / tidak ada data | Jalankan backfill script dulu |
| `@tremor/react not found` | Jalankan `npm install` di terminal |
| Data tidak update | Cek GitHub Actions apakah cron berjalan |

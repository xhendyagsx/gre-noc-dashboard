# NOC Dashboard — Lovable Setup Guide

## Stack
- **Frontend**: Lovable (React + Vite + TypeScript)
- **Charts**: Tremor v3
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Data stream**: GitHub Actions → Python → Supabase

---

## Langkah Setup di Lovable

### 1. Buat project baru di Lovable
1. Buka [lovable.dev](https://lovable.dev) → **New Project**
2. Pilih **Blank** atau **Vite + React + TypeScript**

### 2. Connect Supabase
1. Di Lovable editor → klik **Supabase** icon (sidebar kanan)
2. Klik **Connect Supabase**
3. Pilih project Supabase kamu
4. Lovable otomatis inject:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

> ⚠️ Pastikan sudah jalankan `sql/01_schema.sql` di Supabase sebelum connect

### 3. Install dependencies
Di Lovable terminal atau via prompt:
```
npm install @tremor/react @supabase/supabase-js
```

Atau ketik di Lovable chat:
> "Install @tremor/react and @supabase/supabase-js"

### 4. Copy file-file berikut ke Lovable

| File lokal | Path di Lovable |
|------------|-----------------|
| `src/lib/supabase.ts` | `src/lib/supabase.ts` |
| `src/hooks/useNOCData.ts` | `src/hooks/useNOCData.ts` |
| `src/components/NOCHeader.tsx` | `src/components/NOCHeader.tsx` |
| `src/components/SiteCards.tsx` | `src/components/SiteCards.tsx` |
| `src/components/TrendCharts.tsx` | `src/components/TrendCharts.tsx` |
| `src/components/AvailabilityAndAlerts.tsx` | `src/components/AvailabilityAndAlerts.tsx` |
| `src/pages/NOCDashboard.tsx` | `src/pages/NOCDashboard.tsx` |
| `src/App.tsx` | `src/App.tsx` |

### 5. Seed data awal (opsional tapi direkomendasikan)
Sebelum buka dashboard, seed minimal 24 jam data supaya chart tidak kosong:
```bash
# Di local atau trigger manual dari GitHub Actions
python scripts/backfill_stream.py --hours 168
```

---

## Cara Pakai Dashboard

### NOC Wall Display
- Buka di browser fullscreen (F11)
- Dashboard auto-refresh setiap **60 detik** (sync dengan cron GitHub Actions)
- Realtime subscription via Supabase aktif — data muncul instan saat GitHub Actions push

### Mobile (Higher Management)
- Buka URL Lovable di smartphone
- Layout otomatis collapse menjadi single-column
- KPI cards tetap di atas → bisa lihat status cepat

### Filter per site
- Klik salah satu site card → semua chart otomatis filter ke site tersebut
- Klik lagi untuk deselect (kembali all-sites)

### Time range
- Toggle **6H / 12H / 24H / 48H** di bagian atas untuk ubah rentang trend chart

---

## Fitur Realtime

Dashboard menggunakan **dua mekanisme** agar data selalu fresh:

| Mekanisme | Interval | Keterangan |
|-----------|----------|------------|
| Polling | 60 detik | Fallback, selalu berjalan |
| Supabase Realtime | Instan | Trigger saat GitHub Actions INSERT baru |

---

## Alert Rules

| Kondisi | Severity | Warna |
|---------|----------|-------|
| `tunnel_status = 'down'` | CRITICAL | Merah |
| `packet_loss_pct > 1%` | WARNING | Kuning |
| `rtt_avg_ms > 60ms` | WARNING | Kuning |
| `cpu_load_pct > 85%` | INFO | Biru |

---

## Troubleshooting

**Chart kosong / tidak ada data**
→ Jalankan backfill: `python scripts/backfill_stream.py --hours 24`

**Error "SUPABASE_URL not defined"**
→ Pastikan sudah connect Supabase di Lovable sidebar

**Data tidak update**
→ Cek GitHub Actions apakah cron berjalan (tab Actions di repo)
→ Cek Supabase → Table Editor → `gre_tunnel_metrics` apakah ada data baru

**Tremor chart tidak muncul**
→ Pastikan `@tremor/react` sudah terinstall: `npm install @tremor/react`

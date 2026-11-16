# KEUANGANKU — Manajemen Keuangan Modern (PWA)

Aplikasi manajemen keuangan pribadi berbasis web statis (tanpa framework, tanpa backend, tanpa proses build) yang dapat diinstal di Android, desktop (Chrome/Edge), dan iOS sebagai Progressive Web App (PWA), serta tetap berfungsi saat offline.

Seluruh data keuangan disimpan **lokal di browser Anda** (localStorage) — tidak ada data yang dikirim ke server eksternal.

---

## 1. Deskripsi Proyek

Fitur aplikasi (seluruhnya berjalan di sisi klien):

- **Ringkasan (Dashboard)**: total saldo bersih, pemasukan/pengeluaran bulan terpilih, rasio tabungan, saldo per dompet (Rekening Bank, E-Wallet, Tunai, Kartu Kredit), grafik arus kas 6 bulan dan distribusi kategori (Chart.js).
- **Transaksi**: pencatatannya dengan kategori dan dompet, pencarian, filter jenis & kategori, edit/hapus, ekspor CSV.
- **Anggaran & Target**: batas pengeluaran per kategori dengan indikator progres, target tabungan dengan setoran bertahap.
- **Integrasi Google Sheets (opsional)**: sinkronisasi push/pull melalui Google Apps Script milik pengguna sendiri, sinkron otomatis real-time, panduan + kode Apps Script tersedia di dalam aplikasi.
- **Mode Gelap/Terang** dengan preferensi tersimpan.
- **PWA**: dapat diinstal, tampil standalone tanpa address bar, dukungan offline.

## 2. Teknologi yang Digunakan

| Teknologi | Peran |
|---|---|
| HTML5 + CSS (Tailwind CSS via CDN) | Struktur & tampilan |
| JavaScript (vanilla, inline) | Seluruh logika aplikasi |
| Chart.js (CDN) | Grafik arus kas & kategori |
| Lucide Icons (CDN) | Ikon antarmuka |
| Google Fonts Inter (CDN) | Tipografi |
| Web App Manifest + Service Worker | PWA: instalasi, standalone, offline |
| localStorage | Penyimpanan data (browser-only) |
| Vercel | Hosting statis (HTTPS otomatis) |

Tidak ada framework build, tidak ada bundler, tidak ada backend.

## 3. Persyaratan Sistem

- Browser modern: Chrome/Edge 90+, Firefox 90+, Safari 14+ (desktop maupun mobile).
- Untuk pengembangan lokal: Python 3 atau Node.js (hanya sebagai server file statis).
- Untuk deployment: akun Vercel dan/atau Git (opsional).
- Fitur instalasi PWA membutuhkan HTTPS atau `http://localhost`.

## 4. Instalasi Dependency

**Tidak ada dependency yang perlu diinstal.** Seluruh pustaka pihak ketiga (Tailwind, Chart.js, Lucide, font Inter) dimuat via CDN langsung di `index.html`, dan proyek tidak memiliki proses build.

## 5. Konfigurasi Environment & Database

- **Environment variable: tidak ada.** Proyek ini sepenuhnya statis dan tidak membaca `.env` apa pun.
- **Database: tidak ada.** Data disimpan di localStorage browser dengan kunci:
  - `keuanganku_personal_finance_v1` — transaksi, anggaran, target tabungan
  - `keuanganku_sheets_config_v1` — konfigurasi Google Sheets (URL Apps Script diisi pengguna saat aplikasi berjalan, bukan di file proyek)
  - `keuanganku_theme_v1` — tema gelap/terang
- Kredensial apa pun (termasuk `.env`, `*.key`, `credentials*.json`) telah diblokir lewat `.gitignore` sebagai perlindungan defensif.

## 6. Menjalankan Secara Lokal

Service Worker memerlukan protokol `http://localhost` atau `https://` (tidak bisa lewat `file://`).

Opsi A — Python:

```bash
cd keuangan-apps
python -m http.server 8080
```

Opsi B — Node.js:

```bash
cd keuangan-apps
npx serve .
```

Lalu buka `http://localhost:8080` di browser.

> Catatan: manifest dirancang untuk domain root (`/`). Untuk hasil terbaik, sajikan proyek dari root server lokal, bukan dari sub-path.

## 7. Deployment ke Vercel

Proyek ini adalah **static website** — Vercel menyajikannya apa adanya tanpa build.

**Cara 1 — Melalui GitHub (disarankan):**

1. Push repository ini ke GitHub.
2. Masuk ke [vercel.com](https://vercel.com) → **Add New... → Project** → pilih repository tersebut.
3. Biarkan pengaturan default (Framework Preset: **Other**, tanpa Build Command, tanpa Output Directory khusus).
4. Klik **Deploy**. Aplikasi tersedia di `https://<nama-anda>.vercel.app` (HTTPS otomatis — syarat wajib Service Worker).

**Cara 2 — Melalui Vercel CLI:**

```bash
npm i -g vercel
cd keuangan-apps
vercel          # preview
vercel --prod   # production
```

`vercel.json` sudah mengatur: `service-worker.js` disajikan dengan `Content-Type: application/javascript`, `Service-Worker-Allowed: /`, serta `Cache-Control: no-cache` untuk `index.html`, manifest, dan service worker agar pembaruan selalu diterima pengguna. Ikon di-cache jangka panjang.

## 8. Menginstal Aplikasi

**Android (Chrome):**
1. Buka aplikasi, tekan tombol **"Instal Aplikasi"** di sidebar bawah (desktop) atau ikon instal di header atas (mobile), atau menu ⋮ Chrome → **Tambahkan ke layar utama**.
2. Konfirmasi → aplikasi muncul di layar utama dan terbuka tanpa address bar (standalone).

**Desktop (Chrome/Edge):**
1. Klik tombol **"Instal Aplikasi"** di bagian bawah sidebar, atau ikon instal di address bar.
2. Aplikasi terpasang di Start Menu / Launchpad dan berjalan di jendela terpisah.

**iOS (Safari):**
1. Ketuk tombol instal (ikon di header) — Safari tidak mendukung prompt otomatis, sehingga muncul **petunjuk langkah demi langkah**.
2. Ikuti petunjuk: ketuk **Bagikan (Share)** → **Tambahkan ke Layar Utama** → **Tambah**.

## 9. Fitur Offline

- Halaman, stylesheet Tailwind (CDN), font, Lucide icons, dan Chart.js di-cache sehingga aplikasi **dapat dibuka dan digunakan penuh saat offline** setelah kunjungan pertama.
- Data keuangan tetap aman: penyimpanan `localStorage` tidak disentuh Service Worker, dan request sinkronisasi ke Google Apps Script **tidak pernah di-cache**.
- Batasan: fitur yang membutuhkan internet tetap tidak tersedia saat offline, yaitu **sinkronisasi Google Sheets** (push/pull/tes koneksi). Aplikasi akan menampilkan status "Gagal Sinkron" dan data tetap tersimpan lokal hingga koneksi kembali.

## 10. Struktur Proyek

```text
keuangan-apps/
├── index.html              # Aplikasi lengkap (HTML + CSS/JS inline)
├── manifest.webmanifest    # Identitas & konfigurasi instalasi PWA
├── service-worker.js       # Caching asset & dukungan offline
├── vercel.json             # Header cache & MIME type untuk Vercel
├── .gitignore              # Proteksi file rahasia/OS/editor
├── icons/
│   ├── icon-192.png        # Ikon aplikasi 192x192
│   ├── icon-512.png        # Ikon aplikasi 512x512
│   └── icon-maskable-512.png  # Ikon maskable (Android adaptive icon)
└── README.md
```

## 11. Data & Privasi

- Tidak ada backend, tidak ada analitik, tidak ada pengiriman data ke server eksternal.
- Menghapus data browser akan menghapus data keuangan — gunakan fitur **Ekspor ke CSV** secara berkala.

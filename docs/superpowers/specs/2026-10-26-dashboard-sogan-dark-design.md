# Spesifikasi Desain: Redesain UI Dashboard "Sogan Obsidian" CV Batik Larasati

- **Tanggal**: 26 Oktober 2026
- **Status**: Menunggu Review Pengguna
- **Topik**: Redesain UI Layout Dashboard & Halaman Dashboard (`/dashboard`)
- **Referensi Visual**:
  - Referensi 1: Warm amber/orange glow, modern dark POS bento cards, pill badges, and dual-tone charts.
  - Referensi 2: Luxury French editorial aesthetic, sleek vertical icon sidebar, high-contrast typography, and gold metallic accents.
  - Landing Page: Sogan Batik heritage theme (`#070605`, chiaroscuro, amber gold `#f59e0b`, chamfer accents).
- **Kepatuhan Wajib**: 100% mematuhi aturan PRD_Finance.docx (BR-01 s/d BR-12, pemisahan hak akses peran, data query, kerahasiaan data keuangan).

---

## 1. Latar Belakang & Tujuan Desain

Aplikasi Internal Finance & Accounting CV Batik Larasati saat ini telah memiliki fungsionalitas backend dan alur bisnis yang lengkap sesuai PRD. Namun, tampilan dashboard saat ini masih menggunakan tema standar abu-abu terang (*light mode* `slate-50`), kontras dengan identitas brand di Landing Page (`src/app/page.tsx`) yang megah, artistik, dan bernuansa Batik Sogan klasik.

Tujuan dari redesain ini adalah:
1. **Harmonisasi Estetika**: Mengadopsi palet *"Sogan Obsidian"* (hitam arang pekat `#070605`, aksen emas tembaga `#f59e0b`/`#d97706`, dan kaca gelap *glassmorphism*).
2. **Navigasi Ramping (Referensi 2)**: Menghadirkan sidebar vertikal ikonik yang hemat ruang, presisi, beraksen emas bercahaya (*glow*), dilengkapi *tooltip* nama menu dan status aktif.
3. **Bento Grid Finansial (Referensi 1 & 2)**: Merestrukturisasi kartu metrik, grafik batang 6 bulan, status periode, dan tabel antrean pengajuan ke dalam grid bento yang intuitif dan modern.
4. **Zero-Regression pada Logika Bisnis**: Menjaga seluruh query Supabase, pemisahan peran Staf vs Akuntan/Direktur, format angka negatif dalam kurung `(Rp...)`, form POST `/auth/keluar`, dan aturan non-fungsional PRD.

---

## 2. Palet Warna & Desain Sistem ("Sogan Obsidian")

Sistem desain diimplementasikan menggunakan Tailwind CSS v4 dengan variabel warna turunan dari landing page:

| Token | Nilai Hex / RGBA | Penggunaan |
| :--- | :--- | :--- |
| **Canvas Background** | `#070605` | Latar belakang seluruh halaman dashboard |
| **Surface Card (Base)** | `#0f0d0b` (atau `rgba(18, 15, 13, 0.85)`) | Latar belakang kartu bento, sidebar, dan header |
| **Surface Elevated** | `#1a1613` | Hover baris tabel, tombol dropdown, kartu aktif |
| **Border Subtle** | `rgba(245, 158, 11, 0.12)` | Border pemisah kartu dan tabel |
| **Border Active / Glow** | `rgba(245, 158, 11, 0.40)` | Border kartu aktif, fokus form, dan tombol utama |
| **Gold Primary** | `#f59e0b` (Amber-500) | Aksen utama, ikon aktif, nominal saldo |
| **Gold Bright** | `#fbbf24` (Amber-400) | Highlight teks, angka penting, pendaran cahaya |
| **Text Primary** | `#fdfaf6` | Judul, angka nominal, nama pengguna |
| **Text Secondary** | `#b8afa4` | Subtitle, label metrik, keterangan |
| **Text Muted** | `#78716c` | Tanggal transaksi, label kecil |
| **Status Hijau (Sukses/Disetujui)** | `#10b981` (`emerald-500`) | Pill status `disetujui`, `dibayar`, mutasi kredit |
| **Status Merah/Kurung (Beban/Rugi)** | `#f43f5e` (`rose-500`) | Laba rugi negatif `(Rp...)`, `ditolak`, `perlu_revisi` |
| **Status Ungu (Direktur)** | `#a855f7` (`purple-500`) | Pill status `menunggu_direktur` |

---

## 3. Komponen Arsitektur Layout

### 3.1. Sidebar Ramping Bergaya Referensi 2 (`src/components/layout/sidebar-slim.tsx` / `layout.tsx`)
- **Lebar**: `w-20` (80px) pada desktop, terpasang tetap di sisi kiri (*fixed/sticky left*).
- **Bagian Atas**:
  - Logo Monogram Canting Batik Larasati berbalut lingkaran tembaga berpendar emas (`bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 text-amber-400`).
- **Bagian Tengah (Navigasi Ikonik)**:
  - Menu difilter secara ketat berdasarkan peran pengguna (`MAIN_NAVIGATION`):
    - **Staf** (2 menu): Dashboard, Pengajuan.
    - **Akuntan** (7 menu): Dashboard, Pengajuan, Jurnal Umum, Buku Besar, Mutasi Bank, Laporan Keuangan, Akun & Periode.
    - **Direktur** (8 menu): Semua menu di atas + Pengguna & Audit Log.
  - **Efek Aktif (Referensi 2)**: Tombol aktif mendapatkan pendaran emas di sisi dalam (`bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]`).
  - **Tooltip Interaktif**: Setiap ikon menampilkan label judul menu melayang saat kursor didekatkan (*hover tooltip*), memastikan pengguna mengenali fungsi menu tanpa harus membaca teks panjang terus-menerus.
- **Bagian Bawah**:
  - Lonceng notifikasi antrean pengajuan (dengan dot merah/kuning jika ada antrean).
  - Avatar inisial/foto pengguna dengan cincin emas tipis dan badge peran mini.
  - Tombol Keluar (POST `/auth/keluar`) dengan ikon pintu keluar elegan bernuansa merah/amber redup.
- **Tampilan Mobile (Responsive)**:
  - Bottom navigation bar ramping di bawah layar atau toggle drawer slide-over yang konsisten dengan estetika dark emas.

### 3.2. Top Context Header
- Ketinggian kompak `h-16`, latar kaca gelap `backdrop-blur-md bg-[#070605]/80 border-b border-amber-900/20`.
- **Sisi Kiri**: Judul halaman aktif (misal: "Ringkasan Finansial") dan subjudul "CV Batik Larasati • Surakarta".
- **Sisi Tengah/Kanan**:
  - Pill indikator periode aktif: `Periode: Oktober 2026 • Terbuka` (badge hijau lembut/emas).
  - Indikator waktu WIB (*Asia/Jakarta*) yang akurat.
  - Ringkasan profil singkat pengguna (`Laras Prameswari • Direktur`).

---

## 4. Arsitektur Halaman Dashboard (`/dashboard`)

### 4.1. Dashboard Khusus Akuntan & Direktur (Sesuai PRD Bagian 9 & BR-11)

#### Bagian 1: Bento Cards Metrik Finansial (4 Kartu Finansial + 1 Kartu Antrean Aksi)
1. **Total Saldo Kas & Bank**:
   - Menghitung total saldo seluruh akun kas dan bank aktif (Akun 1101 Kas Kecil + 1102 Bank Mandiri).
   - Menampilkan breakdown mini: `Kas Kecil: Rp 1.500.000` • `Bank Mandiri: Rp 265.451.000`.
   - Ikon brankas/dompet dengan panah sudut `↗`.
2. **Pendapatan Bulan Berjalan**:
   - Saldo normal kredit akun pendapatan (kepala 4) per tanggal 1 s/d hari ini di bulan aktif.
   - Pill perbandingan vs bulan lalu (+X.X%).
3. **Beban Bulan Berjalan**:
   - Saldo normal debit akun beban (kepala 5) per tanggal 1 s/d hari ini.
   - Pill perbandingan tren beban.
4. **Laba (Rugi) Bersih**:
   - Pendapatan dikurangi beban bulan berjalan.
   - **Aturan Wajib PRD 9**: Bila angka negatif (rugi), wajib ditampilkan dalam tanda kurung, misal `(Rp 4.625.000)` dengan aksen warna rose-400.
5. **Antrean Pengajuan Menunggu (Action Card)**:
   - Menghitung pengajuan yang menunggu tindakan pengguna aktif:
     - Akuntan: Status `diajukan` (perlu verifikasi) + `disetujui` (siap dibayar).
     - Direktur: Status `menunggu_direktur` (persetujuan > Rp 1 jt atau pengajuan akuntan).
   - Dilengkapi tombol cepat untuk langsung melompat ke tabel antrean.

#### Bagian 2: Area Visualisasi Data & Status Periode
- **Kiri (Grafik Batang 6 Bulan Terakhir)**:
  - Menggunakan Recharts / SVG kustom dengan styling baru:
    - Batang Pendapatan: Gradasi vertikal emas menyala (`#f59e0b` ke `#fbbf24`) dengan rounded-caps dan pendaran glow.
    - Batang Beban: Gradasi vertikal bronze elegan (`#b45309` ke `#d97706`).
    - Tooltip gelap mewah (*dark frosted glass*) dengan format rupiah standar.
- **Kanan (Status Periode & Ringkasan Cepat)**:
  - Status periode bulan ini dan periode sebelumnya.
  - Peringatan jumlah draf jurnal (karena penutupan periode mensyaratkan 0 draf jurnal sesuai BR-06).
  - Shortcut aksi cepat: "Buat Jurnal Baru", "Rekap Laporan".

#### Bagian 3: Tabel Pengajuan Menunggu Tinjauan
- Tabel bergaya dark glassmorphism:
  - Header: Nomor Pengajuan, Tanggal, Pengaju & Jabatan, Keperluan, Nominal, Status Pill, dan Tombol Aksi.
  - Status Pills:
    - `diajukan`: Kuning/Amber (`bg-amber-500/10 text-amber-300 border-amber-500/30`)
    - `menunggu_direktur`: Ungu (`bg-purple-500/10 text-purple-300 border-purple-500/30`)
    - `disetujui`: Zamrud/Hijau (`bg-emerald-500/10 text-emerald-300 border-emerald-500/30`)
  - Tombol **Tinjau**: Tombol chamfer ramping beraksen emas yang membuka halaman detail pengajuan `/pengajuan/[id]`.

---

### 4.2. Dashboard Khusus Staf (Sesuai PRD Bagian 7 & BR-11)
- **Kerahasiaan Data Terjaga**: Staf sama sekali tidak memuat data kas, bank, jurnal, laba rugi, maupun periode.
- **Kartu Metrik Pribadi**:
  - Total Pengajuan Saya, Menunggu Proses, Perlu Revisi (dengan aksen peringatan agar staf segera memperbaiki nota), dan Berhasil Dicairkan/Dibayar.
- **Tombol Cepat**: `+ Ajukan Biaya / Reimburse Baru` beraksen emas bersinar.
- **Tabel Pengajuan Terakhir Saya**: Menampilkan 10 pengajuan terakhir milik staf bersangkutan beserta badge status dan catatan revisi (jika ada).

---

## 5. File yang Akan Dimodifikasi & Dibuat

1. `src/app/globals.css`:
   - Menambahkan utilitas styling tema "Sogan Obsidian" (scrollbar gelap, efek glassmorphism bento, glow kustom).
2. `src/app/(dashboard)/layout.tsx`:
   - Mengubah wrapper utama dari `bg-slate-50` menjadi `bg-[#070605] text-[#fbf7f0]`.
   - Mengimplementasikan sidebar vertikal ramping (Referensi 2) dengan tooltip dan form keluar.
   - Mengimplementasikan top context bar dengan status periode & profil.
3. `src/components/dashboard/kartu-ringkasan.tsx`:
   - Mengubah kartu metrik menjadi Bento Dark Glass Cards beraksen emas, panah diagonal, dan penanganan angka negatif dalam kurung.
4. `src/components/dashboard/grafik-batang.tsx`:
   - Menerapkan tema dual-glowing bars (amber vs bronze) dengan tooltip gelap mewah.
5. `src/components/dashboard/status-periode-card.tsx`:
   - Menerapkan kartu status periode dark bento dengan peringatan draf jurnal.
6. `src/components/dashboard/tabel-pengajuan-menunggu.tsx`:
   - Mengubah tabel pengajuan menjadi dark luxury table dengan pill badges dan tombol Tinjau tembaga.
7. `src/components/dashboard/dashboard-staf.tsx`:
   - Menerapkan tampilan personal staf dengan tema Sogan Obsidian yang sepadan.

---

## 6. Verifikasi & Pengujian
- Memastikan tidak ada error kompilasi Next.js (`npm run build` atau `next build`).
- Menguji ketiga peran pengguna:
  - **Laras Prameswari (Direktur)**: Melihat 5 kartu metrik lengkap, grafik 6 bulan, antrean `menunggu_direktur`, status periode, dan seluruh 8 menu navigasi.
  - **Dimas Arya Nugroho (Akuntan)**: Melihat metrik finansial, antrean `diajukan` + `disetujui`, dan 7 menu navigasi.
  - **Rina Anggraini (Staf)**: Hanya melihat dashboard personal miliknya dan 2 menu navigasi (Dashboard & Pengajuan).
- Memastikan angka rugi tetap berformat dalam kurung `(Rp 4.625.000)`.
- Memastikan tombol keluar bekerja normal melalui form POST `/auth/keluar`.

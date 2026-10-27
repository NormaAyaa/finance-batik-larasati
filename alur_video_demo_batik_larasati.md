# 🎬 PANDUAN LENGKAP & ALUR VIDEO DEMO CAPSTONE PROJECT (EDISI TERBARU)
## Sistem Informasi Pengelolaan Keuangan & Akuntansi — CV Batik Larasati

- **Pengembang:** Norma Zuhrotul Hayati
- **Target Durasi:** 5 – 7 Menit (Standar Pengujian Capstone)
- **Format:** Screen Recording + Voiceover (Narasi Suara)
- **URL Live Aplikasi:** [https://batiklarasati.normasuci.site](https://batiklarasati.normasuci.site)

---

## 📋 File & Data yang Wajib Disiapkan di Komputer Sebelum Rekam

1. **File Bukti Nota AI:**
   - 📄 [CONTOH_NOTA_BATIK.png](file:///d:/BOOTCAMP/PROJECT%20CAPSTONE/CONTOH_NOTA_BATIK.png) *(taruh di Desktop)*
2. **File CSV Mutasi Bank Baru:**
   - 📄 [CONTOH_MUTASI_BANK_BARU.csv](file:///d:/BOOTCAMP/PROJECT%20CAPSTONE/CONTOH_MUTASI_BANK_BARU.csv) *(taruh di Desktop)*
3. **Kredensial Login Pengujian (Kata Sandi: `Latihan#2026`):**
   - **Staf:** `rinalrsti@gmail.com` (Rina Anggraini - Kepala Produksi)
   - **Akuntan:** `dimaslrst@gmail.com` (Dimas Arya Nugroho - Kepala Akuntansi)
   - **Direktur:** `larasatiyw@gmail.com` (Laras Prameswari - Pemilik Usaha)
   - **Akun Nonaktif (Uji RLS):** `yoga@larasati.test`
4. **Tab Browser yang Disiapkan:**
   - **Tab 1:** Aplikasi `https://batiklarasati.normasuci.site` (atau localhost:3000)
   - **Tab 2:** Kotak Masuk Gmail (`dimaslrst@gmail.com`) untuk melihat email notifikasi Resend

---

## ⏱️ Rangkuman Alur & Timeline Video Baru (Total: ~6 Menit 45 Detik)

| Scene | Menit | Topik Utama | Akun Pengguna | Fokus Aksi Layar |
| :---: | :---: | :--- | :--- | :--- |
| **1** | `00:00 - 00:45` | Pembuka, Identitas & Latar Belakang Masalah | Norma Zuhrotul Hayati | Landing Page & Identitas Sistem Sogan |
| **2** | `00:45 - 01:15` | Tech Stack & Arsitektur Sistem | Norma | Form Login, Next.js 15, Supabase, Gemini AI |
| **3** | `01:15 - 02:30` | **Role 1 (Staf):** Pengajuan Biaya & AI Scanner Nota | `rinalrsti@gmail.com` | Unggah `CONTOH_NOTA_BATIK.png`, AI Ekstrak Otomatis |
| **4** | `02:30 - 03:00` | **Notifikasi Email Real-time (Resend API)** | Inbox Gmail | Bukti notifikasi email instan masuk ke Akuntan |
| **5** | `03:00 - 04:45` | **Role 2 (Akuntan):** Verifikasi Biaya, **Upload CSV Mutasi Bank**, & Jurnal Umum | `dimaslrst@gmail.com` | Verifikasi Pengajuan, **Upload `CONTOH_MUTASI_BANK_BARU.csv`**, Buat Draf Jurnal dari Mutasi, Cek Keseimbangan Jurnal |
| **6** | `04:45 - 06:00` | **Role 3 (Direktur):** Executive Dashboard, Laporan & PDF | `larasatiyw@gmail.com` | Dashboard Keuangan, Laba Rugi, Neraca, Ekspor PDF Resmi |
| **7** | `06:00 - 06:45` | **Keamanan (Supabase RLS)** & Penutup | `yoga@larasati.test` | Uji Tolak Login Akun Nonaktif & Kesimpulan |

---

## 🎥 Detail Alur Per Scene & Aksi Layar Lengkap

---

### SCENE 1: PEMBUKA & LATAR BELAKANG MASALAH
- **Durasi:** `00:00 - 00:45` (45 Detik)
- **Aksi Layar:**
  - Buka halaman depan [https://batiklarasati.normasuci.site](https://batiklarasati.normasuci.site).
  - Arahkan kursor ke Logo CV Batik Larasati, tajuk utama, dan sorot desain bertema Sogan yang modern.
- **Poin Penjelasan:**
  - Perkenalan nama: **Norma Zuhrotul Hayati**.
  - Permasalahan mitra: CV Batik Larasati mengalami nota fisik tercecer, rekonsiliasi bank lambat, dan belum ada laporan keuangan terintegrasi real-time.

---

### SCENE 2: GAMBARAN TEKNOLOGI & ARSITEKTUR
- **Durasi:** `00:45 - 01:15` (30 Detik)
- **Aksi Layar:**
  - Klik tombol **"Masuk Sistem"**. Tunjukkan form login yang bersih dan elegan.
  - Tunjukkan gembok SSL HTTPS dan domain live yang aktif.
- **Poin Penjelasan:**
  - Next.js 15 App Router & TypeScript untuk arsitektur modern.
  - Supabase PostgreSQL dengan Row Level Security (RLS) multi-role.
  - Google Gemini AI (OCR Nota) dan Resend API (Notifikasi Email).

---

### SCENE 3: ROLE 1 — STAF (PENGAJUAN BIAYA & AI OCR GEMINI)
- **Durasi:** `01:15 - 02:30` (1 Menit 15 Detik)
- **Aksi Layar:**
  1. Login sebagai Staf Produksi: `rinalrsti@gmail.com` | Sandi: `Latihan#2026`.
  2. Buka menu **Pengeluaran / Pengajuan**.
  3. Klik tombol **"Ajukan Pengeluaran"**.
  4. Klik area upload dan pilih file `CONTOH_NOTA_BATIK.png`.
  5. Perlihatkan proses loading AI mengekstrak nota (2-3 detik).
  6. Tunjukkan bahwa form terisi otomatis:
     - Tanggal transaksi otomatis terisi.
     - Nominal terisi sesuai nota belanja.
     - Akun Beban otomatis terpilih **Beban Bahan Baku**.
     - Keterangan terisi otomatis.
  7. Klik **"Kirim Pengajuan"**. Tunjukkan status berubah menjadi *"Menunggu Verifikasi Akuntan"*.

---

### SCENE 4: NOTIFIKASI EMAIL OTOMATIS (RESEND API)
- **Durasi:** `02:30 - 03:00` (30 Detik)
- **Aksi Layar:**
  - Beralih ke tab Inbox Gmail `dimaslrst@gmail.com`.
  - Tunjukkan email masuk dari Larasati Finance via Resend API dengan rincian pengajuan biaya yang baru saja disubmit Rina.

---

### SCENE 5: ROLE 2 — AKUNTAN (VERIFIKASI, DEMO UPLOAD CSV MUTASI BANK & JURNAL UMUM)
- **Durasi:** `03:00 - 04:45` (1 Menit 45 Detik)
- **Aksi Layar:**
  1. Logout dari Rina, lalu login sebagai Akuntan: `dimaslrst@gmail.com` | Sandi: `Latihan#2026`.
  2. **Verifikasi Pengajuan:**
     - Masuk menu Pengajuan, periksa nota Rina, klik **"Verifikasi / Setujui"**.
  3. **Demo Upload CSV Mutasi Bank (Fitur Nilai Tambah):**
     - Klik menu **Mutasi Bank** di sidebar.
     - Klik tombol emas **"Unggah CSV Mutasi Bank"** di pojok kanan atas.
     - Pilih rekening: **Bank BCA Operasional (1102)**.
     - Unggah file **`CONTOH_MUTASI_BANK_BARU.csv`**.
     - Klik **"Unggah & Proses"**.
     - Tunjukkan notifikasi hijau sukses: *"4 baris baru, 0 duplikat dilewati"*.
     - Tunjukkan 4 transaksi baru langsung muncul di tabel teratas dengan status *"⏳ Belum Dijurnal"*.
  4. **Pembuatan Draf Jurnal dari Mutasi:**
     - Klik tombol **"+ Draf Jurnal"** pada salah satu transaksi mutasi (misal Penjualan Batik Rp 5.200.000).
     - Pilih akun lawan (*4101 - Penjualan Batik Tulis*), lalu simpan.
     - Tunjukkan status transaksi mutasi berubah menjadi *"✓ Terkait"*.
  5. **Cek Jurnal Umum & Buku Besar:**
     - Buka menu **Jurnal Umum**: Tunjukkan kedua transaksi (pengajuan staf & draf mutasi) tercatat seimbang (*Debit & Kredit seimbang otomatis*).
     - Buka menu **Buku Besar**: Tunjukkan mutasi rekening kas/bank tersusun kronologis dengan saldo berjalan.

---

### SCENE 6: ROLE 3 — DIREKTUR (DASHBOARD EKSEKUTIF, LAPORAN & EKSPOR PDF)
- **Durasi:** `04:45 - 06:00` (1 Menit 15 Detik)
- **Aksi Layar:**
  1. Logout dari Dimas, login sebagai Direktur: `larasatiyw@gmail.com` | Sandi: `Latihan#2026`.
  2. **Dashboard Eksekutif:**
     - Tunjukkan kartu KPI: Total Kas, Pendapatan, Beban, Laba Bersih.
     - Tunjukkan grafik visualisasi tren arus kas bulanan.
  3. **Laporan Keuangan:**
     - Buka menu **Laporan Keuangan**.
     - Tunjukkan tab **Laporan Laba Rugi** (pendapatan vs beban usaha).
     - Tunjukkan tab **Neraca Keuangan** (Aset = Kewajiban + Ekuitas).
  4. **Ekspor PDF:**
     - Klik tombol **Cetak / Unduh PDF** pada laporan.
     - Tunjukkan dokumen PDF resmi yang rapi ber-kop surat CV Batik Larasati.
  5. Perlihatkan sekilas menu **Periode Akuntansi / Tutup Buku** dan **Audit Log**.

---

### SCENE 7: UJI KEAMANAN RLS & PENUTUP
- **Durasi:** `06:00 - 06:45` (45 Detik)
- **Aksi Layar:**
  1. Logout dari Direktur.
  2. Masukkan akun nonaktif: `yoga@larasati.test` | Sandi: `Latihan#2026`.
  3. Klik Masuk -> Tunjukkan pesan penolakan login dari Supabase RLS.
  4. Kembali ke halaman Landing Page depan.
- **Poin Penjelasan:**
  - Penegakan integritas data via Row Level Security.
  - Kesimpulan: Sistem memangkas 70% waktu pembukuan, mencegah nota tercecer, dan menjamin laporan keuangan akurat.
  - Salam penutup dari Norma Zuhrotul Hayati.

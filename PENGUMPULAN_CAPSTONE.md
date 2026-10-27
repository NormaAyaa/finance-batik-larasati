# Dokumen Pengumpulan Capstone Project
**Bootcamp AI Web Programming**  
**Sistem Informasi Pengelolaan Keuangan & Akuntansi — CV Batik Larasati**

---

### Data Mahasiswa / Pengembang
- **Nama:** Norma Zuhrotul Hayati
- **Email:** awyakyut18@gmail.com
- **Basis Teknologi:** Next.js 15, TypeScript, Supabase (PostgreSQL + RLS), Tailwind CSS, Google Gemini AI (OCR Nota), Resend API
- **Batas Waktu Pengumpulan:** 27 Oktober 2026 (23.59 WIB)

---

## 1. Tautan Utama (Application & Repository Links)

| Item | Tautan / URL | Keterangan |
| :--- | :--- | :--- |
| **Link Aplikasi (Live)** | [https://batiklarasati.normasuci.site](https://batiklarasati.normasuci.site) | Deployed dengan custom domain, HTTPS & SSL aktif |
| **Link Repository (Public)** | [https://github.com/NormaAyaa/finance-batik-larasati](https://github.com/NormaAyaa/finance-batik-larasati) | Repository GitHub publik berisi source code lengkap & skema migrasi database |

---

## 2. Kredensial Login Pengujian (Role-Based Test Accounts)

> **Petunjuk Pengujian:** Tersedia akun versi **Gmail** (terhubung ke pengujian email riil Resend & Google OAuth) serta akun versi domain internal. Seluruh akun menggunakan kata sandi terstandarisasi: `Latihan#2026`. Sistem hak akses dan keamanan data diproteksi penuh menggunakan **Supabase Row Level Security (RLS)**.

| Peran (Role) | Nama Pengguna | Akun Email Login | Kata Sandi | Wewenang & Fitur Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Direktur** | **Laras Prameswari** *(Pemilik Usaha)* | `larasatiyw@gmail.com` *(Gmail)*<br>`laras@larasati.test` *(Alt)* | `Latihan#2026` | Approval nominal tinggi, Laporan Neraca & Laba Rugi, Kunci/Tutup Buku |
| **Akuntan** | **Dimas Arya Nugroho** *(Kepala Akuntansi)* | `dimaslrst@gmail.com` *(Gmail)*<br>`dimas@larasati.test` *(Alt)* | `Latihan#2026` | Jurnal Umum seimbang, Verifikasi Biaya, Rekonsiliasi Bank |
| **Staf** | **Rina Anggraini** *(Kepala Produksi)* | `rinalrsti@gmail.com` *(Gmail)*<br>`rina@larasati.test` *(Alt)* | `Latihan#2026` | Pengajuan biaya bahan baku batik & bukti nota transaksi |
| **Staf** | **Bagus Saputra** *(Staf Pemasaran)* | `bagus@larasati.test` | `Latihan#2026` | Pengajuan Biaya/Reimburse, AI Scanner Nota Gemini |
| **Akuntan** | **Wulan Sari Utami** *(Staf Akuntansi)* | `wulan@larasati.test` | `Latihan#2026` | Draf Jurnal, Kelola Bagan Akun (COA), Verifikasi Nota |
| **Nonaktif** | **Yoga Pratama** *(Mantan Kurir)* | `yoga@larasati.test` | `Latihan#2026` | *Akun nonaktif (Uji proteksi RLS & penolakan login)* |

---

## 3. Skenario Rekomendasi Pengujian Cepat untuk Reviewer
1. **Langkah 1 (Staf - `rinalrsti@gmail.com` atau `bagus@larasati.test`):**
   - Buka menu **Pengeluaran** &rarr; klik **Ajukan Pengeluaran**.
   - Unggah foto nota pengeluaran untuk menguji fitur OCR otomatis berbasis **Google Gemini AI** dalam mengekstrak tanggal dan nominal belanja secara otomatis.
2. **Langkah 2 (Akuntan - `dimaslrst@gmail.com`):**
   - Periksa daftar pengajuan yang diajukan staf, lakukan verifikasi, lalu posting transaksi ke **Jurnal Umum** (aturan debit & kredit seimbang otomatis terjaga).
3. **Langkah 3 (Direktur - `laras@larasati.test` / `larasatiyw@gmail.com`):**
   - Masuk untuk melihat ringkasan keuangan di Dashboard, setujui pengeluaran bernominal besar, dan periksa laporan real-time **Laba Rugi** serta **Neraca Keuangan**.

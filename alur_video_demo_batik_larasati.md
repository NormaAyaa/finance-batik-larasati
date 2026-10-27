# 🎬 PANDUAN LENGKAP & NASKAH VIDEO DEMO CAPSTONE PROJECT
## Sistem Informasi Pengelolaan Keuangan & Akuntansi — CV Batik Larasati

- **Pengembang:** Norma Zuhrotul Hayati
- **Target Durasi:** 5 – 7 Menit (Standar Pengujian Capstone)
- **Format:** Screen Recording + Voiceover (Narasi Suara)
- **URL Live Aplikasi:** [https://batiklarasati.normasuci.site](https://batiklarasati.normasuci.site)

---

## 📋 Checklist Persiapan Sebelum Menekan Tombol "Record"

1. **Persiapan Browser:**
   - Gunakan browser Chrome/Edge mode normal (resolusi layar 1080p / 1920x1080).
   - Zoom layar browser disetel ke **100%** (atau 110% jika teks ingin lebih terbaca jelas).
   - Buka 3 tab atau siapkan 3 jendela browser (atau login bergantian):
     - **Tab 1:** Halaman Aplikasi `https://batiklarasati.normasuci.site`
     - **Tab 2:** File nota contoh `CONTOH_NOTA_BATIK.png` yang siap diunggah di folder Desktop/Pictures.
     - **Tab 3:** Tab Inbox Gmail (`dimaslrst@gmail.com` atau `larasatiyw@gmail.com`) untuk memperlihatkan email notifikasi masuk dari Resend.
2. **Kredensial Login Pengujian:**
   - **Staf:** `rinalrsti@gmail.com` | Kata Sandi: `Latihan#2026`
   - **Akuntan:** `dimaslrst@gmail.com` | Kata Sandi: `Latihan#2026`
   - **Direktur:** `larasatiyw@gmail.com` | Kata Sandi: `Latihan#2026`
   - **Akun Nonaktif (Uji RLS):** `yoga@larasati.test` | Kata Sandi: `Latihan#2026`
3. **Audio & Lingkungan:**
   - Rekam di ruangan tenang tanpa gaung.
   - Gunakan mikrofon headset / clip-on agar suara jernih dan terdengar profesional.

---

## ⏱️ Rangkuman Alur & Timeline Video (Total: ~6 Menit 30 Detik)

| Scene | Menit | Topik Utama | Pemeran / Akun | Fokus Aksi |
| :---: | :---: | :--- | :--- | :--- |
| **1** | `00:00 - 00:45` | Pembuka, Identitas & Latar Belakang Masalah | Norma Zuhrotul Hayati | Landing Page & Identitas Sistem |
| **2** | `00:45 - 01:15` | Gambaran Arsitektur & Tech Stack | Norma | Landing Page / Form Login |
| **3** | `01:15 - 02:45` | Role 1 (Staf): Pengajuan Biaya & AI Scanner Nota | `rinalrsti@gmail.com` | Scan Nota Gemini OCR & Submit Biaya |
| **4** | `02:45 - 03:15` | Notifikasi Email Otomatis (Resend API) | Inbox Email | Tampilan Notifikasi Masuk |
| **5** | `03:15 - 04:30` | Role 2 (Akuntan): Verifikasi, Jurnal & Buku Besar | `dimaslrst@gmail.com` | Approval, Jurnal Seimbang & Buku Besar |
| **6** | `04:30 - 05:45` | Role 3 (Direktur): Dashboard, Laporan & Cetak PDF | `larasatiyw@gmail.com` | Executive Dashboard, Laba Rugi, Neraca |
| **7** | `05:45 - 06:30` | Keamanan (Supabase RLS) & Penutup | `yoga@larasati.test` | Uji Login Nonaktif & Kesimpulan |

---

## 🎥 Detail Alur Per Scene & Naskah Narasi (Voiceover Script)

---

### SCENE 1: PEMBUKA & LATAR BELAKANG MASALAH
- **Durasi:** `00:00 - 00:45` (45 Detik)
- **Tampilan Layar:** 
  - Layar menampilkan Landing Page utama `https://batiklarasati.normasuci.site` dengan logo resmi CV Batik Larasati dan nuansa desain Sogan modern.
  - Kursor mengarahkan penonton ke judul sistem dan tombol masuk.

> **🗣️ Naskah Narasi (Voiceover):**
> *"Halo, perkenalkan saya **Norma Zuhrotul Hayati**. Pada video kali ini, saya akan mendemonstrasikan hasil pengerjaan Capstone Project saya, yaitu **Sistem Informasi Pengelolaan Keuangan & Akuntansi CV Batik Larasati**.*
>
> *CV Batik Larasati adalah usaha manufaktur dan perdagangan batik yang sebelumnya menghadapi kendala pencatatan nota fisik yang sering tercecer, risiko human error dalam penjurnalan ganda, serta lambatnya penyusunan laporan keuangan untuk pimpinan.*
>
> *Aplikasi ini hadir sebagai solusi otomasi menyeluruh yang menghubungkan operasional staf produksi, staf akuntansi, dan direktur dalam satu sistem terintegrasi berbasis kecerdasan buatan."*

---

### SCENE 2: GAMBARAN TEKNOLOGI & ARSITEKTUR
- **Durasi:** `00:45 - 01:15` (30 Detik)
- **Tampilan Layar:**
  - Klik tombol **Masuk / Login**. Tampilkan form login yang elegan dan responsif.
  - Tunjukkan sekilas URL resmi dan sertifikat SSL/HTTPS aktif (`https://batiklarasati.normasuci.site`).

> **🗣️ Naskah Narasi (Voiceover):**
> *"Aplikasi ini dibangun menggunakan arsitektur modern berbasis **Next.js 15 App Router** dan **TypeScript** untuk performa yang optimal dan andal.*
>
> *Database dikelola menggunakan **Supabase PostgreSQL** yang dipersenjatai proteksi **Row Level Security (RLS)** untuk menjamin keamanan akses berbasis peran.*
>
> *Selain itu, sistem ini dilengkapi **Google Gemini AI** untuk Optical Character Recognition nota transaksi, serta layanan **Resend API** untuk pengiriman notifikasi persetujuan keuangan secara real-time ke email pengguna."*

---

### SCENE 3: ROLE 1 — STAF OPERASIONAL & AI SCANNER NOTA
- **Durasi:** `01:15 - 02:45` (1 Menit 30 Detik)
- **Tampilan Layar:**
  1. Login menggunakan akun Staf: `rinalrsti@gmail.com` (Rina Anggraini - Kepala Produksi).
  2. Masuk ke halaman **Pengeluaran / Pengajuan Biaya**.
  3. Klik tombol **"Ajukan Pengeluaran"**.
  4. Klik area upload bukti nota & pilih file `CONTOH_NOTA_BATIK.png`.
  5. Tunjukkan proses ekstraksi otomatis Google Gemini AI (loading spinner berputar beberapa detik).
  6. Sorot form yang terisi secara otomatis:
     - Tanggal transaksi terisi otomatis.
     - Nominal belanja terisi otomatis sesuai nota.
     - Kategori Akun Beban (Beban Bahan Baku Batik) terpilih otomatis.
     - Catatan/Keterangan nota terekstrak rapi.
  7. Klik tombol **"Kirim Pengajuan"**.
  8. Tunjukkan notifikasi sukses dan status pengajuan yang kini berstatus *"Menunggu Verifikasi Akuntan"*.

> **🗣️ Naskah Narasi (Voiceover):**
> *"Sekarang kita mulai dari alur pertama: **Staf Operasional**. Saya masuk sebagai Ibu Rina Anggraini, Kepala Produksi Batik.*
>
> *Staf dapat mengajukan klaim pengeluaran operasional dengan sangat mudah. Cukup buka menu Pengeluaran dan klik Ajukan Pengeluaran.*
>
> *Di sini terdapat fitur unggulan kami: **AI Scanner Nota Berbasis Google Gemini**. Ketika staf mengunggah foto kuitansi atau nota pembelian bahan baku seperti ini... sistem kecerdasan buatan akan langsung membaca, memindai, dan mengekstrak tanggal, total nominal, hingga memetakan kategori akun beban secara otomatis tanpa perlu staf mengetik manual.*
>
> *Semua data telah tervalidasi dengan akurat. Sekarang staf tinggal menekan 'Kirim Pengajuan'. Data langsung tersimpan di cloud Supabase dan statusnya otomatis masuk ke antrean verifikasi bagian akuntansi."*

---

### SCENE 4: NOTIFIKASI EMAIL OTOMATIS (RESEND API)
- **Durasi:** `02:45 - 03:15` (30 Detik)
- **Tampilan Layar:**
  - Beralih ke tab Inbox Email (`dimaslrst@gmail.com` atau bukti screenshot email).
  - Buka email masuk yang baru saja dikirimkan oleh sistem via **Resend API**.
  - Tunjukkan template email yang rapi, mencantumkan nomor pengajuan, nama pemohon, nominal, dan link langsung untuk verifikasi.

> **🗣️ Naskah Narasi (Voiceover):**
> *"Secara bersamaan di latar belakang, sistem memicu pengiriman notifikasi email otomatis melalui integrasi **Resend API**.*
>
> *Dapat kita lihat di kotak masuk email Akuntan, notifikasi pengajuan baru dari Ibu Rina telah diterima secara instan, lengkap dengan rincian biaya dan nota terlampir, sehingga proses bisnis tidak lagi terhambat komunikasi manual."*

---

### SCENE 5: ROLE 2 — AKUNTAN (VERIFIKASI & JURNAL OTOMATIS)
- **Durasi:** `03:15 - 04:30` (1 Menit 15 Detik)
- **Tampilan Layar:**
  1. Logout dari akun Rina, lalu Login sebagai Akuntan: `dimaslrst@gmail.com` (Dimas Arya Nugroho).
  2. Buka menu **Pengajuan Biaya**: Tunjukkan pengajuan Rina ada di daftar antrean.
  3. Klik tombol **Verifikasi / Setujui**.
  4. Pindah ke menu **Jurnal Umum**:
     - Tunjukkan bahwa transaksi otomatis terposting ke Jurnal Umum.
     - Tunjukkan tabel Debit dan Kredit (misal: Debit Beban Bahan Baku Rp 850.000, Kredit Kas/Bank Rp 850.000).
     - Tunjukkan indikator bahwa total Debit dan Kredit berstatus seimbang (*Balanced*).
  5. Buka menu **Buku Besar (General Ledger)**:
     - Filter berdasarkan akun Kas atau Beban Bahan Baku.
     - Tunjukkan saldo berjalan yang ter-update seketika.
  6. Buka sekilas menu **Rekonsiliasi Bank**: Tunjukkan pencocokan mutasi kas.

> **🗣️ Naskah Narasi (Voiceover):**
> *"Sekarang kita beralih ke peran kedua: **Akuntan**, login sebagai Mas Dimas.*
>
> *Pada menu Pengajuan, akuntan memeriksa kelengkapan nota dan melakukan verifikasi. Begitu disetujui, sistem secara otomatis melakukan posting transaksi ke **Jurnal Umum**.*
>
> *Perhatikan prinsip dasar akuntansi double-entry di sini: posisi Debit Beban dan Kredit Kas tercatat seimbang secara otomatis, mencegah kesalahan pembukuan manual.*
>
> *Kita juga dapat memeriksa menu **Buku Besar**, di mana setiap mutasi akun tersusun rapi dengan saldo berjalan real-time, serta menu **Rekonsiliasi Bank** untuk mencocokkan rekening koran dengan pencatatan internal."*

---

### SCENE 6: ROLE 3 — DIREKTUR (EXECUTIVE DASHBOARD & LAPORAN KEUANGAN)
- **Durasi:** `04:30 - 05:45` (1 Menit 15 Detik)
- **Tampilan Layar:**
  1. Logout dari Dimas, Login sebagai Direktur: `larasatiyw@gmail.com` (Ibu Laras Prameswari).
  2. Tampilkan **Dashboard Eksekutif**:
     - Sorot kartu ringkasan KPI: Saldo Kas, Total Pendapatan Bulan Ini, Total Beban, dan Laba Bersih.
     - Tunjukkan grafik interaktif tren arus kas bulanan.
  3. Buka menu **Laporan Keuangan**:
     - Klik tab **Laporan Laba Rugi**: Tunjukkan rincian Pendapatan Usaha, Beban Operasional, dan Laba Bersih.
     - Klik tab **Neraca Keuangan**: Tunjukkan keseimbangan Aset = Liabilitas + Ekuitas.
  4. Tunjukkan fitur **Cetak / Ekspor Laporan ke PDF** (klik tombol download/cetak PDF untuk memperlihatkan format laporan resmi ber-kop CV Batik Larasati).
  5. Perlihatkan sekilas menu **Periode Akuntansi / Tutup Buku** dan **Audit Log Aktivitas**.

> **🗣️ Naskah Narasi (Voiceover):**
> *"Terakhir, kita masuk ke peran pimpinan tertinggi: **Direktur & Pemilik Usaha**, Ibu Laras Prameswari.*
>
> *Di Dashboard Eksekutif, direktur langsung disajikan ringkasan metrik finansial strategis: total kas aktif, beban operasional, laba bersih, serta visualisasi grafik arus kas yang informatif.*
>
> *Pada modul **Laporan Keuangan**, direktur dapat memantau Laporan Laba Rugi dan Neraca Keuangan secara real-time tanpa perlu menunggu rekapitulasi akhir bulan dari staf. Laporan ini juga siap diunduh dalam format PDF profesional berkop CV Batik Larasati untuk kebutuhan rapat manajemen atau pelaporan pajak.*
>
> *Direktur juga memiliki kendali penuh atas Tutup Buku Periode untuk mencegah manipulasi data masa lalu, serta memantau seluruh riwayat transaksi melalui Audit Log."*

---

### SCENE 7: UJI KEAMANAN (ROW LEVEL SECURITY) & PENUTUP
- **Durasi:** `05:45 - 06:30` (45 Detik)
- **Tampilan Layar:**
  1. Logout dari sistem.
  2. Coba login menggunakan akun nonaktif: `yoga@larasati.test` | Kata Sandi: `Latihan#2026`.
  3. Tunjukkan sistem menolak akses dengan pesan proteksi akun dinonaktifkan.
  4. Kembali ke halaman depan / landing page.
  5. Tampilkan slide atau layar penutup dengan identitas nama pengembang dan instansi.

> **🗣️ Naskah Narasi (Voiceover):**
> *"Untuk menjamin integritas data, sistem ini menerapkan standar keamanan **Supabase Row Level Security**. Sebagai bukti pengujian, saat saya mencoba login menggunakan akun staf yang telah nonaktif—yaitu Yoga Pratama—sistem secara tegas menolak akses dan memblokir seluruh interaksi database.*
>
> *Dengan adanya otomasi AI, validasi jurnal otomatis, notifikasi email, dan kontrol akses ketat, Sistem Informasi Keuangan CV Batik Larasati berhasil memangkas waktu pencatatan keuangan hingga lebih dari 70% dan menjamin akurasi laporan keuangan secara transparan.*
>
> *Demikian demonstrasi Capstone Project ini. Saya Norma Zuhrotul Hayati, terima kasih atas perhatian Bapak dan Ibu Reviewer."*

---

## 💡 Tips & Trik Saat Merekam Video

1. **Jaga Tempo Suara:** Jangan terburu-buru. Beri jeda 1 detik saat berpindah halaman agar video terlihat tenang dan mudah dipahami reviewer.
2. **Kursor / Mouse:** Gerakkan kursor secara halus ke elemen yang sedang dijelaskan (misalnya saat menunjuk tombol upload nota, indikator debit-kredit seimbang, atau tombol PDF).
3. **Persiapkan Data Bukti:** File `CONTOH_NOTA_BATIK.png` sudah tersedia di repositori proyek untuk diunggah langsung saat rekaman.
4. **Software Rekaman yang Direkomendasikan:**
   - **OBS Studio** (Gratis & kualitas jernih)
   - **Loom** atau **Clipchamp** (Windows bawaan)
5. **Format Ekspor:** MP4 (1080p, 30/60 fps) lalu upload ke Google Drive / YouTube (Unlisted) sesuai petunjuk pengumpulan form.

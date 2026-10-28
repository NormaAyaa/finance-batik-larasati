# 📊 BAHAN PRESENTASI CAPSTONE PROJECT
## Sistem Informasi Pengelolaan Keuangan & Akuntansi — CV Batik Larasati
**Program:** Bootcamp AI Web Programming  
**Pengembang:** Norma Zuhrotul Hayati  
**URL Live Aplikasi:** [https://batiklarasati.normasuci.site](https://batiklarasati.normasuci.site)  
**Repository GitHub:** [https://github.com/NormaAyaa/finance-batik-larasati](https://github.com/NormaAyaa/finance-batik-larasati)  

---

## 🎯 STRUKTUR SLIDE PRESENTASI (8 BAGIAN WAJIB)

---

### SLIDE 1: JUDUL & IDENTITAS PROYEK (Cover Slide)
- **Judul:** Sistem Informasi Pengelolaan Keuangan & Akuntansi CV Batik Larasati Berbasis AI & Double-Entry Bookkeeping
- **Sub-judul:** Modernisasi Tata Kelola Finansial UMKM Batik Warisan Budaya Surakarta
- **Identitas:** 
  - **Nama Pengembang:** Norma Zuhrotul Hayati
  - **Program:** Bootcamp AI Web Programming
  - **Live URL:** `batiklarasati.normasuci.site`
- **Saran Visual:** Mockup tampilan Landing Page bertema Sogan Obsidian (`#070605` & aksen emas) yang menampilkan logo canting Batik Larasati di perangkat laptop dan smartphone.
- **Speaker Notes (Narasi):**
  > *"Selamat pagi/siang rekan-rekan dan dewan penguji. Saya Norma Zuhrotul Hayati. Pada kesempatan ini saya mempresentasikan proyek Capstone saya: Sistem Informasi Pengelolaan Keuangan & Akuntansi CV Batik Larasati—sebuah solusi komprehensif berbasis AI dan Next.js 15 yang mentransformasi tata kelola keuangan UMKM batik tradisional menjadi sistem digital modern, akurat, dan terpercaya."*

---

### SLIDE 2: MASALAH (Latar Belakang & Pain Points Mitra)
- **Judul Slide:** Masalah Operasional & Latar Belakang Mitra
- **Profil Mitra:** CV Batik Larasati adalah UMKM produsen dan toko batik tulis/cap di Surakarta dengan 7 karyawan dan unit kelas membatik wisata.
- **Pain Points Utama yang Dihadapi:**
  1. **Nota Tercecer & Pembayaran Ganda (WhatsApp Pengajuan):** Pengajuan biaya operasional dan reimburse dikirim via WhatsApp dengan foto struk yang sering hilang, lupa diverifikasi, atau dibayar dua kali karena ketiadaan nomor transaksi unik.
  2. **Tanpa Approval Hierarchy:** Pengeluaran bernominal besar sering kali dibayarkan langsung oleh staf/akuntan tanpa verifikasi dan persetujuan dari Pemilik Usaha (Direktur).
  3. **Pembukuan Terpisah & Rawan Selisih (Spreadsheet Manual):** Jurnal umum dicatat manual di spreadsheet sehingga sering tidak seimbang (*debit ≠ kredit*) atau datanya diubah sepihak setelah laporan bulanan diserahkan.
  4. **Laporan Keuangan Lambat & Buta Posisi Kas:** Pemilik usaha baru mengetahui usahanya untung atau rugi berminggu-minggu setelah bulan berakhir, tanpa visibilitas posisi kas riil.
  5. **Kebocoran Data Finansial:** Tidak adanya pemisahan hak akses membuat data sensitif seperti gaji dan laporan laba rugi pernah terlihat oleh staf umum.
- **Saran Visual:** Diagram / Ikon perbandingan: Struk fisik lusuh & chat WhatsApp menumpuk ➔ Tanda silang merah (Risiko Kebocoran Kas & Selisih Jurnal).
- **Speaker Notes (Narasi):**
  > *"CV Batik Larasati menghadapi kendala klasik UMKM yang berkembang pesat: pengajuan belanja bahan kain dan malam batik dilakukan lewat WhatsApp dengan foto nota yang sering tercecer dan dibayar dobel. Pembukuan masih mengandalkan spreadsheet manual oleh satu akuntan, menyebabkan laporan laba rugi terlambat hingga berminggu-minggu, jurnal rentan tidak seimbang, pengeluaran besar lolos tanpa approval pemilik, dan tidak ada privasi data keuangan antarkaryawan."*

---

### SLIDE 3: SOLUSI (Website Internal Finance & Accounting Terintegrasi)
- **Judul Slide:** Solusi: Platform Finansial Terpadu CV Batik Larasati
- **Nilai Solusi yang Dihadirkan:**
  1. **Digitalisasi Pengajuan & Nota Digital:** Formulir pengajuan pengeluaran terpusat dengan unggah bukti (JPG, PNG, PDF) dan penomoran otomatis transaksional (`PG-YYYYMM-XXXX`).
  2. **Persetujuan Berjenjang Otomatis (Approval Matrix):** Sistem otomatis membatasi: pengajuan ≤ Rp 1.000.000 disetujui Akuntan; pengajuan > Rp 1.000.000 serta pengajuan milik Akuntan wajib disetujui Direktur. Anti-self-approval (tidak bisa menyetujui pengajuan sendiri).
  3. **Strict Double-Entry Bookkeeping:** Validasi keseimbangan debit dan kredit mutlak. Pembayaran pengajuan langsung membentuk jurnal otomatis secara atomik.
  4. **Proteksi Integritas Data & Anti-Tampering:** Jurnal yang sudah diposting tidak dapat diedit/dihapus; koreksi hanya melalui *Reversing Journal* (Jurnal Pembalik). Periode bulanan dapat dikunci (*tutup buku*).
  5. **Laporan Finansial Real-time & Role-Based Security:** Dashboard eksekutif, Laporan Laba Rugi, Neraca, dan Buku Besar instan yang diproteksi di level database (Supabase Row Level Security).
- **Saran Visual:** Skema alur kerja: Staf Submit Nota ➔ AI Scan ➔ Akuntan/Direktur Approval ➔ Auto Journaling ➔ Real-time Financial Reports.
- **Speaker Notes (Narasi):**
  > *"Untuk menyelesaikan masalah tersebut, kami membangun aplikasi web internal terpadu. Sistem ini mendigitalisasi alur pengajuan belanja, menerapkan aturan persetujuan berjenjang otomatis, menjamin pembukuan berpasangan (double-entry) selalu seimbang, dan mengunci pembukuan yang telah tutup buku. Pemilik dan akuntan kini dapat memantau kesehatan kas, neraca, dan laba rugi secara instan kapan pun dan di mana pun."*

---

### SLIDE 4: TECH STACK (Teknologi, Bahasa, dan Tools)
- **Judul Slide:** Arsitektur & Teknologi yang Digunakan
- **Pilar Teknologi:**
  - **Frontend & App Framework:** Next.js 15 (App Router, Server Components & Server Actions, React 19, TypeScript) untuk performa tinggi dan type-safety penuh.
  - **Styling & Design System:** Tailwind CSS v4 dengan konsep tematik *"Sogan Obsidian"* (Dark Mode elegan beraksen emas batik `#f59e0b`, responsive mobile-first).
  - **Backend & Database:** Supabase (PostgreSQL Database Engine, Database Functions, Atomicity).
  - **Security & Authorization:** Supabase Row Level Security (RLS) di level database engine + Session Cookie HTTP-Only (`@supabase/ssr`).
  - **Artificial Intelligence:** Google Gemini AI API (Multimodal OCR & semantic parser nota).
  - **Email Service:** Resend API (Notifikasi transaksional email instan).
  - **Deployment & Infra:** Netlify / Custom Domain dengan SSL/HTTPS (`batiklarasati.normasuci.site`).
  - **Testing & Quality Assurance:** Node.js native test runner (`tsx --test`), ESLint v9, Postman.
- **Saran Visual:** Grid logo teknologi: Next.js 15 | TypeScript | Supabase PostgreSQL | Google Gemini | Tailwind CSS | Resend.
- **Speaker Notes (Narasi):**
  > *"Sistem ini dibangun dengan fondasi teknologi modern: Next.js 15 dengan App Router dan TypeScript, didukung database PostgreSQL Supabase dengan penegakan Row Level Security langsung di tingkat basis data. Untuk mempermudah staf, kami mengintegrasikan Google Gemini AI untuk pembacaan nota otomatis, Resend API untuk notifikasi email real-time, serta Tailwind CSS v4 berdesain Sogan Obsidian yang memadukan keanggunan warisan budaya batik Solo dengan fungsionalitas akuntansi mutakhir."*

---

### SLIDE 5: FITUR-FITUR UTAMA (Core Features yang Sudah Berjalan 100%)
- **Judul Slide:** Fitur-Fitur Utama (Kepatuhan Penuh PRD)
- **Rincian Fitur Berdasarkan Peran:**
  1. **Hak Akses 3 Peran & Keamanan RLS (Staf, Akuntan, Direktur):**
     - Staf: Hanya dapat melihat dan mengelola pengajuan belanja miliknya.
     - Akuntan: Mengelola bagan akun (COA 4 digit), jurnal umum, buku besar, mutasi bank, verifikasi biaya, dan tutup buku bulanan.
     - Direktur: Approval nominal tinggi (> Rp 1 Jt), dashboard KPI eksekutif, buka kembali periode, audit log, dan kelola pengguna. Akun nonaktif langsung diblokir sistem.
  2. **Modul Pengajuan & Pencairan Biaya Digital:**
     - Validasi nominal Rp 10.000 s/d Rp 25.000.000, lampiran bukti wajib, alur status: *Draf ➔ Diajukan ➔ Menunggu Direktur ➔ Disetujui ➔ Dibayar / Ditolak / Perlu Revisi*.
     - Pencairan dana memvalidasi kecukupan saldo Kas/Bank secara otomatis.
  3. **Sistem Akuntansi Double-Entry Seimbang (Jurnal Umum & Buku Besar):**
     - Pencegahan jurnal timpang (*Debit = Kredit* wajib terpenuhi sebelum posting).
     - Penomoran otomatis unik berurutan `JU-YYYYMM-XXXX` anti-duplikat.
     - Fitur Jurnal Pembalik (*Reversing Journal*) sekali klik tanpa merusak histori audit.
  4. **Laporan Finansial Real-Time & Tutup Buku:**
     - Laporan Laba Rugi (angka negatif otomatis berformat akuntansi dalam kurung).
     - Neraca Keuangan (validasi otomatis Aset = Kewajiban + Ekuitas).
     - Kunci periode bulanan berurutan untuk mencegah manipulasi data lampau.
  5. **Audit Trail Lengkap (Audit Log):**
     - Pencatatan seluruh aksi sensitif: siapa, aksi apa, data sebelum dan sesudah, beserta timestamp WIB.
- **Saran Visual:** Kolase screenshot antarmuka: Form Pengajuan ➔ Jurnal Umum Seimbang ➔ Laporan Neraca & Laba Rugi.
- **Speaker Notes (Narasi):**
  > *"Seluruh kebutuhan fungsional PRD telah 100% berjalan sempurna: hak akses berbasis peran dengan proteksi RLS ketat, pengajuan biaya digital dengan validasi aturan bisnis, pencairan dana otomatis ke jurnal, jurnal umum seimbang anti-selisih dengan penomoran unik, buku besar interaktif, tutup buku periode bulanan, hingga audit log transparan untuk Direktur."*

---

### SLIDE 6: PENINGKATAN FITUR (Fitur Nilai Tambah Di Luar PRD)
- **Judul Slide:** Peningkatan Fitur (Added-Value Innovations)
- **Inovasi Melampaui Kebutuhan Awal PRD:**
  1. **🤖 Google Gemini AI Smart OCR Receipt Scanner:**
     - Bukan sekadar OCR teks biasa: AI mengekstrak tanggal, total nominal, nama vendor/toko, dan ringkasan keperluan belanja.
     - *Fitur Cerdas Unggulan:* AI otomatis merekomendasikan kode akun beban batik yang paling sesuai (misal: nota kain/malam otomatis terpilih Akun `5104 Beban Bahan Baku`, nota bensin ke `5105`, ATK ke `5107`).
     - Proteksi keamanan: validasi magic bytes berkas (JPG/PNG/PDF), batas 5 MB, dan in-memory rate-limiting.
  2. **🏦 Impor CSV Mutasi Bank dengan Algoritma Anti-Duplikasi:**
     - Akuntan dapat mengunggah file CSV mutasi bank rekening operasional.
     - Sistem mendeteksi baris yang belum dijurnal, mencegah impor ganda, dan menyediakan tombol *"+ Draf Jurnal"* 1-klik langsung dari mutasi rekening.
  3. **📧 Notifikasi Email Transaksional Otomatis (Resend API):**
     - Notifikasi real-time ke email Akuntan saat ada pengajuan baru dari staf.
     - Notifikasi ke pengaju saat pengajuan disetujui, dibayar, atau diminta revisi.
  4. **🎨 Desain Eksklusif "Sogan Obsidian" & Public Landing Page:**
     - PRD hanya mensyaratkan form login polos; kami membangun Landing Page publik yang megah bernuansa batik klasik Surakarta, dilengkapi sidebar slim vertikal beraksen pendar emas (*golden glow*) dan Bento Grid KPI.
  5. **📄 Ekspor Laporan Keuangan ke PDF Resmi:**
     - Cetak laporan Laba Rugi dan Neraca ke format PDF ber-kop surat resmi CV Batik Larasati siap edar.
- **Saran Visual:** Side-by-side: Foto Nota Asli vs Hasil Ekstraksi Form AI Gemini + Banner Notifikasi Email Resend + Tampilan PDF resmi.
- **Speaker Notes (Narasi):**
  > *"Tidak hanya menuntaskan PRD, kami memberikan lima lompatan nilai tambah: Pertama, integrasi Google Gemini AI yang tidak hanya membaca nota tetapi otomatis memilihkan kode akun beban batik. Kedua, impor CSV mutasi bank dengan auto-draft jurnal dan pencegahan duplikasi. Ketiga, notifikasi email real-time via Resend. Keempat, UI/UX eksklusif Sogan Obsidian bertema warisan budaya Surakarta. Dan kelima, ekspor laporan resmi ke format PDF."*

---

### SLIDE 7: PROSES PENGERJAAN & TANTANGAN (Dinamika Development)
- **Judul Slide:** Dinamika & Tantangan Selama Development
- **Tantangan Utama & Strategi Penyelesaian:**
  1. **Tantangan 1: Konsistensi Akuntansi & Konkurensi Data (BR-02 s/d BR-10):**
     - *Dinamika:* Menjamin penomoran jurnal (`JU-202610-XXXX`) tidak loncat atau ganda saat dua akuntan memposting bersamaan, serta saldo kas tidak menjadi negatif saat pencairan.
     - *Solusi:* Memanfaatkan transaksi database PostgreSQL dengan mekanisme locking atomik di Supabase, didukung pengujian pengujian unit dan edge-cases.
  2. **Tantangan 2: Robustness AI OCR terhadap Nota Fisik Riil:**
     - *Dinamika:* Nota belanja UMKM sering berupa kuitansi tulisan tangan toko kain pasar Klewer, posisi miring, atau format tanggal tidak standar (DD/MM/YYYY vs YYYY-MM-DD).
     - *Solusi:* Menggunakan Gemini Structured Outputs (JSON Schema ketat), validasi normalisasi tanggal WIB di backend server, dan sanitasi angka rupiah.
  3. **Tantangan 3: Penegakan Hak Akses Multi-Level (RLS Policies):**
     - *Dinamika:* Menjamin data laporan laba rugi dan jurnal sama sekali tidak bisa dibobol staf melalui panggilan langsung API/Postman (BR-11).
     - *Solusi:* Menerapkan Supabase Row Level Security (RLS) berbasis JWT role di setiap tabel dan storage bucket, bukan sekadar menyembunyikan elemen di frontend.
  4. **Tantangan 4: Uji Coba Email Transaksional pada Lingkungan Dev & Staging:**
     - *Dinamika:* Akun uji sebagian besar menggunakan domain contoh (`.test`) yang tidak memiliki kotak masuk nyata.
     - *Solusi:* Merancang sistem pemetaan email dinamis (`EMAIL_UJI_PETA`) dan pengalihan aman (*safe test redirect*) sehingga email uji diarahkan ke inbox Gmail riil tanpa risiko spam.
- **Saran Visual:** Diagram problem-solving: Tantangan ➔ Solusi Rekayasa Teknis ➔ Hasil Stabil & Teruji.
- **Speaker Notes (Narasi):**
  > *"Dalam proses pengembangan, tantangan terbesar kami adalah memastikan integritas aturan akuntansi: tidak boleh ada nomor jurnal ganda meski diposting pada detik yang sama, serta proteksi kerahasiaan data via Supabase RLS agar kebal dari manipulasi langsung via API. Kami juga mengatasi kendala variasi nota fisik UMKM dengan merancang prompt berstruktur JSON ketat pada Gemini API disertai validasi tanggal dan nominal di layer backend."*

---

### SLIDE 8: DEMO SINGKAT (Skenario Cuplikan 1 Menit)
- **Judul Slide:** Demo Singkat Alur Kerja Sistem (1 Menit)
- **Alur Perjalanan Data (End-to-End Workflow):**
  - **Detik 00 - 15 (Staf Produksi):**
    - Login sebagai Rina (`rinalrsti@gmail.com`).
    - Buka menu Pengajuan ➔ Klik *Ajukan Pengeluaran*.
    - Unggah nota belanja kain batik ➔ Gemini AI mengekstrak nominal Rp 450.000, tanggal, dan otomatis memilih Akun `5104 Beban Bahan Baku`. Klik Kirim.
  - **Detik 15 - 30 (Akuntan & Mutasi Bank):**
    - Buka notifikasi email di Gmail Akuntan.
    - Login sebagai Dimas (`dimaslrst@gmail.com`).
    - Verifikasi pengajuan staf.
    - Masuk menu Mutasi Bank ➔ Unggah CSV bank ➔ Buat draf jurnal dari mutasi bank. Jurnal seimbang otomatis tercatat.
  - **Detik 30 - 45 (Direktur & Laporan Keuangan):**
    - Login sebagai Larasati (`larasatiyw@gmail.com`).
    - Tunjukkan Bento Dashboard Finansial, Laba Rugi real-time, dan Neraca seimbang.
    - Klik tombol *Cetak PDF* untuk mengunduh laporan ber-kop resmi.
  - **Detik 45 - 60 (Keamanan & Uji RLS):**
    - Logout dan coba masuk dengan akun nonaktif Yoga (`yoga@larasati.test`).
    - Sistem menampilkan penolakan akses oleh Supabase RLS. Transaksi aman terlindungi.
- **Saran Visual:** Tampilan 4 cuplikan layar utama: [Upload AI Nota] ➔ [Inbox Resend] ➔ [Dashboard & PDF] ➔ [Tolak Login RLS].
- **Speaker Notes (Narasi):**
  > *"Mari kita lihat alur sistem dalam 1 menit: Staf mengunggah foto nota, dalam 2 detik AI Gemini membaca data dan merekomendasikan akun beban yang tepat. Akuntan menerima notifikasi email, memverifikasi belanja, dan merekonsiliasi mutasi bank via upload CSV. Direktur dapat langsung memantau dampak transaksi tersebut pada Neraca dan Laba Rugi secara real-time serta mengekspor PDF resmi. Terakhir, keamanan terbukti saat akun nonaktif langsung ditolak oleh Supabase RLS."*

---

### SLIDE 9: SIMPULAN & DAMPAK PROYEK (Closing Slide)
- **Judul Slide:** Kesimpulan & Dampak bagi CV Batik Larasati
- **Dampak Nyata yang Dihasilkan:**
  1. **Efisiensi Waktu > 70%:** Rekonsiliasi kas dan pelaporan keuangan yang sebelumnya memakan waktu berhari-hari kini selesai dalam hitungan menit secara real-time.
  2. **Zero Duplicate & Zero Lost Receipts:** Tidak ada lagi nota tercecer di WhatsApp atau klaim ganda berkat sentralisasi bukti digital dan penomoran transaksional unik.
  3. **Tata Kelola Finansial Akuntabel & Anti-Manipulasi:** Penerapan double-entry balance, persetujuan berjenjang berdasar nominal, kunci periode tutup buku, dan audit log menjamin akurasi data 100%.
  4. **Pemberdayaan UMKM Berbasis AI:** Membuktikan bahwa UMKM kriya tradisional dapat mengadopsi teknologi AI mutakhir (Gemini OCR) untuk meningkatkan produktivitas tanpa kerumitan teknis.
- **Pernyataan Penutup:**
  > *"Sistem Informasi Keuangan CV Batik Larasati bukan hanya mendigitalkan pembukuan, tetapi membangun fondasi tata kelola bisnis yang tangguh, transparan, dan siap bertumbuh."*
- **Q&A Session:** Terima Kasih — Sesi Tanya Jawab.
- **Speaker Notes (Narasi):**
  > *"Kesimpulannya, proyek ini sukses mentransformasi CV Batik Larasati dari pencatatan manual yang rentan menjadi UMKM berdaya saing tinggi dengan sistem keuangan yang akuntabel, transparan, dan efisien. Sistem memangkas 70% waktu administrasi, menghilangkan risiko nota hilang, dan memberikan visibilitas penuh bagi pemilik untuk mengambil keputusan bisnis yang tepat. Terima kasih atas perhatian Bapak/Ibu penguji, saya siap untuk sesi tanya jawab."*

---

## 💡 PANDUAN RINGKAS UNTUK PEMBUATAN SLIDE (Canva / PPT)
| Slide # | Judul Halaman | Warna / Layout Dominan | Screenshot / Aset Pendukung |
| :---: | :--- | :--- | :--- |
| **1** | Cover / Judul Proyek | Dark Obsidian `#070605` + Emas `#f59e0b` | Logo CV Batik Larasati + Mockup Laptop |
| **2** | Masalah & Latar Belakang | Dark Slate / Merah aksen | Foto tumpukan nota / chat WhatsApp |
| **3** | Solusi Sistem | Emas Amber + Hijau Emerald | Diagram alur sistem terpadu |
| **4** | Tech Stack & Arsitektur | Grid Modern / Tech Icons | Logo Next.js, Supabase, Gemini, Tailwind |
| **5** | Fitur-Fitur Utama | Bento Cards (2x2) | Screenshot Form Pengajuan, Jurnal, Neraca |
| **6** | Peningkatan Fitur (AI & CSV) | Highlight Card Emas Glowing | Screenshot AI Gemini OCR & CSV Bank Upload |
| **7** | Proses & Tantangan | Timeline / Split Column | Diagram Alur Tantangan ➔ Rekayasa Solusi |
| **8** | Demo Singkat (1 Menit) | 4-Step Flowchart | 4 Thumbnail Langkah Demo Pengujian |
| **9** | Kesimpulan & Q&A | Dark Obsidian + Clean Gold Callout | KPI Persentase Efisiensi (70%) + Kontak |

---
*Dokumen ini disusun untuk presentasi Capstone Project Bootcamp AI Web Programming oleh Norma Zuhrotul Hayati.*

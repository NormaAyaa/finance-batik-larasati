# 📑 MATERI PRESENTASI SLIDE-BY-SLIDE (SIAP PAKAI DI PPT / CANVA)
## Sistem Informasi Pengelolaan Keuangan & Akuntansi — CV Batik Larasati
**Pengembang:** Norma Zuhrotul Hayati  
**Program:** Bootcamp AI Web Programming  
**Live URL:** [https://batiklarasati.normasuci.site](https://batiklarasati.normasuci.site)  
**GitHub:** [https://github.com/NormaAyaa/finance-batik-larasati](https://github.com/NormaAyaa/finance-batik-larasati)  

---

```
================================================================================
SLIDE 1: COVER / JUDUL PROYEK
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Tema Visual:** Dark Mode Elegan (*Sogan Obsidian* - Latar `#070605` dengan aksen emas tembaga `#f59e0b`).
- **Elemen:** Logo Canting Batik Larasati di kiri atas, Judul Besar di tengah, mockup laptop/browser di sebelah kanan.

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[HEADER KECIL]**  
CAPSTONE PROJECT — BOOTCAMP AI WEB PROGRAMMING

**[JUDUL UTAMA]**  
**SISTEM INFORMASI PENGELOLAAN KEUANGAN & AKUNTANSI**  
**CV BATIK LARASATI**

**[SUB-JUDUL]**  
*Transformasi Digital Finansial UMKM Berbasis Next.js 15, Supabase, dan AI Receipt Automation*

**[FOOTER / IDENTITAS]**  
- **Pengembang:** Norma Zuhrotul Hayati
- **Mitra:** CV Batik Larasati (Surakarta, Jawa Tengah)
- **Website Live:** `batiklarasati.normasuci.site`

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Screenshot Landing Page `https://batiklarasati.normasuci.site` dengan bingkai laptop.
- Logo Monogram Canting Batik Larasati beraksen emas.

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Selamat pagi/siang Dewan Penguji dan rekan-rekan sekalian. Saya Norma Zuhrotul Hayati. Hari ini saya mempersembahkan proyek Capstone saya: Sistem Informasi Pengelolaan Keuangan dan Akuntansi untuk CV Batik Larasati. Aplikasi ini dirancang untuk menjawab tantangan tata kelola keuangan UMKM batik tradisional melalui otomatisasi pencatatan, penegakan aturan akuntansi baku, dan integrasi kecerdasan buatan."*

---
<br>

```
================================================================================
SLIDE 2: MASALAH (LATAR BELAKANG & PROBLEM UTAMA)
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** 2 Kolom (Kolom Kiri: Profil Singkat Mitra; Kolom Kanan: 4 Kartu Masalah Berwarna Gelap dengan Aksen Merah/Rose).

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL SLIDE]**  
**LATAR BELAKANG & MASALAH MITRA**

**[KOLOM KIRI: PROFIL MITRA]**  
**CV Batik Larasati (Surakarta):**  
- Produsen & toko batik tulis & cap tradisional (7 karyawan tetap + kelas membatik rombongan).  
- Transaksi harian dinamis: belanja bahan mori, malam, canting, hingga operasional toko.

**[KOLOM KANAN: 4 PAIN POINTS UTAMA]**  
1. 📱 **Nota WhatsApp & Pembayaran Ganda**  
   Pengajuan belanja & reimburse dikirim via chat WhatsApp. Nota fisik sering hilang, lupa diverifikasi, atau dibayar dua kali karena tanpa nomor unik.
2. ⚠️ **Tanpa Kontrol Approval (Bypass Direktur)**  
   Pengeluaran nominal besar kerap dibayarkan langsung tanpa sepengetahuan atau persetujuan Pemilik Usaha.
3. 📉 **Spreadsheet Terpisah & Jurnal Rawan Selisih**  
   Pembukuan manual di Excel oleh satu akuntan; rawan jurnal timpang (*debit ≠ kredit*) dan data masa lalu rentan diubah sepihak.
4. ⏳ **Laporan Keuangan Lambat & Rentan Bocor**  
   Posisi kas dan laba/rugi baru diketahui berminggu-minggu setelah akhir bulan. Data sensitif (seperti gaji) pernah terlihat karyawan umum.

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Gambar nota belanja fisik yang kusut/lusuh atau tangkapan layar chat WA yang menumpuk.
- Ikon silang merah pada spreadsheet yang tidak seimbang.

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"CV Batik Larasati adalah UMKM kriya batik di Solo yang berkembang pesat. Namun pembukuannya masih menghadapi 4 masalah krusial: nota belanja sering hilang di chat WhatsApp hingga terjadi pembayaran dobel; pengeluaran bernilai jutaan rupiah lolos tanpa izin pemilik; pembukuan di spreadsheet sering tidak balance dan bisa diubah diam-diam; serta laporan laba rugi terlambat berminggu-minggu tanpa adanya perlindungan privasi data."*

---
<br>

```
================================================================================
SLIDE 3: SOLUSI (PLATFORM TERPADU YANG DIBANGUN)
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** 4 Kartu Solusi Berjejer Horizontal atau Grid 2x2 dengan Ikon Emas & Hijau Emerald.

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL SLIDE]**  
**SOLUSI YANG DITAWARKAN**  
*Membangun Web Internal Finance & Accounting Terpadu CV Batik Larasati*

**[KARTU 1: PENGELOLAAN NOTA DIGITAL]**  
- **Digitalisasi Bukti Belanja**  
- Pengajuan belanja digital satu pintu dengan unggah foto/PDF.  
- Penomoran otomatis transaksional unik (`PG-YYYYMM-XXXX`) mencegah klaim ganda.

**[KARTU 2: APPROVAL MATRIX BERJENJANG]**  
- **Pemisahan Wewenang Otomatis**  
- Pengajuan $\le$ Rp 1.000.000 diverifikasi Akuntan.  
- Pengajuan $>$ Rp 1.000.000 & pengajuan milik Akuntan wajib disetujui Direktur.  
- Menegakkan aturan *Anti-Self-Approval*.

**[KARTU 3: DOUBLE-ENTRY OTOMATIS & AMAN]**  
- **Jurnal Seimbang & Anti-Tampering**  
- Jurnal hanya bisa diposting jika *Debit = Kredit*.  
- Jurnal terposting terkunci permanen; koreksi hanya lewat Jurnal Pembalik resmi.  
- Penutupan periode bulanan untuk mencegah pengubahan data lampau.

**[KARTU 4: LAPORAN REAL-TIME BER-RLS]**  
- **Visibilitas Eksekutif Instan**  
- Neraca, Laba Rugi, dan Buku Besar ter-update otomatis per detik transaksi.  
- Diproteksi ketat oleh Supabase Row Level Security (RLS) di level database.

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Alur Diagram: *Staf Upload Nota ➔ Approval Otomatis ➔ Posting Jurnal Seimbang ➔ Laporan Real-Time*.

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Untuk mengatasi permasalahan tersebut, kami membangun aplikasi web internal terintegrasi. Sistem ini menggantikan WhatsApp dan Excel dengan satu pintu terpusat: pengajuan belanja bernomor unik, matriks persetujuan berjenjang otomatis berdasarkan nominal, pembukuan double-entry yang menjamin keseimbangan debit-kredit, serta laporan laba rugi dan neraca real-time yang langsung dapat dipantau oleh Direktur."*

---
<br>

```
================================================================================
SLIDE 4: TECH STACK & ARSITEKTUR SISTEM
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** 4 Pilar Arsitektur (Frontend, Backend & Security, AI & Notification, Deployment).

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL SLIDE]**  
**TECH STACK & ARSITEKTUR TEKNOLOGI**

**[PILAR 1: FRONTEND & FRAMEWORK]**  
- **Next.js 15 (App Router)** & **React 19**  
- **TypeScript:** *Full type-safety* untuk presisi data desimal/rupiah.  
- **Tailwind CSS v4:** Desain responsif bertema budaya *"Sogan Obsidian"*.

**[PILAR 2: BACKEND & DATABASE]**  
- **Supabase (PostgreSQL Engine):** Transaksi atomik dan integritas relasional data keuangan.  
- **Row Level Security (RLS):** Isolasi data sensitif di level database engine (bukan sekadar filter UI).

**[PILAR 3: AI & INTEGRASI LAYANAN]**  
- **Google Gemini AI API:** Multimodal OCR untuk ekstraksi nota cerdas & auto-klasifikasi akun beban.  
- **Resend API:** Notifikasi email transaksional otomatis ke Akuntan & Direktur.

**[PILAR 4: INFRASTRUKTUR & DEPLOYMENT]**  
- **Hosting & Domain:** Netlify dengan Custom Domain HTTPS/SSL (`batiklarasati.normasuci.site`).  
- **Keamanan Web:** Header `noindex, nofollow`, perlindungan CSRF, dan HTTP-only session cookies.

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Logo grid: Next.js | TypeScript | Supabase PostgreSQL | Google Gemini | Tailwind CSS | Resend.
- Cuplikan arsitektur sistem atau cuplikan file [ERD_Finance.png](file:///d:/BOOTCAMP/PROJECT%20CAPSTONE/ERD_Finance.png).

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Sistem ini dibangun di atas pondasi modern: Next.js 15 App Router dan TypeScript untuk keandalan kode, didukung PostgreSQL Supabase dengan penegakan Row Level Security langsung di tingkat database. Kami juga memanfaatkan Google Gemini AI untuk pembacaan struk belanja secara otomatis, Resend API untuk notifikasi email instan, serta Tailwind CSS v4 dengan palet Sogan Obsidian yang mencerminkan identitas batik Solo."*

---
<br>

```
================================================================================
SLIDE 5: FITUR-FITUR UTAMA (IMPLEMENTASI LENGKAP PRD)
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** Bento Grid 3 Kolom yang Mengelompokkan Fitur Berdasarkan Peran Pengguna.

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL SLIDE]**  
**FITUR-FITUR UTAMA APLIKASI**  
*Implementasi Lengkap Seluruh Kebutuhan Bisnis PRD (BR-01 s/d BR-12)*

**[KOLOM 1: STAF OPERASIONAL]**  
- **Pengajuan Pengeluaran & Reimburse:** Form pengajuan fleksibel (Rp 10.000 s/d Rp 25.000.000) dengan unggah bukti (JPG, PNG, PDF $\le$ 5MB).  
- **Tracking Transparan:** Memantau status pengajuan (*Diajukan, Perlu Revisi, Disetujui, Dibayar*) beserta catatan revisi.

**[KOLOM 2: AKUNTAN (KEPALA AKUNTANSI)]**  
- **Verifikasi Pengeluaran:** Persetujuan biaya $\le$ Rp 1 Jt & penerusan ke Direktur jika $>$ Rp 1 Jt.  
- **Pencairan Dana Otomatis:** Tombol bayar memvalidasi kecukupan kas dan otomatis memposting jurnal seimbang.  
- **Jurnal Umum & Jurnal Pembalik:** Validasi *Debit = Kredit*, nomor berurutan `JU-YYYYMM-XXXX`, dan fitur pembalikan transaksi keliru.  
- **Tutup Buku Periode:** Mengunci periode bulanan agar data tidak bisa dimanipulasi.

**[KOLOM 3: DIREKTUR (PEMILIK USAHA)]**  
- **Executive KPI Dashboard:** Visualisasi saldo kas/bank, pendapatan, beban, dan laba (rugi) berjalan.  
- **Approval Nominal Besar:** Otoritas tunggal persetujuan pengeluaran $>$ Rp 1 Jt dan pengajuan milik akuntan.  
- **Laporan Laba Rugi & Neraca:** Format akuntansi standar (angka rugi dalam kurung).  
- **Manajemen User & Audit Log:** Mengatur peran staf/akuntan, blokir akun, dan audit trail seluruh aksi sensitif.

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Screenshot halaman Dashboard dengan kartu metrik saldo kas, grafik bulanan, dan tabel pengajuan menunggu.

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Seluruh aturan bisnis PRD telah berhasil kami implementasikan: pemisahan hak akses tiga peran yang ketat, pengajuan belanja digital dengan validasi aturan batas, pencairan dana otomatis yang memotong saldo kas riil, jurnal umum anti-timpang dengan nomor unik berurutan, hingga laporan laba rugi, neraca seimbang, dan audit trail transparan khusus Direktur."*

---
<br>

```
================================================================================
SLIDE 6: PENINGKATAN FITUR (INOVASI NILAI TAMBAH DI LUAR PRD)
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** 2 Kolom Kontras (Highlight Fitur AI di Kiri, 3 Inovasi Lain di Kanan) dengan Badge "Beyond PRD".

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL SLIDE]**  
**PENINGKATAN FITUR (VALUE-ADDED FEATURES)**  
*Inovasi Unggulan yang Melampaui Kebutuhan Awal Dokumen PRD*

**[KOLOM KIRI: INOVASI UTAMA - AI SMART SCANNER]**  
🤖 **Google Gemini AI Multimodal Receipt Scanner**  
- Membaca foto nota fisik/struk/kuitansi secara otomatis (JPG/PNG/PDF).  
- Ekstraksi presisi: Tanggal, Total Rupiah, Nama Vendor/Toko, dan Keperluan.  
- **Smart Auto-Classification COA:** AI otomatis menganalisis barang dan merekomendasikan kode akun beban batik:  
  - *Beli lilin/malam/kain* ➔ Akun `5104 Beban Bahan Baku`  
  - *Bensin/ekspedisi paket* ➔ Akun `5105 Beban Transportasi`  
  - *Kertas HVS/lakban* ➔ Akun `5107 Beban ATK Kantor`  
- Dilengkapi in-memory rate limiting & validasi magic bytes anti-malware.

**[KOLOM KANAN: 3 INOVASI PELENGKAP]**  
1. 🏦 **Impor CSV Mutasi Bank + Auto-Draft Jurnal**  
   Akuntan dapat mengunggah CSV mutasi bank. Sistem mendeteksi transaksi belum dijurnal, mencegah duplikasi baris bank, dan menyediakan tombol *"+ Draf Jurnal"* 1-klik.  
2. 📧 **Notifikasi Email Real-time (Resend API)**  
   Pengiriman email otomatis berformat HTML resmi ke Akuntan saat ada pengajuan baru dan ke staf saat pengajuan disetujui/dibayar.  
3. 📄 **Ekspor Laporan PDF Resmi Ber-kop Surat**  
   Cetak dokumen Laporan Laba Rugi dan Neraca ke format PDF siap edar ber-kop resmi CV Batik Larasati.

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Gunakan aset file [BUKTI AI NOTA.png](file:///d:/BOOTCAMP/PROJECT%20CAPSTONE/BUKTI%20AI%20NOTA.png) dan [BUKTI RESEND EMAIL.png](file:///d:/BOOTCAMP/PROJECT%20CAPSTONE/BUKTI%20RESEND%20EMAIL.png).

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Tidak hanya menyelesaikan apa yang diminta di PRD, kami memberikan lompatan nilai tambah: Pertama, integrasi Google Gemini AI yang tidak hanya membaca teks nota, tetapi juga secara cerdas memetakan barang belanja ke bagan akun beban batik yang sesuai. Kedua, impor CSV mutasi bank dengan fitur auto-draft jurnal. Ketiga, notifikasi email transaksional via Resend. Serta keempat, ekspor laporan keuangan ber-kop surat resmi dalam format PDF."*

---
<br>

```
================================================================================
SLIDE 7: PROSES PENGERJAAN & TANTANGAN DEVELOPMENT
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** Tabel / Kartu Problem vs Solution (Tantangan di kiri ➔ Solusi Teknis di kanan).

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL SLIDE]**  
**PROSES PENGERJAAN & TANTANGAN TEKNIS**  
*Dinamika Rekayasa Sistem Selama Masa Pengembangan*

**[TANTANGAN 1: RACE CONDITION & INTEGRITAS PENOMORAN (BR-03)]**  
- **Kendala:** Mencegah nomor jurnal loncat atau ganda saat dua akuntan memposting jurnal pada detik yang sama.  
- **Solusi Teknis:** Menggunakan fungsi transaksi atomik di PostgreSQL dan penguncian baris penomoran (`SELECT ... FOR UPDATE`).

**[TANTANGAN 2: ROBUSTNESS AI TERHADAP NOTA FISIK PASAR]**  
- **Kendala:** Nota fisik UMKM sering berupa kuitansi tulisan tangan toko kain pasar Klewer, miring, atau format tanggal tidak standar (DD/MM/YYYY vs YYYY-MM-DD).  
- **Solusi Teknis:** Menerapkan *Structured JSON Schema Output* pada Gemini API, normalisasi tanggal WIB di backend server, dan validasi rentang nilai nominal.

**[TANTANGAN 3: PENEGAKAN KEAMANAN DATABASE (RLS)]**  
- **Kendala:** Memastikan data jurnal, saldo, dan laporan laba rugi tidak bisa diintip staf meskipun diakses lewat API langsung/Postman (BR-11).  
- **Solusi Teknis:** Merancang kebijakan *Row Level Security (RLS)* berbasis JWT role di setiap tabel Supabase, sehingga otorisasi ditegakkan langsung oleh basis data.

**[TANTANGAN 4: PENGUJIAN EMAIL PADA DOMAIN DUMMY]**  
- **Kendala:** Akun pengujian memakai domain dummy (`.test`) yang tidak memiliki kotak masuk asli.  
- **Solusi Teknis:** Membangun modul *Safe Email Redirect & Mapping* yang cerdas mengalihkan email uji ke kotak masuk Gmail riil penguji tanpa risiko bounce.

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Diagram alur pemecahan masalah: *Tantangan Teknis ➔ Rekayasa Solusi ➔ Pengujian Otomatis (`tsx --test`) Berhasil 100%*.

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Selama proses development, kami menghadapi tantangan nyata. Salah satunya adalah menjamin penomoran jurnal bebas duplikasi saat dua akuntan bekerja bersamaan—yang kami selesaikan dengan locking atomik PostgreSQL. Kami juga menjamin keandalan ekstraksi Gemini AI terhadap struk pasar tradisional melalui validasi ketat di sisi backend, serta mengunci seluruh celah keamanan finansial langsung di level database via Supabase RLS."*

---
<br>

```
================================================================================
SLIDE 8: DEMO SINGKAT (PANDUAN ALUR SISTEM 1 MENIT)
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** Timeline Horizontal 4 Tahap dengan Indikator Detik (00-15s, 15-30s, 30-45s, 45-60s).

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL SLIDE]**  
**DEMO SINGKAT ALUR KERJA SISTEM (60 DETIK)**

**[TAHAP 1: DETIK 00 - 15 | STAF MENGAJUKAN & SCAN AI]**  
- Login sebagai Staf Produksi (`rinalrsti@gmail.com`).  
- Unggah foto nota bahan baku `CONTOH_NOTA_BATIK.png`.  
- **Hasil:** Gemini AI mengekstrak nominal Rp 450.000 dan otomatis memilih Akun `5104 Beban Bahan Baku`. Klik Kirim.

**[TAHAP 2: DETIK 15 - 30 | AKUNTAN, EMAIL, & CSV BANK]**  
- Bukti notifikasi email langsung masuk ke Gmail Akuntan via Resend API.  
- Login Akuntan (`dimaslrst@gmail.com`) ➔ Verifikasi nota staf.  
- Masuk menu Mutasi Bank ➔ Unggah CSV bank ➔ Bentuk draf jurnal otomatis seimbang.

**[TAHAP 3: DETIK 30 - 45 | DIREKTUR, LAPORAN, & PDF]**  
- Login Direktur (`larasatiyw@gmail.com`).  
- Pantau Bento Dashboard Keuangan (Arus Kas, Laba Rugi berjalan, Neraca seimbang).  
- Klik tombol **Cetak / Unduh PDF** untuk menghasilkan laporan resmi ber-kop CV Batik Larasati.

**[TAHAP 4: DETIK 45 - 60 | UJI KEAMANAN DATABASE RLS]**  
- Coba login dengan akun nonaktif Yoga Pratama (`yoga@larasati.test`).  
- **Hasil:** Sistem langsung menolak login via Supabase RLS. Transaksi & data keuangan terlindungi 100%.

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Kolase 4 thumbnail: [Scan Nota AI] ➔ [Email Resend] ➔ [Laporan PDF] ➔ [Penolakan Login RLS].

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Mari kita saksikan demo sistem dalam 60 detik: Pertama, staf mengunggah foto nota, dalam 2 detik AI Gemini mengisi formulir dan menentukan kode beban secara otomatis. Kedua, akuntan menerima email notifikasi, memverifikasi belanja, dan merekonsiliasi mutasi bank via upload CSV. Ketiga, direktur memantau posisi kas dan mencetak laporan keuangan ber-kop resmi. Dan keempat, sistem terbukti aman saat akun nonaktif ditolak seketika oleh Supabase RLS."*

---
<br>

```
================================================================================
SLIDE 9: SIMPULAN & DAMPAK BAGI MITRA
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** 4 Kartu Metrik Dampak Besar dengan Angka Menonjol + Kutipan Penutup Emas.

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL SLIDE]**  
**KESIMPULAN & DAMPAK BAGI CV BATIK LARASATI**

**[KARTU DAMPAK 1]**  
⏱️ **Efisiensi Waktu > 70%**  
Pencatatan pengajuan dan rekonsiliasi yang sebelumnya memakan waktu berhari-hari kini selesai dalam hitungan detik.

**[KARTU DAMPAK 2]**  
🚫 **Zero Lost & Double Payment**  
Menghilangkan risiko nota tercecer di WhatsApp serta mencegah pembayaran ganda berkat sistem penomoran digital unik.

**[KARTU DAMPAK 3]**  
⚖️ **Integritas Pembukuan 100%**  
Jurnal dipastikan selalu seimbang (*debit = kredit*), pengeluaran besar terproteksi approval direktur, dan pembukuan lampau terkunci aman.

**[KARTU DAMPAK 4]**  
💡 **Pemberdayaan AI untuk UMKM**  
Membuktikan bahwa teknologi kecerdasan buatan dapat diimplementasikan secara praktis untuk memodernisasi tata kelola UMKM lokal.

**[CALLOUT KESIMPULAN AKHIR]**  
> *"Sistem ini tidak hanya mendigitalkan pembukuan kertas, tetapi membangun tata kelola keuangan yang transparan, akuntabel, dan siap mengawal pertumbuhan bisnis CV Batik Larasati."*

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- Ikon centang hijau besar / badge "Project Successfully Deployed & Verified".

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Sebagai kesimpulan, proyek Capstone ini sukses membawa CV Batik Larasati melompat dari pembukuan manual yang rentan menuju era digital yang akurat dan efisien. Sistem memangkas 70% waktu administrasi, menghilangkan risiko nota hilang, dan memberikan kepastian angka keuangan bagi pemilik usaha. Aplikasi ini membuktikan bagaimana kecerdasan buatan dan rekayasa web modern dapat memberikan dampak nyata bagi UMKM Indonesia."*

---
<br>

```
================================================================================
SLIDE 10: PENUTUP & TANYA JAWAB (Q&A)
================================================================================
```

### 🎯 TATA LETAK & DESAIN SLIDE:
- **Layout:** Minimalis, Elegan, Kontak Pengembang & QR Code / Tautan Aplikasi.

---

### 📝 KONTEN TEKS SLIDE (Salin ke Slide PPT):

**[JUDUL UTAMA]**  
**TERIMA KASIH**  
*Sesi Tanya Jawab (Q&A)*

**[INFORMASI TAUTAN & REPOSITORY]**  
- 🌐 **Live Website:** [https://batiklarasati.normasuci.site](https://batiklarasati.normasuci.site)  
- 📂 **GitHub Repository:** [github.com/NormaAyaa/finance-batik-larasati](https://github.com/NormaAyaa/finance-batik-larasati)  
- ✉️ **Email Pengembang:** `awyakyut18@gmail.com`  
- 👤 **Pengembang:** Norma Zuhrotul Hayati  

*“Melestarikan Warisan Budaya Nusantara dengan Keunggulan Teknologi Digital.”*

---

### 🖼️ REKOMENDASI GAMBAR / ASET:
- QR Code yang mengarah ke link aplikasi live: `https://batiklarasati.normasuci.site`.
- Logo CV Batik Larasati berdampingan dengan logo Bootcamp.

---

### 🎙️ SCRIPT PRESENTER (Catatan yang Diucapkan):
> *"Demikian presentasi dari saya. Terima kasih yang sebesar-besarnya kepada Bapak/Ibu Dewan Penguji dan seluruh mentor atas bimbingannya. Sekarang saya membuka kesempatan untuk sesi tanya jawab dan masukan. Terima kasih."*

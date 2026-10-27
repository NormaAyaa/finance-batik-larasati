# 🎙️ NASKAH LENGKAP KATA DEMI KATA (VOICEOVER SCRIPT)
## Video Demo Capstone Project: Sistem Informasi Keuangan CV Batik Larasati
**Pengembang:** Norma Zuhrotul Hayati  
**Durasi Total:** ~6 Menit  
**Petunjuk Pembacaan:** 
- Teks di dalam tanda kurung siku `[seperti ini]` adalah **instruksi gerakan layar/kursor** (jangan dibaca).
- Teks di dalam tanda petik `"seperti ini"` adalah **kata-kata yang dibaca secara langsung**.
- Tanda `(...)` menandakan **jeda santai selama 1 detik**.

---

### ⏱️ MENIT 00:00 - 00:45 | BAGIAN 1: PEMBUKAAN & LATAR BELAKANG
`[Tampilkan Landing Page https://batiklarasati.normasuci.site]`  
`[Arahkan kursor perlahan ke logo CV Batik Larasati dan judul website]`

> "Halo, perkenalkan saya **Norma Zuhrotul Hayati**. Pada kesempatan kali ini, saya akan mendemonstrasikan sistem yang telah saya kembangkan untuk Capstone Project, yaitu: **Sistem Informasi Pengelolaan Keuangan dan Akuntansi CV Batik Larasati**."
>
> *(jeda 1 detik)*
>
> "CV Batik Larasati adalah usaha manufaktur dan perdagangan batik lokal. Selama ini, operasional keuangan mereka masih menghadapi kendala klasik: nota fisik belanja bahan baku yang rawan hilang atau rusak, pencatatan transaksi yang lambat, dan proses rekonsiliasi akuntansi yang memakan waktu berhari-hari."
>
> "Sistem ini hadir untuk mengotomasi seluruh alur keuangan—mulai dari staf lapangan yang mengajukan biaya dengan bantuan AI, bagian akuntansi yang memverifikasi jurnal, hingga pimpinan yang memantau laba rugi secara real-time."

---

### ⏱️ MENIT 00:45 - 01:15 | BAGIAN 2: TECH STACK & ARSITEKTUR
`[Arahkan kursor ke tombol Masuk / Login, lalu klik Masuk]`  
`[Perlihatkan form login dan address bar bertanda gembok HTTPS]`

> "Sebelum masuk ke simulasi, sistem ini dirancang menggunakan fondasi teknologi modern:
>
> Pertama, antarmuka dan backend dibangun menggunakan **Next.js 15 App Router** dengan **TypeScript** dan Tailwind CSS, menghadirkan tampilan bertema Sogan yang modern dan responsif.
>
> Kedua, database didukung oleh **Supabase PostgreSQL** yang dipersenjatai kebijakan **Row Level Security (RLS)** untuk proteksi hak akses multi-peran yang ketat.
>
> Dan yang ketiga, sistem ini mengintegrasikan **Google Gemini AI** untuk pembacaan OCR nota otomatis, serta **Resend API** untuk notifikasi email secara instan."

---

### ⏱️ MENIT 01:15 - 02:45 | BAGIAN 3: ROLE 1 (STAF OPERASIONAL) & DEMO AI SCANNER
`[Ketikkan akun staf: rinalrsti@gmail.com | Sandi: Latihan#2026]`  
`[Klik Masuk]`  
`[Halaman Dashboard Staf terbuka]`

> "Sekarang, mari kita simulasikan alur kerja dari peran pertama: **Staf Operasional**. Di sini saya login sebagai Ibu Rina Anggraini, Kepala Bagian Produksi Batik."
>
> *(jeda 1 detik)*
>
> `[Klik menu Pengeluaran / Pengajuan di sidebar]`  
> `[Klik tombol 'Ajukan Pengeluaran']`
>
> "Ketika Ibu Rina selesai membeli bahan baku seperti malam, kain mori, atau pewarna batik di pasar, ia cukup membuka menu Pengeluaran lalu menekan tombol **Ajukan Pengeluaran**."
>
> `[Arahkan kursor ke kotak unggah bukti nota]`  
> `[Pilih dan upload file: CONTOH_NOTA_BATIK.png]`  
> `[Tunggu 2-3 detik saat AI bekerja mengekstrak data]`
>
> "Perhatikan bagian ini: Staf tidak perlu mengetik nominal atau tanggal secara manual. Kami menyediakan fitur unggulan **AI Scanner Nota Berbasis Google Gemini**. Cukup unggah foto nota pembelian seperti ini..."
>
> `[Sorot kolom-kolom formulir yang otomatis terisi]`
>
> "Dan dalam hitungan detik, AI langsung menganalisis gambar nota! 
> - Tanggal transaksi terdeteksi otomatis.
> - Total nominal terisi presisi sesuai kuitansi.
> - Kategori akun secara cerdas langsung dipetakan ke **Beban Bahan Baku**.
> - Dan catatan keterangan belanja terisi rapi."
>
> `[Klik tombol 'Kirim Pengajuan']`  
> `[Tunjukkan alert sukses dan status berubah jadi 'Menunggu Verifikasi']`
>
> "Semua data valid tanpa repot mengetik. Sekarang Ibu Rina tinggal menekan **Kirim Pengajuan**. Pengajuan berhasil disimpan ke database dan langsung berstatus *Menunggu Verifikasi Akuntan*."

---

### ⏱️ MENIT 02:45 - 03:15 | BAGIAN 4: BUKTI NOTIFIKASI EMAIL (RESEND API)
`[Buka tab baru: Kotak Masuk Gmail dimaslrst@gmail.com atau tunjukkan screenshot bukti email]`  
`[Buka pesan email terbaru dari Sistem Batik Larasati]`

> "Tepat saat pengajuan dikirim, sistem di latar belakang langsung memicu notifikasi email otomatis melalui integrasi **Resend API**."
>
> *(jeda 1 detik)*
>
> "Dapat kita lihat di kotak masuk email Kepala Akuntansi, ada notifikasi baru masuk yang memberitahukan bahwa ada pengajuan biaya belanja bahan baku dari Ibu Rina, lengkap dengan rincian dana yang diajukan. Dengan begitu, tim akuntansi bisa langsung merespons tanpa harus menunggu laporan fisik."

---

### ⏱️ MENIT 03:15 - 04:30 | BAGIAN 5: ROLE 2 (AKUNTAN) — VERIFIKASI & JURNAL UMUM
`[Beralih kembali ke aplikasi]`  
`[Logout dari Rina]`  
`[Login sebagai Akuntan: dimaslrst@gmail.com | Sandi: Latihan#2026]`  
`[Halaman Akuntan terbuka]`

> "Sekarang kita beralih ke peran kedua: **Akuntan**, login sebagai Mas Dimas Arya Nugroho."
>
> `[Klik menu Pengajuan / Verifikasi Biaya]`  
> `[Tunjukkan daftar pengajuan dari Rina]`  
> `[Klik tombol 'Verifikasi' / 'Setujui']`
>
> "Sebagai akuntan, Mas Dimas melihat daftar pengajuan yang masuk, memeriksa keabsahan nota, lalu menekan tombol **Verifikasi**. Begitu diverifikasi, sistem akan melakukan pencatatan akuntansi otomatis."
>
> `[Klik menu Jurnal Umum di sidebar]`  
> `[Arahkan kursor ke baris transaksi terbaru dan total seimbang]`
>
> "Mari kita buka menu **Jurnal Umum**. Transaksi yang baru saja disetujui langsung ter-posting otomatis ke jurnal!
> 
> Sistem menerapkan kaidah akuntansi *double-entry* secara ketat:
> - Beban Bahan Baku bertambah di sisi **Debit**.
> - Kas atau Bank berkurang di sisi **Kredit**.
> Keduanya seimbang sempurna (*balanced*) tanpa ada risiko selisih perhitungan."
>
> `[Klik menu Buku Besar]`  
> `[Pilih filter akun: Kas atau Beban Bahan Baku]`
>
> "Kita juga bisa melihat modul **Buku Besar** (General Ledger). Seluruh mutasi akun tersaring rapi lengkap dengan saldo berjalan yang selalu terbarui secara otomatis."

---

### ⏱️ MENIT 04:30 - 05:45 | BAGIAN 6: ROLE 3 (DIREKTUR) — EXECUTIVE DASHBOARD & LAPORAN
`[Logout dari Dimas]`  
`[Login sebagai Direktur: larasatiyw@gmail.com | Sandi: Latihan#2026]`  
`[Halaman Dashboard Direktur terbuka]`

> "Selanjutnya, kita masuk ke peran pimpinan: **Direktur dan Pemilik Usaha**, Ibu Laras Prameswari."
>
> `[Sorot widget KPI angka di bagian atas]`  
> `[Scroll perlahan ke grafik arus kas bulanan]`
>
> "Pada **Dashboard Eksekutif**, Ibu Laras langsung disambut oleh ringkasan kondisi kesehatan finansial usaha: total saldo kas aktif, perputaran omzet bulanan, beban yang telah dikeluarkan, hingga estimasi laba bersih. Tersedia pula grafik visualisasi tren arus kas masuk dan keluar yang sangat intuitif."
>
> `[Klik menu Laporan Keuangan di sidebar]`  
> `[Tampilkan tab Laba Rugi]`  
> `[Beralih ke tab Neraca Keuangan]`
>
> "Kini pimpinan tidak perlu lagi menunggu akhir bulan untuk membaca buku laporan tebal. Di menu **Laporan Keuangan**, Ibu Laras bisa memeriksa **Laporan Laba Rugi** dan **Neraca Keuangan** kapan saja secara real-time."
>
> `[Klik tombol 'Cetak PDF' atau 'Download PDF' pada laporan]`  
> `[Tunjukkan file preview PDF laporan ber-kop resmi CV Batik Larasati]`
>
> "Laporan keuangan ini juga dilengkapi fitur ekspor ke **PDF berformat resmi**. Sudah dilengkapi kop surat CV Batik Larasati, tanggal cetak, dan tanda tangan digital, siap digunakan untuk keperluan audit maupun pelaporan pajak usaha."

---

### ⏱️ MENIT 05:45 - 06:30 | BAGIAN 7: UJI KEAMANAN (RLS) & PENUTUP
`[Logout dari akun Direktur]`  
`[Kembali ke halaman Login]`  
`[Ketikkan akun nonaktif: yoga@larasati.test | Sandi: Latihan#2026]`  
`[Klik Masuk]`  
`[Tunjukkan pesan error / akses ditolak oleh sistem]`

> "Sebagai pembuktian aspek keamanan data, sistem ini diproteksi ketat menggunakan **Supabase Row Level Security**. 
>
> Misalnya di sini, saya mencoba login menggunakan akun mantan karyawan yang telah dinonaktifkan, yaitu Yoga Pratama. Ketika dicoba masuk... sistem secara tegas menolak login dan memblokir seluruh akses data."
>
> `[Kembali ke halaman Landing Page utama https://batiklarasati.normasuci.site]`  
> `[Arahkan kursor ke tengah layar]`
>
> "Dengan kombinasi teknologi Next.js 15, Supabase PostgreSQL, kecerdasan buatan Google Gemini, dan notifikasi email Resend, Sistem Informasi Keuangan CV Batik Larasati berhasil menyederhanakan birokrasi, menghemat waktu pencatatan hingga 70%, serta menghadirkan laporan keuangan yang akuntabel dan transparan.
>
> Sekian demonstrasi Capstone Project dari saya, **Norma Zuhrotul Hayati**. Terima kasih banyak atas perhatian Bapak dan Ibu Reviewer. 
> 
> Wassalamu'alaikum Warahmatullahi Wabarakatuh."

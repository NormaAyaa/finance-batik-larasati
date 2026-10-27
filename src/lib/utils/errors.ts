/**
 * Menerjemahkan pesan error dari Supabase / PostgreSQL ke bahasa Indonesia yang ramah pengguna.
 * Menghilangkan stack trace mentah, kode SQL, dan detail teknis internal.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return "Terjadi kesalahan yang tidak diketahui.";

  let rawMessage = "";

  if (typeof error === "string") {
    rawMessage = error;
  } else if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; details?: string; hint?: string };
    rawMessage = err.message || err.details || "";
  }

  const msg = rawMessage.trim();

  // 1. Pesan eksplisit dari RAISE EXCEPTION fungsi PostgreSQL (transisi_status_pengajuan / bayar_pengajuan)
  if (msg.includes("Jumlah pengajuan harus bernilai")) {
    return "Jumlah pengajuan harus bernilai antara Rp 10.000 sampai Rp 25.000.000 (BR-07).";
  }
  if (msg.includes("Keperluan pengajuan minimal 10 karakter")) {
    return "Keperluan pengajuan wajib diisi minimal 10 karakter (BR-07).";
  }
  if (msg.includes("Pengajuan wajib memakai akun beban yang aktif")) {
    return "Pengajuan wajib memilih akun beban yang aktif (BR-07).";
  }
  if (msg.includes("Tanggal transaksi tidak boleh di masa depan")) {
    return "Tanggal transaksi tidak boleh di masa depan (BR-07).";
  }
  if (msg.includes("Tanggal transaksi paling lama 30 hari")) {
    return "Tanggal transaksi maksimal 30 hari sebelum pengajuan dikirim (BR-07).";
  }
  if (msg.includes("Bukti nota wajib diunggah")) {
    return "Bukti nota/kuitansi wajib diunggah sebelum pengajuan dikirim (BR-07).";
  }
  if (msg.includes("Meminta revisi atau menolak wajib disertai catatan minimal 10 karakter")) {
    return "Catatan peninjau wajib diisi minimal 10 karakter saat meminta revisi atau menolak (BR-08).";
  }
  if (msg.includes("saldo akun") && msg.includes("tidak mencukupi")) {
    return msg;
  }
  if (msg.includes("periode akuntansi yang sudah ditutup")) {
    return "Pembayaran gagal: tanggal bayar berada di periode akuntansi yang sudah ditutup (BR-05).";
  }
  if (msg.includes("Periode akuntansi untuk tanggal bayar") && msg.includes("belum dibuat")) {
    return "Periode akuntansi untuk tanggal pembayaran yang dipilih belum dibuat oleh Akuntan.";
  }
  if (msg.includes("dilarang memverifikasi") || msg.includes("anti_self_verification")) {
    return "Anda tidak dapat memverifikasi pengajuan milik sendiri (BR-09).";
  }
  if (msg.includes("dilarang menyetujui") || msg.includes("anti_self_approval")) {
    return "Anda tidak dapat menyetujui pengajuan milik sendiri (BR-09).";
  }
  if (msg.includes("Hanya pemilik yang dapat mengirimkan")) {
    return "Hanya pemilik pengajuan yang berhak mengirimkan pengajuan ini.";
  }
  if (msg.includes("Hanya pengaju yang berhak membatalkan")) {
    return "Hanya pemilik pengajuan yang berhak membatalkan pengajuan ini.";
  }
  if (msg.includes("Hanya Akuntan yang dapat memverifikasi")) {
    return "Hanya Akuntan yang berwenang memverifikasi pengajuan berstatus Diajukan.";
  }
  if (msg.includes("Pengajuan di atas Rp1.000.000 wajib diteruskan ke Direktur")) {
    return "Pengajuan di atas Rp 1.000.000 wajib diteruskan ke Direktur untuk disetujui (BR-08).";
  }
  if (msg.includes("langsung disetujui oleh Akuntan")) {
    return "Pengajuan sampai dengan Rp 1.000.000 dapat langsung disetujui oleh Akuntan (BR-08).";
  }
  if (msg.includes("Hanya Direktur yang berhak")) {
    return "Hanya Direktur yang berhak memproses persetujuan pengajuan ini (BR-08).";
  }
  if (msg.includes("Hanya Akuntan yang berhak melakukan pembayaran")) {
    return "Hanya Akuntan yang berwenang melakukan pembayaran pengajuan (BR-10).";
  }
  if (msg.includes("Transisi status pengajuan dari") && msg.includes("tidak diizinkan")) {
    return "Perubahan status pengajuan tersebut tidak diizinkan oleh alur sistem (Tabel 6.1).";
  }
  if (msg.includes("Perubahan status pengajuan dilarang dilakukan secara langsung")) {
    return "Perubahan status pengajuan dilarang dilakukan secara langsung tanpa alur resmi.";
  }

  // 1.b Pesan eksplisit untuk Akun (BR-01)
  if (msg.includes("tidak boleh dihapus karena sudah dipakai dalam transaksi")) {
    return "Akun tidak dapat dihapus karena sudah digunakan dalam transaksi jurnal atau pengajuan (BR-01). Silakan nonaktifkan akun.";
  }
  if (msg.includes("tidak boleh diubah kode atau tipenya karena sudah dipakai")) {
    return "Kode dan tipe akun tidak dapat diubah karena akun sudah digunakan dalam transaksi (BR-01).";
  }
  if (msg.includes("Akun yang dinonaktifkan tidak dapat dipilih")) {
    return "Akun yang dinonaktifkan tidak dapat digunakan untuk transaksi baru (BR-01).";
  }

  // 1.c Pesan eksplisit untuk Periode (BR-05, BR-06)
  if (msg.includes("Hanya pengguna dengan peran Akuntan yang berhak menutup periode")) {
    return "Hanya Akuntan yang berwenang menutup periode akuntansi (BR-06).";
  }
  if (msg.includes("Periode akuntansi ini sudah ditutup sebelumnya")) {
    return "Periode akuntansi ini sudah ditutup sebelumnya.";
  }
  if (msg.includes("Periode sebelumnya harus sudah ditutup terlebih dahulu")) {
    return "Gagal menutup periode: periode sebelumnya harus sudah ditutup terlebih dahulu (BR-06).";
  }
  if (msg.includes("masih terdapat jurnal draf yang belum diposting")) {
    return "Tidak dapat menutup periode: masih terdapat draf jurnal yang belum diposting atau dihapus di periode ini (BR-06).";
  }
  if (msg.includes("Hanya Direktur yang berhak membuka kembali periode")) {
    return "Hanya Direktur yang berwenang membuka kembali periode (BR-06).";
  }
  if (msg.includes("Alasan pembukaan kembali periode wajib diisi minimal 20 karakter")) {
    return "Alasan pembukaan kembali periode wajib diisi minimal 20 karakter (BR-06).";
  }
  if (msg.includes("Periode akuntansi ini sudah dalam status terbuka")) {
    return "Periode akuntansi ini sudah dalam status terbuka.";
  }
  if (msg.includes("Hanya periode terakhir yang ditutup yang dapat dibuka kembali")) {
    return "Gagal membuka kembali periode: hanya periode terakhir yang ditutup yang dapat dibuka kembali (BR-06).";
  }

  // 1.d Pesan eksplisit untuk Jurnal Umum (BR-02, BR-03, BR-04, BR-05)
  if (msg.includes("Jurnal minimal harus memiliki 2 baris akun")) {
    return "Jurnal minimal harus memiliki 2 baris akun (BR-02).";
  }
  if (msg.includes("Jurnal tidak seimbang") || (msg.includes("Total Debit") && msg.includes("Total Kredit"))) {
    return "Jurnal tidak seimbang: Total Debit harus sama persis dengan Total Kredit (BR-02).";
  }
  if (msg.includes("Total nilai transaksi jurnal harus lebih dari 0")) {
    return "Total nilai transaksi jurnal harus lebih dari Rp 0 (BR-02).";
  }
  if (msg.includes("Semua akun yang digunakan dalam baris jurnal harus aktif")) {
    return "Semua akun yang digunakan dalam baris jurnal harus berstatus aktif (BR-01).";
  }
  if (msg.includes("Hanya jurnal berstatus draf yang dapat diposting")) {
    return "Hanya jurnal berstatus draf yang dapat diposting.";
  }
  if (msg.includes("Tidak dapat memposting: periode akuntansi") || (msg.includes("memposting") && msg.includes("berstatus ditutup"))) {
    return "Gagal memposting: periode akuntansi untuk tanggal jurnal ini sudah ditutup (BR-05).";
  }
  if (msg.includes("Hanya Akuntan yang berhak memposting jurnal umum")) {
    return "Hanya pengguna dengan peran Akuntan yang berhak memposting jurnal umum (BR-05).";
  }
  if (msg.includes("Hanya jurnal yang sudah diposting yang dapat dibalik")) {
    return "Hanya jurnal dengan status Diposting yang dapat dibuatkan jurnal pembalik (BR-04).";
  }
  if (msg.includes("Jurnal pembalik tidak dapat dibalik kembali")) {
    return "Jurnal pembalik tidak dapat dibalik kembali (BR-04).";
  }
  if (msg.includes("Jurnal pembayaran pengajuan tidak dapat dibalik")) {
    return "Jurnal pembayaran pengajuan otomatis tidak dapat dibalik (BR-04).";
  }
  if (msg.includes("Jurnal ini sudah pernah dibalik sebelumnya")) {
    return "Jurnal ini sudah pernah dibalik sebelumnya dan tidak dapat dibalik lagi (BR-04).";
  }
  if (msg.includes("Periode akuntansi untuk tanggal pembalik") && msg.includes("belum dibuat")) {
    return "Periode akuntansi untuk tanggal pembalik yang dipilih belum dibuat di sistem.";
  }
  if (msg.includes("Tanggal pembalik berada di periode akuntansi yang sudah ditutup")) {
    return "Gagal membuat jurnal pembalik: tanggal pembalik berada di periode akuntansi yang sudah ditutup (BR-05).";
  }
  if (msg.includes("Hanya Akuntan yang berhak membuat jurnal pembalik")) {
    return "Hanya pengguna dengan peran Akuntan yang berhak membuat jurnal pembalik (BR-04).";
  }
  if (msg.includes("Jurnal yang sudah diposting atau dibalik tidak dapat dihapus")) {
    return "Jurnal yang sudah diposting atau dibalik tidak dapat dihapus oleh siapa pun (BR-04).";
  }
  if (msg.includes("Jurnal yang sudah diposting tidak dapat diubah datanya")) {
    return "Jurnal yang sudah diposting tidak dapat diubah datanya oleh siapa pun (BR-04).";
  }
  if (msg.includes("Baris jurnal tidak dapat ditambah, diubah, atau dihapus")) {
    return "Baris jurnal tidak dapat diubah karena jurnal sudah diposting atau dibalik (BR-04).";
  }
  if (msg.includes("Periode akuntansi untuk tanggal jurnal") && msg.includes("belum dibuat")) {
    return "Periode akuntansi untuk tanggal transaksi yang dipilih belum dibuat di sistem (BR-05).";
  }
  if (msg.includes("Jurnal hanya bisa dibuat atau diubah pada periode yang berstatus terbuka")) {
    return "Jurnal hanya bisa dibuat atau disimpan pada periode akuntansi yang berstatus terbuka (BR-05).";
  }
  if (msg.includes("Akun yang dinonaktifkan tidak dapat dipilih pada baris jurnal")) {
    return "Akun yang dinonaktifkan tidak dapat dipilih pada baris jurnal baru (BR-01).";
  }

  // 1.e Pesan eksplisit untuk Pengguna & Audit Log (BR-12)
  if (msg.includes("Direktur dilarang mengubah peran atau status akunnya sendiri") || msg.includes("trg_direktur_self_mod")) {
    return "Direktur tidak boleh mengubah peran atau status akunnya sendiri (BR-12).";
  }
  if (msg.includes("audit_log adalah tabel immutable") || msg.includes("trg_audit_log_immutable")) {
    return "Catatan audit log bersifat permanen dan tidak dapat diubah atau dihapus.";
  }

  // 2. Constraint PostgreSQL
  // Jurnal & Jurnal Baris (BR-02, BR-03, BR-04)
  if (msg.includes("chk_jurnal_posting_rules")) {
    return "Nomor jurnal JU hanya diterbitkan saat posting resmi (BR-03).";
  }
  if (msg.includes("chk_jurnal_pembalik_sumber")) {
    return "Referensi jurnal pembalik hanya valid untuk transaksi bertipe pembalik (BR-04).";
  }
  if (msg.includes("chk_jurnal_pembayaran_tidak_dibalik")) {
    return "Jurnal pembayaran pengajuan dilarang memiliki pembalik (BR-04).";
  }
  if (msg.includes("chk_jurnal_keterangan")) {
    return "Keterangan jurnal wajib diisi minimal 5 karakter.";
  }
  if (msg.includes("chk_jurnal_baris_satu_sisi")) {
    return "Setiap baris jurnal hanya boleh diisi salah satu antara debit atau kredit dengan nilai lebih dari 0 (BR-02).";
  }
  if (msg.includes("chk_jurnal_baris_debit_nonnegatif") || msg.includes("chk_jurnal_baris_kredit_nonnegatif")) {
    return "Nilai debit dan kredit tidak boleh bernilai negatif (BR-02).";
  }
  if (msg.includes("uq_jurnal_baris_urutan")) {
    return "Terjadi duplikasi nomor urut baris jurnal.";
  }
  // Pengajuan
  if (msg.includes("chk_pengajuan_jumlah")) {
    return "Jumlah pengajuan harus bernilai antara Rp 10.000 sampai Rp 25.000.000 (BR-07).";
  }
  if (msg.includes("chk_pengajuan_keterangan")) {
    return "Keperluan pengajuan wajib diisi minimal 10 karakter (BR-07).";
  }
  if (msg.includes("chk_pengajuan_bukti_wajib")) {
    return "Bukti transaksi wajib diunggah sebelum pengajuan dikirim (BR-07).";
  }
  if (msg.includes("chk_pengajuan_catatan_peninjau")) {
    return "Catatan peninjau wajib diisi minimal 10 karakter saat meminta revisi atau menolak (BR-08).";
  }

  // Akun (BR-01)
  if (msg.includes("chk_akun_kode_format")) {
    return "Kode akun harus berupa 4 digit angka dengan digit pertama 1 sampai 5 (BR-01).";
  }
  if (msg.includes("chk_akun_kode_tipe_match")) {
    return "Digit pertama kode akun harus sesuai tipenya (1 Aset, 2 Kewajiban, 3 Ekuitas, 4 Pendapatan, 5 Beban) (BR-01).";
  }
  if (msg.includes("chk_akun_saldo_normal_tipe")) {
    return "Saldo normal tidak sesuai dengan klasifikasi tipe akun (BR-01).";
  }
  if (msg.includes("chk_akun_is_kas_bank")) {
    return "Hanya akun bertipe Aset yang dapat ditandai sebagai Kas atau Bank (BR-01).";
  }
  if (msg.includes("chk_akun_nama")) {
    return "Nama akun wajib diisi minimal 3 karakter.";
  }
  if (msg.includes("akun_kode_key") || (msg.includes("unique") && msg.includes("kode"))) {
    return "Kode akun sudah digunakan oleh akun lain. Silakan gunakan kode unik yang berbeda (BR-01).";
  }
  if (msg.includes("jurnal_nomor_key") || msg.includes("pengajuan_nomor_key") || (msg.includes("duplicate key") && msg.includes("nomor"))) {
    return "Terjadi duplikasi nomor dokumen otomatis pada sistem. Silakan coba kembali atau hubungi Akuntan.";
  }

  // Periode (BR-06)
  if (msg.includes("uq_periode_tahun_bulan")) {
    return "Periode untuk bulan dan tahun ini sudah pernah dibuat sebelumnya.";
  }
  if (msg.includes("chk_periode_alasan_buka_ulang")) {
    return "Alasan pembukaan kembali periode wajib diisi minimal 20 karakter (BR-06).";
  }
  if (msg.includes("chk_periode_status_tutup")) {
    return "Status penutupan periode tidak valid.";
  }

  // Mutasi Bank
  if (msg.includes("uq_mutasi_bank_transaksi") || msg.includes("duplikat") || (msg.includes("unique") && msg.includes("mutasi_bank"))) {
    return "Baris transaksi mutasi bank ini sudah pernah diimpor sebelumnya (duplikat transaksi dilewati/ditolak).";
  }
  if (msg.includes("chk_mutasi_bank_jumlah_not_zero")) {
    return "Jumlah mutasi bank tidak boleh bernilai 0.";
  }
  if (msg.includes("chk_mutasi_bank_deskripsi_not_empty")) {
    return "Deskripsi mutasi bank wajib diisi.";
  }
  if (msg.includes("is_kas_bank = true") || msg.includes("harus merupakan akun kas atau bank")) {
    return "Akun yang dipilih harus merupakan akun kas atau bank yang aktif.";
  }
  if (msg.includes("sudah dikaitkan dengan jurnal ID") || msg.includes("sudah memiliki jurnal terkait")) {
    return "Baris mutasi bank ini sudah memiliki draf atau jurnal terkait dan tidak dapat dikaitkan ulang.";
  }
  if (msg.includes("Akun lawan tidak boleh sama dengan akun bank")) {
    return "Akun lawan tidak boleh sama dengan akun kas atau bank transaksi.";
  }
  if (msg.includes("Hanya Akuntan yang berwenang membuat draf jurnal")) {
    return "Hanya pengguna dengan peran Akuntan yang berwenang membuat draf jurnal dari mutasi bank.";
  }
  if (msg.includes("Hanya Akuntan yang berwenang mengimpor mutasi bank")) {
    return "Hanya pengguna dengan peran Akuntan yang berwenang mengimpor mutasi bank.";
  }
  if (msg.includes("Periode akuntansi untuk tanggal mutasi") || (msg.includes("belum dibuat di sistem") && msg.includes("BR-05"))) {
    return "Periode akuntansi untuk tanggal transaksi mutasi ini belum dibuat di sistem (BR-05).";
  }
  if (msg.includes("Jurnal hanya bisa dibuat pada periode yang berstatus terbuka") || (msg.includes("sudah ditutup") && msg.includes("BR-05"))) {
    return "Periode akuntansi pada tanggal transaksi mutasi ini sudah ditutup (BR-05). Draf jurnal tidak dapat dibuat.";
  }
  if (msg.includes("bersifat permanen dan tidak dapat diubah")) {
    return "Data mutasi bank yang sudah diimpor bersifat permanen dan tidak dapat diubah kecuali status jurnal.";
  }
  if (msg.includes("bersifat permanen dan tidak dapat dihapus")) {
    return "Riwayat mutasi bank bersifat permanen dan tidak dapat dihapus.";
  }

  // 3. RLS Policy Violation
  if (msg.includes("row-level security policy") || msg.includes("violates row-level security")) {
    return "Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini sesuai hak akses peran Anda.";
  }

  // 4. Storage errors
  if (msg.includes("Payload too large") || msg.includes("413")) {
    return "Ukuran file terlalu besar. Maksimal ukuran bukti adalah 5 MB.";
  }
  if (msg.includes("mime type not supported") || msg.includes("invalid mime type")) {
    return "Format file tidak didukung. Harap unggah file foto JPG, PNG, atau dokumen PDF.";
  }

  // 5. Pesan bersih jika sudah berbahasa Indonesia
  if (msg && !msg.toLowerCase().includes("sql") && !msg.includes("column") && !msg.includes("postgres")) {
    return msg;
  }

  return "Terjadi kendala saat memproses permintaan. Silakan periksa kembali data atau hubungi admin.";
}

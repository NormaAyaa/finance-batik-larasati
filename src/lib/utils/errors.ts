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

  // 2. Constraint PostgreSQL
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

  // 3. RLS Policy Violation
  if (msg.includes("row-level security policy") || msg.includes("violates row-level security")) {
    return "Akses ditolak: Anda tidak memiliki izin untuk melakukan tindakan ini pada data pengajuan.";
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

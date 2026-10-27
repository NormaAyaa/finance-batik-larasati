import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import { StatusBadge } from "@/components/pengajuan/status-badge";
import { BuktiViewer } from "@/components/pengajuan/bukti-viewer";
import { StatusTimeline } from "@/components/pengajuan/status-timeline";
import { ActionButtons } from "@/components/pengajuan/action-buttons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Pengajuan",
  description: "Rincian pengajuan biaya atau reimburse CV Batik Larasati",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPengajuanPage({ params }: PageProps) {
  // Guard autentikasi: Staf, Akuntan, dan Direktur
  const { user, profile } = await requireAuth(["staf", "akuntan", "direktur"]);
  const { id } = await params;
  const numId = Number(id);

  if (!numId || isNaN(numId)) {
    notFound();
  }

  // Client Supabase pengguna yang login (RLS otomatis membatasi jika staf membuka pengajuan orang lain)
  const supabase = await createClient();

  const { data: pengajuan, error } = await supabase
    .from("pengajuan")
    .select(`
      id,
      nomor,
      pengaju_id,
      jenis,
      tanggal_transaksi,
      akun_beban_id,
      jumlah,
      keterangan,
      bukti_path,
      status,
      catatan_peninjau,
      diverifikasi_oleh,
      diverifikasi_pada,
      disetujui_oleh,
      disetujui_pada,
      akun_kas_id,
      dibayar_oleh,
      dibayar_pada,
      dibuat_pada,
      diajukan_pada,
      pengaju:profiles!pengaju_id (
        id,
        nama_lengkap,
        email,
        peran,
        jabatan
      ),
      pemverifikasi:profiles!diverifikasi_oleh (
        id,
        nama_lengkap,
        email,
        peran
      ),
      penyetuju:profiles!disetujui_oleh (
        id,
        nama_lengkap,
        email,
        peran
      ),
      pembayar:profiles!dibayar_oleh (
        id,
        nama_lengkap,
        email,
        peran
      ),
      akun_beban:akun!akun_beban_id (
        id,
        kode,
        nama
      ),
      akun_kas:akun!akun_kas_id (
        id,
        kode,
        nama
      )
    `)
    .eq("id", numId)
    .maybeSingle();

  if (error || !pengajuan) {
    notFound();
  }

  // 3. Ambil signed URL sementara untuk bukti nota dari bucket privat bukti_pengajuan (berlaku 1 jam)
  let signedUrl: string | null = null;
  if (pengajuan.bukti_path) {
    const { data: signedData } = await supabase.storage
      .from("bukti_pengajuan")
      .createSignedUrl(pengajuan.bukti_path, 3600);
    signedUrl = signedData?.signedUrl || null;
  }

  // 4. Jika pengguna adalah Akuntan dan status disetujui, ambil akun kas/bank aktif dan hitung saldonya
  const kasAccounts: {
    id: number;
    kode: string;
    nama: string;
    saldo: number;
  }[] = [];

  if (profile.peran === "akuntan" && pengajuan.status === "disetujui") {
    const { data: rawKas } = await supabase
      .from("akun")
      .select("id, kode, nama")
      .eq("is_kas_bank", true)
      .eq("aktif", true)
      .order("kode", { ascending: true });

    if (rawKas && rawKas.length > 0) {
      // Hitung saldo kas/bank dari jurnal berstatus 'diposting' dan 'dibalik' (sesuai fungsi bayar_pengajuan)
      const kasIds = rawKas.map((k) => k.id);
      const { data: lines } = await supabase
        .from("jurnal_baris")
        .select(`
          akun_id,
          debit,
          kredit,
          jurnal!inner (
            status
          )
        `)
        .in("akun_id", kasIds)
        .in("jurnal.status", ["diposting", "dibalik"]);

      // Agregasi saldo per akun
      const balanceMap: Record<number, number> = {};
      rawKas.forEach((k) => {
        balanceMap[k.id] = 0;
      });

      if (lines) {
        lines.forEach((l) => {
          balanceMap[l.akun_id] =
            (balanceMap[l.akun_id] || 0) + (l.debit || 0) - (l.kredit || 0);
        });
      }

      rawKas.forEach((k) => {
        kasAccounts.push({
          id: k.id,
          kode: k.kode,
          nama: k.nama,
          saldo: balanceMap[k.id] || 0,
        });
      });
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Navigasi Kembali */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm sm:text-base text-[#a89f91]">
          <li>
            <Link
              href="/pengajuan"
              className="hover:text-amber-300 transition font-semibold flex items-center gap-1.5"
            >
              <span aria-hidden="true">←</span> Kembali ke Daftar Pengajuan
            </Link>
          </li>
        </ol>
      </nav>

      {/* Header Halaman & Status (Sogan Obsidian Card) */}
      <div className="sogan-card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-amber-900/30">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdfaf6] tracking-tight font-mono">
              {pengajuan.nomor || `Draf #${pengajuan.id}`}
            </h1>
            <StatusBadge status={pengajuan.status} />
          </div>
          <p className="text-sm sm:text-base text-[#a89f91]">
            Dibuat oleh{" "}
            <strong className="text-amber-300 font-bold">
              {pengajuan.pengaju?.nama_lengkap || "Pengaju"}
            </strong>{" "}
            {pengajuan.pengaju?.peran ? `(${pengajuan.pengaju.peran}) • ` : "• "}
            <span className="capitalize text-amber-400 font-semibold">{pengajuan.jenis}</span>
          </p>
        </div>

        {/* Nilai Pengajuan */}
        <div className="sm:text-right">
          <span className="text-xs sm:text-sm font-bold text-[#a89f91] block uppercase tracking-wider">
            Total Pengajuan
          </span>
          <span className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tabular-nums">
            {formatRupiah(pengajuan.jumlah)}
          </span>
        </div>
      </div>

      {/* Tombol Aksi Sesuai Peran dan Status (Tabel 6.1) */}
      <ActionButtons
        pengajuanId={pengajuan.id}
        currentStatus={pengajuan.status}
        jumlah={pengajuan.jumlah}
        pengajuId={pengajuan.pengaju_id}
        userId={user.id}
        userRole={profile.peran}
        kasAccounts={kasAccounts}
      />

      {/* Rincian Informasi Pengajuan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kolom Kiri: Informasi Transaksi */}
        <div className="sogan-card p-6 sm:p-7 space-y-5">
          <h2 className="text-base sm:text-lg font-bold text-[#fdfaf6] border-b border-amber-900/20 pb-3 flex items-center gap-2">
            <span aria-hidden="true">📋</span> Rincian Pengajuan
          </h2>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm sm:text-base">
            <div>
              <dt className="text-[#a89f91] font-semibold text-xs sm:text-sm">Jenis Pengajuan</dt>
              <dd className="font-bold text-[#fdfaf6] capitalize mt-1 text-base sm:text-lg">
                {pengajuan.jenis}
              </dd>
            </div>

            <div>
              <dt className="text-[#a89f91] font-semibold text-xs sm:text-sm">Tanggal Transaksi</dt>
              <dd className="font-bold text-[#fdfaf6] font-mono mt-1 text-base sm:text-lg">
                {formatDate(pengajuan.tanggal_transaksi)}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-[#a89f91] font-semibold text-xs sm:text-sm">Akun Beban</dt>
              <dd className="font-bold text-[#fdfaf6] mt-1">
                {pengajuan.akun_beban ? (
                  <span className="inline-block text-amber-300 bg-amber-950/60 border border-amber-900/40 px-3 py-1 rounded-lg text-sm sm:text-base">
                    {pengajuan.akun_beban.kode} — {pengajuan.akun_beban.nama}
                  </span>
                ) : (
                  "-"
                )}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-[#a89f91] font-semibold text-xs sm:text-sm">Keperluan Transaksi</dt>
              <dd className="mt-1.5 text-[#fdfaf6] text-sm sm:text-base leading-relaxed bg-[#141210] p-4 rounded-xl border border-amber-900/30 whitespace-pre-wrap">
                {pengajuan.keterangan}
              </dd>
            </div>
          </dl>

          {/* Rincian Akun Kas Pembayar jika sudah dibayar */}
          {pengajuan.status === "dibayar" && pengajuan.akun_kas && (
            <div className="mt-4 pt-4 border-t border-amber-900/20 text-sm sm:text-base">
              <span className="text-[#a89f91] font-semibold text-xs sm:text-sm block">
                Dibayar Menggunakan Akun Kas / Bank:
              </span>
              <span className="font-bold text-teal-300 block mt-1 text-base">
                {pengajuan.akun_kas.kode} — {pengajuan.akun_kas.nama}
              </span>
              {pengajuan.dibayar_pada && (
                <span className="text-xs sm:text-sm text-[#a89f91] font-mono block mt-1">
                  Pada tanggal: {formatDate(pengajuan.dibayar_pada)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Bukti Transaksi */}
        <div className="sogan-card p-6 sm:p-7 space-y-5">
          <h2 className="text-base sm:text-lg font-bold text-[#fdfaf6] border-b border-amber-900/20 pb-3 flex items-center gap-2">
            <span aria-hidden="true">🧾</span> Bukti Transaksi (Nota / Faktur)
          </h2>

          <BuktiViewer
            signedUrl={signedUrl}
            buktiPath={pengajuan.bukti_path}
          />
        </div>
      </div>

      {/* Riwayat Perkembangan Pengajuan (Timeline) */}
      <div className="sogan-card p-6">
        <StatusTimeline
          status={pengajuan.status}
          dibuatPada={pengajuan.dibuat_pada}
          diajukanPada={pengajuan.diajukan_pada}
          diverifikasiPada={pengajuan.diverifikasi_pada}
          disetujuiPada={pengajuan.disetujui_pada}
          dibayarPada={pengajuan.dibayar_pada}
          catatanPeninjau={pengajuan.catatan_peninjau}
          pengaju={pengajuan.pengaju}
          pemverifikasi={pengajuan.pemverifikasi}
          penyetuju={pengajuan.penyetuju}
          pembayar={pengajuan.pembayar}
          akunKas={pengajuan.akun_kas}
        />
      </div>
    </div>
  );
}

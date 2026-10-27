"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PeranPengguna, StatusJurnal, SumberJurnal, StatusPeriode, TipeAkun } from "@/types/database";
import { formatRupiah, formatDate, formatDateTime, formatBulanTahun } from "@/lib/utils/formatters";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { JurnalStatusBadge, JurnalSumberBadge } from "./jurnal-status-badge";
import { PembalikModal } from "./pembalik-modal";
import { JurnalForm } from "./jurnal-form";
import type { AkunOption, PeriodeData } from "./jurnal-form";

export interface JurnalBarisItem {
  id: number;
  urutan: number;
  akun_id: number;
  akun: {
    id: number;
    kode: string;
    nama: string;
    tipe: TipeAkun;
  };
  debit: number;
  kredit: number;
  keterangan: string | null;
}

export interface JurnalDetailData {
  id: number;
  nomor: string | null;
  tanggal: string;
  keterangan: string;
  sumber: SumberJurnal;
  status: StatusJurnal;
  periode_id: number;
  pengajuan_id: number | null;
  pengajuan?: { id: number; nomor: string | null } | null;
  jurnal_dibalik_id: number | null;
  jurnal_dibalik?: { id: number; nomor: string | null; tanggal: string } | null;
  jurnal_pembalik?: { id: number; nomor: string | null; tanggal: string } | null;
  dibuat_oleh: string;
  pembuat?: { id: string; nama_lengkap: string; email: string; peran: string } | null;
  diposting_oleh: string | null;
  pemosting?: { id: string; nama_lengkap: string; email: string; peran: string } | null;
  diposting_pada: string | null;
  periode?: { id: number; tahun: number; bulan: number; status: StatusPeriode } | null;
  baris: JurnalBarisItem[];
}

interface JurnalDetailProps {
  jurnal: JurnalDetailData;
  daftarAkun: AkunOption[];
  daftarPeriode: PeriodeData[];
  peran: PeranPengguna;
  userId: string;
}

export function JurnalDetail({
  jurnal,
  daftarAkun,
  daftarPeriode,
  peran,
  userId,
}: JurnalDetailProps) {
  const router = useRouter();
  const isAkuntan = peran === "akuntan";

  // Mode pengeditan draf in-place
  const [isEditing, setIsEditing] = useState(false);

  // State Modal Pembalik
  const [isPembalikModalOpen, setIsPembalikModalOpen] = useState(false);

  // State Modal Konfirmasi Hapus Draf
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // State Posting langsung dari Detail
  const [isPosting, setIsPosting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [postingSuccessNomor, setPostingSuccessNomor] = useState<string | null>(null);

  // Hitung total debit dan kredit
  const totalDebit = jurnal.baris.reduce((acc, b) => acc + (b.debit || 0), 0);
  const totalKredit = jurnal.baris.reduce((acc, b) => acc + (b.kredit || 0), 0);
  const isBalanced = totalDebit > 0 && totalDebit === totalKredit;

  // Syarat apakah jurnal boleh dibalik (BR-04):
  // Tombol Pembalik disembunyikan bila:
  // - Pengguna bukan Akuntan
  // - pengajuan_id terisi
  // - sumber adalah 'pengajuan' atau 'pembalik'
  // - status adalah 'dibalik' atau 'draf' (hanya 'diposting' yang boleh dibalik)
  // - sudah pernah dibalik sebelumnya (jurnal_pembalik ada)
  const canReverse =
    isAkuntan &&
    jurnal.status === "diposting" &&
    jurnal.sumber !== "pembalik" &&
    jurnal.sumber !== "pengajuan" &&
    jurnal.sumber !== "pembayaran_pengajuan" &&
    !jurnal.pengajuan_id &&
    !jurnal.jurnal_pembalik;

  // Handler Hapus Draf
  const handleHapusDraf = async () => {
    setActionError(null);
    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("jurnal")
        .delete()
        .eq("id", jurnal.id)
        .eq("status", "draf");

      if (error) throw error;

      router.push("/jurnal");
      router.refresh();
    } catch (err: unknown) {
      console.error("Gagal menghapus draf jurnal:", err);
      setActionError(getFriendlyErrorMessage(err));
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Handler Posting Jurnal dari Detail View
  const handlePosting = async () => {
    setActionError(null);
    setIsPosting(true);
    const supabase = createClient();

    try {
      const { data: updated, error } = await supabase.rpc("posting_jurnal", {
        p_jurnal_id: jurnal.id,
      });

      if (error) throw error;

      setPostingSuccessNomor(updated?.nomor || "Nomor JU");
      setIsPosting(false);
      router.refresh();
    } catch (err: unknown) {
      console.error("Gagal memposting jurnal:", err);
      setActionError(getFriendlyErrorMessage(err));
      setIsPosting(false);
    }
  };

  // Jika sedang mode edit draf (hanya untuk status draf dan Akuntan)
  if (isEditing && isAkuntan && jurnal.status === "draf") {
    return (
      <div className="space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-amber-400 hover:text-amber-300 font-bold text-sm sm:text-base flex items-center gap-2 transition"
            >
              <span>←</span>
              <span>Batal Ubah & Kembali ke Detail</span>
            </button>
          </div>
          <span className="text-xs sm:text-sm font-mono font-bold bg-amber-950/60 text-amber-300 px-3.5 py-1.5 rounded-full border border-amber-500/40 shadow-sm">
            Mode Ubah Draf
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdfaf6] tracking-tight">
              Ubah Draf Jurnal #{jurnal.id}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#a89f91]">
            Perbarui data baris debit-kredit sebelum diposting resmi ke buku besar (BR-02)
          </p>
        </div>

        <JurnalForm
          mode="ubah"
          initialData={{
            id: jurnal.id,
            tanggal: jurnal.tanggal,
            keterangan: jurnal.keterangan,
            periode_id: jurnal.periode_id,
            baris: jurnal.baris.map((b) => ({
              urutan: b.urutan,
              akun_id: b.akun_id,
              debit: b.debit,
              kredit: b.kredit,
              keterangan: b.keterangan,
            })),
          }}
          daftarAkun={daftarAkun}
          daftarPeriode={daftarPeriode}
          userId={userId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Navigasi breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/jurnal"
          className="text-amber-400 hover:text-amber-300 font-bold text-sm sm:text-base flex items-center gap-2 transition"
        >
          <span>←</span>
          <span>Kembali ke Daftar Jurnal</span>
        </Link>
        <span className="font-mono text-xs sm:text-sm text-[#8a7e72] bg-[#141210] border border-amber-900/20 px-3 py-1.5 rounded-lg">
          ID Internal: #{jurnal.id}
        </span>
      </div>

      {/* Alert Error Tindakan */}
      {actionError && (
        <div
          role="alert"
          className="sogan-card rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 sm:p-5 text-sm sm:text-base text-rose-200 flex items-start gap-3 shadow-lg"
        >
          <span className="font-bold text-rose-400 text-lg">✕</span>
          <div className="flex-1 space-y-1">
            <strong className="block font-semibold">Tindakan ditolak oleh sistem:</strong>
            <span className="text-xs sm:text-sm text-rose-300/90">{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-200 font-bold p-1 transition"
            aria-label="Tutup pesan galat"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alert Berhasil Posting */}
      {postingSuccessNomor && (
        <div className="sogan-card rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 sm:p-5 text-sm sm:text-base text-emerald-200 flex items-start gap-3 shadow-lg">
          <span className="font-bold text-emerald-400 text-lg">✓</span>
          <div className="flex-1 space-y-1">
            <strong className="block font-semibold">Jurnal Berhasil Diposting!</strong>
            <span className="text-xs sm:text-sm text-emerald-300/90">
              Nomor dokumen resmi: <strong className="font-mono text-amber-300 font-bold">{postingSuccessNomor}</strong>. Transaksi telah dibukukan ke buku besar.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPostingSuccessNomor(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold p-1 transition"
            aria-label="Tutup pesan sukses"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner Tautan Jurnal Terkait */}
      {/* 1. Jika jurnal ini merupakan jurnal pembalik */}
      {jurnal.sumber === "pembalik" && jurnal.jurnal_dibalik && (
        <div className="sogan-card rounded-2xl border border-purple-500/30 bg-purple-950/30 p-5 text-sm text-purple-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔄</span>
            <div>
              <p className="font-bold text-purple-200">Ini adalah Jurnal Pembalik (Koreksi)</p>
              <p className="text-purple-300/80 text-xs sm:text-sm">
                Membalik transaksi pada jurnal asal bertanggal {formatDate(jurnal.jurnal_dibalik.tanggal)}
              </p>
            </div>
          </div>
          <Link
            href={`/jurnal/${jurnal.jurnal_dibalik.id}`}
            className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-300 hover:text-amber-200 underline whitespace-nowrap text-sm"
          >
            Buka Jurnal Asal ({jurnal.jurnal_dibalik.nomor || `#${jurnal.jurnal_dibalik.id}`}) →
          </Link>
        </div>
      )}

      {/* 2. Jika jurnal ini telah dibalik oleh jurnal lain */}
      {jurnal.jurnal_pembalik && (
        <div className="sogan-card rounded-2xl border border-amber-500/30 bg-amber-950/30 p-5 text-sm text-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">↩</span>
            <div>
              <p className="font-bold text-amber-200">Jurnal Ini Telah Dibalik</p>
              <p className="text-[#a89f91] text-xs sm:text-sm">
                Telah dibuatkan jurnal pembalik untuk mengoreksi transaksi ini (BR-04)
              </p>
            </div>
          </div>
          <Link
            href={`/jurnal/${jurnal.jurnal_pembalik.id}`}
            className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-400 hover:text-amber-300 underline whitespace-nowrap text-sm"
          >
            Lihat Pembalik ({jurnal.jurnal_pembalik.nomor || `#${jurnal.jurnal_pembalik.id}`}) →
          </Link>
        </div>
      )}

      {/* 3. Jika jurnal berasal dari pembayaran pengajuan biaya */}
      {jurnal.pengajuan_id && (
        <div className="sogan-card rounded-2xl border border-blue-500/30 bg-blue-950/30 p-5 text-sm text-blue-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <p className="font-bold text-blue-200">Jurnal Otomatis Pembayaran Pengajuan</p>
              <p className="text-blue-300/80 text-xs sm:text-sm">
                Dibuat otomatis oleh sistem saat pengajuan biaya dibayarkan oleh Akuntan (BR-10)
              </p>
            </div>
          </div>
          <Link
            href={`/pengajuan/${jurnal.pengajuan_id}`}
            className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-300 hover:text-amber-200 underline whitespace-nowrap text-sm"
          >
            Buka Pengajuan ({jurnal.pengajuan?.nomor || `#${jurnal.pengajuan_id}`}) →
          </Link>
        </div>
      )}

      {/* Card Header Jurnal */}
      <div className="sogan-card rounded-2xl border border-amber-500/20 bg-[#0e0c0a] p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-900/20 pb-5">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              Nomor Dokumen
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-[#fdfaf6]">
              {jurnal.status === "draf" || !jurnal.nomor ? (
                <span className="italic font-sans text-amber-400">Draf Jurnal</span>
              ) : (
                jurnal.nomor
              )}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <JurnalSumberBadge sumber={jurnal.sumber} className="text-xs sm:text-sm px-3.5 py-1.5" />
            <JurnalStatusBadge status={jurnal.status} className="text-xs sm:text-sm px-3.5 py-1.5" />
          </div>
        </div>

        {/* Informasi Kunci */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#141210] border border-amber-900/20 rounded-xl p-4">
            <span className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider block mb-1">Tanggal Transaksi</span>
            <span className="font-bold text-sm sm:text-base text-[#fdfaf6]">{formatDate(jurnal.tanggal)}</span>
          </div>

          <div className="bg-[#141210] border border-amber-900/20 rounded-xl p-4">
            <span className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider block mb-1">Periode Akuntansi</span>
            <span className="font-bold text-sm sm:text-base text-[#fdfaf6]">
              {jurnal.periode
                ? formatBulanTahun(jurnal.periode.tahun, jurnal.periode.bulan)
                : "-"}
            </span>
            {jurnal.periode && (
              <span className="text-xs text-[#a89f91] mt-0.5 block">
                ({jurnal.periode.status === "terbuka" ? "Status: Terbuka" : "Status: Ditutup"})
              </span>
            )}
          </div>

          <div className="bg-[#141210] border border-amber-900/20 rounded-xl p-4">
            <span className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider block mb-1">Dibuat Oleh</span>
            <span className="font-bold text-sm sm:text-base text-[#fdfaf6]">
              {jurnal.pembuat?.nama_lengkap || "Pengguna"}
            </span>
            <span className="text-xs text-[#a89f91] mt-0.5 block">{jurnal.pembuat?.email || ""}</span>
          </div>

          <div className="bg-[#141210] border border-amber-900/20 rounded-xl p-4">
            <span className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider block mb-1">Pelaku & Waktu Posting</span>
            {jurnal.status !== "draf" && jurnal.pemosting ? (
              <>
                <span className="font-bold text-sm sm:text-base text-[#fdfaf6]">{jurnal.pemosting.nama_lengkap}</span>
                <span className="text-xs text-[#a89f91] mt-0.5 block">
                  {jurnal.diposting_pada ? formatDateTime(jurnal.diposting_pada) : "-"}
                </span>
              </>
            ) : (
              <span className="text-[#8a7e72] italic text-sm">Belum diposting</span>
            )}
          </div>
        </div>

        {/* Keterangan */}
        <div className="pt-2 border-t border-amber-900/20 space-y-2">
          <span className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider block">Keterangan Transaksi</span>
          <p className="text-sm sm:text-base text-[#d6cfc7] bg-[#141210] rounded-xl p-4 border border-amber-900/20 leading-relaxed">
            {jurnal.keterangan}
          </p>
        </div>
      </div>

      {/* Rincian Baris Jurnal Debit - Kredit */}
      <div className="sogan-card rounded-2xl border border-amber-500/20 bg-[#0e0c0a] shadow-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-amber-900/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <h2 className="text-lg sm:text-xl font-bold text-[#fdfaf6]">Rincian Baris Akun (BR-02)</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#a89f91]">
              Klasifikasi transaksi debit dan kredit yang memengaruhi buku besar
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs sm:text-sm font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3.5 py-1.5 rounded-full">
            {jurnal.baris.length} Baris Akun
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base">
            <thead className="bg-[#141210] border-b border-amber-900/30 text-[#d6cfc7] font-bold uppercase tracking-wider text-xs sm:text-sm">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-center w-14">#</th>
                <th scope="col" className="px-5 py-3.5">Akun</th>
                <th scope="col" className="px-5 py-3.5">Keterangan Baris</th>
                <th scope="col" className="px-5 py-3.5 text-right w-44">Debit</th>
                <th scope="col" className="px-5 py-3.5 text-right w-44">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {jurnal.baris.map((b) => (
                <tr key={b.id} className="hover:bg-[#161311] transition-colors">
                  <td className="px-5 py-4 text-center font-mono text-[#8a7e72] font-semibold text-sm">
                    {b.urutan}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold font-mono text-sm sm:text-base text-[#fdfaf6]">
                      [{b.akun?.kode || "-"}] {b.akun?.nama || "Akun"}
                    </div>
                    <span className="text-xs text-amber-400 uppercase tracking-wider mt-0.5 block">
                      Tipe: {b.akun?.tipe || "-"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#a89f91] text-sm">
                    {b.keterangan || <span className="text-[#685f54] italic">-</span>}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm sm:text-base font-bold tabular-nums">
                    {b.debit > 0 ? (
                      <span className="text-emerald-300">{formatRupiah(b.debit)}</span>
                    ) : (
                      <span className="text-[#5a524a]">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm sm:text-base font-bold tabular-nums">
                    {b.kredit > 0 ? (
                      <span className="text-amber-300">{formatRupiah(b.kredit)}</span>
                    ) : (
                      <span className="text-[#5a524a]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#141210] border-t-2 border-amber-500/30 font-bold text-sm sm:text-base">
              <tr>
                <td colSpan={3} className="px-5 py-4 text-right text-[#d6cfc7]">
                  Total Nilai:
                </td>
                <td className="px-5 py-4 text-right font-mono text-emerald-300 font-extrabold whitespace-nowrap">
                  {formatRupiah(totalDebit)}
                </td>
                <td className="px-5 py-4 text-right font-mono text-amber-300 font-extrabold whitespace-nowrap">
                  {formatRupiah(totalKredit)}
                </td>
              </tr>
              <tr className={isBalanced ? "bg-emerald-950/30 border-t border-emerald-500/20" : "bg-rose-950/30 border-t border-rose-500/20"}>
                <td colSpan={5} className="px-5 py-3 text-center text-sm sm:text-base">
                  {isBalanced ? (
                    <span className="text-emerald-300 font-bold flex items-center justify-center gap-2">
                      <span>✓</span>
                      <span>Jurnal Seimbang (Debit = Kredit = {formatRupiah(totalDebit)})</span>
                    </span>
                  ) : (
                    <span className="text-rose-300 font-bold flex items-center justify-center gap-2">
                      <span>⚠</span>
                      <span>Jurnal Tidak Seimbang (Selisih: {formatRupiah(Math.abs(totalDebit - totalKredit))})</span>
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tombol Aksi Halaman Detail */}
      {/* Akuntan memiliki wewenang aksi; Direktur hanya membaca (tanpa tombol buat, ubah, posting, hapus, pembalik) */}
      {isAkuntan && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Sisi Kiri: Aksi Hapus (hanya jika draf) */}
          <div>
            {jurnal.status === "draf" && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isPosting || isDeleting}
                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 px-5 py-2.5 text-sm sm:text-base font-bold text-rose-300 hover:bg-rose-900/40 hover:text-rose-200 transition shadow-sm disabled:opacity-50"
                id="btn-hapus-draf"
              >
                <span aria-hidden="true">🗑</span>
                <span>Hapus Draf</span>
              </button>
            )}
          </div>

          {/* Sisi Kanan: Aksi Ubah, Posting, atau Buat Pembalik */}
          <div className="flex flex-wrap items-center gap-3">
            {jurnal.status === "draf" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isPosting || isDeleting}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-[#141210] px-5 py-2.5 text-sm sm:text-base font-bold text-[#d6cfc7] hover:bg-[#1c1815] hover:text-[#fdfaf6] transition shadow-sm disabled:opacity-50"
                  id="btn-ubah-draf"
                >
                  <span aria-hidden="true">✎</span>
                  <span>Ubah Draf</span>
                </button>

                <button
                  type="button"
                  onClick={handlePosting}
                  disabled={
                    isPosting ||
                    isDeleting ||
                    !isBalanced ||
                    jurnal.periode?.status !== "terbuka"
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-2.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-emerald-950/50 hover:from-emerald-500 hover:to-emerald-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  id="btn-posting-detail"
                  title={
                    !isBalanced
                      ? "Jurnal belum seimbang (BR-02)"
                      : jurnal.periode?.status !== "terbuka"
                      ? "Periode akuntansi berstatus ditutup (BR-05)"
                      : "Posting jurnal ke buku besar"
                  }
                >
                  {isPosting ? (
                    <>
                      <span className="animate-spin text-sm">⏳</span>
                      <span>Memposting...</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true" className="font-bold">✓</span>
                      <span>Posting Jurnal Sekarang</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Tombol Buat Jurnal Pembalik (Hanya jika berstatus 'diposting' dan memenuhi BR-04) */}
            {canReverse && (
              <button
                type="button"
                onClick={() => setIsPembalikModalOpen(true)}
                disabled={isPosting || isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-2.5 text-sm sm:text-base font-bold text-[#070605] shadow-lg shadow-amber-950/50 hover:from-amber-500 hover:to-amber-600 transition active:scale-95 disabled:opacity-40"
                id="btn-buka-pembalik"
              >
                <span aria-hidden="true">🔄</span>
                <span>Buat Jurnal Pembalik (Koreksi)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Draf */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="sogan-card w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0e0c0a] p-6 sm:p-7 shadow-2xl space-y-5 text-[#fdfaf6]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold text-xl">
                ⚠
              </div>
              <div className="space-y-1">
                <h3 id="delete-modal-title" className="text-lg font-bold text-rose-200">
                  Hapus Draf Jurnal #{jurnal.id}?
                </h3>
                <p className="text-xs sm:text-sm text-[#d6cfc7] leading-relaxed">
                  Apakah Anda yakin ingin menghapus draf jurnal ini beserta seluruh baris akunnya? Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/20">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="rounded-xl border border-amber-900/40 bg-[#141210] px-5 py-2.5 text-sm sm:text-base font-bold text-[#d6cfc7] hover:bg-[#1c1815] hover:text-[#fdfaf6] transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleHapusDraf}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-800 px-5 py-2.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-rose-950/50 hover:from-rose-600 hover:to-rose-700 transition disabled:opacity-50"
                id="btn-konfirmasi-hapus"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Draf</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Jurnal Pembalik */}
      <PembalikModal
        isOpen={isPembalikModalOpen}
        onClose={() => setIsPembalikModalOpen(false)}
        jurnalId={jurnal.id}
        jurnalNomor={jurnal.nomor || `#${jurnal.id}`}
        daftarPeriode={daftarPeriode}
        onSuccess={(newId) => {
          setIsPembalikModalOpen(false);
          router.push(`/jurnal/${newId}`);
          router.refresh();
        }}
      />
    </div>
  );
}

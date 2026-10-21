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
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-amber-800 hover:underline font-semibold"
            >
              ← Batal Ubah & Kembali ke Detail
            </button>
          </div>
          <span className="text-xs font-mono bg-amber-50 text-amber-800 px-2.5 py-1 rounded border border-amber-200">
            Mode Ubah Draf
          </span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">Ubah Draf Jurnal #{jurnal.id}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigasi breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <Link href="/jurnal" className="hover:text-slate-900 transition font-medium">
          ← Kembali ke Daftar Jurnal
        </Link>
        <span className="font-mono text-[11px]">ID Internal: #{jurnal.id}</span>
      </div>

      {/* Alert Error Tindakan */}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2 shadow-sm"
        >
          <span className="font-bold text-red-600">✕</span>
          <div className="flex-1">
            <strong className="block font-semibold">Tindakan ditolak oleh sistem:</strong>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-600 hover:text-red-900 font-bold ml-2"
            aria-label="Tutup pesan galat"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alert Berhasil Posting */}
      {postingSuccessNomor && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2 shadow-sm">
          <span className="font-bold text-emerald-600 text-sm">✓</span>
          <div className="flex-1">
            <strong className="block font-semibold">Jurnal Berhasil Diposting!</strong>
            <span>
              Nomor dokumen resmi: <strong className="font-mono">{postingSuccessNomor}</strong>. Transaksi telah dibukukan ke buku besar.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPostingSuccessNomor(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
            aria-label="Tutup pesan sukses"
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner Tautan Jurnal Terkait */}
      {/* 1. Jika jurnal ini merupakan jurnal pembalik */}
      {jurnal.sumber === "pembalik" && jurnal.jurnal_dibalik && (
        <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 text-xs text-purple-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🔄</span>
            <div>
              <p className="font-semibold">Ini adalah Jurnal Pembalik (Koreksi)</p>
              <p className="text-purple-700 text-[11px]">
                Membalik transaksi pada jurnal asal bertanggal {formatDate(jurnal.jurnal_dibalik.tanggal)}
              </p>
            </div>
          </div>
          <Link
            href={`/jurnal/${jurnal.jurnal_dibalik.id}`}
            className="font-mono font-semibold underline hover:text-purple-950 whitespace-nowrap"
          >
            Buka Jurnal Asal ({jurnal.jurnal_dibalik.nomor || `#${jurnal.jurnal_dibalik.id}`}) →
          </Link>
        </div>
      )}

      {/* 2. Jika jurnal ini telah dibalik oleh jurnal lain */}
      {jurnal.jurnal_pembalik && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 text-xs text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">↩</span>
            <div>
              <p className="font-semibold">Jurnal Ini Telah Dibalik</p>
              <p className="text-slate-600 text-[11px]">
                Telah dibuatkan jurnal pembalik untuk mengoreksi transaksi ini (BR-04)
              </p>
            </div>
          </div>
          <Link
            href={`/jurnal/${jurnal.jurnal_pembalik.id}`}
            className="font-mono font-semibold text-amber-900 underline hover:text-amber-950 whitespace-nowrap"
          >
            Lihat Pembalik ({jurnal.jurnal_pembalik.nomor || `#${jurnal.jurnal_pembalik.id}`}) →
          </Link>
        </div>
      )}

      {/* 3. Jika jurnal berasal dari pembayaran pengajuan biaya */}
      {jurnal.pengajuan_id && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📄</span>
            <div>
              <p className="font-semibold">Jurnal Otomatis Pembayaran Pengajuan</p>
              <p className="text-blue-700 text-[11px]">
                Dibuat otomatis oleh sistem saat pengajuan biaya dibayarkan oleh Akuntan (BR-10)
              </p>
            </div>
          </div>
          <Link
            href={`/pengajuan/${jurnal.pengajuan_id}`}
            className="font-mono font-semibold underline hover:text-blue-950 whitespace-nowrap"
          >
            Buka Pengajuan ({jurnal.pengajuan?.nomor || `#${jurnal.pengajuan_id}`}) →
          </Link>
        </div>
      )}

      {/* Card Header Jurnal */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Nomor Dokumen
            </span>
            <h1 className="text-2xl font-bold font-mono text-slate-900">
              {jurnal.status === "draf" || !jurnal.nomor ? (
                <span className="italic font-sans text-amber-700">Draf Jurnal</span>
              ) : (
                jurnal.nomor
              )}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <JurnalSumberBadge sumber={jurnal.sumber} className="text-xs px-2.5 py-1" />
            <JurnalStatusBadge status={jurnal.status} className="text-xs px-3 py-1" />
          </div>
        </div>

        {/* Informasi Kunci */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Tanggal Transaksi</span>
            <span className="font-medium text-slate-800">{formatDate(jurnal.tanggal)}</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Periode Akuntansi</span>
            <span className="font-medium text-slate-800">
              {jurnal.periode
                ? formatBulanTahun(jurnal.periode.tahun, jurnal.periode.bulan)
                : "-"}
            </span>
            {jurnal.periode && (
              <span className="text-[10px] text-slate-500 block">
                ({jurnal.periode.status === "terbuka" ? "Status: Terbuka" : "Status: Ditutup"})
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Dibuat Oleh</span>
            <span className="font-medium text-slate-800">
              {jurnal.pembuat?.nama_lengkap || "Pengguna"}
            </span>
            <span className="text-[10px] text-slate-500 block">{jurnal.pembuat?.email || ""}</span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Pelaku & Waktu Posting</span>
            {jurnal.status !== "draf" && jurnal.pemosting ? (
              <>
                <span className="font-medium text-slate-800">{jurnal.pemosting.nama_lengkap}</span>
                <span className="text-[10px] text-slate-500 block">
                  {jurnal.diposting_pada ? formatDateTime(jurnal.diposting_pada) : "-"}
                </span>
              </>
            ) : (
              <span className="text-slate-400 italic">Belum diposting</span>
            )}
          </div>
        </div>

        {/* Keterangan */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Keterangan Transaksi</span>
          <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200">
            {jurnal.keterangan}
          </p>
        </div>
      </div>

      {/* Rincian Baris Jurnal Debit - Kredit */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Rincian Baris Akun (BR-02)</h2>
            <p className="text-[11px] text-slate-500">
              Klasifikasi transaksi debit dan kredit yang memengaruhi buku besar
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            {jurnal.baris.length} Baris Akun
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-2.5 text-center w-12">#</th>
                <th scope="col" className="px-4 py-2.5">Akun</th>
                <th scope="col" className="px-4 py-2.5">Keterangan Baris</th>
                <th scope="col" className="px-4 py-2.5 text-right w-36">Debit</th>
                <th scope="col" className="px-4 py-2.5 text-right w-36">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jurnal.baris.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-center font-mono text-slate-400">
                    {b.urutan}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold font-mono text-slate-900">
                      [{b.akun?.kode || "-"}] {b.akun?.nama || "Akun"}
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase">
                      Tipe: {b.akun?.tipe || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.keterangan || <span className="text-slate-400 italic">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">
                    {b.debit > 0 ? (
                      <span className="font-semibold text-slate-900">{formatRupiah(b.debit)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800">
                    {b.kredit > 0 ? (
                      <span className="font-semibold text-slate-900">{formatRupiah(b.kredit)}</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right text-slate-700">
                  Total Nilai:
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-900 whitespace-nowrap">
                  {formatRupiah(totalDebit)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-900 whitespace-nowrap">
                  {formatRupiah(totalKredit)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="px-4 py-2 text-center text-xs">
                  {isBalanced ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Jurnal Seimbang (Debit = Kredit = {formatRupiah(totalDebit)})
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold">
                      ⚠ Jurnal Tidak Seimbang (Selisih: {formatRupiah(Math.abs(totalDebit - totalKredit))})
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Sisi Kiri: Aksi Hapus (hanya jika draf) */}
          <div>
            {jurnal.status === "draf" && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isPosting || isDeleting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition shadow-sm disabled:opacity-50"
                id="btn-hapus-draf"
              >
                <span aria-hidden="true">🗑</span>
                <span>Hapus Draf</span>
              </button>
            )}
          </div>

          {/* Sisi Kanan: Aksi Ubah, Posting, atau Buat Pembalik */}
          <div className="flex items-center gap-2">
            {jurnal.status === "draf" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={isPosting || isDeleting}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
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
                      <span className="animate-spin text-xs">⏳</span>
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-900 transition shadow-sm active:scale-95"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">
                ⚠
              </div>
              <div>
                <h3 id="delete-modal-title" className="text-sm font-bold text-slate-900">
                  Hapus Draf Jurnal #{jurnal.id}?
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Apakah Anda yakin ingin menghapus draf jurnal ini beserta seluruh baris akunnya? Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleHapusDraf}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                id="btn-konfirmasi-hapus"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin text-xs">⏳</span>
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

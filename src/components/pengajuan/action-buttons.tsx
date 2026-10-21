"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { formatRupiah } from "@/lib/utils/formatters";
import type { StatusPengajuan, UserRole } from "@/types/database";

interface KasAccountOption {
  id: number;
  kode: string;
  nama: string;
  saldo: number;
}

interface ActionButtonsProps {
  pengajuanId: number;
  currentStatus: StatusPengajuan;
  jumlah: number;
  pengajuId: string;
  userId: string;
  userRole: UserRole;
  kasAccounts?: KasAccountOption[];
}

export function ActionButtons({
  pengajuanId,
  currentStatus,
  jumlah,
  pengajuId,
  userId,
  userRole,
  kasAccounts = [],
}: ActionButtonsProps) {
  const router = useRouter();
  const supabase = createClient();

  const isOwner = userId === pengajuId;
  const isAkuntan = userRole === "akuntan";
  const isDirektur = userRole === "direktur";

  // State Dialog & Modal
  const [modalMode, setModalMode] = useState<
    "none" | "batal" | "revisi" | "tolak" | "bayar" | "setuju_confirm"
  >("none");
  const [catatan, setCatatan] = useState("");
  const [selectedAkunKasId, setSelectedAkunKasId] = useState<number | "">(
    kasAccounts[0]?.id ?? ""
  );
  const [tanggalBayar, setTanggalBayar] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Status proses
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetModals = () => {
    setModalMode("none");
    setCatatan("");
    setErrorMessage(null);
  };

  // 1. Eksekusi transisi status umum via RPC transisi_status_pengajuan
  const handleTransition = async (
    targetStatus: StatusPengajuan,
    pCatatan: string | null = null
  ) => {
    if (loading) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.rpc("transisi_status_pengajuan", {
        p_pengajuan_id: pengajuanId,
        p_status_baru: targetStatus,
        p_catatan: pCatatan,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Status pengajuan berhasil diperbarui!");
      resetModals();
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 2. Eksekusi pembayaran via RPC bayar_pengajuan
  const handleBayar = async () => {
    if (loading) return;

    if (!selectedAkunKasId) {
      setErrorMessage("Silakan pilih akun kas atau bank pembayar.");
      return;
    }
    if (!tanggalBayar) {
      setErrorMessage("Tanggal bayar wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.rpc("bayar_pengajuan", {
        p_pengajuan_id: pengajuanId,
        p_akun_kas_id: Number(selectedAkunKasId),
        p_tanggal_bayar: tanggalBayar,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage(
        "Pembayaran pengajuan berhasil dicatat dan jurnal pengeluaran otomatis diposting!"
      );
      resetModals();
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Evaluasi tombol apa saja yang sah ditampilkan sesuai Tabel 6.1
  const canOwnerSend = isOwner && (currentStatus === "draf" || currentStatus === "perlu_revisi");
  const canOwnerEdit = isOwner && (currentStatus === "draf" || currentStatus === "perlu_revisi");
  const canOwnerCancel = isOwner && (currentStatus === "draf" || currentStatus === "perlu_revisi");

  const canAkuntanReview = isAkuntan && !isOwner && currentStatus === "diajukan";
  const canDirekturReview = isDirektur && !isOwner && currentStatus === "menunggu_direktur";

  const canAkuntanPay = isAkuntan && currentStatus === "disetujui";

  const hasAnyAction =
    canOwnerSend ||
    canOwnerEdit ||
    canOwnerCancel ||
    canAkuntanReview ||
    canDirekturReview ||
    canAkuntanPay;

  if (!hasAnyAction && !successMessage && !errorMessage) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Pesan Sukses */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-base">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Pesan Error */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-800"
        >
          <p className="font-bold flex items-center gap-1.5">
            <span aria-hidden="true">⚠️</span> Aksi Tidak Dapat Dilanjutkan
          </p>
          <p className="mt-1">{errorMessage}</p>
        </div>
      )}

      {/* Baris Tombol Aksi */}
      {hasAnyAction && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-700 mr-1">
            Tindakan yang Dapat Dilakukan:
          </span>

          {/* AKSI PEMILIK: Kirim */}
          {canOwnerSend && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                const targetStatus: StatusPengajuan =
                  userRole === "akuntan" ? "menunggu_direktur" : "diajukan";
                handleTransition(targetStatus);
              }}
              className="rounded-lg bg-amber-800 hover:bg-amber-900 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              {loading
                ? "Memproses..."
                : currentStatus === "perlu_revisi"
                ? "Kirim Ulang Pengajuan"
                : "Kirim Pengajuan"}
            </button>
          )}

          {/* AKSI PEMILIK: Ubah */}
          {canOwnerEdit && (
            <Link
              href={`/pengajuan/${pengajuanId}/ubah`}
              tabIndex={loading ? -1 : 0}
              className={`rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2 text-xs font-semibold shadow-sm transition ${
                loading ? "opacity-50 pointer-events-none cursor-not-allowed" : ""
              }`}
            >
              ✎ Ubah Pengajuan
            </Link>
          )}

          {/* AKSI PEMILIK: Batalkan */}
          {canOwnerCancel && (
            <button
              type="button"
              disabled={loading}
              onClick={() => setModalMode("batal")}
              className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              ⊘ Batalkan Pengajuan
            </button>
          )}

          {/* AKSI AKUNTAN PADA STATUS diajukan */}
          {canAkuntanReview && (
            <>
              {jumlah <= 1000000 ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleTransition("disetujui")}
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {loading ? "Memproses..." : "✓ Setujui Pengajuan (≤ Rp 1 Jt)"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleTransition("menunggu_direktur")}
                  className="rounded-lg bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {loading ? "Memproses..." : "⏳ Teruskan ke Direktur (> Rp 1 Jt)"}
                </button>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={() => setModalMode("revisi")}
                className="rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                ↩ Minta Revisi
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setModalMode("tolak")}
                className="rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                ✕ Tolak Pengajuan
              </button>
            </>
          )}

          {/* AKSI DIREKTUR PADA STATUS menunggu_direktur */}
          {canDirekturReview && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleTransition("disetujui")}
                className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {loading ? "Memproses..." : "✓ Setujui Pengajuan"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setModalMode("revisi")}
                className="rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                ↩ Minta Revisi
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setModalMode("tolak")}
                className="rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 px-3.5 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                ✕ Tolak Pengajuan
              </button>
            </>
          )}

          {/* AKSI AKUNTAN PADA STATUS disetujui: Bayar */}
          {canAkuntanPay && (
            <button
              type="button"
              disabled={loading}
              onClick={() => setModalMode("bayar")}
              className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              💳 Bayar Pengajuan Sekarang
            </button>
          )}
        </div>
      )}

      {/* MODAL 1: Konfirmasi Pembatalan */}
      {modalMode === "batal" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Pembatalan Pengajuan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Batalkan Pengajuan Ini?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin membatalkan pengajuan ini? Status pengajuan akan diubah menjadi <strong className="text-slate-800">Dibatalkan</strong> dan tidak dapat diproses lagi.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={resetModals}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleTransition("dibatalkan")}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {loading ? "Membatalkan..." : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2 & 3: Catatan Peninjau (Minta Revisi / Tolak) */}
      {(modalMode === "revisi" || modalMode === "tolak") && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={modalMode === "revisi" ? "Form Permintaan Revisi" : "Form Penolakan Pengajuan"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">
                {modalMode === "revisi"
                  ? "↩ Minta Revisi Pengajuan"
                  : "✕ Tolak Pengajuan"}
              </h4>
              <button
                type="button"
                onClick={resetModals}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {modalMode === "revisi"
                ? "Berikan catatan arahan bagian mana yang harus diperbaiki oleh pengaju (BR-08)."
                : "Berikan alasan yang jelas mengapa pengajuan ini ditolak (BR-08)."}
            </p>

            <div className="space-y-1.5">
              <label
                htmlFor="catatan-peninjau-input"
                className="block text-xs font-bold text-slate-800"
              >
                Catatan Peninjau (Wajib minimal 10 karakter){" "}
                <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="catatan-peninjau-input"
                rows={4}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan detail (minimal 10 karakter)..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <div className="flex justify-between text-[11px]">
                <span
                  className={
                    catatan.trim().length >= 10
                      ? "text-emerald-700 font-medium"
                      : "text-rose-600"
                  }
                >
                  Minimal 10 karakter (saat ini: {catatan.trim().length})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={resetModals}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading || catatan.trim().length < 10}
                onClick={() => {
                  const targetStatus: StatusPengajuan =
                    modalMode === "revisi" ? "perlu_revisi" : "ditolak";
                  handleTransition(targetStatus, catatan.trim());
                }}
                className={`px-4 py-2 rounded-lg text-white text-xs font-bold transition disabled:opacity-50 ${
                  modalMode === "revisi"
                    ? "bg-amber-700 hover:bg-amber-800"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {loading
                  ? "Menyimpan..."
                  : modalMode === "revisi"
                  ? "Kirim Permintaan Revisi"
                  : "Konfirmasi Tolak Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Pembayaran Pengajuan (Akuntan) */}
      {modalMode === "bayar" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Modal Pembayaran Pengajuan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span aria-hidden="true">💳</span> Pembayaran Pengajuan #{pengajuanId}
              </h4>
              <button
                type="button"
                onClick={resetModals}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="rounded-lg bg-teal-50 border border-teal-200 p-3 text-xs text-teal-900 space-y-1">
              <div className="flex justify-between">
                <span>Total yang Harus Dibayar:</span>
                <span className="font-extrabold text-teal-950">
                  {formatRupiah(jumlah)}
                </span>
              </div>
              <p className="text-[11px] text-teal-700">
                Sistem akan secara otomatis membuat dan memposting jurnal pengeluaran (Debit Akun Beban, Kredit Akun Kas/Bank) (BR-10).
              </p>
            </div>

            {/* Pilihan Akun Kas / Bank Aktif */}
            <div className="space-y-1.5">
              <label
                htmlFor="akun-kas-select"
                className="block text-xs font-bold text-slate-800"
              >
                Pilih Akun Kas atau Bank Pembayar{" "}
                <span className="text-rose-600">*</span>
              </label>
              <select
                id="akun-kas-select"
                disabled={loading}
                value={selectedAkunKasId}
                onChange={(e) => setSelectedAkunKasId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50"
              >
                {kasAccounts.length === 0 ? (
                  <option value="">Tidak ada akun kas/bank yang aktif</option>
                ) : (
                  kasAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.kode} — {acc.nama} (Saldo: {formatRupiah(acc.saldo)})
                    </option>
                  ))
                )}
              </select>
              <p className="text-[11px] text-slate-500">
                Informasi: Angka saldo di atas dihitung oleh server berdasarkan seluruh mutasi debit dan kredit jurnal berstatus diposting dan dibalik. Angka ini hanya sebagai informasi; validasi saldo akhir dan penolakan tetap dieksekusi secara ketat oleh database saat transaksi diproses (BR-10).
              </p>

              {/* Peringatan jika saldo terhitung kurang dari nilai pengajuan */}
              {selectedAkunKasId && (() => {
                const sel = kasAccounts.find((a) => a.id === Number(selectedAkunKasId));
                if (sel && sel.saldo < jumlah) {
                  return (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 flex items-start gap-1.5 mt-1">
                      <span aria-hidden="true" className="font-bold">⚠️</span>
                      <div>
                        <strong className="block">Perkiraan Saldo Kurang:</strong>
                        <span>
                          Saldo akun {sel.kode} ({formatRupiah(sel.saldo)}) diperkirakan kurang dari nominal pembayaran ({formatRupiah(jumlah)}). Bila diteruskan, database akan menolak pembayaran sesuai aturan BR-10.
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Tanggal Bayar */}
            <div className="space-y-1.5">
              <label
                htmlFor="tanggal-bayar-input"
                className="block text-xs font-bold text-slate-800"
              >
                Tanggal Pembayaran <span className="text-rose-600">*</span>
              </label>
              <input
                id="tanggal-bayar-input"
                type="date"
                disabled={loading}
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-500">
                Tanggal bayar wajib berada pada periode akuntansi yang berstatus terbuka (BR-05).
              </p>
            </div>

            {/* Tombol Konfirmasi */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={loading}
                onClick={resetModals}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading || !selectedAkunKasId || !tanggalBayar}
                onClick={handleBayar}
                className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {loading ? "Memproses Pembayaran..." : "Konfirmasi & Bayar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

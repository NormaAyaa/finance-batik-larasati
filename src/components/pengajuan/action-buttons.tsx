"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  transisiStatusPengajuanAction,
  bayarPengajuanAction,
} from "@/app/(dashboard)/pengajuan/actions";
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

  // 1. Eksekusi transisi status umum via Server Action transisiStatusPengajuanAction
  const handleTransition = async (
    targetStatus: StatusPengajuan,
    pCatatan: string | null = null
  ) => {
    if (loading) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await transisiStatusPengajuanAction({
        pengajuanId,
        targetStatus,
        catatan: pCatatan,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal memperbarui status pengajuan.");
      } else {
        const noticeSuffix = res.emailNotice ? ` (${res.emailNotice})` : "";
        setSuccessMessage(`Status pengajuan berhasil diperbarui!${noticeSuffix}`);
        resetModals();
      }
    } catch (err: unknown) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      // Saat Server Action gagal atau habis waktu, UI tetap memanggil router.refresh() karena status database mungkin sudah berubah
      router.refresh();
      setLoading(false);
    }
  };

  // 2. Eksekusi pembayaran via Server Action bayarPengajuanAction
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
      const res = await bayarPengajuanAction({
        pengajuanId,
        akunKasId: Number(selectedAkunKasId),
        tanggalBayar,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal mencatat pembayaran pengajuan.");
      } else {
        const noticeSuffix = res.emailNotice ? ` (${res.emailNotice})` : "";
        setSuccessMessage(
          `Pembayaran pengajuan berhasil dicatat dan jurnal pengeluaran otomatis diposting!${noticeSuffix}`
        );
        resetModals();
      }
    } catch (err: unknown) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      // Selalu refresh tampilan untuk memastikan sinkronisasi status database terbaru
      router.refresh();
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
          className="sogan-card border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 to-[#0f0d0b] p-4 text-sm sm:text-base font-semibold text-emerald-300 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-lg text-emerald-400 font-bold">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-sm font-bold px-1"
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
          className="sogan-card border-rose-500/40 bg-gradient-to-r from-rose-950/30 to-[#0f0d0b] p-4 text-sm sm:text-base text-rose-300"
        >
          <p className="font-bold flex items-center gap-1.5">
            <span aria-hidden="true">⚠️</span> Aksi Tidak Dapat Dilanjutkan
          </p>
          <p className="mt-1 text-rose-400/90">{errorMessage}</p>
        </div>
      )}

      {/* Baris Tombol Aksi */}
      {hasAnyAction && (
        <div className="sogan-card p-5 border-amber-900/30 flex flex-wrap items-center gap-3.5">
          <span className="text-sm sm:text-base font-bold text-[#fdfaf6] mr-1">
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
              className="btn-3d-gold px-5 py-2.5 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
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
              className={`btn-3d-dark px-5 py-2.5 text-sm sm:text-base font-semibold ${
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
              className="btn-3d-dark border-rose-900/40 text-rose-300 px-5 py-2.5 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
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
                  className="btn-3d-gold px-5 py-2.5 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {loading ? "Memproses..." : "✓ Setujui Pengajuan (≤ Rp 1 Jt)"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleTransition("menunggu_direktur")}
                  className="btn-3d-gold px-5 py-2.5 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                >
                  {loading ? "Memproses..." : "⏳ Teruskan ke Direktur (> Rp 1 Jt)"}
                </button>
              )}

              <button
                type="button"
                disabled={loading}
                onClick={() => setModalMode("revisi")}
                className="btn-3d-orange px-5 py-2.5 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                ↩ Minta Revisi
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setModalMode("tolak")}
                className="btn-3d-dark border-rose-900/40 text-rose-300 px-5 py-2.5 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
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
                className="btn-3d-gold px-5 py-2.5 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {loading ? "Memproses..." : "✓ Setujui Pengajuan"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setModalMode("revisi")}
                className="btn-3d-orange px-5 py-2.5 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                ↩ Minta Revisi
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setModalMode("tolak")}
                className="btn-3d-dark border-rose-900/40 text-rose-300 px-5 py-2.5 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
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
              className="btn-3d-gold px-6 py-2.5 text-sm sm:text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <div className="sogan-card bg-[#0e0c0a] border border-rose-900/40 max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <h4 className="text-base sm:text-lg font-bold text-[#fdfaf6] flex items-center gap-2">
              <span aria-hidden="true" className="text-rose-400">⊘</span> Batalkan Pengajuan Ini?
            </h4>
            <p className="text-sm sm:text-base text-[#a89f91] leading-relaxed">
              Apakah Anda yakin ingin membatalkan pengajuan ini? Status pengajuan akan diubah menjadi <strong className="text-rose-400 font-bold">Dibatalkan</strong> dan tidak dapat diproses lagi.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/20">
              <button
                type="button"
                disabled={loading}
                onClick={resetModals}
                className="px-5 py-2.5 rounded-xl border border-amber-900/40 bg-[#161310] text-sm sm:text-base font-semibold text-[#a89f91] hover:text-[#fdfaf6] hover:bg-[#1e1a16] transition"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleTransition("dibatalkan")}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm sm:text-base font-bold transition disabled:opacity-50 shadow-[0_0_10px_rgba(225,29,72,0.3)]"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <div className="sogan-card bg-[#0e0c0a] border border-amber-500/30 max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-base sm:text-lg font-bold text-[#fdfaf6]">
                {modalMode === "revisi"
                  ? "↩ Minta Revisi Pengajuan"
                  : "✕ Tolak Pengajuan"}
              </h4>
              <button
                type="button"
                onClick={resetModals}
                className="text-[#a89f91] hover:text-[#fdfaf6] text-sm font-bold px-1"
              >
                ✕
              </button>
            </div>

            <p className="text-sm sm:text-base text-[#a89f91]">
              {modalMode === "revisi"
                ? "Berikan catatan arahan bagian mana yang harus diperbaiki oleh pengaju (BR-08)."
                : "Berikan alasan yang jelas mengapa pengajuan ini ditolak (BR-08)."}
            </p>

            <div className="space-y-2">
              <label
                htmlFor="catatan-peninjau-input"
                className="block text-sm sm:text-base font-bold text-[#fdfaf6]"
              >
                Catatan Peninjau (Wajib minimal 10 karakter){" "}
                <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="catatan-peninjau-input"
                rows={4}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Tuliskan catatan detail (minimal 10 karakter)..."
                className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] placeholder-[#78716c] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <div className="flex justify-between text-xs sm:text-sm">
                <span
                  className={
                    catatan.trim().length >= 10
                      ? "text-emerald-400 font-medium"
                      : "text-rose-400"
                  }
                >
                  Minimal 10 karakter (saat ini: {catatan.trim().length})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/20">
              <button
                type="button"
                disabled={loading}
                onClick={resetModals}
                className="px-5 py-2.5 rounded-xl border border-amber-900/40 bg-[#161310] text-sm sm:text-base font-semibold text-[#a89f91] hover:text-[#fdfaf6] hover:bg-[#1e1a16] transition"
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
                className={`px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold transition disabled:opacity-50 ${
                  modalMode === "revisi"
                    ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                    : "bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)]"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <div className="sogan-card bg-[#0e0c0a] border border-teal-500/40 max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-base sm:text-lg font-bold text-[#fdfaf6] flex items-center gap-2">
                <span aria-hidden="true" className="text-teal-400">💳</span> Pembayaran Pengajuan #{pengajuanId}
              </h4>
              <button
                type="button"
                onClick={resetModals}
                className="text-[#a89f91] hover:text-[#fdfaf6] text-sm font-bold px-1"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-teal-950/40 border border-teal-500/30 p-4 text-sm sm:text-base text-teal-200 space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-[#a89f91] text-xs sm:text-sm">Total yang Harus Dibayar:</span>
                <span className="font-extrabold text-teal-300 font-mono text-lg sm:text-xl">
                  {formatRupiah(jumlah)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-teal-300/80 pt-1">
                Sistem akan secara otomatis membuat dan memposting jurnal pengeluaran (Debit Akun Beban, Kredit Akun Kas/Bank) (BR-10).
              </p>
            </div>

            {/* Pilihan Akun Kas / Bank Aktif */}
            <div className="space-y-2">
              <label
                htmlFor="akun-kas-select"
                className="block text-sm sm:text-base font-bold text-[#fdfaf6]"
              >
                Pilih Akun Kas atau Bank Pembayar{" "}
                <span className="text-rose-400">*</span>
              </label>
              <select
                id="akun-kas-select"
                disabled={loading}
                value={selectedAkunKasId}
                onChange={(e) => setSelectedAkunKasId(Number(e.target.value))}
                className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
              >
                {kasAccounts.length === 0 ? (
                  <option value="" className="bg-[#141210] text-[#fdfaf6]">Tidak ada akun kas/bank yang aktif</option>
                ) : (
                  kasAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-[#141210] text-[#fdfaf6]">
                      {acc.kode} — {acc.nama} (Saldo: {formatRupiah(acc.saldo)})
                    </option>
                  ))
                )}
              </select>
              <p className="text-xs sm:text-sm text-[#a89f91]">
                Informasi: Angka saldo di atas dihitung berdasarkan seluruh mutasi debit dan kredit jurnal berstatus diposting dan dibalik (BR-10).
              </p>

              {/* Peringatan jika saldo terhitung kurang dari nilai pengajuan */}
              {selectedAkunKasId && (() => {
                const sel = kasAccounts.find((a) => a.id === Number(selectedAkunKasId));
                if (sel && sel.saldo < jumlah) {
                  return (
                    <div className="rounded-xl bg-amber-950/40 border border-amber-500/40 p-3 text-xs sm:text-sm text-amber-300 flex items-start gap-2 mt-1">
                      <span aria-hidden="true" className="font-bold text-base">⚠️</span>
                      <div>
                        <strong className="block">Perkiraan Saldo Kurang:</strong>
                        <span className="text-[#a89f91]">
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
            <div className="space-y-2">
              <label
                htmlFor="tanggal-bayar-input"
                className="block text-sm sm:text-base font-bold text-[#fdfaf6]"
              >
                Tanggal Pembayaran <span className="text-rose-400">*</span>
              </label>
              <input
                id="tanggal-bayar-input"
                type="date"
                disabled={loading}
                value={tanggalBayar}
                onChange={(e) => setTanggalBayar(e.target.value)}
                className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 [color-scheme:dark]"
              />
              <p className="text-xs sm:text-sm text-[#a89f91]">
                Tanggal bayar wajib berada pada periode akuntansi yang berstatus terbuka (BR-05).
              </p>
            </div>

            {/* Tombol Konfirmasi */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/20">
              <button
                type="button"
                disabled={loading}
                onClick={resetModals}
                className="px-5 py-2.5 rounded-xl border border-amber-900/40 bg-[#161310] text-sm sm:text-base font-semibold text-[#a89f91] hover:text-[#fdfaf6] hover:bg-[#1e1a16] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading || !selectedAkunKasId || !tanggalBayar}
                onClick={handleBayar}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-black text-sm sm:text-base font-bold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none shadow-[0_0_12px_rgba(20,184,166,0.3)]"
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

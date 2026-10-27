"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { formatBulanTahun } from "@/lib/utils/formatters";
import type { Database } from "@/types/database";

type PeriodeRow = Database["public"]["Tables"]["periode"]["Row"];

export type PeriodeToClose = PeriodeRow & {
  jumlah_draf?: number;
};

interface TutupPeriodeModalProps {
  isOpen: boolean;
  periode: PeriodeToClose | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function TutupPeriodeModal({
  isOpen,
  periode,
  onClose,
  onSuccess,
}: TutupPeriodeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !periode) return null;

  const periodeLabel = formatBulanTahun(periode.tahun, periode.bulan);

  const handleTutup = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createClient();
    try {
      // Panggil fungsi RPC resmi tutup_periode (BR-06)
      // DILARANG melakukan UPDATE status langsung!
      const { error } = await supabase.rpc("tutup_periode", {
        p_periode_id: periode.id,
      });

      if (error) throw error;

      onSuccess(
        `Periode akuntansi ${periodeLabel} berhasil ditutup. Transaksi baru tidak dapat dicatat pada periode ini (BR-05).`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutup-periode-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md overflow-y-auto"
    >
      <div className="sogan-card relative w-full max-w-md rounded-2xl bg-[#0e0c0a] border border-amber-500/25 p-6 shadow-2xl text-[#fdfaf6] transition-all my-8 space-y-5">
        {/* Header Modal */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-lg">
            🔒
          </div>
          <div className="flex-1">
            <h2 id="tutup-periode-title" className="text-base sm:text-lg font-bold text-[#fdfaf6] tracking-tight">
              Tutup Periode Akuntansi
            </h2>
            <p className="text-xs text-[#a89f91] mt-0.5">
              Konfirmasi penutupan buku periode bulanan (BR-06)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-1.5 text-[#a89f91] hover:bg-amber-950/40 hover:text-[#fdfaf6] transition"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl bg-rose-950/20 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5"
          >
            <span className="font-bold text-rose-400 text-sm" aria-hidden="true">
              ⚠️
            </span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Kotak Informasi Aturan Bisnis */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs text-amber-200/90 space-y-2.5">
          <p className="font-semibold text-amber-300">
            Anda akan menutup periode: <span className="text-[#fdfaf6] font-bold">{periodeLabel}</span>
          </p>
          {periode.jumlah_draf !== undefined && periode.jumlah_draf > 0 && (
            <div className="rounded-xl bg-rose-950/30 border border-rose-500/40 p-3 text-rose-200 text-xs font-medium flex items-center gap-2">
              <span aria-hidden="true" className="font-bold text-rose-400">⚠️</span>
              <span>
                Periode ini masih memiliki <strong>{periode.jumlah_draf} jurnal draf</strong>. Database akan menolak penutupan sampai seluruh draf diposting atau dihapus (BR-06).
              </span>
            </div>
          )}
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-[#d6cfc7]">
            <li>Periode sebelumnya harus sudah dalam keadaan ditutup (BR-06).</li>
            <li>Tidak boleh ada jurnal draf yang masih tersisa di periode ini (BR-06).</li>
            <li>Setelah ditutup, jurnal baru tidak dapat dibuat atau diposting di periode ini (BR-05).</li>
            <li>Hanya Direktur yang berwenang membuka kembali periode yang sudah ditutup.</li>
          </ul>
        </div>

        {/* Aksi Bawah */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-3d-dark px-4 py-2.5 text-xs sm:text-sm font-bold disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleTutup}
            disabled={isSubmitting}
            className="btn-3d-gold inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#070605] border-t-transparent" />
                <span>Memproses Penutupan...</span>
              </>
            ) : (
              "Ya, Tutup Periode"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

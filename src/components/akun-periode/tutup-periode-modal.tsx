"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { formatBulanTahun } from "@/lib/utils/formatters";
import type { Database } from "@/types/database";

type PeriodeRow = Database["public"]["Tables"]["periode"]["Row"];

interface TutupPeriodeModalProps {
  isOpen: boolean;
  periode: PeriodeRow | null;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all my-8 space-y-4">
        {/* Header Modal */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-lg">
            🔒
          </div>
          <div className="flex-1">
            <h2 id="tutup-periode-title" className="text-base font-bold text-slate-900">
              Tutup Periode Akuntansi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Konfirmasi penutupan buku periode bulanan (BR-06)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2"
          >
            <span className="font-bold text-rose-600" aria-hidden="true">
              ⚠️
            </span>
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Kotak Informasi Aturan Bisnis */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 space-y-2">
          <p className="font-semibold">
            Anda akan menutup periode: <span className="text-slate-900 font-bold">{periodeLabel}</span>
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
            <li>Periode sebelumnya harus sudah dalam keadaan ditutup (BR-06).</li>
            <li>Tidak boleh ada jurnal draf yang masih tersisa di periode ini (BR-06).</li>
            <li>Setelah ditutup, jurnal baru tidak dapat dibuat atau diposting di periode ini (BR-05).</li>
            <li>Hanya Direktur yang berwenang membuka kembali periode yang sudah ditutup.</li>
          </ul>
        </div>

        {/* Aksi Bawah */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleTutup}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-900 transition disabled:opacity-50 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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

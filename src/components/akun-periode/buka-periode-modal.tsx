"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { formatBulanTahun } from "@/lib/utils/formatters";
import type { Database } from "@/types/database";

type PeriodeRow = Database["public"]["Tables"]["periode"]["Row"];

interface BukaPeriodeModalProps {
  isOpen: boolean;
  periode: PeriodeRow | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const MIN_ALASAN_LENGTH = 20;

export function BukaPeriodeModal({
  isOpen,
  periode,
  onClose,
  onSuccess,
}: BukaPeriodeModalProps) {
  const [alasan, setAlasan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !periode) return null;

  const periodeLabel = formatBulanTahun(periode.tahun, periode.bulan);
  const cleanAlasan = alasan.trim();
  const charCount = cleanAlasan.length;
  const isAlasanValid = charCount >= MIN_ALASAN_LENGTH;

  const handleBukaKembali = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAlasanValid) {
      setErrorMessage(
        `Alasan pembukaan kembali wajib diisi minimal ${MIN_ALASAN_LENGTH} karakter (saat ini ${charCount} karakter). (BR-06)`
      );
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Panggil fungsi RPC resmi buka_kembali_periode (BR-06)
      // DILARANG melakukan UPDATE status langsung!
      const { error } = await supabase.rpc("buka_kembali_periode", {
        p_periode_id: periode.id,
        p_alasan: cleanAlasan,
      });

      if (error) throw error;

      onSuccess(
        `Periode akuntansi ${periodeLabel} berhasil dibuka kembali. Transaksi penyesuaian kini dapat dicatat.`
      );
      setAlasan("");
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
      aria-labelledby="buka-periode-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all my-8 space-y-4">
        {/* Header Modal */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-lg">
            🔓
          </div>
          <div className="flex-1">
            <h2 id="buka-periode-title" className="text-base font-bold text-slate-900">
              Buka Kembali Periode Akuntansi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Otoritas khusus Direktur untuk membuka kembali buku periode (BR-06)
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

        {/* Kotak Peringatan & Aturan Bisnis */}
        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-xs text-purple-950 space-y-1.5">
          <p className="font-semibold text-purple-900">
            Membuka kembali periode: <span className="text-slate-900 font-bold">{periodeLabel}</span>
          </p>
          <ul className="list-disc pl-4 space-y-1 text-[11px] text-purple-800">
            <li>Hanya periode terakhir yang ditutup yang diizinkan untuk dibuka kembali (BR-06).</li>
            <li>Alasan pembukaan kembali wajib dicatat untuk audit trail minimal 20 karakter.</li>
          </ul>
        </div>

        {/* Formulir Alasan Wajib */}
        <form onSubmit={handleBukaKembali} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="alasan-buka-kembali" className="block text-xs font-semibold text-slate-700">
                Alasan Pembukaan Kembali Periode <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  isAlasanValid ? "text-emerald-600 font-semibold" : "text-amber-600"
                }`}
              >
                {charCount} / {MIN_ALASAN_LENGTH} karakter minimal
              </span>
            </div>

            <textarea
              id="alasan-buka-kembali"
              rows={4}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Jelaskan alasan pembukuan perlu dibuka kembali (misal: Perbaikan jurnal penyesuaian beban listrik toko yang terlewat catat)..."
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-slate-100"
              required
            />
            {!isAlasanValid && (
              <p className="text-[11px] text-amber-700 mt-1">
                Alasan wajib ditulis minimal {MIN_ALASAN_LENGTH} karakter sesuai aturan bisnis BR-06.
              </p>
            )}
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
              type="submit"
              disabled={isSubmitting || !isAlasanValid}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Membuka Periode...</span>
                </>
              ) : (
                "Buka Kembali Periode"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

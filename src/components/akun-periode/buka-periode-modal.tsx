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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md overflow-y-auto"
    >
      <div className="sogan-card relative w-full max-w-lg rounded-2xl bg-[#0e0c0a] border border-purple-500/30 p-6 shadow-2xl text-[#fdfaf6] transition-all my-8 space-y-5">
        {/* Header Modal */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-lg">
            🔓
          </div>
          <div className="flex-1">
            <h2 id="buka-periode-title" className="text-base sm:text-lg font-bold text-[#fdfaf6] tracking-tight">
              Buka Kembali Periode Akuntansi
            </h2>
            <p className="text-xs text-[#a89f91] mt-0.5">
              Otoritas khusus Direktur untuk membuka kembali buku periode (BR-06)
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

        {/* Kotak Peringatan & Aturan Bisnis */}
        <div className="rounded-2xl border border-purple-500/25 bg-purple-950/20 p-4 text-xs text-purple-200 space-y-2">
          <p className="font-semibold text-purple-300">
            Membuka kembali periode: <span className="text-[#fdfaf6] font-bold">{periodeLabel}</span>
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-[#d6cfc7]">
            <li>Hanya periode terakhir yang ditutup yang diizinkan untuk dibuka kembali (BR-06).</li>
            <li>Alasan pembukaan kembali wajib dicatat untuk audit trail minimal 20 karakter.</li>
          </ul>
        </div>

        {/* Formulir Alasan Wajib */}
        <form onSubmit={handleBukaKembali} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="alasan-buka-kembali" className="block text-xs font-semibold text-[#d6cfc7]">
                Alasan Pembukaan Kembali Periode <span className="text-amber-400">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  isAlasanValid ? "text-emerald-400 font-semibold" : "text-amber-400"
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
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] p-3.5 text-xs sm:text-sm text-[#fdfaf6] placeholder-[#5c554b] focus:border-purple-500/60 focus:outline-none focus:ring-1 focus:ring-purple-500/40 disabled:opacity-50 transition"
              required
            />
            {!isAlasanValid && (
              <p className="text-[11px] text-amber-400/90 mt-1.5">
                Alasan wajib ditulis minimal {MIN_ALASAN_LENGTH} karakter sesuai aturan bisnis BR-06.
              </p>
            )}
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
              type="submit"
              disabled={isSubmitting || !isAlasanValid}
              className="btn-3d-gold inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold disabled:opacity-50"
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

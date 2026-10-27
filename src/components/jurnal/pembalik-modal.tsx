"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatBulanTahun } from "@/lib/utils/formatters";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import type { PeriodeData } from "./jurnal-form";

interface PembalikModalProps {
  isOpen: boolean;
  onClose: () => void;
  jurnalId: number;
  jurnalNomor: string;
  daftarPeriode: PeriodeData[];
  onSuccess: (newId: number, newNomor: string) => void;
}

export function PembalikModal({
  isOpen,
  onClose,
  jurnalId,
  jurnalNomor,
  daftarPeriode,
  onSuccess,
}: PembalikModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [tanggalPembalik, setTanggalPembalik] = useState<string>(todayStr);
  const [keterangan, setKeterangan] = useState<string>(
    `Pembalik jurnal ${jurnalNomor}: Koreksi transaksi`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deteksi periode untuk tanggal pembalik
  const periodePembalik = useMemo(() => {
    if (!tanggalPembalik) return null;
    const parts = tanggalPembalik.split("-");
    if (parts.length < 2) return null;
    const tahun = parseInt(parts[0], 10);
    const bulan = parseInt(parts[1], 10);

    const match = daftarPeriode.find((p) => p.tahun === tahun && p.bulan === bulan);
    return {
      tahun,
      bulan,
      ditemukan: Boolean(match),
      periode: match || null,
      status: match ? match.status : ("tidak_ada" as const),
    };
  }, [tanggalPembalik, daftarPeriode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!tanggalPembalik) {
      setErrorMessage("Tanggal jurnal pembalik wajib dipilih.");
      return;
    }

    if (!periodePembalik || !periodePembalik.ditemukan) {
      setErrorMessage("Periode akuntansi untuk tanggal pembalik ini belum dibuat di sistem (BR-05).");
      return;
    }

    if (periodePembalik.status !== "terbuka") {
      setErrorMessage(
        `Tanggal pembalik berada di periode yang telah ditutup (${formatBulanTahun(
          periodePembalik.tahun,
          periodePembalik.bulan
        )}) (BR-05).`
      );
      return;
    }

    if (keterangan.trim().length < 5) {
      setErrorMessage("Alasan / keterangan jurnal pembalik wajib diisi minimal 5 karakter.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      // Panggil RPC buat_jurnal_pembalik murni lewat client sesi pengguna (RLS aktif)
      const { data: newJurnal, error } = await supabase.rpc("buat_jurnal_pembalik", {
        p_jurnal_id: jurnalId,
        p_tanggal_pembalik: tanggalPembalik,
        p_keterangan: keterangan.trim(),
      });

      if (error) {
        throw error;
      }

      onSuccess(newJurnal.id, newJurnal.nomor || "Nomor JU");
    } catch (err: unknown) {
      console.error("Gagal membuat jurnal pembalik:", err);
      setErrorMessage(getFriendlyErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  const isPeriodClosed = periodePembalik?.status === "ditutup";
  const isPeriodMissing = periodePembalik?.status === "tidak_ada";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pembalik-modal-title"
    >
      <div className="sogan-card w-full max-w-xl rounded-2xl border border-amber-500/25 bg-[#0e0c0a] p-6 sm:p-7 shadow-2xl space-y-5 text-[#fdfaf6]">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-amber-900/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <h2 id="pembalik-modal-title" className="text-xl font-bold text-[#fdfaf6]">
                Buat Jurnal Pembalik (Koreksi)
              </h2>
            </div>
            <p className="text-sm text-[#a89f91]">
              Membalik posisi debit dan kredit jurnal <strong className="font-mono text-amber-300">{jurnalNomor}</strong> secara otomatis (BR-04)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#8a7e72] hover:text-[#fdfaf6] hover:bg-[#1a1613] rounded-lg p-2 transition text-base"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        {/* Pesan Kesalahan */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-200 flex items-start gap-3"
          >
            <span className="font-bold text-rose-400 text-base">✕</span>
            <div className="flex-1 space-y-1">
              <strong className="block font-semibold">Gagal membalik jurnal:</strong>
              <span className="text-xs sm:text-sm text-rose-300/90">{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Info aturan BR-04 */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4 text-xs sm:text-sm text-amber-200/90 space-y-2">
            <p className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>ℹ</span> Aturan Bisnis Pembalik Jurnal (BR-04 & BR-05):
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#d6cfc7] text-xs sm:text-sm">
              <li>Seluruh baris akun akan disalin dengan membalik posisi debit dan kredit.</li>
              <li>Jurnal pembalik akan langsung diposting dengan nomor JU baru.</li>
              <li>Jurnal asal (<span className="font-mono text-amber-300">{jurnalNomor}</span>) akan ditandai berstatus &quot;Dibalik&quot; secara permanen.</li>
              <li>Tanggal pembalik harus berada pada periode akuntansi yang berstatus terbuka.</li>
            </ul>
          </div>

          {/* Input Tanggal Pembalik */}
          <div>
            <label htmlFor="tanggal-pembalik" className="block font-semibold text-sm sm:text-base text-[#d6cfc7] mb-1.5">
              Tanggal Transaksi Pembalik <span className="text-amber-400">*</span>
            </label>
            <input
              id="tanggal-pembalik"
              type="date"
              value={tanggalPembalik}
              onChange={(e) => setTanggalPembalik(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-3 text-sm sm:text-base text-[#fdfaf6] focus:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:bg-[#100e0c] disabled:opacity-50"
            />
          </div>

          {/* Status Periode Tanggal Pembalik */}
          <div>
            <label htmlFor="status-periode-pembalik" className="block font-semibold text-sm sm:text-base text-[#d6cfc7] mb-1.5">
              Status Periode Akuntansi
            </label>
            <div
              id="status-periode-pembalik"
              className="flex items-center justify-between rounded-xl border border-amber-900/20 bg-[#141210] px-4 py-3 text-sm sm:text-base"
            >
              <span className="font-medium text-[#fdfaf6]">
                {periodePembalik
                  ? formatBulanTahun(periodePembalik.tahun, periodePembalik.bulan)
                  : "Pilih tanggal"}
              </span>
              {periodePembalik && (
                <div>
                  {periodePembalik.status === "terbuka" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                      ✓ Terbuka
                    </span>
                  )}
                  {periodePembalik.status === "ditutup" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/60 border border-rose-500/40 px-3 py-1 text-xs font-bold text-rose-300">
                      ✕ Ditutup (BR-05)
                    </span>
                  )}
                  {periodePembalik.status === "tidak_ada" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/60 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300">
                      ⚠ Belum Dibuat
                    </span>
                  )}
                </div>
              )}
            </div>
            {isPeriodClosed && (
              <p className="text-xs sm:text-sm text-rose-400 mt-1.5 flex items-center gap-1">
                <span>⚠</span> Tanggal pembalik berada pada periode yang telah ditutup (BR-05).
              </p>
            )}
            {isPeriodMissing && (
              <p className="text-xs sm:text-sm text-amber-400 mt-1.5 flex items-center gap-1">
                <span>⚠</span> Periode akuntansi belum dibuat di sistem.
              </p>
            )}
          </div>

          {/* Keterangan Pembalik */}
          <div>
            <label htmlFor="keterangan-pembalik" className="block font-semibold text-sm sm:text-base text-[#d6cfc7] mb-1.5">
              Keterangan / Alasan Pembalik <span className="text-amber-400">*</span>
            </label>
            <textarea
              id="keterangan-pembalik"
              rows={3}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={isSubmitting}
              placeholder="Jelaskan alasan pembalikan / koreksi jurnal..."
              required
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-3 text-sm sm:text-base text-[#fdfaf6] placeholder-[#5a524a] focus:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:bg-[#100e0c]"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-amber-900/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-3d-dark px-5 py-2.5 font-bold text-sm sm:text-base disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPeriodClosed || isPeriodMissing}
              className="btn-3d-gold inline-flex items-center gap-2 px-6 py-2.5 font-bold text-sm sm:text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Memproses Pembalik...</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">🔄</span>
                  <span>Eksekusi Jurnal Pembalik</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

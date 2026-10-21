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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pembalik-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
        {/* Header Modal */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 id="pembalik-modal-title" className="text-base font-bold text-slate-900">
              Buat Jurnal Pembalik (Koreksi)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Membalik posisi debit dan kredit jurnal <strong className="font-mono">{jurnalNomor}</strong> secara otomatis (BR-04)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        {/* Pesan Kesalahan */}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2"
          >
            <span className="font-bold text-red-600">✕</span>
            <div className="flex-1">
              <strong className="block font-semibold">Gagal membalik jurnal:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Info aturan BR-04 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-[11px] text-blue-900 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <span>ℹ</span> Aturan Bisnis Pembalik Jurnal (BR-04 & BR-05):
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>Seluruh baris akun akan disalin dengan membalik posisi debit dan kredit.</li>
              <li>Jurnal pembalik akan langsung diposting dengan nomor JU baru.</li>
              <li>Jurnal asal ({jurnalNomor}) akan ditandai berstatus &quot;Dibalik&quot; secara permanen.</li>
              <li>Tanggal pembalik harus berada pada periode akuntansi yang berstatus terbuka.</li>
            </ul>
          </div>

          {/* Input Tanggal Pembalik */}
          <div>
            <label htmlFor="tanggal-pembalik" className="block font-semibold text-slate-700 mb-1">
              Tanggal Transaksi Pembalik <span className="text-red-500">*</span>
            </label>
            <input
              id="tanggal-pembalik"
              type="date"
              value={tanggalPembalik}
              onChange={(e) => setTanggalPembalik(e.target.value)}
              disabled={isSubmitting}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-50"
            />
          </div>

          {/* Status Periode Tanggal Pembalik */}
          <div>
            <label htmlFor="status-periode-pembalik" className="block font-semibold text-slate-700 mb-1">
              Status Periode Akuntansi
            </label>
            <div
              id="status-periode-pembalik"
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
            >
              <span className="font-medium text-slate-700">
                {periodePembalik
                  ? formatBulanTahun(periodePembalik.tahun, periodePembalik.bulan)
                  : "Pilih tanggal"}
              </span>
              {periodePembalik && (
                <div>
                  {periodePembalik.status === "terbuka" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      ✓ Terbuka
                    </span>
                  )}
                  {periodePembalik.status === "ditutup" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                      ✕ Ditutup (BR-05)
                    </span>
                  )}
                  {periodePembalik.status === "tidak_ada" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                      ⚠ Belum Dibuat
                    </span>
                  )}
                </div>
              )}
            </div>
            {isPeriodClosed && (
              <p className="text-[11px] text-red-600 mt-1">
                ⚠ Tanggal pembalik berada pada periode yang telah ditutup (BR-05).
              </p>
            )}
            {isPeriodMissing && (
              <p className="text-[11px] text-amber-700 mt-1">
                ⚠ Periode akuntansi belum dibuat di sistem.
              </p>
            )}
          </div>

          {/* Keterangan Pembalik */}
          <div>
            <label htmlFor="keterangan-pembalik" className="block font-semibold text-slate-700 mb-1">
              Keterangan / Alasan Pembalik <span className="text-red-500">*</span>
            </label>
            <textarea
              id="keterangan-pembalik"
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              disabled={isSubmitting}
              placeholder="Jelaskan alasan pembalikan / koreksi jurnal..."
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-50"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPeriodClosed || isPeriodMissing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white hover:bg-amber-900 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-xs">⏳</span>
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

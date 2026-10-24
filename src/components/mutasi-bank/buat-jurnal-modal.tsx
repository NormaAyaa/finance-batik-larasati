"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import type { AkunOption, MutasiBankWithRelations } from "@/lib/mutasi-bank/types";

interface BuatJurnalModalProps {
  isOpen: boolean;
  mutasi: MutasiBankWithRelations | null;
  akunList: AkunOption[];
  onClose: () => void;
  onSuccess: (jurnalId: number) => void;
}

export function BuatJurnalModal({
  isOpen,
  mutasi,
  akunList,
  onClose,
  onSuccess,
}: BuatJurnalModalProps) {
  const [selectedLawanId, setSelectedLawanId] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen || !mutasi) return null;

  // Nilai awal keterangan jika belum diubah
  const defaultKeterangan = keterangan || mutasi.deskripsi;
  const isUangMasuk = mutasi.jumlah > 0;
  const nominalAbs = Math.abs(mutasi.jumlah);

  // Filter akun lawan: akun aktif dan tidak sama dengan akun bank mutasi
  const eligibleAkunLawan = akunList.filter(
    (a) => a.aktif && a.id !== mutasi.akun_bank_id
  );

  const selectedAkunLawan = eligibleAkunLawan.find(
    (a) => a.id === parseInt(selectedLawanId, 10)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const akunLawanId = parseInt(selectedLawanId, 10);
    if (!akunLawanId || isNaN(akunLawanId)) {
      setErrorMessage("Silakan pilih akun lawan transaksi terlebih dahulu.");
      return;
    }

    const finalKeterangan = (keterangan || mutasi.deskripsi).trim();
    if (finalKeterangan.length < 5) {
      setErrorMessage("Keterangan jurnal wajib diisi minimal 5 karakter.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("buat_draf_dari_mutasi", {
          p_mutasi_id: mutasi.id,
          p_akun_lawan_id: akunLawanId,
        });

        if (error) throw error;
        if (!data) throw new Error("Gagal membuat draf jurnal dari mutasi bank.");

        onSuccess(data.id);
      } catch (err: unknown) {
        console.error("Gagal membuat draf jurnal:", err);
        setErrorMessage(getFriendlyErrorMessage(err));
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="buat-jurnal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 id="buat-jurnal-title" className="text-base font-bold text-slate-900">
              Buat Draf Jurnal dari Mutasi Bank
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem akan membuat draf jurnal umum berstatus draf dengan 2 baris seimbang (BR-02)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-200 transition disabled:opacity-50"
            aria-label="Tutup form"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2"
            >
              <span className="font-bold text-red-600">⚠</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Rincian Mutasi Terpilih */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Rincian Mutasi Rekening:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div>
                <span className="text-slate-500 block">Tanggal Mutasi:</span>
                <span className="font-semibold text-slate-900">{formatDate(mutasi.tanggal)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Akun Bank:</span>
                <span className="font-semibold text-slate-900">
                  {mutasi.akun_bank ? `${mutasi.akun_bank.kode} - ${mutasi.akun_bank.nama}` : `ID: ${mutasi.akun_bank_id}`}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Uraian / Deskripsi:</span>
                <span className="font-medium text-slate-900 break-words">{mutasi.deskripsi}</span>
              </div>
              <div className="col-span-2 flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-600 font-medium">Arah & Nilai Mutasi:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded text-xs inline-flex items-center gap-1 ${
                    isUangMasuk
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  <span>{isUangMasuk ? "↓ Uang Masuk (Penerimaan)" : "↑ Uang Keluar (Pengeluaran)"}:</span>
                  <span className="font-mono">{formatRupiah(nominalAbs)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Input Akun Lawan */}
          <div className="space-y-1">
            <label htmlFor="pilih-akun-lawan" className="block text-xs font-bold text-slate-800">
              Pilih Akun Lawan <span className="text-red-500">*</span>
            </label>
            <select
              id="pilih-akun-lawan"
              value={selectedLawanId}
              onChange={(e) => setSelectedLawanId(e.target.value)}
              required
              disabled={isPending}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Pilih Akun Lawan --</option>
              {eligibleAkunLawan.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.kode} - {a.nama} ({a.tipe.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              {isUangMasuk
                ? "Untuk uang masuk, akun lawan biasanya Pendapatan atau Piutang (dikreditkan)."
                : "Untuk uang keluar, akun lawan biasanya Beban atau Utang (didebitkan)."}
            </p>
          </div>

          {/* Input Keterangan Jurnal */}
          <div className="space-y-1">
            <label htmlFor="keterangan-jurnal" className="block text-xs font-bold text-slate-800">
              Keterangan Jurnal <span className="text-red-500">*</span>
            </label>
            <textarea
              id="keterangan-jurnal"
              rows={2}
              value={defaultKeterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              required
              minLength={5}
              disabled={isPending}
              placeholder="Contoh: Penerimaan pembayaran dari pelanggan toko"
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500">Minimal 5 karakter. Bawaan diambil dari deskripsi mutasi bank.</p>
          </div>

          {/* Pratinjau Baris Jurnal Seimbang */}
          {selectedAkunLawan && (
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-800 text-[11px]">
                Pratinjau Draf Jurnal yang Akan Dibuat:
              </div>
              <table className="w-full text-left">
                <caption className="sr-only">Pratinjau baris debit dan kredit draf jurnal</caption>
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                  <tr>
                    <th scope="col" className="px-3 py-1.5">Urutan</th>
                    <th scope="col" className="px-3 py-1.5">Akun</th>
                    <th scope="col" className="px-3 py-1.5 text-right">Debit</th>
                    <th scope="col" className="px-3 py-1.5 text-right">Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isUangMasuk ? (
                    <>
                      <tr>
                        <td className="px-3 py-1.5 font-mono text-slate-500">1</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900">
                          {mutasi.akun_bank?.kode} - {mutasi.akun_bank?.nama} (Bank)
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-emerald-700 font-semibold">
                          {formatRupiah(nominalAbs)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-400">Rp 0</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono text-slate-500">2</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900">
                          {selectedAkunLawan.kode} - {selectedAkunLawan.nama}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-400">Rp 0</td>
                        <td className="px-3 py-1.5 text-right font-mono text-blue-700 font-semibold">
                          {formatRupiah(nominalAbs)}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td className="px-3 py-1.5 font-mono text-slate-500">1</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900">
                          {selectedAkunLawan.kode} - {selectedAkunLawan.nama}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-blue-700 font-semibold">
                          {formatRupiah(nominalAbs)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-400">Rp 0</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1.5 font-mono text-slate-500">2</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900">
                          {mutasi.akun_bank?.kode} - {mutasi.akun_bank?.nama} (Bank)
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-400">Rp 0</td>
                        <td className="px-3 py-1.5 text-right font-mono text-red-700 font-semibold">
                          {formatRupiah(nominalAbs)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedLawanId}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <span className="animate-spin text-sm">⏳</span> Menyimpan Jurnal...
                </>
              ) : (
                <>
                  <span>✓</span> Buat Draf Jurnal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

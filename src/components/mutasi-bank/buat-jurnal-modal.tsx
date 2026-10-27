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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="sogan-card relative w-full max-w-xl bg-[#0e0c0a] rounded-2xl shadow-2xl border border-amber-500/25 overflow-hidden my-8 text-[#fdfaf6]">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-amber-900/30 flex items-center justify-between bg-gradient-to-r from-amber-950/30 to-[#0e0c0a]">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <h3 id="buat-jurnal-title" className="text-base sm:text-lg font-bold text-[#fdfaf6] tracking-tight">
                Buat Draf Jurnal dari Mutasi Bank
              </h3>
            </div>
            <p className="text-xs text-[#a89f91] mt-1">
              Sistem akan membuat draf jurnal umum berstatus draf dengan 2 baris seimbang (BR-02)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-[#a89f91] hover:text-[#fdfaf6] rounded-xl p-2 hover:bg-amber-950/40 border border-transparent hover:border-amber-900/40 transition disabled:opacity-50"
            aria-label="Tutup form"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5"
            >
              <span className="font-bold text-rose-400">⚠</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Rincian Mutasi Terpilih */}
          <div className="bg-[#141210] border border-amber-900/20 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <span>💳</span> Rincian Mutasi Rekening:
            </h4>
            <div className="grid grid-cols-2 gap-3 text-[#d6cfc7]">
              <div>
                <span className="text-[#a89f91] block text-[11px]">Tanggal Mutasi:</span>
                <span className="font-semibold text-[#fdfaf6]">{formatDate(mutasi.tanggal)}</span>
              </div>
              <div>
                <span className="text-[#a89f91] block text-[11px]">Akun Bank:</span>
                <span className="font-semibold text-amber-300">
                  {mutasi.akun_bank ? `${mutasi.akun_bank.kode} - ${mutasi.akun_bank.nama}` : `ID: ${mutasi.akun_bank_id}`}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-[#a89f91] block text-[11px]">Uraian / Deskripsi:</span>
                <span className="font-medium text-[#fdfaf6] break-words">{mutasi.deskripsi}</span>
              </div>
              <div className="col-span-2 flex items-center justify-between border-t border-amber-900/20 pt-3 mt-1">
                <span className="text-[#a89f91] font-medium text-xs">Arah & Nilai Mutasi:</span>
                <span
                  className={`font-bold px-3 py-1 rounded-lg text-xs inline-flex items-center gap-1.5 ${
                    isUangMasuk
                      ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-950/50 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  <span>{isUangMasuk ? "↓ Uang Masuk (Penerimaan)" : "↑ Uang Keluar (Pengeluaran)"}:</span>
                  <span className="font-mono font-bold">{formatRupiah(nominalAbs)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Input Akun Lawan */}
          <div className="space-y-1.5">
            <label htmlFor="pilih-akun-lawan" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider">
              Pilih Akun Lawan <span className="text-amber-400">*</span>
            </label>
            <select
              id="pilih-akun-lawan"
              value={selectedLawanId}
              onChange={(e) => setSelectedLawanId(e.target.value)}
              required
              disabled={isPending}
              className="w-full text-xs sm:text-sm rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2.5 text-[#fdfaf6] focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition"
            >
              <option value="" className="bg-[#141210] text-[#a89f91]">-- Pilih Akun Lawan --</option>
              {eligibleAkunLawan.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#141210] text-[#fdfaf6]">
                  {a.kode} - {a.nama} ({a.tipe.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#a89f91]">
              {isUangMasuk
                ? "Untuk uang masuk, akun lawan biasanya Pendapatan atau Piutang (dikreditkan)."
                : "Untuk uang keluar, akun lawan biasanya Beban atau Utang (didebitkan)."}
            </p>
          </div>

          {/* Input Keterangan Jurnal */}
          <div className="space-y-1.5">
            <label htmlFor="keterangan-jurnal" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider">
              Keterangan Jurnal <span className="text-amber-400">*</span>
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
              className="w-full text-xs sm:text-sm rounded-xl border border-amber-900/30 bg-[#141210] p-3 text-[#fdfaf6] placeholder-[#5c554b] focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition"
            />
            <p className="text-[11px] text-[#a89f91]">Minimal 5 karakter. Bawaan diambil dari deskripsi mutasi bank.</p>
          </div>

          {/* Pratinjau Baris Jurnal Seimbang */}
          {selectedAkunLawan && (
            <div className="border border-amber-900/30 rounded-xl overflow-hidden text-xs bg-[#141210]">
              <div className="bg-amber-950/30 px-4 py-2 font-bold text-amber-300 text-[11px] border-b border-amber-900/30 flex items-center gap-1.5">
                <span>⚖</span> Pratinjau Draf Jurnal yang Akan Dibuat:
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">Pratinjau baris debit dan kredit draf jurnal</caption>
                  <thead className="bg-[#0e0c0a] border-b border-amber-900/20 text-[#a89f91] text-[11px] uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-3.5 py-2">Urutan</th>
                      <th scope="col" className="px-3.5 py-2">Akun</th>
                      <th scope="col" className="px-3.5 py-2 text-right">Debit</th>
                      <th scope="col" className="px-3.5 py-2 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10 text-xs">
                    {isUangMasuk ? (
                      <>
                        <tr className="hover:bg-amber-950/20 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono text-[#a89f91]">1</td>
                          <td className="px-3.5 py-2.5 font-semibold text-[#fdfaf6]">
                            {mutasi.akun_bank?.kode} - {mutasi.akun_bank?.nama} (Bank)
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-emerald-400 font-bold">
                            {formatRupiah(nominalAbs)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-[#5c554b]">Rp 0</td>
                        </tr>
                        <tr className="hover:bg-amber-950/20 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono text-[#a89f91]">2</td>
                          <td className="px-3.5 py-2.5 font-semibold text-[#fdfaf6]">
                            {selectedAkunLawan.kode} - {selectedAkunLawan.nama}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-[#5c554b]">Rp 0</td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-amber-400 font-bold">
                            {formatRupiah(nominalAbs)}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr className="hover:bg-amber-950/20 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono text-[#a89f91]">1</td>
                          <td className="px-3.5 py-2.5 font-semibold text-[#fdfaf6]">
                            {selectedAkunLawan.kode} - {selectedAkunLawan.nama}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-amber-400 font-bold">
                            {formatRupiah(nominalAbs)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-[#5c554b]">Rp 0</td>
                        </tr>
                        <tr className="hover:bg-amber-950/20 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono text-[#a89f91]">2</td>
                          <td className="px-3.5 py-2.5 font-semibold text-[#fdfaf6]">
                            {mutasi.akun_bank?.kode} - {mutasi.akun_bank?.nama} (Bank)
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-[#5c554b]">Rp 0</td>
                          <td className="px-3.5 py-2.5 text-right font-mono text-rose-400 font-bold">
                            {formatRupiah(nominalAbs)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-amber-900/20">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 text-xs font-bold text-[#d6cfc7] bg-[#141210] border border-amber-900/30 rounded-xl hover:bg-amber-950/40 hover:text-[#fdfaf6] transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedLawanId}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-[#070605] bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-lg shadow-amber-950/40 transition disabled:opacity-50"
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

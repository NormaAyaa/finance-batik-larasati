"use client";

import { useState } from "react";
import { CONTOH_CSV_TEMPLATE } from "@/lib/mutasi-bank/csv-parser";

interface FormatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FormatModal({ isOpen, onClose }: FormatModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTOH_CSV_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback jika clipboard API tidak diizinkan
      alert("Gagal menyalin teks secara otomatis. Silakan salin teks manual dari kotak di bawah.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([CONTOH_CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "contoh_mutasi_bank.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="format-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="sogan-card relative w-full max-w-2xl bg-[#0e0c0a] rounded-2xl shadow-2xl border border-amber-500/25 overflow-hidden my-8 text-[#fdfaf6]">
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-amber-900/30 flex items-center justify-between bg-gradient-to-r from-amber-950/30 to-[#0e0c0a]">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <h3 id="format-modal-title" className="text-base sm:text-lg font-bold text-[#fdfaf6] tracking-tight">
                Format & Contoh Berkas CSV Mutasi Bank
              </h3>
            </div>
            <p className="text-xs text-[#a89f91] mt-1">
              Panduan struktur kolom dan ketentuan pengisian berkas rekening koran
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#a89f91] hover:text-[#fdfaf6] rounded-xl p-2 hover:bg-amber-950/40 border border-transparent hover:border-amber-900/40 transition"
            aria-label="Tutup panduan"
          >
            ✕
          </button>
        </div>

        {/* Konten Modal */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm">
          {/* Ketentuan Berkas */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-5 text-xs space-y-3 text-amber-200/90">
            <h4 className="font-bold text-amber-300 flex items-center gap-2 text-xs uppercase tracking-wider">
              <span>📋</span> Ketentuan Berkas Impor:
            </h4>
            <ul className="list-disc list-inside space-y-2 pl-1 text-[#d6cfc7]">
              <li>
                <strong className="text-[#fdfaf6]">Batas ukuran berkas:</strong> Maksimal 1 MB dan 2.000 baris transaksi.
              </li>
              <li>
                <strong className="text-[#fdfaf6]">Pemisah kolom:</strong> Mendukung tanda koma (<code className="bg-[#141210] px-1.5 py-0.5 rounded border border-amber-900/40 font-mono text-amber-300">,</code>) atau titik koma (<code className="bg-[#141210] px-1.5 py-0.5 rounded border border-amber-900/40 font-mono text-amber-300">;</code>) yang terdeteksi otomatis.
              </li>
              <li>
                <strong className="text-[#fdfaf6]">Encoding:</strong> UTF-8 (dengan atau tanpa BOM).
              </li>
              <li>
                <strong className="text-[#fdfaf6]">Nama Kolom (Toleran sinonim):</strong>
                <ul className="list-circle list-inside pl-4 mt-1.5 space-y-1 text-[#a89f91]">
                  <li><span className="font-semibold text-[#fdfaf6]">tanggal:</span> tanggal, date, tgl. Format: <code className="bg-[#141210] px-1 py-0.5 rounded border border-amber-900/30 font-mono text-amber-300">YYYY-MM-DD</code> atau <code className="bg-[#141210] px-1 py-0.5 rounded border border-amber-900/30 font-mono text-amber-300">DD/MM/YYYY</code>.</li>
                  <li><span className="font-semibold text-[#fdfaf6]">deskripsi:</span> deskripsi, keterangan, uraian, description, memo (wajib diisi).</li>
                  <li><span className="font-semibold text-[#fdfaf6]">jumlah:</span> jumlah, amount, nominal, mutasi (rupiah bulat, positif = uang masuk, negatif = uang keluar, 0 ditolak).</li>
                  <li><span className="font-semibold text-[#fdfaf6]">saldo:</span> saldo, balance (boleh kosong).</li>
                </ul>
              </li>
              <li>
                <strong className="text-[#fdfaf6]">Format Angka Rupiah:</strong> Boleh bertanda minus (<code className="font-mono text-amber-300">-500000</code>), boleh berpemisah ribuan titik atau koma (<code className="font-mono text-amber-300">1.000.000</code>), boleh akhiran <code className="font-mono text-amber-300">,00</code> atau <code className="font-mono text-amber-300">.00</code>. Pecahan selain nol ditolak.
              </li>
            </ul>
          </div>

          {/* Kotak Contoh CSV */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="csv-preview-text" className="font-bold text-[#fdfaf6] text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>📄</span> Isi Contoh Berkas CSV:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-900/30 bg-[#141210] text-[#d6cfc7] hover:bg-amber-950/40 hover:text-[#fdfaf6] transition"
                >
                  {copied ? "✓ Tersalin!" : "📋 Salin Teks"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-[#070605] shadow-sm transition"
                >
                  ⬇ Unduh File CSV
                </button>
              </div>
            </div>
            <textarea
              id="csv-preview-text"
              readOnly
              rows={8}
              value={CONTOH_CSV_TEMPLATE}
              className="w-full font-mono text-xs sm:text-sm p-4 bg-[#141210] text-amber-200/90 rounded-xl border border-amber-900/30 focus:outline-none focus:ring-2 focus:ring-amber-500/40 select-all leading-relaxed"
            />
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-4 border-t border-amber-900/20 bg-[#0e0c0a] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-[#d6cfc7] bg-[#141210] border border-amber-900/30 rounded-xl hover:bg-amber-950/40 hover:text-[#fdfaf6] transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

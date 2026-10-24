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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 id="format-modal-title" className="text-base font-bold text-slate-900">
              Format & Contoh Berkas CSV Mutasi Bank
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Panduan struktur kolom dan ketentuan pengisian berkas rekening koran
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-200 transition"
            aria-label="Tutup panduan"
          >
            ✕
          </button>
        </div>

        {/* Konten Modal */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          {/* Ketentuan Berkas */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs space-y-2 text-blue-900">
            <h4 className="font-bold text-blue-950 flex items-center gap-1.5">
              <span>📋</span> Ketentuan Berkas Impor:
            </h4>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
              <li>
                <strong>Batas ukuran berkas:</strong> Maksimal 1 MB dan 2.000 baris transaksi.
              </li>
              <li>
                <strong>Pemisah kolom:</strong> Mendukung tanda koma (<code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono">,</code>) atau titik koma (<code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono">;</code>) yang terdeteksi otomatis.
              </li>
              <li>
                <strong>Encoding:</strong> UTF-8 (dengan atau tanpa BOM).
              </li>
              <li>
                <strong>Nama Kolom (Toleran sinonim):</strong>
                <ul className="list-circle list-inside pl-4 mt-1 space-y-0.5 text-slate-600">
                  <li><span className="font-semibold text-slate-800">tanggal:</span> tanggal, date, tgl. Format: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">YYYY-MM-DD</code> atau <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">DD/MM/YYYY</code>.</li>
                  <li><span className="font-semibold text-slate-800">deskripsi:</span> deskripsi, keterangan, uraian, description, memo (wajib diisi).</li>
                  <li><span className="font-semibold text-slate-800">jumlah:</span> jumlah, amount, nominal, mutasi (rupiah bulat, positif = uang masuk, negatif = uang keluar, 0 ditolak).</li>
                  <li><span className="font-semibold text-slate-800">saldo:</span> saldo, balance (boleh kosong).</li>
                </ul>
              </li>
              <li>
                <strong>Format Angka Rupiah:</strong> Boleh bertanda minus (<code className="font-mono">-500000</code>), boleh berpemisah ribuan titik atau koma (<code className="font-mono">1.000.000</code>), boleh akhiran <code className="font-mono">,00</code> atau <code className="font-mono">.00</code>. Pecahan selain nol ditolak.
              </li>
            </ul>
          </div>

          {/* Kotak Contoh CSV */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="csv-preview-text" className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Isi Contoh Berkas CSV:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition"
                >
                  {copied ? "✓ Tersalin!" : "📋 Salin Teks"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
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
              className="w-full font-mono text-xs p-3 bg-slate-900 text-slate-100 rounded-lg border border-slate-800 focus:outline-none select-all"
            />
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

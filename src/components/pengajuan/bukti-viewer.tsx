"use client";

import React, { useState } from "react";

interface BuktiViewerProps {
  signedUrl: string | null;
  buktiPath: string | null;
}

export function BuktiViewer({ signedUrl, buktiPath }: BuktiViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!buktiPath || !signedUrl) {
    return (
      <div className="rounded-xl border border-dashed border-amber-900/40 bg-[#141210] p-8 text-center text-sm sm:text-base text-[#a89f91]">
        <span aria-hidden="true" className="text-3xl block mb-2">
          📄
        </span>
        Belum ada bukti transaksi yang diunggah untuk pengajuan ini.
      </div>
    );
  }

  const rawFileName = buktiPath.split("/").pop() || "bukti-transaksi";
  const fileName = rawFileName.replace(/^\d+-/, "");
  const isPdf =
    buktiPath.toLowerCase().endsWith(".pdf") ||
    signedUrl.toLowerCase().includes(".pdf");

  return (
    <div className="space-y-4">
      {isPdf ? (
        // Tampilan Dokumen PDF
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-amber-900/30 bg-[#141210]">
          <div className="flex items-center gap-3.5">
            <span aria-hidden="true" className="text-4xl text-rose-400">
              📑
            </span>
            <div>
              <p className="text-sm sm:text-base font-bold text-[#fdfaf6] truncate max-w-xs sm:max-w-md">
                {fileName}
              </p>
              <p className="text-xs sm:text-sm text-[#a89f91]">
                Dokumen Bukti Nota / Faktur (Format PDF)
              </p>
            </div>
          </div>
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-amber-900/40 bg-[#161310] hover:bg-[#1e1a16] text-amber-300 px-4 py-2.5 text-sm sm:text-base font-semibold shadow-sm transition"
          >
            Buka Dokumen PDF ↗
          </a>
        </div>
      ) : (
        // Tampilan Gambar (JPG / PNG) dengan Thumbnail dan Modal Zoom
        <div className="space-y-2.5">
          <div className="relative group max-w-sm rounded-xl overflow-hidden border border-amber-900/30 bg-[#141210] shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt="Bukti transaksi pengajuan"
              className="w-full max-h-72 object-cover group-hover:opacity-90 transition cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            />
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition text-[#fdfaf6] text-sm font-semibold gap-2 focus:opacity-100 focus:outline-none backdrop-blur-xs"
            >
              <span aria-hidden="true" className="text-lg">
                🔍
              </span>
              Perbesar Bukti
            </button>
          </div>
          <div className="flex items-center justify-between max-w-sm text-xs sm:text-sm text-[#a89f91] px-1">
            <span className="truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold underline"
            >
              Klik untuk memperbesar
            </button>
          </div>
        </div>
      )}

      {/* Modal Lightbox untuk Perbesar Gambar */}
      {isModalOpen && !isPdf && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan Bukti Transaksi Diperbesar"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] sogan-card bg-[#0e0c0a] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/20 bg-[#141210]">
              <span className="text-xs font-bold text-[#fdfaf6] truncate max-w-md">
                Bukti: {fileName}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded-lg hover:bg-[#1e1a16] transition"
                  title="Buka gambar di tab baru"
                >
                  Buka di Tab Baru ↗
                </a>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-[#a89f91] hover:bg-[#1e1a16] hover:text-[#fdfaf6] transition"
                  aria-label="Tutup pratinjau bukti"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Gambar Diperbesar */}
            <div className="p-3 overflow-auto flex items-center justify-center bg-[#070605]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signedUrl}
                alt="Bukti transaksi pengajuan diperbesar"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

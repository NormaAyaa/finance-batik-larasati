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
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
        <span aria-hidden="true" className="text-xl block mb-1">
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
    <div className="space-y-3">
      {isPdf ? (
        // Tampilan Dokumen PDF
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-3xl text-rose-600">
              📑
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {fileName}
              </p>
              <p className="text-[11px] text-slate-500">
                Dokumen Bukti Nota / Faktur (Format PDF)
              </p>
            </div>
          </div>
          <a
            href={signedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 text-xs font-semibold shadow-sm transition"
          >
            Buka Dokumen PDF ↗
          </a>
        </div>
      ) : (
        // Tampilan Gambar (JPG / PNG) dengan Thumbnail dan Modal Zoom
        <div className="space-y-2">
          <div className="relative group max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt="Bukti transaksi pengajuan"
              className="w-full max-h-64 object-cover group-hover:opacity-90 transition cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            />
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition text-white text-xs font-semibold gap-1.5 focus:opacity-100 focus:outline-none"
            >
              <span aria-hidden="true" className="text-base">
                🔍
              </span>
              Perbesar Bukti
            </button>
          </div>
          <div className="flex items-center justify-between max-w-sm text-[11px] text-slate-500 px-1">
            <span className="truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-amber-800 hover:text-amber-900 font-semibold underline"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-xs font-bold text-slate-800 truncate max-w-md">
                Bukti: {fileName}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-200 transition"
                  title="Buka gambar di tab baru"
                >
                  Buka di Tab Baru ↗
                </a>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
                  aria-label="Tutup pratinjau bukti"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Gambar Diperbesar */}
            <div className="p-2 overflow-auto flex items-center justify-center bg-slate-950/10">
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

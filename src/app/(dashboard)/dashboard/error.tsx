"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error secara internal untuk debugging tanpa mengekspos ke UI pengguna
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-2xl font-bold mb-4 border border-rose-200">
        ⚠️
      </div>
      <h1 className="text-lg font-bold text-slate-900">
        Kendala Memuat Halaman Dashboard
      </h1>
      <p className="text-xs text-slate-500 mt-2 max-w-md">
        Terjadi kendala saat mengambil data ringkasan keuangan atau pengajuan.
        Silakan coba muat ulang data atau periksa koneksi internet Anda.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs transition focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          Muat Ulang Dashboard
        </button>
        <Link
          href="/pengajuan"
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
        >
          Buka Halaman Pengajuan
        </Link>
      </div>
    </div>
  );
}

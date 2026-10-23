"use client";

import { useSyncExternalStore } from "react";
import { formatDateTime } from "@/lib/utils/formatters";

interface LaporanPrintHeaderProps {
  judul: string;
  subjudul?: string;
  periode?: string;
}

const emptySubscribe = () => () => {};

export function LaporanPrintHeader({
  judul,
  subjudul = "CV Batik Larasati",
  periode,
}: LaporanPrintHeaderProps) {
  // Gunakan useSyncExternalStore untuk membaca waktu klien tanpa efek cascading render atau hydration mismatch
  const printDate = useSyncExternalStore(
    emptySubscribe,
    () => formatDateTime(new Date().toISOString()),
    () => ""
  );

  return (
    <div className="print-only mb-6 border-b-2 border-slate-900 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {subjudul}
          </h1>
          <p className="text-xs text-slate-600">
            Sistem Informasi Keuangan & Akuntansi Internal UMKM
          </p>
        </div>
        <div className="text-right text-[10px] text-slate-500">
          <p>Dicetak pada:</p>
          <p className="font-semibold text-slate-700">{printDate || "Saat dokumen dicetak"}</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
          {judul}
        </h2>
        {periode && (
          <p className="text-xs font-medium text-slate-600 mt-0.5">
            {periode}
          </p>
        )}
      </div>
    </div>
  );
}

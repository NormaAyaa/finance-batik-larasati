import React from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils/formatters";

interface KartuRingkasanProps {
  totalKasBank: number;
  pendapatanBulanIni: number;
  bebanBulanIni: number;
  labaBulanIni: number;
  jumlahPengajuanMenunggu: number;
  peran: "akuntan" | "direktur";
  detailAkuntan?: {
    diajukan: number;
    disetujui: number;
  };
  namaBulan: string;
}

export function KartuRingkasan({
  totalKasBank,
  pendapatanBulanIni,
  bebanBulanIni,
  labaBulanIni,
  jumlahPengajuanMenunggu,
  peran,
  detailAkuntan,
  namaBulan,
}: KartuRingkasanProps) {
  const isRugi = labaBulanIni < 0;

  return (
    <section aria-labelledby="ringkasan-keuangan-title">
      <h2 id="ringkasan-keuangan-title" className="sr-only">
        Ringkasan Keuangan dan Posisi Kas Bulan Berjalan
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Saldo Kas & Bank */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Kas & Bank
            </span>
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-700 text-sm font-bold border border-sky-100"
              aria-hidden="true"
            >
              🏦
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(totalKasBank)}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Per hari ini (WIB)
            </p>
          </div>
        </div>

        {/* 2. Pendapatan Bulan Berjalan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pendapatan
            </span>
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100"
              aria-hidden="true"
            >
              ↗
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight">
              {formatRupiah(pendapatanBulanIni)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Bulan {namaBulan}
            </p>
          </div>
        </div>

        {/* 3. Beban Bulan Berjalan */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Beban
            </span>
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-700 text-sm font-bold border border-amber-100"
              aria-hidden="true"
            >
              ↘
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xl sm:text-2xl font-bold text-amber-800 tracking-tight">
              {formatRupiah(bebanBulanIni)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Bulan {namaBulan}
            </p>
          </div>
        </div>

        {/* 4. Laba / Rugi Bulan Berjalan */}
        <div
          className={`rounded-xl border p-5 shadow-sm hover:shadow transition flex flex-col justify-between ${
            isRugi
              ? "bg-rose-50/40 border-rose-200"
              : "bg-emerald-50/40 border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isRugi ? "text-rose-900" : "text-emerald-900"
              }`}
            >
              {isRugi ? "Rugi Bulan Berjalan" : "Laba Bulan Berjalan"}
            </span>
            {isRugi ? (
              <span
                role="status"
                className="inline-flex items-center gap-1 rounded bg-rose-100 text-rose-800 font-bold px-2 py-0.5 text-xs border border-rose-300"
              >
                <span aria-hidden="true">⚠️</span>
                <span>Rugi</span>
              </span>
            ) : (
              <span
                role="status"
                className="inline-flex items-center gap-1 rounded bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-xs border border-emerald-300"
              >
                <span aria-hidden="true">✓</span>
                <span>Laba</span>
              </span>
            )}
          </div>
          <div className="mt-3">
            <p
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isRugi ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {formatRupiah(labaBulanIni)}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {isRugi ? "Beban melebihi pendapatan" : "Pendapatan melampaui beban"}
            </p>
          </div>
        </div>

        {/* 5. Pengajuan Menunggu */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {peran === "akuntan" ? "Menunggu Akuntan" : "Menunggu Direktur"}
            </span>
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-purple-700 text-sm font-bold border border-purple-100"
              aria-hidden="true"
            >
              ⏳
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {jumlahPengajuanMenunggu}
              </p>
              <span className="text-xs text-slate-500">berkas</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {peran === "akuntan" && detailAkuntan
                ? `${detailAkuntan.diajukan} verifikasi, ${detailAkuntan.disetujui} pembayaran`
                : "Menunggu persetujuan Direktur"}
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100">
            <Link
              href="#tabel-pengajuan-menunggu"
              className="text-[11px] font-medium text-sky-700 hover:text-sky-900 transition flex items-center justify-between"
            >
              <span>Tinjau pengajuan</span>
              <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

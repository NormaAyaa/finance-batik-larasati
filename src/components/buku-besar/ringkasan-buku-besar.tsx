import React from "react";
import type { AkunOption } from "@/lib/buku-besar";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";

interface RingkasanBukuBesarProps {
  akun: AkunOption;
  tanggalDari: string;
  tanggalSampai: string;
  saldoAwal: number;
  totalDebit: number;
  totalKredit: number;
  saldoAkhir: number;
  totalBaris: number;
}

export function RingkasanBukuBesar({
  akun,
  tanggalDari,
  tanggalSampai,
  saldoAwal,
  totalDebit,
  totalKredit,
  saldoAkhir,
  totalBaris,
}: RingkasanBukuBesarProps) {
  // Label klasifikasi tipe akun
  const tipeBadgeColors: Record<string, string> = {
    aset: "bg-blue-50 text-blue-700 border-blue-200",
    kewajiban: "bg-amber-50 text-amber-700 border-amber-200",
    ekuitas: "bg-purple-50 text-purple-700 border-purple-200",
    pendapatan: "bg-emerald-50 text-emerald-700 border-emerald-200",
    beban: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const tipeLabel: Record<string, string> = {
    aset: "Aset",
    kewajiban: "Kewajiban",
    ekuitas: "Ekuitas",
    pendapatan: "Pendapatan",
    beban: "Beban",
  };

  return (
    <div className="space-y-4">
      {/* Kartu Header Informasi Akun */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {akun.kode}
            </span>
            <h2 className="text-base font-bold text-slate-900">{akun.nama}</h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                tipeBadgeColors[akun.tipe] || "bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              Tipe: {tipeLabel[akun.tipe] || akun.tipe}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Saldo Normal: {akun.saldo_normal === "debit" ? "Debit" : "Kredit"}
            </span>
            {akun.is_kas_bank && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-50 text-cyan-700 border border-cyan-200">
                <span aria-hidden="true">🏦</span>
                <span>Kas / Bank</span>
              </span>
            )}
            {!akun.aktif && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-300">
                Nonaktif
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Periode mutasi: <span className="font-medium text-slate-700">{formatDate(tanggalDari)}</span> s.d.{" "}
            <span className="font-medium text-slate-700">{formatDate(tanggalSampai)}</span>
            {" • "}{totalBaris} transaksi ditemukan
          </p>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Ringkasan Saldo & Mutasi */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Saldo Awal */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Saldo Awal</span>
            <span className="text-[11px] font-medium text-slate-400">per {formatDate(tanggalDari)}</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-800 tabular-nums">
            {formatRupiah(saldoAwal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Akumulasi mutasi sebelum tanggal awal</p>
        </div>

        {/* 2. Total Debit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Mutasi Debit</span>
            <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              + Debit
            </span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-800 tabular-nums">
            {formatRupiah(totalDebit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total penambahan/pengurangan debit periode ini</p>
        </div>

        {/* 3. Total Kredit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Mutasi Kredit</span>
            <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              - Kredit
            </span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-slate-800 tabular-nums">
            {formatRupiah(totalKredit)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total penambahan/pengurangan kredit periode ini</p>
        </div>

        {/* 4. Saldo Akhir */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Saldo Akhir</span>
            <span className="text-[11px] font-medium text-amber-700">per {formatDate(tanggalSampai)}</span>
          </div>
          <div className="mt-2 font-mono text-lg font-bold text-amber-950 tabular-nums">
            {formatRupiah(saldoAkhir)}
          </div>
          <p className="text-[11px] text-amber-800/80 mt-1">
            Saldo berjalan akhir mengikuti posisi normal ({akun.saldo_normal})
          </p>
        </div>
      </div>
    </div>
  );
}

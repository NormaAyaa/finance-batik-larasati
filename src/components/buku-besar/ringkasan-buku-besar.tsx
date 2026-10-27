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
    aset: "bg-blue-950/60 text-blue-300 border-blue-500/40",
    kewajiban: "bg-amber-950/60 text-amber-300 border-amber-500/40",
    ekuitas: "bg-purple-950/60 text-purple-300 border-purple-500/40",
    pendapatan: "bg-emerald-950/60 text-emerald-300 border-emerald-500/40",
    beban: "bg-rose-950/60 text-rose-300 border-rose-500/40",
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
      <div className="sogan-card rounded-2xl border border-amber-500/20 bg-[#0e0c0a] p-5 sm:p-6 shadow-xl text-[#fdfaf6]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm sm:text-base font-bold text-amber-300 bg-amber-950/60 px-3 py-1 rounded-xl border border-amber-500/40 shadow-sm">
              {akun.kode}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#fdfaf6]">{akun.nama}</h2>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                tipeBadgeColors[akun.tipe] || "bg-[#141210] text-[#d6cfc7] border-amber-900/30"
              }`}
            >
              Tipe: {tipeLabel[akun.tipe] || akun.tipe}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#141210] text-[#d6cfc7] border border-amber-900/30">
              Saldo Normal: {akun.saldo_normal === "debit" ? "Debit" : "Kredit"}
            </span>
            {akun.is_kas_bank && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/40">
                <span aria-hidden="true">🏦</span>
                <span>Kas / Bank</span>
              </span>
            )}
            {!akun.aktif && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#141210] text-[#8a7e72] border border-amber-900/20">
                Nonaktif
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#a89f91] mt-2">
            Periode mutasi: <span className="font-semibold text-[#fdfaf6]">{formatDate(tanggalDari)}</span> s.d.{" "}
            <span className="font-semibold text-[#fdfaf6]">{formatDate(tanggalSampai)}</span>
            {" • "}<strong className="text-amber-400">{totalBaris}</strong> transaksi ditemukan
          </p>
        </div>
      </div>

      {/* Grid 4 Kartu Metrik Ringkasan Saldo & Mutasi */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Saldo Awal */}
        <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-lg hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#8a7e72] uppercase tracking-wider">Saldo Awal</span>
            <span className="text-xs text-[#8a7e72]">per {formatDate(tanggalDari)}</span>
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold text-[#fdfaf6] tabular-nums">
            {formatRupiah(saldoAwal)}
          </div>
          <p className="text-xs text-[#8a7e72] mt-1">Akumulasi mutasi sebelum tanggal awal</p>
        </div>

        {/* 2. Total Debit */}
        <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-lg hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#8a7e72] uppercase tracking-wider">Total Mutasi Debit</span>
            <span className="inline-flex items-center text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/40">
              + Debit
            </span>
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold text-emerald-300 tabular-nums">
            {formatRupiah(totalDebit)}
          </div>
          <p className="text-xs text-[#8a7e72] mt-1">Total penambahan/pengurangan debit periode ini</p>
        </div>

        {/* 3. Total Kredit */}
        <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-lg hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-semibold text-[#8a7e72] uppercase tracking-wider">Total Mutasi Kredit</span>
            <span className="inline-flex items-center text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/40">
              - Kredit
            </span>
          </div>
          <div className="mt-2 font-mono text-xl sm:text-2xl font-bold text-amber-300 tabular-nums">
            {formatRupiah(totalKredit)}
          </div>
          <p className="text-xs text-[#8a7e72] mt-1">Total penambahan/pengurangan kredit periode ini</p>
        </div>

        {/* 4. Saldo Akhir */}
        <div className="sogan-card rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 to-[#0e0c0a] p-5 shadow-xl hover:border-amber-500/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">Saldo Akhir</span>
            <span className="text-xs text-amber-400/80">per {formatDate(tanggalSampai)}</span>
          </div>
          <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-amber-300 tabular-nums">
            {formatRupiah(saldoAkhir)}
          </div>
          <p className="text-xs text-amber-200/80 mt-1">
            Saldo berjalan akhir posisi normal ({akun.saldo_normal})
          </p>
        </div>
      </div>
    </div>
  );
}

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

  // Format laba rugi sesuai PRD Bagian 9: Angka negatif ditampilkan dalam kurung (Rp ...)
  const formattedLabaRugi = isRugi
    ? `(${formatRupiah(Math.abs(labaBulanIni))})`
    : formatRupiah(labaBulanIni);

  return (
    <section aria-labelledby="ringkasan-keuangan-title" className="select-none">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="ringkasan-keuangan-title" className="text-base font-bold text-[#fdfaf6] tracking-tight flex items-center gap-2">
            <span>Ringkasan Posisi Keuangan</span>
            <span className="text-xs font-normal text-amber-400/70 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded-full">
              Bulan {namaBulan}
            </span>
          </h2>
          <p className="text-xs text-[#a89f91] mt-0.5">
            Posisi kas, pendapatan, beban, dan antrean verifikasi terkini (WIB)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Saldo Kas & Bank */}
        <div className="sogan-card sogan-card-hover p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#a89f91] uppercase tracking-wider">
              Total Kas & Bank
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-300 text-sm group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h0M2 9.5h20" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl font-extrabold text-[#fdfaf6] tracking-tight">
              {formatRupiah(totalKasBank)}
            </p>
            <div className="text-[11px] text-[#a89f91] mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" aria-hidden="true" />
              <span>Kas Kecil & Bank Mandiri</span>
            </div>
          </div>
        </div>

        {/* 2. Pendapatan Bulan Berjalan */}
        <div className="sogan-card sogan-card-hover p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#a89f91] uppercase tracking-wider">
              Pendapatan
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-sm font-bold group-hover:scale-105 transition-transform">
              ↗
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight">
              {formatRupiah(pendapatanBulanIni)}
            </p>
            <p className="text-[11px] text-[#a89f91] mt-1.5 flex items-center gap-1">
              <span className="text-emerald-400/80 font-medium">Bulan berjalan</span>
              <span>• Akun 4xxx</span>
            </p>
          </div>
        </div>

        {/* 3. Beban Bulan Berjalan */}
        <div className="sogan-card sogan-card-hover p-5 flex flex-col justify-between group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#a89f91] uppercase tracking-wider">
              Beban
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-sm font-bold group-hover:scale-105 transition-transform">
              ↘
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl font-extrabold text-amber-300 tracking-tight">
              {formatRupiah(bebanBulanIni)}
            </p>
            <p className="text-[11px] text-[#a89f91] mt-1.5 flex items-center gap-1">
              <span className="text-amber-400/80 font-medium">Bulan berjalan</span>
              <span>• Akun 5xxx</span>
            </p>
          </div>
        </div>

        {/* 4. Laba / Rugi Bulan Berjalan (Format Negatif dalam Kurung Sesuai PRD Seksi 9) */}
        <div
          className={`sogan-card sogan-card-hover p-5 flex flex-col justify-between group ${
            isRugi
              ? "border-rose-900/40 bg-gradient-to-b from-rose-950/20 to-[#0f0d0b]"
              : "border-emerald-900/40 bg-gradient-to-b from-emerald-950/20 to-[#0f0d0b]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#a89f91] uppercase tracking-wider">
              {isRugi ? "Rugi Bersih" : "Laba Bersih"}
            </span>
            {isRugi ? (
              <span
                role="status"
                className="inline-flex items-center gap-1 rounded-full bg-rose-950/70 text-rose-300 font-bold px-2 py-0.5 text-[10px] border border-rose-500/40"
              >
                <span aria-hidden="true">⚠</span>
                <span>Rugi</span>
              </span>
            ) : (
              <span
                role="status"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-950/70 text-emerald-300 font-bold px-2 py-0.5 text-[10px] border border-emerald-500/40"
              >
                <span aria-hidden="true">✓</span>
                <span>Laba</span>
              </span>
            )}
          </div>
          <div className="mt-4">
            <p
              className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                isRugi ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {formattedLabaRugi}
            </p>
            <p className="text-[11px] text-[#a89f91] mt-1.5">
              {isRugi ? "Beban melampaui pendapatan" : "Pendapatan melampaui beban"}
            </p>
          </div>
        </div>

        {/* 5. Pengajuan Menunggu (Action Alert Card) */}
        <div className="sogan-card sogan-card-hover p-5 flex flex-col justify-between border-amber-500/30 bg-gradient-to-b from-amber-950/20 to-[#0f0d0b] group">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              {peran === "akuntan" ? "Antrean Akuntan" : "Antrean Direktur"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-bold group-hover:scale-105 transition-transform">
              ⏳
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <p className="text-xl sm:text-2xl font-extrabold text-[#fdfaf6] tracking-tight">
                {jumlahPengajuanMenunggu}
              </p>
              <span className="text-xs text-[#a89f91]">pengajuan</span>
            </div>
            <p className="text-[11px] text-[#a89f91] mt-1 line-clamp-1">
              {peran === "akuntan" && detailAkuntan
                ? `${detailAkuntan.diajukan} verifikasi, ${detailAkuntan.disetujui} bayar`
                : "Menunggu persetujuan Direktur"}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-900/30">
            <Link
              href="#tabel-pengajuan-menunggu"
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition flex items-center justify-between"
            >
              <span>Tinjau berkas</span>
              <span aria-hidden="true" className="group-hover:translate-y-0.5 transition-transform">↓</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import type { NeracaSaldoData } from "@/lib/laporan";
import { LaporanPrintHeader } from "@/components/laporan/laporan-print-header";
import { CetakButton } from "@/components/laporan/cetak-button";

interface NeracaSaldoViewProps {
  data: NeracaSaldoData | null;
  errorMessage: string | null;
  initialTanggal: string;
}

export function NeracaSaldoView({
  data,
  errorMessage,
  initialTanggal,
}: NeracaSaldoViewProps) {
  const router = useRouter();
  const [tanggal, setTanggal] = useState(initialTanggal);

  const handlePilihTanggal = (tgl: string) => {
    setTanggal(tgl);
    router.push(`/laporan/neraca-saldo?tanggal=${tgl}`);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) return;
    router.push(`/laporan/neraca-saldo?tanggal=${tanggal}`);
  };

  const tanggalLabel = data
    ? `Per Tanggal: ${formatDate(data.tanggal)}`
    : `Per Tanggal: ${formatDate(tanggal)}`;

  const isDataKosong = !data || data.baris.length === 0;

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Header Halaman (Screen View) */}
      <div className="no-print space-y-3">
        <div className="flex items-center gap-2">
          <Link
            href="/laporan"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-amber-400 hover:text-amber-300 transition"
          >
            <span>←</span> Kembali ke Pusat Laporan
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                VALIDASI PEMBUKUAN BERPASANGAN
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#fdfaf6] tracking-tight">
              Neraca Saldo (Trial Balance)
            </h1>
            <p className="text-xs sm:text-sm text-[#a89f91] mt-1 max-w-3xl leading-relaxed">
              Daftar saldo debit dan kredit seluruh bagan akun untuk memastikan validitas dan keseimbangan pembukuan berpasangan CV Batik Larasati (PRD Bagian 7 &amp; BR-11).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CetakButton />
          </div>
        </div>
      </div>

      {/* Header Khusus Cetak */}
      <LaporanPrintHeader judul="Neraca Saldo (Trial Balance)" periode={tanggalLabel} />

      {/* Toolbar Filter Tanggal (No Print) */}
      <div className="no-print sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-xl space-y-4">
        {/* Pilihan Cepat Tanggal Akhir Bulan */}
        <div className="flex flex-wrap items-center gap-2 border-b border-amber-900/20 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 mr-2 flex items-center gap-1.5">
            <span>⚡</span> Pilihan Cepat:
          </span>
          {[
            { label: "31 Juli 2026", tgl: "2026-07-31" },
            { label: "31 Agustus 2026", tgl: "2026-08-31" },
            { label: "30 September 2026", tgl: "2026-09-30" },
            { label: "22 Oktober 2026", tgl: "2026-10-22" },
          ].map((preset) => (
            <button
              key={preset.tgl}
              type="button"
              onClick={() => handlePilihTanggal(preset.tgl)}
              className="btn-3d-dark px-3 py-1.5 text-xs font-semibold"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Form Pemilihan Tanggal Kustom */}
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="filter-tanggal-neraca-saldo" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
              Posisi Per Tanggal
            </label>
            <input
              id="filter-tanggal-neraca-saldo"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
            />
          </div>

          <button
            type="submit"
            className="btn-3d-gold px-5 py-2 text-xs sm:text-sm font-bold"
          >
            Terapkan Tanggal
          </button>
        </form>
      </div>

      {/* Banner Error */}
      {errorMessage && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-300 flex items-start gap-3">
          <span className="text-base font-bold text-rose-400">⚠️</span>
          <div>
            <p className="font-bold text-rose-200">Terjadi Kesalahan</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Tampilan Konten Laporan Kosong */}
      {!errorMessage && isDataKosong && (
        <div className="sogan-card rounded-2xl border border-dashed border-amber-900/30 bg-[#0e0c0a] p-12 text-center text-[#a89f91]">
          <p className="text-base font-bold text-[#fdfaf6]">Tidak ada data akun</p>
          <p className="text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
            Belum ada akun yang terdaftar atau dapat diakses dalam sistem.
          </p>
        </div>
      )}

      {!errorMessage && data && !isDataKosong && (
        <div className="space-y-6 sm:space-y-8">
          {/* Banner Status Keseimbangan Neraca Saldo */}
          <div
            className={`sogan-card rounded-2xl border p-5 sm:p-6 shadow-xl flex items-start sm:items-center justify-between gap-4 ${
              data.is_seimbang
                ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-[#0e0c0a] to-[#0e0c0a] text-emerald-200"
                : "border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-[#0e0c0a] to-[#0e0c0a] text-rose-200"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
                  data.is_seimbang
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 shadow-sm"
                    : "bg-rose-950/60 text-rose-300 border border-rose-500/40 shadow-sm"
                }`}
              >
                {data.is_seimbang ? "✓" : "⚠️"}
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#fdfaf6]">
                    {data.is_seimbang ? "Neraca Saldo Seimbang (Debit = Kredit)" : "Peringatan: Neraca Saldo Tidak Seimbang"}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      data.is_seimbang
                        ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                        : "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    {data.is_seimbang ? "Seimbang" : "Tidak Seimbang"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#d6cfc7] mt-1 max-w-2xl">
                  {data.is_seimbang
                    ? `Total Debit (${formatRupiah(data.total_debit)}) sama persis dengan Total Kredit (${formatRupiah(data.total_kredit)}).`
                    : `Terdapat selisih sebesar ${formatRupiah(data.selisih)} antara debit dan kredit.`}
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a89f91]">
                Selisih Debit / Kredit
              </span>
              <p
                className={`text-xl sm:text-2xl font-mono font-extrabold ${
                  data.is_seimbang ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatRupiah(data.selisih)}
              </p>
            </div>
          </div>

          {/* Tabel Neraca Saldo */}
          <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-amber-950/30 to-[#0e0c0a] px-5 py-4 border-b border-amber-900/20 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <h2 className="text-sm sm:text-base font-bold text-[#fdfaf6] uppercase tracking-wide">
                    Daftar Saldo Akun
                  </h2>
                </div>
                <p className="text-[11px] text-[#a89f91] mt-0.5">
                  Posisi saldo neto satu sisi per akun (termasuk akun dengan saldo nol)
                </p>
              </div>
              <span className="text-xs font-semibold text-[#a89f91]">
                {data.baris.length} akun terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[650px]">
                <caption className="sr-only">Daftar Saldo Debit dan Kredit Seluruh Akun</caption>
                <thead className="border-b border-amber-900/20 bg-[#141210] text-[11px] font-bold uppercase tracking-wider text-[#a89f91]">
                  <tr>
                    <th scope="col" className="px-5 py-3 w-28">Kode</th>
                    <th scope="col" className="px-5 py-3">Nama Akun</th>
                    <th scope="col" className="px-5 py-3 w-36">Klasifikasi</th>
                    <th scope="col" className="px-5 py-3 text-right w-44">Saldo Debit</th>
                    <th scope="col" className="px-5 py-3 text-right w-44">Saldo Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 text-[#d6cfc7]">
                  {data.baris.map((item) => (
                    <tr key={item.akun_id} className="hover:bg-amber-950/20 transition-colors">
                      <td className="px-5 py-3 font-mono text-amber-300/90">{item.kode}</td>
                      <td className="px-5 py-3 font-semibold text-[#fdfaf6]">{item.nama}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-lg bg-amber-950/40 border border-amber-900/30 px-2 py-0.5 text-[11px] capitalize text-amber-200/90 font-medium">
                          {item.tipe}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold">
                        {item.saldo_debit > 0 ? (
                          <span className="text-emerald-400">{formatRupiah(item.saldo_debit)}</span>
                        ) : (
                          <span className="text-[#5c554b]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold">
                        {item.saldo_kredit > 0 ? (
                          <span className="text-amber-400">{formatRupiah(item.saldo_kredit)}</span>
                        ) : (
                          <span className="text-[#5c554b]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-amber-900/40 bg-[#141210] font-bold text-[#fdfaf6]">
                  <tr>
                    <td colSpan={3} className="px-5 py-3.5 text-right uppercase tracking-wider text-xs text-[#a89f91]">
                      Total Saldo Keseluruhan
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-base text-emerald-400">
                      {formatRupiah(data.total_debit)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-base text-amber-400">
                      {formatRupiah(data.total_kredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

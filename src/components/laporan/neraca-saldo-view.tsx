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
    <div className="space-y-6 max-w-5xl">
      {/* Header Halaman (Screen View) */}
      <div className="no-print space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/laporan" className="hover:text-slate-900 transition flex items-center gap-1 font-medium">
            <span>←</span> Kembali ke Laporan Keuangan
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Neraca Saldo
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar saldo debit dan kredit seluruh akun untuk memastikan keseimbangan pembukuan CV Batik Larasati
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
      <div className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Pilihan Cepat Tanggal Akhir Bulan */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-600 mr-1">Pilihan Cepat:</span>
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
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Form Pemilihan Tanggal Kustom */}
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="filter-tanggal-neraca-saldo" className="block text-xs font-semibold text-slate-700 mb-1">
              Posisi Per Tanggal
            </label>
            <input
              id="filter-tanggal-neraca-saldo"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-amber-800 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-900 transition"
          >
            Terapkan Tanggal
          </button>
        </form>
      </div>

      {/* Banner Error */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2">
          <span className="text-base font-bold">⚠️</span>
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Tampilan Konten Laporan */}
      {!errorMessage && isDataKosong && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">Tidak ada data akun</p>
          <p className="text-xs text-slate-500 mt-1">
            Belum ada akun yang terdaftar atau dapat diakses dalam sistem.
          </p>
        </div>
      )}

      {!errorMessage && data && !isDataKosong && (
        <div className="space-y-6">
          {/* Banner Status Keseimbangan Neraca Saldo */}
          <div
            className={`rounded-xl border p-4 shadow-sm flex items-start sm:items-center justify-between gap-4 ${
              data.is_seimbang
                ? "border-emerald-300 bg-emerald-50/80 text-emerald-950"
                : "border-rose-300 bg-rose-50/80 text-rose-950"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                  data.is_seimbang
                    ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                    : "bg-rose-200 text-rose-900 border border-rose-300"
                }`}
              >
                {data.is_seimbang ? "✓" : "⚠️"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">
                    {data.is_seimbang ? "Neraca Saldo Seimbang" : "Peringatan: Neraca Saldo Tidak Seimbang"}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      data.is_seimbang ? "bg-emerald-200 text-emerald-900" : "bg-rose-200 text-rose-900"
                    }`}
                  >
                    {data.is_seimbang ? "Seimbang" : "Tidak Seimbang"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {data.is_seimbang
                    ? `Total Debit (${formatRupiah(data.total_debit)}) sama persis dengan Total Kredit (${formatRupiah(data.total_kredit)}).`
                    : `Terdapat selisih sebesar ${formatRupiah(data.selisih)} antara debit dan kredit.`}
                </p>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Selisih
              </span>
              <p
                className={`text-lg font-mono font-bold ${
                  data.is_seimbang ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                {formatRupiah(data.selisih)}
              </p>
            </div>
          </div>

          {/* Tabel Neraca Saldo */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Daftar Saldo Akun
                </h2>
                <p className="text-[11px] text-slate-500">
                  Posisi saldo neto satu sisi per akun (termasuk akun dengan saldo nol)
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {data.baris.length} akun terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <caption className="sr-only">Daftar Saldo Debit dan Kredit Seluruh Akun</caption>
                <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 w-24">Kode</th>
                    <th scope="col" className="px-4 py-2.5">Nama Akun</th>
                    <th scope="col" className="px-4 py-2.5 w-28">Klasifikasi</th>
                    <th scope="col" className="px-4 py-2.5 text-right w-40">Saldo Debit</th>
                    <th scope="col" className="px-4 py-2.5 text-right w-40">Saldo Kredit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {data.baris.map((item) => (
                    <tr key={item.akun_id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-2.5 font-mono text-slate-600">{item.kode}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{item.nama}</td>
                      <td className="px-4 py-2.5 capitalize text-slate-500 text-[11px]">{item.tipe}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium">
                        {item.saldo_debit > 0 ? (
                          formatRupiah(item.saldo_debit)
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium">
                        {item.saldo_kredit > 0 ? (
                          formatRupiah(item.saldo_kredit)
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                      Total Saldo
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-900">
                      {formatRupiah(data.total_debit)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-900">
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

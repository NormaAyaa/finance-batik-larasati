"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import type { LabaRugiData } from "@/lib/laporan";
import { LaporanPrintHeader } from "@/components/laporan/laporan-print-header";
import { CetakButton } from "@/components/laporan/cetak-button";

interface LabaRugiViewProps {
  data: LabaRugiData | null;
  errorMessage: string | null;
  initialDari: string;
  initialSampai: string;
}

export function LabaRugiView({
  data,
  errorMessage,
  initialDari,
  initialSampai,
}: LabaRugiViewProps) {
  const router = useRouter();
  const [dari, setDari] = useState(initialDari);
  const [sampai, setSampai] = useState(initialSampai);
  const [clientError, setClientError] = useState<string | null>(null);

  // Quick preset filter bulan
  const handlePilihBulan = (bulan: number, tahun: number) => {
    const mm = String(bulan).padStart(2, "0");
    const lastDay = new Date(tahun, bulan, 0).getDate();
    const tglDari = `${tahun}-${mm}-01`;
    const tglSampai = `${tahun}-${mm}-${String(lastDay).padStart(2, "0")}`;
    setDari(tglDari);
    setSampai(tglSampai);
    setClientError(null);
    router.push(`/laporan/laba-rugi?dari=${tglDari}&sampai=${tglSampai}`);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dari || !sampai) {
      setClientError("Tanggal awal dan tanggal akhir wajib diisi.");
      return;
    }
    if (dari > sampai) {
      setClientError("Tanggal 'Dari' tidak boleh lebih besar dari tanggal 'Sampai'.");
      return;
    }
    setClientError(null);
    router.push(`/laporan/laba-rugi?dari=${dari}&sampai=${sampai}`);
  };

  const activeError = clientError || errorMessage;
  const isDataKosong = !data || (data.pendapatan.length === 0 && data.beban.length === 0);

  const periodeLabel = data
    ? `Periode: ${formatDate(data.dari)} s.d. ${formatDate(data.sampai)}`
    : `Periode: ${formatDate(dari)} s.d. ${formatDate(sampai)}`;

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
              Laporan Laba Rugi
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kalkulasi otomatis pendapatan per akun, beban per akun, dan laba (rugi) bersih CV Batik Larasati
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CetakButton />
          </div>
        </div>
      </div>

      {/* Header Khusus Cetak */}
      <LaporanPrintHeader judul="Laporan Laba Rugi" periode={periodeLabel} />

      {/* Toolbar Filter Periode & Rentang Tanggal (No Print) */}
      <div className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        {/* Pilihan Cepat Periode */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-slate-600 mr-1">Pilihan Cepat:</span>
          {[
            { label: "Juli 2026", bulan: 7, tahun: 2026 },
            { label: "Agustus 2026", bulan: 8, tahun: 2026 },
            { label: "September 2026", bulan: 9, tahun: 2026 },
            { label: "Oktober 2026", bulan: 10, tahun: 2026 },
          ].map((preset) => (
            <button
              key={`${preset.tahun}-${preset.bulan}`}
              type="button"
              onClick={() => handlePilihBulan(preset.bulan, preset.tahun)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Form Rentang Tanggal Kustom */}
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="filter-dari" className="block text-xs font-semibold text-slate-700 mb-1">
              Dari Tanggal
            </label>
            <input
              id="filter-dari"
              type="date"
              value={dari}
              onChange={(e) => {
                setDari(e.target.value);
                setClientError(null);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
          </div>

          <div>
            <label htmlFor="filter-sampai" className="block text-xs font-semibold text-slate-700 mb-1">
              Sampai Tanggal
            </label>
            <input
              id="filter-sampai"
              type="date"
              value={sampai}
              onChange={(e) => {
                setSampai(e.target.value);
                setClientError(null);
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-amber-800 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-900 transition"
          >
            Terapkan Filter
          </button>
        </form>
      </div>

      {/* Banner Error Ramah Pengguna */}
      {activeError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2">
          <span className="text-base font-bold">⚠️</span>
          <div>
            <p className="font-semibold">Terjadi Kesalahan</p>
            <p className="mt-0.5">{activeError}</p>
          </div>
        </div>
      )}

      {/* Tampilan Konten Laporan */}
      {!activeError && isDataKosong && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">Tidak ada transaksi mutasi pada periode ini</p>
          <p className="text-xs text-slate-500 mt-1">
            Belum ada jurnal berstatus diposting atau dibalik untuk akun pendapatan maupun beban pada rentang tanggal yang dipilih.
          </p>
        </div>
      )}

      {!activeError && data && !isDataKosong && (
        <div className="space-y-6">
          {/* Card Ringkasan Laba / Rugi Bersih */}
          <div
            className={`rounded-xl border p-5 shadow-sm ${
              data.is_rugi
                ? "border-amber-300 bg-amber-50/70 text-amber-900"
                : "border-emerald-300 bg-emerald-50/70 text-emerald-900"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      data.is_rugi
                        ? "bg-amber-200 text-amber-900 border border-amber-300"
                        : "bg-emerald-200 text-emerald-900 border border-emerald-300"
                    }`}
                  >
                    <span>{data.is_rugi ? "⚠️" : "✓"}</span>
                    <span>{data.is_rugi ? "Rugi Bersih" : "Laba Bersih"}</span>
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    ({periodeLabel})
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {data.is_rugi
                    ? "Total beban melebihi total pendapatan pada periode ini."
                    : "Total pendapatan melebihi total beban pada periode ini."}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {data.is_rugi ? "Hasil (Rugi Bersih)" : "Hasil (Laba Bersih)"}
                </p>
                <p
                  className={`text-2xl font-extrabold tracking-tight mt-0.5 ${
                    data.is_rugi ? "text-amber-900" : "text-emerald-800"
                  }`}
                >
                  {formatRupiah(data.laba_rugi_bersih)}
                </p>
              </div>
            </div>
          </div>

          {/* 1. BAGIAN PENDAPATAN */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                1. Pendapatan
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {data.pendapatan.length} akun tercatat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Rincian Akun Pendapatan</caption>
                <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 w-28">Kode Akun</th>
                    <th scope="col" className="px-4 py-2.5">Nama Akun</th>
                    <th scope="col" className="px-4 py-2.5 text-right w-44">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {data.pendapatan.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-400 italic">
                        Tidak ada transaksi pendapatan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.pendapatan.map((item) => (
                      <tr key={item.akun_id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-2.5 font-mono text-slate-600">{item.kode}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{item.nama}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium">
                          {formatRupiah(item.jumlah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                      Total Pendapatan
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-emerald-700">
                      {formatRupiah(data.total_pendapatan)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 2. BAGIAN BEBAN */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Beban Operasional & Usaha
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {data.beban.length} akun tercatat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Rincian Akun Beban</caption>
                <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 w-28">Kode Akun</th>
                    <th scope="col" className="px-4 py-2.5">Nama Akun</th>
                    <th scope="col" className="px-4 py-2.5 text-right w-44">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {data.beban.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-4 text-center text-slate-400 italic">
                        Tidak ada transaksi beban pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.beban.map((item) => (
                      <tr key={item.akun_id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-2.5 font-mono text-slate-600">{item.kode}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{item.nama}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium">
                          {formatRupiah(item.jumlah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold text-slate-900">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                      Total Beban
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-900">
                      {formatRupiah(data.total_beban)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 3. REKAPITULASI LABA (RUGI) BERSIH */}
          <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-4 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>Total Pendapatan</span>
                <span className="font-mono">{formatRupiah(data.total_pendapatan)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>Total Beban</span>
                <span className="font-mono">({formatRupiah(data.total_beban)})</span>
              </div>
              <div className="border-t-2 border-slate-300 pt-2 flex items-center justify-between font-bold text-sm text-slate-900">
                <span className="flex items-center gap-1.5">
                  <span>Laba (Rugi) Bersih</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded ${
                      data.is_rugi ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {data.is_rugi ? "Rugi" : "Laba"}
                  </span>
                </span>
                <span
                  className={`text-base font-mono ${
                    data.is_rugi ? "text-amber-900" : "text-emerald-700"
                  }`}
                >
                  {formatRupiah(data.laba_rugi_bersih)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

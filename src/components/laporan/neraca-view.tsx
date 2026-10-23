"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import type { NeracaData } from "@/lib/laporan";
import { LaporanPrintHeader } from "@/components/laporan/laporan-print-header";
import { CetakButton } from "@/components/laporan/cetak-button";

interface NeracaViewProps {
  data: NeracaData | null;
  errorMessage: string | null;
  initialTanggal: string;
}

export function NeracaView({
  data,
  errorMessage,
  initialTanggal,
}: NeracaViewProps) {
  const router = useRouter();
  const [tanggal, setTanggal] = useState(initialTanggal);

  // Quick preset tanggal penutupan
  const handlePilihTanggal = (tgl: string) => {
    setTanggal(tgl);
    router.push(`/laporan/neraca?tanggal=${tgl}`);
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) return;
    router.push(`/laporan/neraca?tanggal=${tanggal}`);
  };

  const tanggalLabel = data
    ? `Per Tanggal: ${formatDate(data.tanggal)}`
    : `Per Tanggal: ${formatDate(tanggal)}`;

  const isDataKosong = !data || (data.aset.length === 0 && data.kewajiban.length === 0 && data.ekuitas.length === 0);

  return (
    <div className="space-y-6 max-w-6xl">
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
              Laporan Neraca
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Posisi keuangan perusahaan: Aset = Kewajiban + Ekuitas (+ Laba/Rugi Berjalan) CV Batik Larasati
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CetakButton />
          </div>
        </div>
      </div>

      {/* Header Khusus Cetak */}
      <LaporanPrintHeader judul="Laporan Neraca (Posisi Keuangan)" periode={tanggalLabel} />

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
            <label htmlFor="filter-tanggal-neraca" className="block text-xs font-semibold text-slate-700 mb-1">
              Posisi Per Tanggal
            </label>
            <input
              id="filter-tanggal-neraca"
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
          <p className="text-sm font-semibold text-slate-700">Tidak ada saldo akun pada tanggal ini</p>
          <p className="text-xs text-slate-500 mt-1">
            Belum ada jurnal terposting atau dibalik sebelum atau pada tanggal yang dipilih.
          </p>
        </div>
      )}

      {!errorMessage && data && !isDataKosong && (
        <div className="space-y-6">
          {/* Banner Status Keseimbangan Neraca (PRD Seksi 7 & 9) */}
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
                    {data.is_seimbang ? "Neraca Seimbang" : "Peringatan: Neraca Tidak Seimbang"}
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
                    ? `Total Aset (${formatRupiah(data.total_aset)}) sama dengan Total Kewajiban + Ekuitas + Laba Berjalan (${formatRupiah(data.total_pasiva)}).`
                    : `Terdapat selisih sebesar ${formatRupiah(Math.abs(data.selisih))}. Pembukuan memerlukan rekonsiliasi.`}
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

          {/* Grid 2 Kolom: Kiri (Aset / Aktiva), Kanan (Kewajiban & Ekuitas / Pasiva) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ===================== KOLOM KIRI: ASET ===================== */}
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Aset (Aktiva)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Seluruh akun kas, bank, piutang, dan perlengkapan
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {data.aset.length} akun
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">Rincian Akun Aset</caption>
                    <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 w-24">Kode</th>
                        <th scope="col" className="px-4 py-2.5">Nama Akun</th>
                        <th scope="col" className="px-4 py-2.5 text-right w-36">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {data.aset.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-slate-400 italic">
                            Tidak ada akun aset dengan saldo aktif.
                          </td>
                        </tr>
                      ) : (
                        data.aset.map((item) => (
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
                          Total Aset
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-emerald-800">
                          {formatRupiah(data.total_aset)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* ===================== KOLOM KANAN: KEWAJIBAN & EKUITAS ===================== */}
            <div className="space-y-6">
              {/* 1. Bagian Kewajiban */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Kewajiban (Utang)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Utang usaha dan liabilitas lainnya
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {data.kewajiban.length} akun
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">Rincian Akun Kewajiban</caption>
                    <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 w-24">Kode</th>
                        <th scope="col" className="px-4 py-2.5">Nama Akun</th>
                        <th scope="col" className="px-4 py-2.5 text-right w-36">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {data.kewajiban.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-center text-slate-400 italic">
                            Tidak ada kewajiban tercatat.
                          </td>
                        </tr>
                      ) : (
                        data.kewajiban.map((item) => (
                          <tr key={item.akun_id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-2 font-mono text-slate-600">{item.kode}</td>
                            <td className="px-4 py-2 font-medium text-slate-900">{item.nama}</td>
                            <td className="px-4 py-2 text-right font-mono font-medium">
                              {formatRupiah(item.jumlah)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-800">
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-right uppercase tracking-wider text-[11px]">
                          Total Kewajiban
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-xs text-slate-900">
                          {formatRupiah(data.total_kewajiban)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 2. Bagian Ekuitas */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Ekuitas (Modal)
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Modal pemilik dan penambahan ekuitas
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    {data.ekuitas.length} akun
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <caption className="sr-only">Rincian Akun Ekuitas</caption>
                    <thead className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 w-24">Kode</th>
                        <th scope="col" className="px-4 py-2.5">Nama Akun</th>
                        <th scope="col" className="px-4 py-2.5 text-right w-36">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {data.ekuitas.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-center text-slate-400 italic">
                            Tidak ada ekuitas tercatat.
                          </td>
                        </tr>
                      ) : (
                        data.ekuitas.map((item) => (
                          <tr key={item.akun_id} className="hover:bg-slate-50/60 transition">
                            <td className="px-4 py-2 font-mono text-slate-600">{item.kode}</td>
                            <td className="px-4 py-2 font-medium text-slate-900">{item.nama}</td>
                            <td className="px-4 py-2 text-right font-mono font-medium">
                              {formatRupiah(item.jumlah)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="border-t border-slate-200 bg-slate-50 font-semibold text-slate-800">
                      <tr>
                        <td colSpan={2} className="px-4 py-2 text-right uppercase tracking-wider text-[11px]">
                          Total Ekuitas
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-xs text-slate-900">
                          {formatRupiah(data.total_ekuitas)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 3. Laba (Rugi) Berjalan & Total Pasiva */}
              <div className="rounded-xl border-2 border-slate-300 bg-slate-50 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Laba (Rugi) Berjalan
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Akumulasi pendapatan dikurangi beban sejak awal data s.d. tanggal ini
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs ${
                      data.laba_berjalan < 0 ? "text-amber-800" : "text-emerald-800"
                    }`}
                  >
                    {formatRupiah(data.laba_berjalan)}
                  </span>
                </div>

                <div className="border-t-2 border-slate-300 pt-3 flex items-center justify-between font-bold text-sm text-slate-900">
                  <span className="uppercase tracking-wider">
                    Total Kewajiban & Ekuitas
                  </span>
                  <span className="text-sm font-mono text-slate-900">
                    {formatRupiah(data.total_pasiva)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

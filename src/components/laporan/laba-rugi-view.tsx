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
                LAPORAN KINERJA KEUANGAN
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#fdfaf6] tracking-tight">
              Laporan Laba Rugi
            </h1>
            <p className="text-xs sm:text-sm text-[#a89f91] mt-1 max-w-3xl leading-relaxed">
              Kalkulasi otomatis pendapatan per akun, beban operasional, dan laba (rugi) bersih CV Batik Larasati (PRD Bagian 7 &amp; BR-11).
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
      <div className="no-print sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-xl space-y-4">
        {/* Pilihan Cepat Periode */}
        <div className="flex flex-wrap items-center gap-2 border-b border-amber-900/20 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 mr-2 flex items-center gap-1.5">
            <span>⚡</span> Pilihan Cepat:
          </span>
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
              className="btn-3d-dark px-3 py-1.5 text-xs font-semibold"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Form Rentang Tanggal Kustom */}
        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="filter-dari" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
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
              className="rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
            />
          </div>

          <div>
            <label htmlFor="filter-sampai" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
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
              className="rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
            />
          </div>

          <button
            type="submit"
            className="btn-3d-gold px-5 py-2 text-xs sm:text-sm font-bold"
          >
            Terapkan Filter
          </button>
        </form>
      </div>

      {/* Banner Error Ramah Pengguna */}
      {activeError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs sm:text-sm text-rose-300 flex items-start gap-3">
          <span className="text-base font-bold text-rose-400">⚠️</span>
          <div>
            <p className="font-bold text-rose-200">Terjadi Kesalahan</p>
            <p className="mt-0.5">{activeError}</p>
          </div>
        </div>
      )}

      {/* Tampilan Konten Laporan Kosong */}
      {!activeError && isDataKosong && (
        <div className="sogan-card rounded-2xl border border-dashed border-amber-900/30 bg-[#0e0c0a] p-12 text-center text-[#a89f91]">
          <p className="text-base font-bold text-[#fdfaf6]">Tidak ada transaksi mutasi pada periode ini</p>
          <p className="text-xs sm:text-sm mt-1.5 max-w-md mx-auto">
            Belum ada jurnal berstatus diposting atau dibalik untuk akun pendapatan maupun beban pada rentang tanggal yang dipilih.
          </p>
        </div>
      )}

      {!activeError && data && !isDataKosong && (
        <div className="space-y-6 sm:space-y-8">
          {/* Card Ringkasan Laba / Rugi Bersih */}
          <div
            className={`sogan-card rounded-2xl border p-6 sm:p-7 shadow-xl ${
              data.is_rugi
                ? "border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-[#0e0c0a] to-[#0e0c0a]"
                : "border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-[#0e0c0a] to-[#0e0c0a]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      data.is_rugi
                        ? "bg-amber-950/60 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    <span>{data.is_rugi ? "⚠️" : "✓"}</span>
                    <span>{data.is_rugi ? "Rugi Bersih" : "Laba Bersih"}</span>
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#a89f91]">
                    ({periodeLabel})
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#d6cfc7] mt-2.5 max-w-xl">
                  {data.is_rugi
                    ? "Total beban operasional melebihi total pendapatan yang diakui pada periode ini."
                    : "Total pendapatan operasional melebihi total beban yang diakui pada periode ini."}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-[#a89f91]">
                  {data.is_rugi ? "Hasil (Rugi Bersih)" : "Hasil (Laba Bersih)"}
                </p>
                <p
                  className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight mt-1 ${
                    data.is_rugi ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {formatRupiah(data.laba_rugi_bersih)}
                </p>
              </div>
            </div>
          </div>

          {/* 1. BAGIAN PENDAPATAN */}
          <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-amber-950/30 to-[#0e0c0a] px-5 py-4 border-b border-amber-900/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h2 className="text-sm sm:text-base font-bold text-[#fdfaf6] uppercase tracking-wide">
                  1. Pendapatan Usaha
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#a89f91]">
                {data.pendapatan.length} akun tercatat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <caption className="sr-only">Rincian Akun Pendapatan</caption>
                <thead className="border-b border-amber-900/20 bg-[#141210] text-[11px] font-bold uppercase tracking-wider text-[#a89f91]">
                  <tr>
                    <th scope="col" className="px-5 py-3 w-32">Kode Akun</th>
                    <th scope="col" className="px-5 py-3">Nama Akun</th>
                    <th scope="col" className="px-5 py-3 text-right w-48">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 text-[#d6cfc7]">
                  {data.pendapatan.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-[#a89f91] italic">
                        Tidak ada transaksi pendapatan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.pendapatan.map((item) => (
                      <tr key={item.akun_id} className="hover:bg-amber-950/20 transition-colors">
                        <td className="px-5 py-3 font-mono text-amber-300/90">{item.kode}</td>
                        <td className="px-5 py-3 font-semibold text-[#fdfaf6]">{item.nama}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400">
                          {formatRupiah(item.jumlah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t-2 border-amber-900/40 bg-[#141210] font-bold text-[#fdfaf6]">
                  <tr>
                    <td colSpan={2} className="px-5 py-3.5 text-right uppercase tracking-wider text-xs text-[#a89f91]">
                      Total Pendapatan
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-base text-emerald-400">
                      {formatRupiah(data.total_pendapatan)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 2. BAGIAN BEBAN */}
          <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-amber-950/30 to-[#0e0c0a] px-5 py-4 border-b border-amber-900/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <h2 className="text-sm sm:text-base font-bold text-[#fdfaf6] uppercase tracking-wide">
                  2. Beban Operasional &amp; Usaha
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#a89f91]">
                {data.beban.length} akun tercatat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <caption className="sr-only">Rincian Akun Beban</caption>
                <thead className="border-b border-amber-900/20 bg-[#141210] text-[11px] font-bold uppercase tracking-wider text-[#a89f91]">
                  <tr>
                    <th scope="col" className="px-5 py-3 w-32">Kode Akun</th>
                    <th scope="col" className="px-5 py-3">Nama Akun</th>
                    <th scope="col" className="px-5 py-3 text-right w-48">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10 text-[#d6cfc7]">
                  {data.beban.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-[#a89f91] italic">
                        Tidak ada transaksi beban pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.beban.map((item) => (
                      <tr key={item.akun_id} className="hover:bg-amber-950/20 transition-colors">
                        <td className="px-5 py-3 font-mono text-amber-300/90">{item.kode}</td>
                        <td className="px-5 py-3 font-semibold text-[#fdfaf6]">{item.nama}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-amber-400">
                          {formatRupiah(item.jumlah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="border-t-2 border-amber-900/40 bg-[#141210] font-bold text-[#fdfaf6]">
                  <tr>
                    <td colSpan={2} className="px-5 py-3.5 text-right uppercase tracking-wider text-xs text-[#a89f91]">
                      Total Beban
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-base text-amber-400">
                      {formatRupiah(data.total_beban)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 3. REKAPITULASI LABA (RUGI) BERSIH */}
          <div className="sogan-card rounded-2xl border border-amber-500/25 bg-[#0e0c0a] p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span>⚖️</span> Rekapitulasi Laba (Rugi) Bersih
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#d6cfc7]">
                <span>Total Pendapatan</span>
                <span className="font-mono text-emerald-400">{formatRupiah(data.total_pendapatan)}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#d6cfc7]">
                <span>Total Beban Operasional</span>
                <span className="font-mono text-amber-400">({formatRupiah(data.total_beban)})</span>
              </div>
              <div className="border-t border-amber-900/30 pt-4 flex items-center justify-between font-bold text-base sm:text-lg text-[#fdfaf6]">
                <span className="flex items-center gap-2">
                  <span>Hasil Akhir:</span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full ${
                      data.is_rugi ? "bg-amber-950/60 text-amber-300 border border-amber-500/40" : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {data.is_rugi ? "Rugi Bersih" : "Laba Bersih"}
                  </span>
                </span>
                <span
                  className={`font-mono text-xl sm:text-2xl font-extrabold ${
                    data.is_rugi ? "text-amber-400" : "text-emerald-400"
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

"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { AkunOption, MutasiBukuBesarItem } from "@/lib/buku-besar";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import { JurnalStatusBadge } from "@/components/jurnal/jurnal-status-badge";

interface TabelBukuBesarProps {
  akun: AkunOption;
  tanggalDari: string;
  tanggalSampai: string;
  saldoAwal: number;
  mutasi: MutasiBukuBesarItem[];
  totalDebit: number;
  totalKredit: number;
  saldoAkhir: number;
}

export function TabelBukuBesar({
  akun,
  tanggalDari,
  tanggalSampai,
  saldoAwal,
  mutasi,
  totalDebit,
  totalKredit,
  saldoAkhir,
}: TabelBukuBesarProps) {
  // Paginasi di sisi klien dengan data yang sudah dihitung saldo berjalannya
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"auto" | "table" | "cards">("auto");

  const totalItems = mutasi.length;
  const isAllPages = pageSize === 0;
  const totalPages = isAllPages ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));

  // Ambil slice mutasi untuk halaman saat ini
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = isAllPages ? 0 : (validCurrentPage - 1) * pageSize;
  const endIndex = isAllPages ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const displayedMutasi = mutasi.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Header Baris Kontrol Tabel: Info Baris & Toggle Mode Tampilan Mobile */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className="text-sm sm:text-base font-bold text-[#fdfaf6]">
            Daftar Mutasi Transaksi
          </span>
          <span className="rounded-full bg-amber-950/60 border border-amber-500/30 px-3 py-1 text-xs sm:text-sm font-bold text-amber-300">
            {totalItems} mutasi
          </span>
        </div>

        {/* Kontrol Paginasi Ukuran & View Mode */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          {/* Toggle Tampilan (Mobile Friendly) */}
          <div className="inline-flex rounded-xl border border-amber-900/30 bg-[#141210] p-1 shadow-sm sm:hidden">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                viewMode === "cards" || viewMode === "auto"
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-[#070605] shadow-xs"
                  : "text-[#8a7e72] hover:text-[#fdfaf6]"
              }`}
              title="Tampilan Kartu"
            >
              Kartu
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                viewMode === "table"
                  ? "bg-gradient-to-r from-amber-600 to-amber-700 text-[#070605] shadow-xs"
                  : "text-[#8a7e72] hover:text-[#fdfaf6]"
              }`}
              title="Tampilan Tabel"
            >
              Tabel
            </button>
          </div>

          {/* Pemilih Jumlah Baris Per Halaman */}
          {totalItems > 10 && (
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <label htmlFor="select-page-size" className="text-[#8a7e72] font-semibold text-xs sm:text-sm">
                Baris per halaman:
              </label>
              <select
                id="select-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-xl border border-amber-900/30 bg-[#141210] px-3 py-1.5 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/80 focus:outline-none"
              >
                <option value={25} className="bg-[#141210] text-[#fdfaf6]">25</option>
                <option value={50} className="bg-[#141210] text-[#fdfaf6]">50</option>
                <option value={100} className="bg-[#141210] text-[#fdfaf6]">100</option>
                <option value={0} className="bg-[#141210] text-[#fdfaf6]">Semua</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 1. TAMPILAN TABEL (Bisa digulir horizontal di layar kecil) */}
      <div
        className={`sogan-card rounded-2xl border border-amber-500/20 bg-[#0e0c0a] shadow-xl overflow-hidden ${
          viewMode === "cards" ? "hidden" : viewMode === "auto" ? "hidden sm:block" : "block"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base" aria-label={`Buku Besar ${akun.kode} - ${akun.nama}`}>
            <caption className="sr-only">
              Buku besar mutasi akun {akun.kode} - {akun.nama} periode {tanggalDari} sampai {tanggalSampai}
            </caption>
            <thead className="bg-[#141210] border-b border-amber-900/30 text-[#d6cfc7] font-bold uppercase tracking-wider text-xs sm:text-sm">
              <tr>
                <th scope="col" className="px-5 py-3.5 min-w-[120px]">
                  Tanggal
                </th>
                <th scope="col" className="px-5 py-3.5 min-w-[150px]">
                  No. Jurnal
                </th>
                <th scope="col" className="px-5 py-3.5 min-w-[260px]">
                  Keterangan
                </th>
                <th scope="col" className="px-5 py-3.5 text-right min-w-[140px]">
                  Debit
                </th>
                <th scope="col" className="px-5 py-3.5 text-right min-w-[140px]">
                  Kredit
                </th>
                <th scope="col" className="px-5 py-3.5 text-right min-w-[160px] bg-[#141210]/80">
                  Saldo Berjalan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10 text-[#d6cfc7]">
              {/* Baris Saldo Awal (Wajib tampil baik ada mutasi maupun tidak) */}
              <tr className="bg-amber-950/20 font-semibold text-[#fdfaf6]">
                <td className="px-5 py-4 text-[#a89f91] whitespace-nowrap">
                  {formatDate(tanggalDari)}
                </td>
                <td className="px-5 py-4 text-[#685f54] italic">
                  -
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 font-bold text-amber-300">
                    <span aria-hidden="true" className="text-amber-400 text-sm">⚖️</span>
                    <span>Saldo Awal</span>
                    <span className="text-xs font-normal text-[#a89f91]">
                      (sebelum {formatDate(tanggalDari)})
                    </span>
                  </span>
                </td>
                <td className="px-5 py-4 text-right font-mono text-[#5a524a] tabular-nums">
                  -
                </td>
                <td className="px-5 py-4 text-right font-mono text-[#5a524a] tabular-nums">
                  -
                </td>
                <td className="px-5 py-4 text-right font-mono font-extrabold text-amber-300 bg-amber-950/30 tabular-nums">
                  {formatRupiah(saldoAwal)}
                </td>
              </tr>

              {/* Baris Kosong jika mutasi = 0 */}
              {totalItems === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[#a89f91]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span aria-hidden="true" className="text-3xl">📋</span>
                      <p className="font-bold text-[#fdfaf6] text-base">Tidak ada mutasi transaksi</p>
                      <p className="text-xs sm:text-sm text-[#8a7e72] max-w-md mx-auto">
                        Tidak ditemukan mutasi debit maupun kredit pada akun ini dalam rentang tanggal {formatDate(tanggalDari)} s.d. {formatDate(tanggalSampai)}. Saldo akhir sama dengan saldo awal.
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {/* Baris Tiap Mutasi Dalam Halaman */}
              {displayedMutasi.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#161311] transition-colors ${
                      isEven ? "bg-transparent" : "bg-[#141210]/30"
                    }`}
                  >
                    {/* Tanggal */}
                    <td className="px-5 py-3.5 text-[#a89f91] whitespace-nowrap">
                      {formatDate(item.tanggal)}
                    </td>

                    {/* Nomor Jurnal */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jurnal/${item.jurnal_id}`}
                          className="font-mono font-bold text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1"
                          title={`Lihat detail jurnal ${item.jurnal_nomor || ""}`}
                        >
                          <span>{item.jurnal_nomor || `Jurnal #${item.jurnal_id}`}</span>
                          <span aria-hidden="true" className="text-xs">↗</span>
                        </Link>
                        {item.jurnal_status === "dibalik" && (
                          <JurnalStatusBadge status={item.jurnal_status} className="scale-90 origin-left" />
                        )}
                      </div>
                    </td>

                    {/* Keterangan */}
                    <td className="px-5 py-3.5 text-[#fdfaf6]">
                      <div className="line-clamp-2 max-w-md" title={item.keterangan}>
                        {item.keterangan}
                      </div>
                    </td>

                    {/* Debit */}
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                      {item.debit > 0 ? (
                        <span className="font-bold text-emerald-300">
                          {formatRupiah(item.debit)}
                        </span>
                      ) : (
                        <span className="text-[#5a524a]">-</span>
                      )}
                    </td>

                    {/* Kredit */}
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums">
                      {item.kredit > 0 ? (
                        <span className="font-bold text-amber-300">
                          {formatRupiah(item.kredit)}
                        </span>
                      ) : (
                        <span className="text-[#5a524a]">-</span>
                      )}
                    </td>

                    {/* Saldo Berjalan (selalu akurat di halaman mana pun) */}
                    <td className="px-5 py-3.5 text-right font-mono font-extrabold tabular-nums text-[#fdfaf6] bg-[#141210]/50">
                      {formatRupiah(item.saldo_berjalan)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Mutasi & Saldo Akhir */}
            <tfoot className="border-t-2 border-amber-500/30 bg-[#141210] font-bold text-[#fdfaf6]">
              <tr>
                <td colSpan={3} className="px-5 py-4 text-right uppercase tracking-wider text-xs sm:text-sm text-[#d6cfc7]">
                  Total Mutasi Periode:
                </td>
                <td className="px-5 py-4 text-right font-mono text-emerald-300 font-extrabold tabular-nums">
                  {formatRupiah(totalDebit)}
                </td>
                <td className="px-5 py-4 text-right font-mono text-amber-300 font-extrabold tabular-nums">
                  {formatRupiah(totalKredit)}
                </td>
                <td className="px-5 py-4 text-right font-mono text-[#5a524a] tabular-nums bg-[#100e0c]/50">
                  -
                </td>
              </tr>
              <tr className="bg-gradient-to-r from-amber-950/40 to-[#141210] text-amber-300 border-t border-amber-500/30">
                <td colSpan={5} className="px-5 py-4 text-right font-extrabold text-sm sm:text-base uppercase tracking-wider">
                  Saldo Akhir per {formatDate(tanggalSampai)}:
                </td>
                <td className="px-5 py-4 text-right font-mono font-extrabold text-base sm:text-lg text-amber-300 tabular-nums bg-amber-950/50">
                  {formatRupiah(saldoAkhir)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 2. TAMPILAN KARTU RESPONSIVE MOBILE (Untuk tampilan layar ponsel yang rapi) */}
      <div
        className={`space-y-3 ${
          viewMode === "table" ? "hidden" : viewMode === "auto" ? "block sm:hidden" : "block"
        }`}
      >
        {/* Kartu Saldo Awal */}
        <div className="sogan-card rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs sm:text-sm text-[#a89f91]">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <span aria-hidden="true">⚖️</span>
              <span>Saldo Awal</span>
            </span>
            <span>per {formatDate(tanggalDari)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-amber-900/20 pt-2 font-mono">
            <span className="text-xs text-[#8a7e72]">Posisi Awal:</span>
            <span className="font-extrabold text-amber-300 tabular-nums">{formatRupiah(saldoAwal)}</span>
          </div>
        </div>

        {/* Keadaan Kosong di Mobile */}
        {totalItems === 0 && (
          <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-6 text-center shadow-xl">
            <span aria-hidden="true" className="text-3xl block mb-2">📋</span>
            <p className="font-bold text-[#fdfaf6] text-sm">Tidak ada mutasi transaksi</p>
            <p className="text-xs text-[#8a7e72] mt-1">
              Tidak ada mutasi debit/kredit pada rentang tanggal ini.
            </p>
          </div>
        )}

        {/* Kartu Per Mutasi */}
        {displayedMutasi.map((item) => (
          <div
            key={`card-${item.id}`}
            className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-4 shadow-sm space-y-3 hover:border-amber-500/30 transition"
          >
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#8a7e72]">{formatDate(item.tanggal)}</span>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/jurnal/${item.jurnal_id}`}
                  className="font-mono font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  {item.jurnal_nomor || `Jurnal #${item.jurnal_id}`}
                </Link>
                {item.jurnal_status === "dibalik" && (
                  <JurnalStatusBadge status={item.jurnal_status} className="scale-75 origin-right" />
                )}
              </div>
            </div>

            <p className="text-sm text-[#fdfaf6] line-clamp-2">
              {item.keterangan}
            </p>

            <div className="grid grid-cols-2 gap-3 border-t border-amber-900/20 pt-2 text-xs sm:text-sm font-mono">
              <div>
                <span className="block text-xs uppercase font-sans text-[#8a7e72]">Debit</span>
                <span className={`font-bold tabular-nums ${item.debit > 0 ? "text-emerald-300" : "text-[#5a524a]"}`}>
                  {item.debit > 0 ? formatRupiah(item.debit) : "-"}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs uppercase font-sans text-[#8a7e72]">Kredit</span>
                <span className={`font-bold tabular-nums ${item.kredit > 0 ? "text-amber-300" : "text-[#5a524a]"}`}>
                  {item.kredit > 0 ? formatRupiah(item.kredit) : "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-amber-900/20 pt-2 bg-[#141210] -mx-4 -mb-4 p-3 rounded-b-2xl text-xs sm:text-sm">
              <span className="text-[#a89f91] font-medium">Saldo Berjalan:</span>
              <span className="font-mono font-extrabold text-[#fdfaf6] tabular-nums">
                {formatRupiah(item.saldo_berjalan)}
              </span>
            </div>
          </div>
        ))}

        {/* Kartu Saldo Akhir Mobile */}
        <div className="sogan-card rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 to-[#0e0c0a] p-4.5 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm text-amber-300 font-bold">
            <span>Saldo Akhir</span>
            <span className="text-xs text-amber-400/80 font-normal">per {formatDate(tanggalSampai)}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-xs sm:text-sm border-t border-amber-900/20 pt-2">
            <span className="text-[#a89f91] font-sans text-xs">Total Debit / Kredit:</span>
            <span className="text-[#fdfaf6] tabular-nums font-semibold">
              <span className="text-emerald-300">+{formatRupiah(totalDebit)}</span> / <span className="text-amber-300">-{formatRupiah(totalKredit)}</span>
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-base border-t border-amber-900/20 pt-2 font-extrabold text-amber-300">
            <span className="font-sans text-xs sm:text-sm">Posisi Akhir:</span>
            <span className="tabular-nums">{formatRupiah(saldoAkhir)}</span>
          </div>
        </div>
      </div>

      {/* Kontrol Paginasi (Sebelumnya, Nomor Halaman, Selanjutnya) */}
      {!isAllPages && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs sm:text-sm text-[#8a7e72]">
          <div>
            Menampilkan <span className="font-bold text-[#fdfaf6]">{startIndex + 1}</span> s.d.{" "}
            <span className="font-bold text-[#fdfaf6]">{endIndex}</span> dari{" "}
            <span className="font-bold text-amber-400">{totalItems}</span> mutasi
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-2 font-bold text-[#d6cfc7] hover:bg-[#1c1815] hover:text-[#fdfaf6] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              ← Sebelumnya
            </button>

            {/* Indikator Halaman */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Tampilkan halaman pertama, terakhir, dan yang berada di dekat halaman aktif
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - validCurrentPage) <= 1;
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span className="px-1 text-[#8a7e72]">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[36px] h-9 rounded-xl text-xs sm:text-sm font-bold transition ${
                          p === validCurrentPage
                            ? "bg-gradient-to-r from-amber-600 to-amber-700 text-[#070605] shadow-md"
                            : "border border-amber-900/30 bg-[#141210] text-[#d6cfc7] hover:bg-[#1c1815] hover:text-[#fdfaf6]"
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-2 font-bold text-[#d6cfc7] hover:bg-[#1c1815] hover:text-[#fdfaf6] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

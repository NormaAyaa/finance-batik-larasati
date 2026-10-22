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
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Daftar Mutasi Transaksi
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {totalItems} mutasi
          </span>
        </div>

        {/* Kontrol Paginasi Ukuran & View Mode */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Toggle Tampilan (Mobile Friendly) */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm sm:hidden">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                viewMode === "cards" || viewMode === "auto"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Tampilan Kartu"
            >
              Kartu
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                viewMode === "table"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Tampilan Tabel"
            >
              Tabel
            </button>
          </div>

          {/* Pemilih Jumlah Baris Per Halaman */}
          {totalItems > 10 && (
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <label htmlFor="select-page-size" className="text-slate-500 font-medium">
                Baris per halaman:
              </label>
              <select
                id="select-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:border-amber-700 focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={0}>Semua</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 1. TAMPILAN TABEL (Bisa digulir horizontal di layar kecil) */}
      <div
        className={`rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden ${
          viewMode === "cards" ? "hidden" : viewMode === "auto" ? "hidden sm:block" : "block"
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label={`Buku Besar ${akun.kode} - ${akun.nama}`}>
            <caption className="sr-only">
              Buku besar mutasi akun {akun.kode} - {akun.nama} periode {tanggalDari} sampai {tanggalSampai}
            </caption>
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 min-w-[110px]">
                  Tanggal
                </th>
                <th scope="col" className="px-4 py-3 min-w-[140px]">
                  No. Jurnal
                </th>
                <th scope="col" className="px-4 py-3 min-w-[240px]">
                  Keterangan
                </th>
                <th scope="col" className="px-4 py-3 text-right min-w-[130px]">
                  Debit
                </th>
                <th scope="col" className="px-4 py-3 text-right min-w-[130px]">
                  Kredit
                </th>
                <th scope="col" className="px-4 py-3 text-right min-w-[150px] bg-slate-100/50">
                  Saldo Berjalan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {/* Baris Saldo Awal (Wajib tampil baik ada mutasi maupun tidak) */}
              <tr className="bg-amber-50/20 font-medium text-slate-900">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {formatDate(tanggalDari)}
                </td>
                <td className="px-4 py-3 text-slate-400 italic">
                  -
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                    <span aria-hidden="true" className="text-amber-700 text-xs">⚖️</span>
                    <span>Saldo Awal</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      (sebelum {formatDate(tanggalDari)})
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-400 tabular-nums">
                  -
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-400 tabular-nums">
                  -
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 bg-amber-50/40 tabular-nums">
                  {formatRupiah(saldoAwal)}
                </td>
              </tr>

              {/* Baris Kosong jika mutasi = 0 */}
              {totalItems === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span aria-hidden="true" className="text-2xl">📋</span>
                      <p className="font-semibold text-slate-700">Tidak ada mutasi transaksi</p>
                      <p className="text-xs text-slate-500 max-w-md">
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
                    className={`hover:bg-slate-50 transition-colors ${
                      isEven ? "bg-white" : "bg-slate-50/40"
                    }`}
                  >
                    {/* Tanggal */}
                    <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                      {formatDate(item.tanggal)}
                    </td>

                    {/* Nomor Jurnal */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/jurnal/${item.jurnal_id}`}
                          className="font-mono font-semibold text-amber-800 hover:text-amber-950 hover:underline inline-flex items-center gap-1"
                          title={`Lihat detail jurnal ${item.jurnal_nomor || ""}`}
                        >
                          <span>{item.jurnal_nomor || `Jurnal #${item.jurnal_id}`}</span>
                          <span aria-hidden="true" className="text-[10px]">↗</span>
                        </Link>
                        {item.jurnal_status === "dibalik" && (
                          <JurnalStatusBadge status={item.jurnal_status} className="scale-90 origin-left" />
                        )}
                      </div>
                    </td>

                    {/* Keterangan */}
                    <td className="px-4 py-2.5 text-slate-700">
                      <div className="line-clamp-2 max-w-md" title={item.keterangan}>
                        {item.keterangan}
                      </div>
                    </td>

                    {/* Debit */}
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800">
                      {item.debit > 0 ? (
                        <span className="font-semibold text-emerald-800">
                          {formatRupiah(item.debit)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Kredit */}
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-800">
                      {item.kredit > 0 ? (
                        <span className="font-semibold text-rose-800">
                          {formatRupiah(item.kredit)}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Saldo Berjalan (selalu akurat di halaman mana pun) */}
                    <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-slate-900 bg-slate-50/60">
                      {formatRupiah(item.saldo_berjalan)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Total Mutasi & Saldo Akhir */}
            <tfoot className="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right uppercase tracking-wider text-[11px] text-slate-600">
                  Total Mutasi Periode:
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-900 tabular-nums">
                  {formatRupiah(totalDebit)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-rose-900 tabular-nums">
                  {formatRupiah(totalKredit)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-400 tabular-nums bg-slate-200/50">
                  -
                </td>
              </tr>
              <tr className="bg-amber-100/60 text-amber-950 border-t border-amber-200">
                <td colSpan={5} className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wider">
                  Saldo Akhir per {formatDate(tanggalSampai)}:
                </td>
                <td className="px-4 py-3 text-right font-mono font-extrabold text-sm text-amber-950 tabular-nums bg-amber-200/40">
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
        <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <span aria-hidden="true">⚖️</span>
              <span>Saldo Awal</span>
            </span>
            <span>per {formatDate(tanggalDari)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-amber-200/60 pt-2 font-mono">
            <span className="text-xs text-slate-500">Posisi Awal:</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(saldoAwal)}</span>
          </div>
        </div>

        {/* Keadaan Kosong di Mobile */}
        {totalItems === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
            <span aria-hidden="true" className="text-2xl">📋</span>
            <p className="mt-1 font-semibold text-slate-800 text-xs">Tidak ada mutasi transaksi</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Tidak ada mutasi debit/kredit pada rentang tanggal ini.
            </p>
          </div>
        )}

        {/* Kartu Per Mutasi */}
        {displayedMutasi.map((item) => (
          <div
            key={`card-${item.id}`}
            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2 hover:border-slate-300 transition"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{formatDate(item.tanggal)}</span>
              <div className="flex items-center gap-1.5">
                <Link
                  href={`/jurnal/${item.jurnal_id}`}
                  className="font-mono font-semibold text-amber-800 hover:underline"
                >
                  {item.jurnal_nomor || `Jurnal #${item.jurnal_id}`}
                </Link>
                {item.jurnal_status === "dibalik" && (
                  <JurnalStatusBadge status={item.jurnal_status} className="scale-75 origin-right" />
                )}
              </div>
            </div>

            <p className="text-xs text-slate-800 line-clamp-2">
              {item.keterangan}
            </p>

            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs font-mono">
              <div>
                <span className="block text-[10px] uppercase font-sans text-slate-400">Debit</span>
                <span className={`font-semibold tabular-nums ${item.debit > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                  {item.debit > 0 ? formatRupiah(item.debit) : "-"}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] uppercase font-sans text-slate-400">Kredit</span>
                <span className={`font-semibold tabular-nums ${item.kredit > 0 ? "text-rose-700" : "text-slate-400"}`}>
                  {item.kredit > 0 ? formatRupiah(item.kredit) : "-"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 bg-slate-50 -mx-3.5 -mb-3.5 p-2.5 rounded-b-xl text-xs">
              <span className="text-slate-600 font-medium text-[11px]">Saldo Berjalan:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatRupiah(item.saldo_berjalan)}
              </span>
            </div>
          </div>
        ))}

        {/* Kartu Saldo Akhir Mobile */}
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-amber-900 font-semibold">
            <span>Saldo Akhir</span>
            <span className="text-[11px] text-amber-700 font-normal">per {formatDate(tanggalSampai)}</span>
          </div>
          <div className="flex items-center justify-between font-mono text-xs border-t border-amber-200/80 pt-2">
            <span className="text-amber-800 font-sans text-[11px]">Total Debit / Kredit:</span>
            <span className="text-amber-900 tabular-nums">
              +{formatRupiah(totalDebit)} / -{formatRupiah(totalKredit)}
            </span>
          </div>
          <div className="flex items-center justify-between font-mono text-sm border-t border-amber-200/80 pt-2 font-bold text-amber-950">
            <span className="font-sans text-xs">Posisi Akhir:</span>
            <span className="tabular-nums">{formatRupiah(saldoAkhir)}</span>
          </div>
        </div>
      </div>

      {/* Kontrol Paginasi (Sebelumnya, Nomor Halaman, Selanjutnya) */}
      {!isAllPages && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-600">
          <div>
            Menampilkan <span className="font-semibold text-slate-800">{startIndex + 1}</span> s.d.{" "}
            <span className="font-semibold text-slate-800">{endIndex}</span> dari{" "}
            <span className="font-semibold text-slate-800">{totalItems}</span> mutasi
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              ← Sebelumnya
            </button>

            {/* Indikator Halaman */}
            <div className="flex items-center gap-1">
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
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition ${
                          p === validCurrentPage
                            ? "bg-amber-800 text-white shadow-xs"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
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
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium hover:bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

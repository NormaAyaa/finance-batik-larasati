"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { PeranPengguna, StatusJurnal, SumberJurnal, StatusPeriode } from "@/types/database";
import { formatRupiah, formatDate, formatBulanTahun } from "@/lib/utils/formatters";
import { JurnalStatusBadge, JurnalSumberBadge } from "./jurnal-status-badge";

export interface PeriodeOption {
  id: number;
  tahun: number;
  bulan: number;
  status: StatusPeriode;
}

export interface JurnalListItem {
  id: number;
  nomor: string | null;
  tanggal: string;
  keterangan: string;
  sumber: SumberJurnal;
  status: StatusJurnal;
  periode_id: number;
  periode?: PeriodeOption | null;
  total_nilai: number;
}

interface DaftarJurnalProps {
  initialJurnal: JurnalListItem[];
  daftarPeriode: PeriodeOption[];
  peran: PeranPengguna;
}

export function DaftarJurnal({ initialJurnal, daftarPeriode, peran }: DaftarJurnalProps) {
  const isAkuntan = peran === "akuntan";

  const [selectedPeriode, setSelectedPeriode] = useState<string>("semua");
  const [selectedStatus, setSelectedStatus] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter daftar jurnal secara reaktif di sisi klien
  const filteredJurnal = useMemo(() => {
    return initialJurnal.filter((item) => {
      // 1. Filter periode
      if (selectedPeriode !== "semua" && String(item.periode_id) !== selectedPeriode) {
        return false;
      }

      // 2. Filter status
      if (selectedStatus !== "semua" && item.status !== selectedStatus) {
        return false;
      }

      // 3. Filter pencarian (nomor atau keterangan)
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchNomor = item.nomor ? item.nomor.toLowerCase().includes(q) : "draf".includes(q);
        const matchKeterangan = item.keterangan.toLowerCase().includes(q);
        if (!matchNomor && !matchKeterangan) {
          return false;
        }
      }

      return true;
    });
  }, [initialJurnal, selectedPeriode, selectedStatus, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Jurnal Umum</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pencatatan transaksi keuangan CV Batik Larasati dengan validasi debit-kredit seimbang (BR-02)
          </p>
        </div>

        {/* Akuntan dapat membuat draf jurnal; Direktur hanya membaca */}
        {isAkuntan && (
          <Link
            href="/jurnal/baru"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-800 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-900 transition shadow-sm active:scale-95"
            id="btn-tambah-jurnal"
          >
            <span aria-hidden="true" className="text-sm font-bold">+</span>
            <span>Input Draf Jurnal</span>
          </Link>
        )}
      </div>

      {/* Bar Filter & Pencarian */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Pencarian Nomor / Keterangan */}
          <div>
            <label htmlFor="filter-pencarian" className="block text-xs font-medium text-slate-700 mb-1">
              Cari Transaksi
            </label>
            <div className="relative">
              <input
                id="filter-pencarian"
                type="text"
                placeholder="Nomor (JU-...) atau keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  aria-label="Bersihkan pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Periode */}
          <div>
            <label htmlFor="filter-periode" className="block text-xs font-medium text-slate-700 mb-1">
              Periode Akuntansi
            </label>
            <select
              id="filter-periode"
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 bg-white"
            >
              <option value="semua">Semua Periode</option>
              {daftarPeriode.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {formatBulanTahun(p.tahun, p.bulan)} ({p.status === "terbuka" ? "Terbuka" : "Ditutup"})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label htmlFor="filter-status" className="block text-xs font-medium text-slate-700 mb-1">
              Status Jurnal
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 bg-white"
            >
              <option value="semua">Semua Status (Draf, Diposting, Dibalik)</option>
              <option value="draf">✎ Draf</option>
              <option value="diposting">✓ Diposting</option>
              <option value="dibalik">↩ Dibalik</option>
            </select>
          </div>
        </div>

        {/* Total Hasil Filter */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-700">{filteredJurnal.length}</strong> dari {initialJurnal.length} jurnal
          </span>
          {(selectedPeriode !== "semua" || selectedStatus !== "semua" || searchQuery !== "") && (
            <button
              type="button"
              onClick={() => {
                setSelectedPeriode("semua");
                setSelectedStatus("semua");
                setSearchQuery("");
              }}
              className="text-amber-800 font-semibold hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Tabel Tampilan Desktop (md+) */}
      <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th scope="col" className="px-4 py-3">Nomor</th>
              <th scope="col" className="px-4 py-3">Tanggal</th>
              <th scope="col" className="px-4 py-3">Keterangan</th>
              <th scope="col" className="px-4 py-3">Sumber</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Total Nilai</th>
              <th scope="col" className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredJurnal.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl">📋</span>
                    <p className="font-medium text-slate-600">Tidak ada jurnal yang sesuai kriteria.</p>
                    <p className="text-[11px] text-slate-400">Coba ubah kata kunci pencarian atau reset filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredJurnal.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition">
                    <td className="px-4 py-3 font-mono font-medium text-slate-800">
                      {item.status === "draf" ? (
                        <span className="italic text-amber-700 font-sans font-semibold">Draf</span>
                      ) : (
                        item.nomor
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(item.tanggal)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={item.keterangan}>
                      {item.keterangan}
                    </td>
                    <td className="px-4 py-3">
                      <JurnalSumberBadge sumber={item.sumber} />
                    </td>
                    <td className="px-4 py-3">
                      <JurnalStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {formatRupiah(item.total_nilai)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Link
                        href={`/jurnal/${item.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900 font-medium transition"
                        title="Lihat rincian debit-kredit jurnal"
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Ponsel / Layar Sempit (Mobile Cards) */}
      <div className="md:hidden space-y-3">
        {filteredJurnal.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            <span className="text-3xl block mb-2">📋</span>
            <p className="font-semibold text-slate-700 text-sm">Tidak ada jurnal ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          filteredJurnal.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-500 block">
                      {formatDate(item.tanggal)}
                    </span>
                    <h2 className="text-sm font-bold font-mono text-slate-800">
                      {item.status === "draf" ? (
                        <span className="italic text-amber-700 font-sans">Draf</span>
                      ) : (
                        item.nomor
                      )}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <JurnalSumberBadge sumber={item.sumber} />
                    <JurnalStatusBadge status={item.status} />
                  </div>
                </div>

                <p className="text-xs text-slate-700 line-clamp-2" title={item.keterangan}>
                  {item.keterangan}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Nilai</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {formatRupiah(item.total_nilai)}
                    </span>
                  </div>
                  <Link
                    href={`/jurnal/${item.id}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs hover:bg-amber-100 hover:text-amber-900 transition"
                  >
                    Buka Detail →
                  </Link>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-amber-900/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400/90">
              Buku Besar & Pembukuan • CV Batik Larasati
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdfaf6] tracking-tight">
            Jurnal Umum
          </h1>
          <p className="text-sm sm:text-base text-[#a89f91] mt-1">
            Daftar pencatatan transaksi keuangan CV Batik Larasati dengan validasi debit-kredit seimbang (BR-02).
          </p>
        </div>

        {/* Akuntan dapat membuat draf jurnal; Direktur hanya membaca */}
        {isAkuntan && (
          <Link
            href="/jurnal/baru"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-5 py-2.5 text-sm sm:text-base font-bold text-black shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition shrink-0"
            id="btn-tambah-jurnal"
          >
            <span aria-hidden="true" className="text-base font-black">+</span>
            <span>Input Draf Jurnal</span>
          </Link>
        )}
      </div>

      {/* Bar Filter & Pencarian */}
      <div className="sogan-card p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pencarian Nomor / Keterangan */}
          <div className="space-y-2">
            <label htmlFor="filter-pencarian" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
              Cari Transaksi
            </label>
            <div className="relative">
              <input
                id="filter-pencarian"
                type="text"
                placeholder="Nomor (JU-...) atau keterangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-amber-900/40 bg-[#141210] pl-11 pr-9 py-3 text-sm sm:text-base text-[#fdfaf6] placeholder-[#78716c] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <span
                aria-hidden="true"
                className="absolute left-3.5 top-3.5 text-amber-400/80 text-base"
              >
                🔍
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#a89f91] hover:text-[#fdfaf6]"
                  aria-label="Bersihkan pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Periode */}
          <div className="space-y-2">
            <label htmlFor="filter-periode" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
              Periode Akuntansi
            </label>
            <select
              id="filter-periode"
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="w-full rounded-xl border border-amber-900/40 bg-[#141210] px-4 py-3 text-sm sm:text-base text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            >
              <option value="semua" className="bg-[#141210] text-[#fdfaf6]">Semua Periode</option>
              {daftarPeriode.map((p) => (
                <option key={p.id} value={String(p.id)} className="bg-[#141210] text-[#fdfaf6]">
                  {formatBulanTahun(p.tahun, p.bulan)} ({p.status === "terbuka" ? "Terbuka" : "Ditutup"})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="space-y-2">
            <label htmlFor="filter-status" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
              Status Jurnal
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-amber-900/40 bg-[#141210] px-4 py-3 text-sm sm:text-base text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            >
              <option value="semua" className="bg-[#141210] text-[#fdfaf6]">Semua Status (Draf, Diposting, Dibalik)</option>
              <option value="draf" className="bg-[#141210] text-[#fdfaf6]">✎ Draf</option>
              <option value="diposting" className="bg-[#141210] text-[#fdfaf6]">✓ Diposting</option>
              <option value="dibalik" className="bg-[#141210] text-[#fdfaf6]">↩ Dibalik</option>
            </select>
          </div>
        </div>

        {/* Total Hasil Filter */}
        <div className="flex items-center justify-between pt-3 border-t border-amber-900/20 text-xs sm:text-sm text-[#a89f91]">
          <span>
            Menampilkan <strong className="text-amber-400 font-bold">{filteredJurnal.length}</strong> dari {initialJurnal.length} transaksi jurnal
          </span>
          {(selectedPeriode !== "semua" || selectedStatus !== "semua" || searchQuery !== "") && (
            <button
              type="button"
              onClick={() => {
                setSelectedPeriode("semua");
                setSelectedStatus("semua");
                setSearchQuery("");
              }}
              className="text-amber-400 hover:text-amber-300 font-bold transition underline"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Tabel Tampilan Desktop (md+) */}
      <div className="hidden md:block sogan-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-base text-[#fdfaf6]" aria-label="Tabel Jurnal Umum">
            <thead>
              <tr className="bg-[#141210] border-b border-amber-900/30 text-[#d6cfc7] text-sm sm:text-base font-bold uppercase tracking-wider">
                <th scope="col" className="px-5 py-4">Nomor</th>
                <th scope="col" className="px-5 py-4">Tanggal</th>
                <th scope="col" className="px-5 py-4">Keterangan</th>
                <th scope="col" className="px-5 py-4 text-center">Sumber</th>
                <th scope="col" className="px-5 py-4 text-center">Status</th>
                <th scope="col" className="px-5 py-4 text-right">Total Nilai</th>
                <th scope="col" className="px-5 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/15">
              {filteredJurnal.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div
                      aria-hidden="true"
                      className="w-16 h-16 mx-auto rounded-full bg-amber-950/40 text-amber-400 flex items-center justify-center text-3xl font-bold mb-4 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    >
                      📋
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-[#fdfaf6]">
                      Tidak Ada Jurnal Ditemukan
                    </h4>
                    <p className="text-sm sm:text-base text-[#a89f91] mt-1.5 max-w-md mx-auto">
                      {selectedPeriode !== "semua" || selectedStatus !== "semua" || searchQuery !== ""
                        ? "Coba sesuaikan kata kunci pencarian atau reset filter aktif Anda."
                        : isAkuntan
                        ? "Mulai dengan membuat draf jurnal transaksi pertama Anda."
                        : "Belum ada transaksi jurnal yang tersimpan."}
                    </p>
                    {isAkuntan && selectedPeriode === "semua" && selectedStatus === "semua" && !searchQuery && (
                      <div className="mt-5">
                        <Link
                          href="/jurnal/baru"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-900/40 bg-[#161310] text-sm sm:text-base font-bold text-amber-300 hover:bg-[#1e1a16] transition shadow-sm"
                        >
                          + Input Draf Jurnal Pertama
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredJurnal.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1a1613] transition-colors">
                    <td className="px-5 py-4.5 font-mono font-bold whitespace-nowrap">
                      {item.status === "draf" || !item.nomor ? (
                        <span className="italic text-amber-400 font-sans font-bold text-base">
                          Draf #{item.id}
                        </span>
                      ) : (
                        <span className="text-[#fdfaf6] text-base sm:text-lg">{item.nomor}</span>
                      )}
                    </td>
                    <td className="px-5 py-4.5 text-sm sm:text-base text-[#d6cfc7] font-medium whitespace-nowrap">
                      {formatDate(item.tanggal)}
                    </td>
                    <td className="px-5 py-4.5 text-sm sm:text-base text-[#fdfaf6] max-w-sm truncate" title={item.keterangan}>
                      {item.keterangan}
                    </td>
                    <td className="px-5 py-4.5 text-center whitespace-nowrap">
                      <JurnalSumberBadge sumber={item.sumber} />
                    </td>
                    <td className="px-5 py-4.5 text-center whitespace-nowrap">
                      <JurnalStatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-4.5 text-right font-mono font-black text-lg sm:text-xl text-amber-300 tabular-nums whitespace-nowrap">
                      {formatRupiah(item.total_nilai)}
                    </td>
                    <td className="px-5 py-4.5 text-center whitespace-nowrap">
                      <Link
                        href={`/jurnal/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)]"
                        title="Lihat rincian debit-kredit jurnal"
                      >
                        <span>Detail</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tampilan Ponsel / Layar Sempit (Mobile Cards) */}
      <div className="md:hidden space-y-4">
        {filteredJurnal.length === 0 ? (
          <div className="sogan-card p-8 text-center text-[#a89f91]">
            <span className="text-3xl block mb-2">📋</span>
            <p className="text-lg font-bold text-[#fdfaf6]">Tidak ada jurnal ditemukan</p>
            <p className="text-sm sm:text-base text-[#a89f91] mt-1.5">Coba sesuaikan filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          filteredJurnal.map((item) => (
            <div
              key={item.id}
              className="sogan-card sogan-card-hover p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs sm:text-sm font-mono text-[#a89f91] block">
                    {formatDate(item.tanggal)}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold font-mono text-[#fdfaf6] mt-0.5">
                    {item.status === "draf" || !item.nomor ? (
                      <span className="italic text-amber-400 font-sans">Draf #{item.id}</span>
                    ) : (
                      item.nomor
                    )}
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <JurnalSumberBadge sumber={item.sumber} />
                  <JurnalStatusBadge status={item.status} />
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#fdfaf6] line-clamp-2 leading-relaxed" title={item.keterangan}>
                {item.keterangan}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-amber-900/20">
                <div>
                  <span className="text-xs sm:text-sm text-[#a89f91] block">Total Nilai</span>
                  <span className="text-lg sm:text-xl font-black font-mono text-amber-300 tabular-nums">
                    {formatRupiah(item.total_nilai)}
                  </span>
                </div>
                <Link
                  href={`/jurnal/${item.id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm sm:text-base font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                >
                  <span>Detail</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

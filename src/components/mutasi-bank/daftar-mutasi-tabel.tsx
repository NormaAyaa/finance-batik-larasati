"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import type {
  MutasiBankWithRelations,
  AkunKasBankOption,
} from "@/lib/mutasi-bank/types";

interface DaftarMutasiTabelProps {
  mutasiList: MutasiBankWithRelations[];
  akunKasBankList: AkunKasBankOption[];
  isAkuntan: boolean;
  onPilihBuatJurnal: (mutasi: MutasiBankWithRelations) => void;
}

export function DaftarMutasiTabel({
  mutasiList,
  akunKasBankList,
  isAkuntan,
  onPilihBuatJurnal,
}: DaftarMutasiTabelProps) {
  const [filterAkunId, setFilterAkunId] = useState<string>("semua");
  const [filterStatus, setFilterStatus] = useState<string>("semua"); // "semua" | "belum" | "sudah"
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter client-side untuk interaktivitas instan
  const filteredList = useMemo(() => {
    return mutasiList.filter((item) => {
      // 1. Filter Akun
      if (filterAkunId !== "semua" && String(item.akun_bank_id) !== filterAkunId) {
        return false;
      }

      // 2. Filter Status Jurnal
      if (filterStatus === "belum" && item.jurnal_id !== null) {
        return false;
      }
      if (filterStatus === "sudah" && item.jurnal_id === null) {
        return false;
      }

      // 3. Pencarian Teks
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const deskripsiMatch = item.deskripsi.toLowerCase().includes(q);
        const fileMatch = item.nama_file.toLowerCase().includes(q);
        const nomorJurnalMatch = item.jurnal?.nomor?.toLowerCase().includes(q) || false;
        if (!deskripsiMatch && !fileMatch && !nomorJurnalMatch) {
          return false;
        }
      }

      return true;
    });
  }, [mutasiList, filterAkunId, filterStatus, searchQuery]);

  // Kalkulasi metrik ringkasan
  const metrik = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    let belumDijurnalCount = 0;

    for (const item of filteredList) {
      if (item.jumlah > 0) {
        totalMasuk += item.jumlah;
      } else {
        totalKeluar += Math.abs(item.jumlah);
      }
      if (!item.jurnal_id) {
        belumDijurnalCount++;
      }
    }

    return {
      totalBaris: filteredList.length,
      totalMasuk,
      totalKeluar,
      belumDijurnalCount,
    };
  }, [filteredList]);

  return (
    <div className="space-y-5">
      {/* Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sogan-card bg-[#0e0c0a] border border-amber-900/20 rounded-2xl p-5 shadow-lg">
          <p className="text-xs sm:text-sm font-semibold text-[#8a7e72] uppercase tracking-wider">
            Total Rekaman Mutasi
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-[#fdfaf6] mt-2 font-mono">
            {metrik.totalBaris}{" "}
            <span className="text-xs sm:text-sm font-normal text-[#8a7e72]">baris</span>
          </p>
        </div>

        <div className="sogan-card bg-[#0e0c0a] border border-amber-900/20 rounded-2xl p-5 shadow-lg">
          <p className="text-xs sm:text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>↓</span> Total Uang Masuk
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-300 mt-2 font-mono">
            {formatRupiah(metrik.totalMasuk)}
          </p>
        </div>

        <div className="sogan-card bg-[#0e0c0a] border border-amber-900/20 rounded-2xl p-5 shadow-lg">
          <p className="text-xs sm:text-sm font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>↑</span> Total Uang Keluar
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-rose-300 mt-2 font-mono">
            {formatRupiah(metrik.totalKeluar)}
          </p>
        </div>

        <div className="sogan-card bg-[#0e0c0a] border border-amber-500/30 rounded-2xl p-5 shadow-lg bg-gradient-to-br from-amber-950/30 to-[#0e0c0a]">
          <p className="text-xs sm:text-sm font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>⏳</span> Belum Dijurnal
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-300 mt-2 font-mono">
            {metrik.belumDijurnalCount}{" "}
            <span className="text-xs sm:text-sm font-normal text-amber-200/70">baris</span>
          </p>
        </div>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className="sogan-card bg-[#0e0c0a] border border-amber-500/20 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 text-[#fdfaf6]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Filter Akun Kas/Bank */}
          <div className="space-y-2">
            <label htmlFor="filter-akun" className="block text-sm sm:text-base font-semibold text-[#d6cfc7]">
              Filter Akun Rekening
            </label>
            <select
              id="filter-akun"
              value={filterAkunId}
              onChange={(e) => setFilterAkunId(e.target.value)}
              className="w-full text-sm sm:text-base rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-3 text-[#fdfaf6] focus:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              <option value="semua" className="bg-[#141210] text-[#fdfaf6]">Semua Akun Kas & Bank</option>
              {akunKasBankList.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#141210] text-[#fdfaf6]">
                  {a.kode} - {a.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Jurnal */}
          <div className="space-y-2">
            <label htmlFor="filter-status" className="block text-sm sm:text-base font-semibold text-[#d6cfc7]">
              Filter Status Jurnal
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-sm sm:text-base rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-3 text-[#fdfaf6] focus:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            >
              <option value="semua" className="bg-[#141210] text-[#fdfaf6]">Semua Status (Sudah & Belum)</option>
              <option value="belum" className="bg-[#141210] text-[#fdfaf6]">Belum Punya Jurnal</option>
              <option value="sudah" className="bg-[#141210] text-[#fdfaf6]">Sudah Dijurnal</option>
            </select>
          </div>

          {/* Pencarian Deskripsi */}
          <div className="space-y-2">
            <label htmlFor="cari-deskripsi" className="block text-sm sm:text-base font-semibold text-[#d6cfc7]">
              Pencarian Transaksi / Berkas
            </label>
            <input
              id="cari-deskripsi"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari deskripsi, nama berkas, nomor JU..."
              className="w-full text-sm sm:text-base rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-3 text-[#fdfaf6] placeholder-[#5a524a] focus:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Tabel Mutasi Bank Desktop */}
      <div className="sogan-card bg-[#0e0c0a] border border-amber-500/20 rounded-2xl shadow-xl overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm sm:text-base border-collapse">
            <caption className="sr-only">
              Daftar seluruh riwayat transaksi mutasi bank hasil impor CSV
            </caption>
            <thead className="bg-[#141210] border-b border-amber-900/30 text-[#d6cfc7] text-xs sm:text-sm uppercase tracking-wider font-bold">
              <tr>
                <th scope="col" className="px-5 py-3.5">Tanggal</th>
                <th scope="col" className="px-5 py-3.5">Akun Bank</th>
                <th scope="col" className="px-5 py-3.5 min-w-[240px]">Deskripsi Transaksi</th>
                <th scope="col" className="px-5 py-3.5 text-right">Uang Masuk</th>
                <th scope="col" className="px-5 py-3.5 text-right">Uang Keluar</th>
                <th scope="col" className="px-5 py-3.5 text-right">Saldo</th>
                <th scope="col" className="px-5 py-3.5">Nama Berkas</th>
                <th scope="col" className="px-5 py-3.5 text-center">Status Jurnal</th>
                {isAkuntan && <th scope="col" className="px-5 py-3.5 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/10">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAkuntan ? 9 : 8}
                    className="px-5 py-12 text-center text-[#a89f91]"
                  >
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-3xl">📭</p>
                      <p className="font-bold text-[#fdfaf6] text-base">Tidak ada data mutasi bank</p>
                      <p className="text-xs sm:text-sm text-[#8a7e72]">
                        {mutasiList.length === 0
                          ? "Belum ada berkas CSV mutasi yang diimpor ke sistem."
                          : "Tidak ada transaksi yang cocok dengan kriteria filter saat ini."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const isMasuk = item.jumlah > 0;
                  const nominalAbs = Math.abs(item.jumlah);
                  const sudahDijurnal = item.jurnal_id !== null;

                  return (
                    <tr key={item.id} className="hover:bg-[#161311] transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-[#a89f91] font-medium">
                        {formatDate(item.tanggal)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm sm:text-base font-mono">
                        {item.akun_bank ? (
                          <span title={`${item.akun_bank.kode} - ${item.akun_bank.nama}`}>
                            <strong className="text-amber-300 font-bold">{item.akun_bank.kode}</strong>{" "}
                            <span className="text-[#a89f91]">- {item.akun_bank.nama}</span>
                          </span>
                        ) : (
                          `ID: ${item.akun_bank_id}`
                        )}
                      </td>
                      <td className="px-5 py-4 text-[#fdfaf6] font-medium break-words">
                        {item.deskripsi}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap font-mono tabular-nums">
                        {isMasuk ? (
                          <span className="font-bold text-emerald-300">
                            +{formatRupiah(nominalAbs)}
                          </span>
                        ) : (
                          <span className="text-[#5a524a]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap font-mono tabular-nums">
                        {!isMasuk ? (
                          <span className="font-bold text-rose-300">
                            -{formatRupiah(nominalAbs)}
                          </span>
                        ) : (
                          <span className="text-[#5a524a]">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap font-mono text-[#d6cfc7] tabular-nums">
                        {item.saldo !== null ? formatRupiah(item.saldo) : "-"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-[#8a7e72] font-mono max-w-[130px] truncate" title={item.nama_file}>
                        {item.nama_file}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        {sudahDijurnal ? (
                          <Link
                            href={`/jurnal/${item.jurnal_id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/60 text-blue-300 border border-blue-500/40 hover:bg-blue-900/60 transition"
                            title="Buka detail jurnal"
                          >
                            <span>✓</span>
                            <span>
                              {item.jurnal?.nomor ? item.jurnal.nomor : `Draf JU #${item.jurnal_id}`}
                            </span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                            <span>⏳</span>
                            <span>Belum Dijurnal</span>
                          </span>
                        )}
                      </td>
                      {isAkuntan && (
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {!sudahDijurnal ? (
                            <button
                              type="button"
                              onClick={() => onPilihBuatJurnal(item)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-[#070605] bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl hover:from-amber-500 hover:to-amber-600 transition shadow-md active:scale-95"
                            >
                              <span>+</span> Draf Jurnal
                            </button>
                          ) : (
                            <span className="text-xs text-[#8a7e72] italic">Terkait</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kartu Mutasi Mobile (Tampil Rapi di Ponsel) */}
      <div className="space-y-4 md:hidden">
        {filteredList.length === 0 ? (
          <div className="sogan-card bg-[#0e0c0a] border border-amber-900/20 rounded-2xl p-8 text-center text-[#a89f91]">
            <p className="text-3xl">📭</p>
            <p className="font-bold text-[#fdfaf6] mt-2">Tidak ada data mutasi</p>
            <p className="text-xs text-[#8a7e72] mt-1">
              {mutasiList.length === 0
                ? "Belum ada mutasi yang diimpor."
                : "Tidak ada transaksi yang cocok dengan filter."}
            </p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isMasuk = item.jumlah > 0;
            const nominalAbs = Math.abs(item.jumlah);
            const sudahDijurnal = item.jurnal_id !== null;

            return (
              <div
                key={item.id}
                className="sogan-card bg-[#0e0c0a] border border-amber-900/20 rounded-2xl p-4.5 shadow-md space-y-3"
              >
                {/* Header Kartu: Tanggal, Akun & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-amber-900/20 pb-3">
                  <div>
                    <span className="text-sm font-bold text-[#fdfaf6] block">
                      {formatDate(item.tanggal)}
                    </span>
                    <span className="text-xs text-[#a89f91]">
                      {item.akun_bank ? `${item.akun_bank.kode} - ${item.akun_bank.nama}` : `Akun: ${item.akun_bank_id}`}
                    </span>
                  </div>
                  <div>
                    {sudahDijurnal ? (
                      <Link
                        href={`/jurnal/${item.jurnal_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/60 text-blue-300 border border-blue-500/40"
                      >
                        <span>✓</span>
                        <span>{item.jurnal?.nomor || `JU #${item.jurnal_id}`}</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                        <span>⏳</span>
                        <span>Belum Dijurnal</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <span className="text-xs font-semibold text-[#8a7e72] uppercase tracking-wider block">
                    Keterangan Mutasi:
                  </span>
                  <p className="text-sm font-medium text-[#fdfaf6] break-words mt-1 leading-relaxed">
                    {item.deskripsi}
                  </p>
                </div>

                {/* Nominal & Saldo */}
                <div className="flex items-center justify-between bg-[#141210] p-3 rounded-xl border border-amber-900/20 text-xs sm:text-sm">
                  <div>
                    <span className="text-xs text-[#8a7e72] block">
                      {isMasuk ? "Uang Masuk (+):" : "Uang Keluar (-):"}
                    </span>
                    <span
                      className={`font-mono font-bold text-sm ${
                        isMasuk ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {isMasuk ? `+${formatRupiah(nominalAbs)}` : `-${formatRupiah(nominalAbs)}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#8a7e72] block">Saldo Rekening:</span>
                    <span className="font-mono text-[#d6cfc7] font-semibold text-sm">
                      {item.saldo !== null ? formatRupiah(item.saldo) : "-"}
                    </span>
                  </div>
                </div>

                {/* Footer Kartu: Nama File & Tombol Aksi */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[#8a7e72] font-mono truncate max-w-[140px]" title={item.nama_file}>
                    📁 {item.nama_file}
                  </span>
                  {isAkuntan && !sudahDijurnal && (
                    <button
                      type="button"
                      onClick={() => onPilihBuatJurnal(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-[#070605] bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl hover:from-amber-500 hover:to-amber-600 transition shadow-md"
                    >
                      <span>+</span> Buat Draf Jurnal
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

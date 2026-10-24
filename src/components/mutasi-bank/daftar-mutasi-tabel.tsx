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
    <div className="space-y-4">
      {/* Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Rekaman Mutasi
          </p>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {metrik.totalBaris}{" "}
            <span className="text-xs font-normal text-slate-500">baris</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <span>↓</span> Total Uang Masuk
          </p>
          <p className="text-xl font-bold text-emerald-700 mt-1 font-mono">
            {formatRupiah(metrik.totalMasuk)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wider flex items-center gap-1">
            <span>↑</span> Total Uang Keluar
          </p>
          <p className="text-xl font-bold text-red-700 mt-1 font-mono">
            {formatRupiah(metrik.totalKeluar)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <span>⏳</span> Belum Dijurnal
          </p>
          <p className="text-xl font-bold text-amber-800 mt-1 font-mono">
            {metrik.belumDijurnalCount}{" "}
            <span className="text-xs font-normal text-slate-500">baris</span>
          </p>
        </div>
      </div>

      {/* Filter & Kontrol Pencarian */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filter Akun Kas/Bank */}
          <div className="space-y-1">
            <label htmlFor="filter-akun" className="block text-xs font-bold text-slate-700">
              Filter Akun Rekening
            </label>
            <select
              id="filter-akun"
              value={filterAkunId}
              onChange={(e) => setFilterAkunId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Semua Akun Kas & Bank</option>
              {akunKasBankList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.kode} - {a.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Jurnal */}
          <div className="space-y-1">
            <label htmlFor="filter-status" className="block text-xs font-bold text-slate-700">
              Filter Status Jurnal
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="semua">Semua Status (Sudah & Belum)</option>
              <option value="belum">Belum Punya Jurnal</option>
              <option value="sudah">Sudah Dijurnal</option>
            </select>
          </div>

          {/* Pencarian Deskripsi */}
          <div className="space-y-1">
            <label htmlFor="cari-deskripsi" className="block text-xs font-bold text-slate-700">
              Pencarian Transaksi / Berkas
            </label>
            <input
              id="cari-deskripsi"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari deskripsi, nama berkas, nomor JU..."
              className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabel Mutasi Bank Desktop */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="sr-only">
              Daftar seluruh riwayat transaksi mutasi bank hasil impor CSV
            </caption>
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-4 py-3">Tanggal</th>
                <th scope="col" className="px-4 py-3">Akun Bank</th>
                <th scope="col" className="px-4 py-3 min-w-[200px]">Deskripsi Transaksi</th>
                <th scope="col" className="px-4 py-3 text-right">Uang Masuk</th>
                <th scope="col" className="px-4 py-3 text-right">Uang Keluar</th>
                <th scope="col" className="px-4 py-3 text-right">Saldo</th>
                <th scope="col" className="px-4 py-3">Nama Berkas</th>
                <th scope="col" className="px-4 py-3 text-center">Status Jurnal</th>
                {isAkuntan && <th scope="col" className="px-4 py-3 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAkuntan ? 9 : 8}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    <div className="max-w-sm mx-auto space-y-1">
                      <p className="text-2xl">📭</p>
                      <p className="font-bold text-slate-700">Tidak ada data mutasi bank</p>
                      <p className="text-xs text-slate-400">
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
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-800 font-medium">
                        {formatDate(item.tanggal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {item.akun_bank ? (
                          <span title={`${item.akun_bank.kode} - ${item.akun_bank.nama}`}>
                            <strong className="text-slate-800">{item.akun_bank.kode}</strong> - {item.akun_bank.nama}
                          </span>
                        ) : (
                          `ID: ${item.akun_bank_id}`
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium break-words">
                        {item.deskripsi}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                        {isMasuk ? (
                          <span className="font-semibold text-emerald-700">
                            +{formatRupiah(nominalAbs)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono">
                        {!isMasuk ? (
                          <span className="font-semibold text-red-700">
                            -{formatRupiah(nominalAbs)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono text-slate-600">
                        {item.saldo !== null ? formatRupiah(item.saldo) : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-slate-500 max-w-[120px] truncate" title={item.nama_file}>
                        {item.nama_file}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {sudahDijurnal ? (
                          <Link
                            href={`/jurnal/${item.jurnal_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition"
                            title="Buka detail jurnal"
                          >
                            <span>✓</span>
                            <span>
                              {item.jurnal?.nomor ? item.jurnal.nomor : `Draf JU #${item.jurnal_id}`}
                            </span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span>⏳</span>
                            <span>Belum Dijurnal</span>
                          </span>
                        )}
                      </td>
                      {isAkuntan && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {!sudahDijurnal ? (
                            <button
                              type="button"
                              onClick={() => onPilihBuatJurnal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm"
                            >
                              <span>+</span> Draf Jurnal
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Terkait</span>
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
      <div className="space-y-3 md:hidden">
        {filteredList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
            <p className="text-2xl">📭</p>
            <p className="font-bold text-slate-700 mt-1">Tidak ada data mutasi</p>
            <p className="text-xs text-slate-400 mt-0.5">
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
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3"
              >
                {/* Header Kartu: Tanggal, Akun & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {formatDate(item.tanggal)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.akun_bank ? `${item.akun_bank.kode} - ${item.akun_bank.nama}` : `Akun: ${item.akun_bank_id}`}
                    </span>
                  </div>
                  <div>
                    {sudahDijurnal ? (
                      <Link
                        href={`/jurnal/${item.jurnal_id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200"
                      >
                        <span>✓</span>
                        <span>{item.jurnal?.nomor || `JU #${item.jurnal_id}`}</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span>⏳</span>
                        <span>Belum Dijurnal</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Keterangan Mutasi:
                  </span>
                  <p className="text-xs font-medium text-slate-800 break-words mt-0.5">
                    {item.deskripsi}
                  </p>
                </div>

                {/* Nominal & Saldo */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">
                      {isMasuk ? "Uang Masuk (+):" : "Uang Keluar (-):"}
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        isMasuk ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {isMasuk ? `+${formatRupiah(nominalAbs)}` : `-${formatRupiah(nominalAbs)}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Saldo Rekening:</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {item.saldo !== null ? formatRupiah(item.saldo) : "-"}
                    </span>
                  </div>
                </div>

                {/* Footer Kartu: Nama File & Tombol Aksi */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={item.nama_file}>
                    📁 {item.nama_file}
                  </span>
                  {isAkuntan && !sudahDijurnal && (
                    <button
                      type="button"
                      onClick={() => onPilihBuatJurnal(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
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

"use client";

import React, { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { FormAkunModal } from "./form-akun-modal";
import type { Database, TipeAkun } from "@/types/database";

type AkunRow = Database["public"]["Tables"]["akun"]["Row"];

interface DaftarAkunProps {
  initialAkun: AkunRow[];
  userRole: "akuntan" | "direktur" | "staf";
  onRefresh?: () => void;
}

const TIPE_BADGE_STYLE: Record<TipeAkun, { label: string; className: string }> = {
  aset: {
    label: "1 - Aset",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  kewajiban: {
    label: "2 - Kewajiban",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  ekuitas: {
    label: "3 - Ekuitas",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  pendapatan: {
    label: "4 - Pendapatan",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  beban: {
    label: "5 - Beban",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export function DaftarAkun({ initialAkun, userRole, onRefresh }: DaftarAkunProps) {
  const isAkuntan = userRole === "akuntan";

  const [akunList, setAkunList] = useState<AkunRow[]>(initialAkun);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTipe, setFilterTipe] = useState<string>("semua");
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [filterKasBank, setFilterKasBank] = useState<boolean>(false);

  // State Modal Form Tambah / Ubah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [akunToEdit, setAkunToEdit] = useState<AkunRow | null>(null);

  // State Konfirmasi Aksi (Toggle Status Aktif/Nonaktif)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ambil data terbaru dari Supabase
  const refreshData = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("akun")
      .select("*")
      .order("kode", { ascending: true });

    if (!error && data) {
      setAkunList(data);
    }
    if (onRefresh) onRefresh();
  };

  // Filter daftar akun
  const filteredAkun = useMemo(() => {
    return akunList.filter((item) => {
      // 1. Pencarian (Kode atau Nama)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKode = item.kode.toLowerCase().includes(q);
        const matchNama = item.nama.toLowerCase().includes(q);
        const matchKet = item.keterangan?.toLowerCase().includes(q);
        if (!matchKode && !matchNama && !matchKet) return false;
      }

      // 2. Filter Tipe
      if (filterTipe !== "semua" && item.tipe !== filterTipe) {
        return false;
      }

      // 3. Filter Status Aktif
      if (filterStatus === "aktif" && !item.aktif) return false;
      if (filterStatus === "nonaktif" && item.aktif) return false;

      // 4. Filter Kas/Bank
      if (filterKasBank && !item.is_kas_bank) return false;

      return true;
    });
  }, [akunList, searchQuery, filterTipe, filterStatus, filterKasBank]);

  // Handler Buka Form Tambah
  const handleOpenTambah = () => {
    setAkunToEdit(null);
    setIsModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Handler Buka Form Ubah
  const handleOpenUbah = (akun: AkunRow) => {
    setAkunToEdit(akun);
    setIsModalOpen(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Handler Toggle Status Aktif / Nonaktif
  const handleToggleAktif = async (akun: AkunRow) => {
    const newStatus = !akun.aktif;
    const confirmText = newStatus
      ? `Aktifkan kembali akun "${akun.kode} - ${akun.nama}"?`
      : `Nonaktifkan akun "${akun.kode} - ${akun.nama}"? Akun nonaktif tidak bisa dipilih pada transaksi jurnal atau pengajuan baru (BR-01).`;

    if (!window.confirm(confirmText)) return;

    setActionLoadingId(akun.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("akun")
        .update({ aktif: newStatus })
        .eq("id", akun.id);

      if (error) throw error;

      setSuccessMessage(
        `Akun "${akun.kode} - ${akun.nama}" berhasil di${newStatus ? "aktifkan" : "nonaktifkan"}.`
      );
      await refreshData();
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setActionLoadingId(null);
    }
  };



  return (
    <div className="space-y-4">
      {/* Banner Pesan Sukses & Error */}
      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="font-bold text-emerald-600 text-sm">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1"
            aria-label="Tutup pesan sukses"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800 flex items-center justify-between"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="font-bold text-rose-600 text-sm">
              ⚠️
            </span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 p-1"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toolbar Filter & Aksi Tambah */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Bagan Akun (Chart of Accounts)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar akun 4 digit CV Batik Larasati diurutkan menurut kode (BR-01)
            </p>
          </div>

          {/* Tombol Tambah Akun (Hanya Akuntan, Direktur tidak melihat tombol ini) */}
          {isAkuntan && (
            <button
              type="button"
              onClick={handleOpenTambah}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs shrink-0"
            >
              <span aria-hidden="true" className="text-sm">
                +
              </span>
              <span>Tambah Akun Baru</span>
            </button>
          )}
        </div>

        {/* Input Pencarian & Dropdown Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
          {/* Kotak Cari */}
          <div>
            <label htmlFor="search-akun" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Cari Akun
            </label>
            <input
              id="search-akun"
              type="text"
              placeholder="Cari kode atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Filter Tipe */}
          <div>
            <label htmlFor="filter-tipe" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tipe Klasifikasi
            </label>
            <select
              id="filter-tipe"
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="semua">Semua Tipe (1 s.d. 5)</option>
              <option value="aset">1 - Aset</option>
              <option value="kewajiban">2 - Kewajiban</option>
              <option value="ekuitas">3 - Ekuitas</option>
              <option value="pendapatan">4 - Pendapatan</option>
              <option value="beban">5 - Beban</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label htmlFor="filter-status" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status Akun
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif Saja</option>
              <option value="nonaktif">Nonaktif Saja</option>
            </select>
          </div>

          {/* Filter Kas/Bank */}
          <div className="flex items-end pb-1.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={filterKasBank}
                onChange={(e) => setFilterKasBank(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Hanya Akun Kas/Bank</span>
            </label>
          </div>
        </div>
      </div>

      {/* Ringkasan Jumlah */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Menampilkan <strong className="text-slate-900">{filteredAkun.length}</strong> dari{" "}
          <strong className="text-slate-900">{akunList.length}</strong> akun
        </span>
        {!isAkuntan && (
          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
            Mode Lihat Saja (Direktur)
          </span>
        )}
      </div>

      {/* Tabel Akun Desktop / Tablet */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">Kode</th>
              <th scope="col" className="px-4 py-3">Nama Akun</th>
              <th scope="col" className="px-4 py-3">Tipe</th>
              <th scope="col" className="px-4 py-3">Saldo Normal</th>
              <th scope="col" className="px-4 py-3">Kas / Bank</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Keterangan</th>
              {isAkuntan && <th scope="col" className="px-4 py-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAkun.length === 0 ? (
              <tr>
                <td colSpan={isAkuntan ? 8 : 7} className="px-4 py-8 text-center text-slate-400">
                  Tidak ada akun yang sesuai dengan filter pencarian.
                </td>
              </tr>
            ) : (
              filteredAkun.map((akun) => {
                const tipeBadge = TIPE_BADGE_STYLE[akun.tipe];
                const isLoading = actionLoadingId === akun.id;

                return (
                  <tr
                    key={akun.id}
                    className={`hover:bg-slate-50/80 transition ${
                      !akun.aktif ? "bg-slate-50/50 opacity-75" : ""
                    }`}
                  >
                    {/* Kode 4 Digit */}
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                      {akun.kode}
                    </td>

                    {/* Nama Akun */}
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {akun.nama}
                    </td>

                    {/* Tipe Akun */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tipeBadge.className}`}
                      >
                        {tipeBadge.label}
                      </span>
                    </td>

                    {/* Saldo Normal */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="capitalize font-medium text-slate-700">
                        {akun.saldo_normal}
                      </span>
                    </td>

                    {/* Kas / Bank */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {akun.is_kas_bank ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                          <span aria-hidden="true">🏦</span> Kas / Bank
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Status Aktif */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {akun.aktif ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          <span aria-hidden="true">✓</span> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          <span aria-hidden="true">✕</span> Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Kolom Keterangan Tersendiri (BR-01) */}
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      {akun.keterangan ? (
                        <span className="line-clamp-2 text-[11px]" title={akun.keterangan}>
                          {akun.keterangan}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Tombol Aksi (Khusus Akuntan) */}
                    {isAkuntan && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Ubah */}
                          <button
                            type="button"
                            onClick={() => handleOpenUbah(akun)}
                            disabled={isLoading}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                            title="Ubah nama dan keterangan akun"
                          >
                            Ubah
                          </button>

                          {/* Tombol Nonaktifkan / Aktifkan */}
                          <button
                            type="button"
                            onClick={() => handleToggleAktif(akun)}
                            disabled={isLoading}
                            className={`rounded-md border px-2 py-1 text-[11px] font-medium transition disabled:opacity-50 ${
                              akun.aktif
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            }`}
                            title={akun.aktif ? "Nonaktifkan akun" : "Aktifkan akun"}
                          >
                            {isLoading ? "..." : akun.aktif ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu Ponsel (Mobile Responsive) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredAkun.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            Tidak ada akun yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredAkun.map((akun) => {
            const tipeBadge = TIPE_BADGE_STYLE[akun.tipe];
            const isLoading = actionLoadingId === akun.id;

            return (
              <div
                key={akun.id}
                className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5 ${
                  !akun.aktif ? "opacity-75 bg-slate-50" : ""
                }`}
              >
                {/* Header Kartu: Kode & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {akun.kode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {akun.aktif ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <span aria-hidden="true">✓</span> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        <span aria-hidden="true">✕</span> Nonaktif
                      </span>
                    )}
                  </div>
                </div>

                {/* Nama & Keterangan */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{akun.nama}</h3>
                  {akun.keterangan && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{akun.keterangan}</p>
                  )}
                </div>

                {/* Rincian Atribut */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 text-[11px]">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${tipeBadge.className}`}
                  >
                    {tipeBadge.label}
                  </span>

                  <span className="rounded bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] capitalize font-medium">
                    Saldo Normal: {akun.saldo_normal}
                  </span>

                  {akun.is_kas_bank && (
                    <span className="inline-flex items-center gap-1 rounded bg-teal-50 border border-teal-200 text-teal-800 px-2 py-0.5 text-[10px] font-semibold">
                      🏦 Kas/Bank
                    </span>
                  )}
                </div>

                {/* Tombol Aksi Mobile (Khusus Akuntan) */}
                {isAkuntan && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenUbah(akun)}
                      disabled={isLoading}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-center disabled:opacity-50"
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAktif(akun)}
                      disabled={isLoading}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition text-center disabled:opacity-50 ${
                        akun.aktif
                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      {isLoading ? "..." : akun.aktif ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Form Tambah / Ubah Akun */}
      <FormAkunModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          refreshData();
        }}
        akunToEdit={akunToEdit}
      />
    </div>
  );
}

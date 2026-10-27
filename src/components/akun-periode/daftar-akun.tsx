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
    className: "bg-blue-950/50 text-blue-300 border-blue-500/30",
  },
  kewajiban: {
    label: "2 - Kewajiban",
    className: "bg-amber-950/50 text-amber-300 border-amber-500/30",
  },
  ekuitas: {
    label: "3 - Ekuitas",
    className: "bg-purple-950/50 text-purple-300 border-purple-500/30",
  },
  pendapatan: {
    label: "4 - Pendapatan",
    className: "bg-emerald-950/50 text-emerald-300 border-emerald-500/30",
  },
  beban: {
    label: "5 - Beban",
    className: "bg-rose-950/50 text-rose-300 border-rose-500/30",
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
    <div className="space-y-6">
      {/* Banner Pesan Sukses & Error */}
      {successMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs sm:text-sm font-medium text-emerald-300 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="font-bold text-emerald-400 text-base">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1.5 rounded-lg hover:bg-emerald-900/40 transition"
            aria-label="Tutup pesan sukses"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs sm:text-sm font-medium text-rose-300 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-start gap-2.5">
            <span aria-hidden="true" className="font-bold text-rose-400 text-base">
              ⚠️
            </span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 p-1.5 rounded-lg hover:bg-rose-900/40 transition"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toolbar Filter & Aksi Tambah */}
      <div className="sogan-card flex flex-col gap-4 rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-[#fdfaf6]">
                Bagan Akun (Chart of Accounts)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#a89f91]">
              Daftar kode akun 4 digit CV Batik Larasati diurutkan menurut kode (BR-01)
            </p>
          </div>

          {/* Tombol Tambah Akun (Hanya Akuntan) */}
          {isAkuntan && (
            <button
              type="button"
              onClick={handleOpenTambah}
              className="btn-3d-gold px-4 py-2.5 text-xs sm:text-sm font-bold gap-2 shrink-0"
            >
              <span aria-hidden="true" className="text-base font-extrabold">
                +
              </span>
              <span>Tambah Akun Baru</span>
            </button>
          )}
        </div>

        {/* Input Pencarian & Dropdown Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-amber-900/20">
          {/* Kotak Cari */}
          <div>
            <label htmlFor="search-akun" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
              Cari Akun
            </label>
            <input
              id="search-akun"
              type="text"
              placeholder="Cari kode atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2 text-xs sm:text-sm text-[#fdfaf6] placeholder-[#5c554b] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
            />
          </div>

          {/* Filter Tipe */}
          <div>
            <label htmlFor="filter-tipe" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
              Tipe Klasifikasi
            </label>
            <select
              id="filter-tipe"
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
            >
              <option value="semua" className="bg-[#141210] text-[#fdfaf6]">Semua Tipe (1 s.d. 5)</option>
              <option value="aset" className="bg-[#141210] text-[#fdfaf6]">1 - Aset</option>
              <option value="kewajiban" className="bg-[#141210] text-[#fdfaf6]">2 - Kewajiban</option>
              <option value="ekuitas" className="bg-[#141210] text-[#fdfaf6]">3 - Ekuitas</option>
              <option value="pendapatan" className="bg-[#141210] text-[#fdfaf6]">4 - Pendapatan</option>
              <option value="beban" className="bg-[#141210] text-[#fdfaf6]">5 - Beban</option>
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <label htmlFor="filter-status" className="block text-xs font-bold text-[#fdfaf6] uppercase tracking-wider mb-1.5">
              Status Akun
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition"
            >
              <option value="semua" className="bg-[#141210] text-[#fdfaf6]">Semua Status</option>
              <option value="aktif" className="bg-[#141210] text-[#fdfaf6]">Aktif Saja</option>
              <option value="nonaktif" className="bg-[#141210] text-[#fdfaf6]">Nonaktif Saja</option>
            </select>
          </div>

          {/* Filter Kas/Bank */}
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-semibold text-[#d6cfc7] hover:text-[#fdfaf6] transition">
              <input
                type="checkbox"
                checked={filterKasBank}
                onChange={(e) => setFilterKasBank(e.target.checked)}
                className="h-4 w-4 rounded border-amber-900/40 bg-[#141210] text-amber-500 focus:ring-amber-500/40"
              />
              <span>Hanya Akun Kas/Bank</span>
            </label>
          </div>
        </div>
      </div>

      {/* Ringkasan Jumlah */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-[#a89f91] px-1">
        <span>
          Menampilkan <strong className="text-amber-400 font-mono font-bold">{filteredAkun.length}</strong> dari{" "}
          <strong className="text-[#fdfaf6] font-mono font-bold">{akunList.length}</strong> akun
        </span>
        {!isAkuntan && (
          <span className="text-[11px] bg-amber-950/40 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-semibold">
            Mode Lihat Saja (Direktur)
          </span>
        )}
      </div>

      {/* Tabel Akun Desktop / Tablet */}
      <div className="hidden md:block sogan-card overflow-hidden rounded-2xl border border-amber-900/20 bg-[#0e0c0a] shadow-xl">
        <table className="w-full text-left text-xs sm:text-sm text-[#d6cfc7]">
          <thead className="border-b border-amber-900/20 bg-[#141210] text-[11px] font-bold uppercase tracking-wider text-[#a89f91]">
            <tr>
              <th scope="col" className="px-5 py-3.5">Kode</th>
              <th scope="col" className="px-5 py-3.5">Nama Akun</th>
              <th scope="col" className="px-5 py-3.5">Tipe</th>
              <th scope="col" className="px-5 py-3.5">Saldo Normal</th>
              <th scope="col" className="px-5 py-3.5">Kas / Bank</th>
              <th scope="col" className="px-5 py-3.5">Status</th>
              <th scope="col" className="px-5 py-3.5">Keterangan</th>
              {isAkuntan && <th scope="col" className="px-5 py-3.5 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-900/10">
            {filteredAkun.length === 0 ? (
              <tr>
                <td colSpan={isAkuntan ? 8 : 7} className="px-5 py-10 text-center text-[#a89f91] italic">
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
                    className={`hover:bg-amber-950/20 transition-colors ${
                      !akun.aktif ? "bg-[#141210]/30 opacity-70" : ""
                    }`}
                  >
                    {/* Kode 4 Digit */}
                    <td className="px-5 py-3.5 font-mono font-bold text-amber-300 text-sm whitespace-nowrap">
                      {akun.kode}
                    </td>

                    {/* Nama Akun */}
                    <td className="px-5 py-3.5 font-semibold text-[#fdfaf6] whitespace-nowrap">
                      {akun.nama}
                    </td>

                    {/* Tipe Akun */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tipeBadge.className}`}
                      >
                        {tipeBadge.label}
                      </span>
                    </td>

                    {/* Saldo Normal */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="capitalize font-semibold text-[#d6cfc7]">
                        {akun.saldo_normal}
                      </span>
                    </td>

                    {/* Kas / Bank */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {akun.is_kas_bank ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-950/50 border border-teal-500/30 px-2.5 py-0.5 text-[11px] font-bold text-teal-300">
                          <span aria-hidden="true">🏦</span> Kas / Bank
                        </span>
                      ) : (
                        <span className="text-[#5c554b]">-</span>
                      )}
                    </td>

                    {/* Status Aktif */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {akun.aktif ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                          <span aria-hidden="true">✓</span> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#141210] border border-amber-900/30 px-2.5 py-0.5 text-[11px] font-medium text-[#a89f91]">
                          <span aria-hidden="true">✕</span> Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Kolom Keterangan Tersendiri (BR-01) */}
                    <td className="px-5 py-3.5 text-[#a89f91] max-w-xs">
                      {akun.keterangan ? (
                        <span className="line-clamp-2 text-xs" title={akun.keterangan}>
                          {akun.keterangan}
                        </span>
                      ) : (
                        <span className="text-[#5c554b]">-</span>
                      )}
                    </td>

                    {/* Tombol Aksi (Khusus Akuntan) */}
                    {isAkuntan && (
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Tombol Ubah */}
                          <button
                            type="button"
                            onClick={() => handleOpenUbah(akun)}
                            disabled={isLoading}
                            className="btn-3d-dark px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                            title="Ubah nama dan keterangan akun"
                          >
                            Ubah
                          </button>

                          {/* Tombol Nonaktifkan / Aktifkan */}
                          <button
                            type="button"
                            onClick={() => handleToggleAktif(akun)}
                            disabled={isLoading}
                            className={`btn-3d-dark px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                              akun.aktif ? "text-amber-400" : "text-emerald-400"
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
          <div className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-8 text-center text-xs text-[#a89f91]">
            Tidak ada akun yang sesuai dengan filter pencarian.
          </div>
        ) : (
          filteredAkun.map((akun) => {
            const tipeBadge = TIPE_BADGE_STYLE[akun.tipe];
            const isLoading = actionLoadingId === akun.id;

            return (
              <div
                key={akun.id}
                className={`sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-5 shadow-lg space-y-3 ${
                  !akun.aktif ? "opacity-75 bg-[#141210]/40" : ""
                }`}
              >
                {/* Header Kartu: Kode & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-amber-300 bg-[#141210] border border-amber-900/30 px-2.5 py-1 rounded-lg">
                    {akun.kode}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {akun.aktif ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        <span aria-hidden="true">✓</span> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#141210] border border-amber-900/30 px-2.5 py-0.5 text-[10px] font-medium text-[#a89f91]">
                        <span aria-hidden="true">✕</span> Nonaktif
                      </span>
                    )}
                  </div>
                </div>

                {/* Nama & Keterangan */}
                <div>
                  <h3 className="text-sm font-bold text-[#fdfaf6]">{akun.nama}</h3>
                  {akun.keterangan && (
                    <p className="text-xs text-[#a89f91] mt-1">{akun.keterangan}</p>
                  )}
                </div>

                {/* Rincian Atribut */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-900/20 text-[11px]">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${tipeBadge.className}`}
                  >
                    {tipeBadge.label}
                  </span>

                  <span className="rounded-full bg-[#141210] border border-amber-900/30 text-[#d6cfc7] px-2.5 py-0.5 text-[10px] capitalize font-semibold">
                    Saldo Normal: {akun.saldo_normal}
                  </span>

                  {akun.is_kas_bank && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-950/50 border border-teal-500/30 text-teal-300 px-2.5 py-0.5 text-[10px] font-bold">
                      🏦 Kas/Bank
                    </span>
                  )}
                </div>

                {/* Tombol Aksi Mobile (Khusus Akuntan) */}
                {isAkuntan && (
                  <div className="flex items-center gap-2 pt-3 border-t border-amber-900/20">
                    <button
                      type="button"
                      onClick={() => handleOpenUbah(akun)}
                      disabled={isLoading}
                      className="btn-3d-dark flex-1 py-2 text-xs font-bold text-center disabled:opacity-50"
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAktif(akun)}
                      disabled={isLoading}
                      className={`btn-3d-dark flex-1 py-2 text-xs font-bold text-center disabled:opacity-50 ${
                        akun.aktif ? "text-amber-400" : "text-emerald-400"
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

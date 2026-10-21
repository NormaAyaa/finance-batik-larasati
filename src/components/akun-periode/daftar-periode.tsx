"use client";

import React, { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatBulanTahun, formatDateTime } from "@/lib/utils/formatters";
import { TutupPeriodeModal } from "./tutup-periode-modal";
import { BukaPeriodeModal } from "./buka-periode-modal";
import type { Database } from "@/types/database";

export type PeriodeWithProfile = Database["public"]["Tables"]["periode"]["Row"] & {
  penutup?: {
    id: string;
    nama_lengkap: string;
    email: string;
    peran: string;
  } | null;
};

interface DaftarPeriodeProps {
  initialPeriode: PeriodeWithProfile[];
  userRole: "akuntan" | "direktur" | "staf";
  onRefresh?: () => void;
}

export function DaftarPeriode({
  initialPeriode,
  userRole,
  onRefresh,
}: DaftarPeriodeProps) {
  const isAkuntan = userRole === "akuntan";
  const isDirektur = userRole === "direktur";

  const [periodeList, setPeriodeList] = useState<PeriodeWithProfile[]>(initialPeriode);
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [filterTahun, setFilterTahun] = useState<string>("semua");

  // State Modal Tutup Periode (Akuntan)
  const [tutupModalPeriode, setTutupModalPeriode] = useState<PeriodeWithProfile | null>(null);

  // State Modal Buka Kembali (Direktur)
  const [bukaModalPeriode, setBukaModalPeriode] = useState<PeriodeWithProfile | null>(null);

  // State Pesan Banner
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refresh data periode dari Supabase
  const refreshData = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("periode")
      .select(`
        id,
        tahun,
        bulan,
        tanggal_mulai,
        status,
        ditutup_oleh,
        ditutup_pada,
        alasan_buka_ulang,
        penutup:profiles!ditutup_oleh (
          id,
          nama_lengkap,
          email,
          peran
        )
      `)
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false });

    if (!error && data) {
      setPeriodeList(data as unknown as PeriodeWithProfile[]);
    }
    if (onRefresh) onRefresh();
  };

  // Kumpulan tahun unik untuk filter
  const tahunOptions = useMemo(() => {
    const setTahun = new Set<number>();
    periodeList.forEach((p) => setTahun.add(p.tahun));
    return Array.from(setTahun).sort((a, b) => b - a);
  }, [periodeList]);

  // Filter daftar periode
  const filteredPeriode = useMemo(() => {
    return periodeList.filter((item) => {
      if (filterStatus !== "semua" && item.status !== filterStatus) {
        return false;
      }
      if (filterTahun !== "semua" && item.tahun !== Number(filterTahun)) {
        return false;
      }
      return true;
    });
  }, [periodeList, filterStatus, filterTahun]);

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

      {/* Toolbar Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Periode Akuntansi Bulanan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kontrol penutupan buku (Akuntan) dan pembukaan kembali (Direktur) sesuai BR-06
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isAkuntan && (
              <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-blue-800 font-medium">
                Wewenang: Tutup Periode
              </span>
            )}
            {isDirektur && (
              <span className="rounded-md bg-purple-50 border border-purple-200 px-2.5 py-1 text-purple-800 font-medium">
                Wewenang: Buka Kembali Periode
              </span>
            )}
          </div>
        </div>

        {/* Dropdown Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          <div>
            <label htmlFor="filter-periode-status" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Status Periode
            </label>
            <select
              id="filter-periode-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="semua">Semua Status</option>
              <option value="terbuka">Terbuka Saja</option>
              <option value="ditutup">Ditutup Saja</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-periode-tahun" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tahun Buku
            </label>
            <select
              id="filter-periode-tahun"
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="semua">Semua Tahun</option>
              {tahunOptions.map((t) => (
                <option key={t} value={t}>
                  Tahun {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ringkasan Jumlah */}
      <div className="text-xs text-slate-500 px-1">
        Menampilkan <strong className="text-slate-900">{filteredPeriode.length}</strong> periode akuntansi
      </div>

      {/* Tabel Periode Desktop */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            <tr>
              <th scope="col" className="px-4 py-3">Periode</th>
              <th scope="col" className="px-4 py-3">Status Buku</th>
              <th scope="col" className="px-4 py-3">Ditutup Oleh & Waktu</th>
              <th scope="col" className="px-4 py-3">Alasan Buka Ulang</th>
              <th scope="col" className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPeriode.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Tidak ada data periode akuntansi yang sesuai.
                </td>
              </tr>
            ) : (
              filteredPeriode.map((item) => {
                const label = formatBulanTahun(item.tahun, item.bulan);
                const isTerbuka = item.status === "terbuka";

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* Nama Periode */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">{label}</div>
                      <div className="text-[11px] text-slate-400">
                        Mulai: {item.tanggal_mulai}
                      </div>
                    </td>

                    {/* Status Buku dengan Indikator Aksesibel */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isTerbuka ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                          />
                          <span>● Terbuka</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          <span aria-hidden="true">🔒</span>
                          <span>Ditutup</span>
                        </span>
                      )}
                    </td>

                    {/* Ditutup Oleh & Kapan */}
                    <td className="px-4 py-3.5">
                      {!isTerbuka && item.ditutup_pada ? (
                        <div>
                          <div className="font-semibold text-slate-800">
                            {item.penutup?.nama_lengkap || "Akuntan"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatDateTime(item.ditutup_pada)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Alasan Buka Ulang (bila ada) */}
                    <td className="px-4 py-3.5 max-w-xs">
                      {item.alasan_buka_ulang ? (
                        <div className="rounded-lg bg-purple-50/80 border border-purple-200/60 p-2 text-[11px] text-purple-900">
                          <span className="font-semibold block text-[10px] text-purple-700 uppercase tracking-wider">
                            Riwayat Buka Kembali:
                          </span>
                          <span className="italic line-clamp-2">
                            &quot;{item.alasan_buka_ulang}&quot;
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Kolom Aksi */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {/* Akuntan: Tombol Tutup Periode bila status terbuka */}
                      {isAkuntan && isTerbuka && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage(null);
                            setSuccessMessage(null);
                            setTutupModalPeriode(item);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900 transition shadow-xs"
                          title="Tutup periode pembukuan ini (BR-06)"
                        >
                          <span aria-hidden="true">🔒</span>
                          <span>Tutup Periode</span>
                        </button>
                      )}

                      {/* Direktur: Tombol Buka Kembali bila status ditutup */}
                      {isDirektur && !isTerbuka && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage(null);
                            setSuccessMessage(null);
                            setBukaModalPeriode(item);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-800 transition shadow-xs"
                          title="Buka kembali periode akuntansi ini (BR-06)"
                        >
                          <span aria-hidden="true">🔓</span>
                          <span>Buka Kembali</span>
                        </button>
                      )}

                      {/* Jika tidak ada aksi yang sah untuk peran pengguna */}
                      {((isAkuntan && !isTerbuka) || (isDirektur && isTerbuka)) && (
                        <span className="text-[11px] text-slate-400 italic">Selesai</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilan Kartu Ponsel (Mobile Responsive) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filteredPeriode.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
            Tidak ada data periode akuntansi yang sesuai.
          </div>
        ) : (
          filteredPeriode.map((item) => {
            const label = formatBulanTahun(item.tahun, item.bulan);
            const isTerbuka = item.status === "terbuka";

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
              >
                {/* Header: Periode & Badge Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{label}</h3>
                    <p className="text-[11px] text-slate-400">Mulai: {item.tanggal_mulai}</p>
                  </div>

                  {isTerbuka ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      <span>● Terbuka</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                      <span>🔒 Ditutup</span>
                    </span>
                  )}
                </div>

                {/* Info Penutupan */}
                {!isTerbuka && item.ditutup_pada && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Ditutup Oleh:
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.penutup?.nama_lengkap || "Akuntan"}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      pada {formatDateTime(item.ditutup_pada)}
                    </span>
                  </div>
                )}

                {/* Alasan Buka Ulang */}
                {item.alasan_buka_ulang && (
                  <div className="rounded-lg bg-purple-50 p-2.5 text-xs text-purple-900 border border-purple-200">
                    <span className="font-bold block text-[10px] text-purple-700 uppercase">
                      Alasan Buka Ulang (Direktur):
                    </span>
                    <p className="italic mt-0.5">&quot;{item.alasan_buka_ulang}&quot;</p>
                  </div>
                )}

                {/* Aksi Mobile */}
                {isAkuntan && isTerbuka && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setTutupModalPeriode(item);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-800 py-2 text-xs font-semibold text-white hover:bg-amber-900 transition shadow-xs"
                  >
                    <span>🔒</span>
                    <span>Tutup Periode</span>
                  </button>
                )}

                {isDirektur && !isTerbuka && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setBukaModalPeriode(item);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-purple-700 py-2 text-xs font-semibold text-white hover:bg-purple-800 transition shadow-xs"
                  >
                    <span>🔓</span>
                    <span>Buka Kembali Periode</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tutup Periode (Akuntan) */}
      <TutupPeriodeModal
        isOpen={Boolean(tutupModalPeriode)}
        periode={tutupModalPeriode}
        onClose={() => setTutupModalPeriode(null)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          refreshData();
        }}
      />

      {/* Modal Buka Periode (Direktur) */}
      <BukaPeriodeModal
        isOpen={Boolean(bukaModalPeriode)}
        periode={bukaModalPeriode}
        onClose={() => setBukaModalPeriode(null)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          refreshData();
        }}
      />
    </div>
  );
}

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
  jumlah_draf?: number;
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

  // Refresh data periode dan hitungan draf dari Supabase
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
      // Ambil jumlah jurnal draf per periode dengan head: true (tidak terpotong batas 1.000 baris)
      const periodeWithDraf: PeriodeWithProfile[] = await Promise.all(
        data.map(async (p) => {
          const { count } = await supabase
            .from("jurnal")
            .select("id", { count: "exact", head: true })
            .eq("periode_id", p.id)
            .eq("status", "draf");

          return {
            ...p,
            jumlah_draf: count ?? 0,
          } as unknown as PeriodeWithProfile;
        })
      );
      setPeriodeList(periodeWithDraf);
    }
    if (onRefresh) onRefresh();
  };

  // Periode terakhir yang ditutup (urutan tahun lalu bulan)
  // Aturan BR-06: Hanya periode terakhir yang ditutup yang boleh dibuka kembali
  const latestClosedPeriode = useMemo(() => {
    const closed = periodeList.filter((p) => p.status === "ditutup");
    if (closed.length === 0) return null;
    return closed.reduce((latest, current) => {
      if (!latest) return current;
      if (current.tahun > latest.tahun) return current;
      if (current.tahun === latest.tahun && current.bulan > latest.bulan) return current;
      return latest;
    }, closed[0]);
  }, [periodeList]);

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
          className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs font-medium text-emerald-300 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="font-bold text-emerald-400 text-sm">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
            aria-label="Tutup pesan sukses"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs font-medium text-rose-300 flex items-center justify-between"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="font-bold text-rose-400 text-sm">
              ⚠️
            </span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 p-1"
            aria-label="Tutup pesan error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toolbar Filter */}
      <div className="sogan-card flex flex-col gap-3.5 rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#fdfaf6] tracking-tight">Periode Akuntansi Bulanan</h2>
            <p className="text-xs text-[#a89f91] mt-0.5">
              Kontrol penutupan buku (Akuntan) dan pembukaan kembali (Direktur) sesuai BR-06
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isAkuntan && (
              <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-amber-300 font-semibold text-xs">
                Wewenang: Tutup Periode
              </span>
            )}
            {isDirektur && (
              <span className="rounded-lg bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-purple-300 font-semibold text-xs">
                Wewenang: Buka Kembali Periode
              </span>
            )}
          </div>
        </div>

        {/* Dropdown Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-amber-900/20">
          <div>
            <label htmlFor="filter-periode-status" className="block text-[11px] font-semibold text-[#a89f91] mb-1.5">
              Status Periode
            </label>
            <select
              id="filter-periode-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition"
            >
              <option value="semua" className="bg-[#141210] text-[#fdfaf6]">Semua Status</option>
              <option value="terbuka" className="bg-[#141210] text-[#fdfaf6]">Terbuka Saja</option>
              <option value="ditutup" className="bg-[#141210] text-[#fdfaf6]">Ditutup Saja</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-periode-tahun" className="block text-[11px] font-semibold text-[#a89f91] mb-1.5">
              Tahun Buku
            </label>
            <select
              id="filter-periode-tahun"
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-3.5 py-2 text-xs sm:text-sm text-[#fdfaf6] focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition"
            >
              <option value="semua" className="bg-[#141210] text-[#fdfaf6]">Semua Tahun</option>
              {tahunOptions.map((t) => (
                <option key={t} value={t} className="bg-[#141210] text-[#fdfaf6]">
                  Tahun {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Ringkasan Jumlah */}
      <div className="text-xs text-[#a89f91] px-1">
        Menampilkan <strong className="text-[#fdfaf6]">{filteredPeriode.length}</strong> periode akuntansi
      </div>

      {/* Tabel Periode Desktop */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-amber-900/20 bg-[#0e0c0a] shadow-xl">
        <table className="w-full text-left text-xs text-[#d6cfc7]">
          <thead className="border-b border-amber-900/20 bg-[#141210] text-[11px] font-bold uppercase tracking-wider text-[#a89f91]">
            <tr>
              <th scope="col" className="px-4 py-3.5">Periode</th>
              <th scope="col" className="px-4 py-3.5">Status Buku</th>
              <th scope="col" className="px-4 py-3.5 text-center">Jurnal Draf</th>
              <th scope="col" className="px-4 py-3.5">Ditutup Oleh & Waktu</th>
              <th scope="col" className="px-4 py-3.5">Alasan Buka Ulang</th>
              <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-900/10">
            {filteredPeriode.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#736b5e]">
                  Tidak ada data periode akuntansi yang sesuai.
                </td>
              </tr>
            ) : (
              filteredPeriode.map((item) => {
                const label = formatBulanTahun(item.tahun, item.bulan);
                const isTerbuka = item.status === "terbuka";
                const isTerakhirDitutup = !isTerbuka && latestClosedPeriode?.id === item.id;

                return (
                  <tr key={item.id} className="hover:bg-amber-950/20 transition">
                    {/* Nama Periode */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#fdfaf6] text-sm">{label}</div>
                      <div className="text-[11px] text-[#736b5e] mt-0.5">
                        Mulai: {item.tanggal_mulai}
                      </div>
                    </td>

                    {/* Status Buku dengan Indikator Aksesibel */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isTerbuka ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
                          />
                          <span>● Terbuka</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#141210] border border-amber-900/30 px-2.5 py-1 text-[11px] font-semibold text-[#a89f91]">
                          <span aria-hidden="true">🔒</span>
                          <span>Ditutup</span>
                        </span>
                      )}
                    </td>

                    {/* Jumlah Jurnal Draf (BR-06) */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {item.jumlah_draf !== undefined && item.jumlah_draf > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                          <span aria-hidden="true">⚠️</span>
                          <span>{item.jumlah_draf} draf</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[#141210] border border-amber-900/20 px-2.5 py-0.5 text-[11px] font-medium text-[#736b5e]">
                          0 draf
                        </span>
                      )}
                    </td>

                    {/* Ditutup Oleh & Kapan */}
                    <td className="px-4 py-3.5">
                      {!isTerbuka && item.ditutup_pada ? (
                        <div>
                          <div className="font-semibold text-[#fdfaf6]">
                            {item.penutup?.nama_lengkap || "Akuntan"}
                          </div>
                          <div className="text-[11px] text-[#a89f91]">
                            {formatDateTime(item.ditutup_pada)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#736b5e]">-</span>
                      )}
                    </td>

                    {/* Alasan Buka Ulang (bila ada) */}
                    <td className="px-4 py-3.5 max-w-xs">
                      {item.alasan_buka_ulang ? (
                        <div className="rounded-xl bg-purple-950/20 border border-purple-500/30 p-2.5 text-[11px] text-purple-200">
                          <span className="font-semibold block text-[10px] text-purple-400 uppercase tracking-wider">
                            Riwayat Buka Kembali:
                          </span>
                          <span className="italic line-clamp-2">
                            &quot;{item.alasan_buka_ulang}&quot;
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#736b5e]">-</span>
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
                          className="btn-3d-gold px-3.5 py-1.5 text-xs font-bold gap-1.5"
                          title="Tutup periode pembukuan ini (BR-06)"
                        >
                          <span aria-hidden="true">🔒</span>
                          <span>Tutup Periode</span>
                        </button>
                      )}

                      {/* Direktur: Tombol Buka Kembali HANYA bila periode terakhir yang ditutup (BR-06) */}
                      {isDirektur && isTerakhirDitutup && (
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage(null);
                            setSuccessMessage(null);
                            setBukaModalPeriode(item);
                          }}
                          className="btn-3d-dark px-3.5 py-1.5 text-xs font-bold gap-1.5"
                          title="Buka kembali periode akuntansi terakhir yang ditutup ini (BR-06)"
                        >
                          <span aria-hidden="true">🔓</span>
                          <span>Buka Kembali</span>
                        </button>
                      )}

                      {/* Jika Direktur melihat periode ditutup tetapi bukan periode terakhir yang ditutup */}
                      {isDirektur && !isTerbuka && !isTerakhirDitutup && (
                        <span className="text-[11px] text-[#736b5e] italic">Ditutup</span>
                      )}

                      {/* Jika Akuntan melihat periode ditutup atau Direktur melihat periode terbuka */}
                      {((isAkuntan && !isTerbuka) || (isDirektur && isTerbuka)) && (
                        <span className="text-[11px] text-[#736b5e] italic">Selesai</span>
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
          <div className="rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-6 text-center text-xs text-[#736b5e]">
            Tidak ada data periode akuntansi yang sesuai.
          </div>
        ) : (
          filteredPeriode.map((item) => {
            const label = formatBulanTahun(item.tahun, item.bulan);
            const isTerbuka = item.status === "terbuka";
            const isTerakhirDitutup = !isTerbuka && latestClosedPeriode?.id === item.id;

            return (
              <div
                key={item.id}
                className="sogan-card rounded-2xl border border-amber-900/20 bg-[#0e0c0a] p-4 shadow-xl space-y-3"
              >
                {/* Header: Periode & Badge Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#fdfaf6]">{label}</h3>
                    <p className="text-[11px] text-[#736b5e]">Mulai: {item.tanggal_mulai}</p>
                  </div>

                  {isTerbuka ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                      <span>● Terbuka</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#141210] border border-amber-900/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#a89f91]">
                      <span>🔒 Ditutup</span>
                    </span>
                  )}
                </div>

                {/* Indikator Jumlah Jurnal Draf di Kartu Ponsel */}
                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-amber-900/20">
                  <span className="text-[#a89f91] font-medium text-[11px]">Jurnal Draf:</span>
                  {item.jumlah_draf !== undefined && item.jumlah_draf > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <span aria-hidden="true">⚠️</span>
                      <span>{item.jumlah_draf} draf tertunda</span>
                    </span>
                  ) : (
                    <span className="rounded bg-[#141210] border border-amber-900/20 px-2 py-0.5 text-[10px] font-medium text-[#736b5e]">
                      0 draf
                    </span>
                  )}
                </div>

                {/* Info Penutupan */}
                {!isTerbuka && item.ditutup_pada && (
                  <div className="text-xs text-[#a89f91] bg-[#141210] p-2.5 rounded-xl border border-amber-900/20">
                    <span className="text-[#736b5e] block text-[10px] uppercase font-semibold">
                      Ditutup Oleh:
                    </span>
                    <span className="font-semibold text-[#fdfaf6]">
                      {item.penutup?.nama_lengkap || "Akuntan"}
                    </span>
                    <span className="text-[#a89f91] block text-[11px] mt-0.5">
                      pada {formatDateTime(item.ditutup_pada)}
                    </span>
                  </div>
                )}

                {/* Alasan Buka Ulang */}
                {item.alasan_buka_ulang && (
                  <div className="rounded-xl bg-purple-950/20 p-2.5 text-xs text-purple-200 border border-purple-500/30">
                    <span className="font-bold block text-[10px] text-purple-400 uppercase">
                      Alasan Buka Ulang (Direktur):
                    </span>
                    <p className="italic mt-0.5 text-[11px]">&quot;{item.alasan_buka_ulang}&quot;</p>
                  </div>
                )}

                {/* Aksi Mobile: Akuntan Tutup Periode */}
                {isAkuntan && isTerbuka && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setTutupModalPeriode(item);
                    }}
                    className="btn-3d-gold w-full py-2.5 text-xs font-bold gap-1.5"
                  >
                    <span>🔒</span>
                    <span>Tutup Periode</span>
                  </button>
                )}

                {/* Aksi Mobile: Direktur Buka Kembali HANYA periode terakhir yang ditutup (BR-06) */}
                {isDirektur && isTerakhirDitutup && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setBukaModalPeriode(item);
                    }}
                    className="btn-3d-dark w-full py-2.5 text-xs font-bold gap-1.5"
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

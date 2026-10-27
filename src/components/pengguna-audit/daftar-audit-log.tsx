"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatWIB, translateAuditAction, translateTableName } from "./audit-helpers";
import { DetailAuditModal } from "./detail-audit-modal";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import type { Database } from "@/types/database";

type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"] & {
  pelaku?: {
    id: string;
    nama_lengkap: string;
    email: string;
    peran: string;
  } | null;
};

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

interface DaftarAuditLogProps {
  initialLogs: AuditLogRow[];
  initialTotal: number;
  allProfiles: ProfileRow[];
}

const PAGE_SIZE = 10;

export function DaftarAuditLog({
  initialLogs,
  initialTotal,
  allProfiles,
}: DaftarAuditLogProps) {
  const [logs, setLogs] = useState<AuditLogRow[]>(initialLogs);
  const [totalCount, setTotalCount] = useState<number>(initialTotal);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter States
  const [filterTanggalDari, setFilterTanggalDari] = useState<string>("");
  const [filterTanggalSampai, setFilterTanggalSampai] = useState<string>("");
  const [filterTabel, setFilterTabel] = useState<string>("semua");
  const [filterPelaku, setFilterPelaku] = useState<string>("semua");

  // Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch data dengan .range() dan filters
  const fetchAuditLogs = async (
    targetPage: number,
    overrides?: {
      tabel?: string;
      pelaku?: string;
      dari?: string;
      sampai?: string;
    }
  ) => {
    setLoading(true);
    setErrorMessage(null);

    const activeTabel = overrides?.tabel !== undefined ? overrides.tabel : filterTabel;
    const activePelaku = overrides?.pelaku !== undefined ? overrides.pelaku : filterPelaku;
    const activeDari = overrides?.dari !== undefined ? overrides.dari : filterTanggalDari;
    const activeSampai = overrides?.sampai !== undefined ? overrides.sampai : filterTanggalSampai;

    try {
      const supabase = createClient();
      const from = (targetPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("audit_log")
        .select(
          "id, waktu, pelaku_id, aksi, nama_tabel, id_data, data_lama, data_baru, pelaku:profiles!pelaku_id(id, nama_lengkap, email, peran)",
          { count: "exact" }
        )
        .order("waktu", { ascending: false })
        .order("id", { ascending: false });

      if (activeTabel !== "semua") {
        query = query.eq("nama_tabel", activeTabel);
      }

      if (activePelaku !== "semua") {
        query = query.eq("pelaku_id", activePelaku);
      }

      if (activeDari) {
        query = query.gte("waktu", `${activeDari}T00:00:00+07:00`);
      }

      if (activeSampai) {
        query = query.lte("waktu", `${activeSampai}T23:59:59+07:00`);
      }

      // Paginasi Supabase via .range()
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error));
        return;
      }

      if (data) {
        const formatted = data.map((item) => ({
          ...item,
          pelaku: Array.isArray(item.pelaku) ? item.pelaku[0] : item.pelaku,
        })) as unknown as AuditLogRow[];

        setLogs(formatted);
        if (count !== null) {
          setTotalCount(count);
        }
        setPage(targetPage);
      }
    } catch (err) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchAuditLogs(1);
  };

  const handleResetFilter = () => {
    setFilterTanggalDari("");
    setFilterTanggalSampai("");
    setFilterTabel("semua");
    setFilterPelaku("semua");
    fetchAuditLogs(1, { tabel: "semua", pelaku: "semua", dari: "", sampai: "" });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const fromRecord = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toRecord = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filter Jejak Audit</span>
          </span>

          {(filterTanggalDari || filterTanggalSampai || filterTabel !== "semua" || filterPelaku !== "semua") && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Dari Tanggal */}
          <div>
            <label htmlFor="filter-tgl-dari" className="block text-[11px] font-medium text-slate-500 mb-1">
              Dari Tanggal (WIB)
            </label>
            <input
              id="filter-tgl-dari"
              type="date"
              value={filterTanggalDari}
              onChange={(e) => setFilterTanggalDari(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Sampai Tanggal */}
          <div>
            <label htmlFor="filter-tgl-sampai" className="block text-[11px] font-medium text-slate-500 mb-1">
              Sampai Tanggal (WIB)
            </label>
            <input
              id="filter-tgl-sampai"
              type="date"
              value={filterTanggalSampai}
              onChange={(e) => setFilterTanggalSampai(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Filter Tabel */}
          <div>
            <label htmlFor="filter-tabel" className="block text-[11px] font-medium text-slate-500 mb-1">
              Tabel Sistem
            </label>
            <select
              id="filter-tabel"
              value={filterTabel}
              onChange={(e) => {
                const val = e.target.value;
                setFilterTabel(val);
                fetchAuditLogs(1, { tabel: val });
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="semua">Semua Tabel</option>
              <option value="profiles">Pengguna (profiles)</option>
              <option value="periode">Periode Akuntansi (periode)</option>
              <option value="jurnal">Jurnal Umum (jurnal)</option>
              <option value="jurnal_baris">Baris Jurnal (jurnal_baris)</option>
              <option value="pengajuan">Pengajuan Belanja (pengajuan)</option>
              <option value="akun">Bagan Akun (akun)</option>
            </select>
          </div>

          {/* Filter Pelaku (diambil dari profiles) */}
          <div>
            <label htmlFor="filter-pelaku" className="block text-[11px] font-medium text-slate-500 mb-1">
              Pelaku Aksi
            </label>
            <select
              id="filter-pelaku"
              value={filterPelaku}
              onChange={(e) => {
                const val = e.target.value;
                setFilterPelaku(val);
                fetchAuditLogs(1, { pelaku: val });
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-xs focus:border-blue-500 focus:outline-hidden"
            >
              <option value="semua">Semua Pengguna</option>
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama_lengkap} ({p.peran})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tombol Terapkan Rentang Tanggal jika diisi */}
        {(filterTanggalDari || filterTanggalSampai) && (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => handleApplyFilter()}
              className="btn-3d-gold px-3.5 py-1.5 text-xs font-bold"
            >
              Terapkan Filter Tanggal
            </button>
          </div>
        )}
      </div>

      {/* Info Status Paginasi & Refresh */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Menampilkan <span className="font-semibold text-slate-800">{fromRecord}</span> -{" "}
          <span className="font-semibold text-slate-800">{toRecord}</span> dari{" "}
          <span className="font-semibold text-slate-800">{totalCount}</span> catatan audit
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-blue-600 font-medium">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Memuat data...</span>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Pelaku</th>
                <th className="py-3 px-4">Aksi Sistem</th>
                <th className="py-3 px-4">Tabel & ID Target</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada catatan audit yang sesuai dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionInfo = translateAuditAction(log.aksi);
                  const tableInfo = translateTableName(log.nama_tabel);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Waktu (WIB) */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {formatWIB(log.waktu)}
                      </td>

                      {/* Pelaku */}
                      <td className="py-3 px-4">
                        {log.pelaku ? (
                          <div>
                            <span className="font-semibold text-slate-900 block">{log.pelaku.nama_lengkap}</span>
                            <span className="text-[11px] text-slate-400 capitalize">{log.pelaku.peran}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono italic text-[11px]">
                            {log.pelaku_id ? log.pelaku_id.slice(0, 8) + "..." : "Sistem"}
                          </span>
                        )}
                      </td>

                      {/* Aksi: Terjemahan manusiawi + kode asli di bawah */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${actionInfo.badgeClass}`}>
                            {actionInfo.label}
                          </span>
                          <span className="block font-mono text-[10px] text-slate-400" title={`Kode asli: ${actionInfo.raw}`}>
                            {actionInfo.raw}
                          </span>
                        </div>
                      </td>

                      {/* Tabel & ID Target */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tableInfo.badgeClass}`}>
                            {tableInfo.label}
                          </span>
                          <span className="font-mono text-[11px] text-slate-700 font-medium">
                            #{log.id_data}
                          </span>
                        </div>
                      </td>

                      {/* Aksi Lihat Detail */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsModalOpen(true);
                          }}
                          className="btn-3d-dark inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                        >
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Perubahan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="grid gap-3 md:hidden">
        {logs.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            Tidak ada catatan audit yang sesuai.
          </div>
        ) : (
          logs.map((log) => {
            const actionInfo = translateAuditAction(log.aksi);
            const tableInfo = translateTableName(log.nama_tabel);

            return (
              <div key={log.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${actionInfo.badgeClass}`}>
                      {actionInfo.label}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                      {actionInfo.raw}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">#{log.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Waktu (WIB)</span>
                    <span className="text-slate-700 font-mono text-[11px]">{formatWIB(log.waktu)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Pelaku</span>
                    <span className="text-slate-700 font-medium">
                      {log.pelaku ? log.pelaku.nama_lengkap : "Sistem"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[11px] block">Tabel & Target ID</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${tableInfo.badgeClass}`}>
                        {tableInfo.label}
                      </span>
                      <span className="font-mono text-slate-700 font-semibold text-[11px]">
                        ID: {log.id_data}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLog(log);
                      setIsModalOpen(true);
                    }}
                    className="btn-3d-dark w-full py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Lihat Perbandingan Data</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginasi Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => fetchAuditLogs(page - 1)}
          disabled={page <= 1 || loading}
          className="btn-3d-dark inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Sebelumnya</span>
        </button>

        <span className="text-xs text-stone-400 font-medium">
          Halaman <strong className="text-amber-400 font-bold">{page}</strong> dari{" "}
          <strong className="text-stone-200">{totalPages}</strong>
        </span>

        <button
          type="button"
          onClick={() => fetchAuditLogs(page + 1)}
          disabled={page >= totalPages || loading}
          className="btn-3d-dark inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Berikutnya</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Modal Detail Audit */}
      <DetailAuditModal
        isOpen={isModalOpen}
        log={selectedLog}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}

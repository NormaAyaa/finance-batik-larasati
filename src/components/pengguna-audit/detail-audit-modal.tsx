"use client";

import React, { useState } from "react";
import { formatWIB, translateAuditAction, translateTableName } from "./audit-helpers";
import type { Database, Json } from "@/types/database";

type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"] & {
  pelaku?: {
    id: string;
    nama_lengkap: string;
    email: string;
    peran: string;
  } | null;
};

interface DetailAuditModalProps {
  isOpen: boolean;
  log: AuditLogRow | null;
  onClose: () => void;
}

export function DetailAuditModal({ isOpen, log, onClose }: DetailAuditModalProps) {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!isOpen || !log) return null;

  const actionInfo = translateAuditAction(log.aksi);
  const tableInfo = translateTableName(log.nama_tabel);

  // Helper untuk mengekstrak keys dari data_lama dan data_baru
  const parseDiff = () => {
    const oldObj = (log.data_lama && typeof log.data_lama === "object" ? log.data_lama : {}) as Record<string, Json>;
    const newObj = (log.data_baru && typeof log.data_baru === "object" ? log.data_baru : {}) as Record<string, Json>;

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)])).sort();

    return allKeys.map((key) => {
      const oldVal = oldObj[key];
      const newVal = newObj[key];
      const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

      return {
        key,
        oldVal: oldVal !== undefined ? JSON.stringify(oldVal) : "-",
        newVal: newVal !== undefined ? JSON.stringify(newVal) : "-",
        isChanged,
      };
    });
  };

  const diffItems = parseDiff();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-800">Detail Catatan Audit</h3>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                ID #{log.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Jejak riwayat transaksi dan perubahan data sistem yang bersifat immutable
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Waktu Pencatatan (WIB)</span>
              <span className="text-slate-800 font-semibold mt-0.5 block font-mono">
                {formatWIB(log.waktu)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Pelaku Aksi</span>
              <div className="mt-0.5">
                {log.pelaku ? (
                  <span className="text-slate-800 font-semibold">
                    {log.pelaku.nama_lengkap}{" "}
                    <span className="font-normal text-slate-500">
                      ({log.pelaku.peran})
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono italic">
                    {log.pelaku_id ? log.pelaku_id.slice(0, 8) + "..." : "Sistem"}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Aksi Sistem</span>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${actionInfo.badgeClass}`}>
                  {actionInfo.label}
                </span>
                <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {actionInfo.raw}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Tabel & ID Target</span>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${tableInfo.badgeClass}`}>
                  {tableInfo.label}
                </span>
                <span className="font-mono text-[11px] text-slate-700 font-semibold">
                  ID: {log.id_data}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center justify-between pt-1">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Perbandingan Data (Lama vs Baru)
            </h4>
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
            >
              {showRawJson ? "Tampilkan Tabel Diff" : "Tampilkan Raw JSON"}
            </button>
          </div>

          {/* Raw JSON View */}
          {showRawJson ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto">
                <span className="text-rose-400 font-semibold block mb-1.5">[Data Lama]</span>
                <pre>{JSON.stringify(log.data_lama, null, 2) || "null"}</pre>
              </div>
              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto">
                <span className="text-emerald-400 font-semibold block mb-1.5">[Data Baru]</span>
                <pre>{JSON.stringify(log.data_baru, null, 2) || "null"}</pre>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {diffItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada data lama atau baru yang tersimpan untuk catatan ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Kolom (Field)</th>
                        <th className="py-2.5 px-3">Nilai Lama</th>
                        <th className="py-2.5 px-3">Nilai Baru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {diffItems.map((item) => (
                        <tr
                          key={item.key}
                          className={item.isChanged ? "bg-amber-50/40" : "hover:bg-slate-50/50"}
                        >
                          <td className="py-2 px-3 font-semibold text-slate-700">
                            {item.key}
                            {item.isChanged && (
                              <span className="ml-1 text-[10px] text-amber-700 font-sans font-bold">
                                • diubah
                              </span>
                            )}
                          </td>
                          <td className={`py-2 px-3 ${item.isChanged ? "text-rose-700 bg-rose-50/50" : "text-slate-500"}`}>
                            {item.oldVal}
                          </td>
                          <td className={`py-2 px-3 ${item.isChanged ? "text-emerald-700 bg-emerald-50/50 font-semibold" : "text-slate-500"}`}>
                            {item.newVal}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Tabel audit_log dilindungi trigger trg_audit_log_immutable (hanya baca).</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

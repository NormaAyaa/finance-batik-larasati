"use client";

import React, { useState } from "react";
import { DaftarPengguna } from "./daftar-pengguna";
import { DaftarAuditLog } from "./daftar-audit-log";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"] & {
  pelaku?: {
    id: string;
    nama_lengkap: string;
    email: string;
    peran: string;
  } | null;
};

interface PenggunaAuditViewProps {
  initialUsers: ProfileRow[];
  initialAuditLogs: AuditLogRow[];
  initialAuditTotal: number;
  currentUserId: string;
}

export function PenggunaAuditView({
  initialUsers,
  initialAuditLogs,
  initialAuditTotal,
  currentUserId,
}: PenggunaAuditViewProps) {
  const [activeTab, setActiveTab] = useState<"pengguna" | "audit">("pengguna");

  // Kalkulasi statistik pengguna
  const totalUsers = initialUsers.length;
  const direkturCount = initialUsers.filter((u) => u.peran === "direktur").length;
  const akuntanCount = initialUsers.filter((u) => u.peran === "akuntan").length;
  const stafCount = initialUsers.filter((u) => u.peran === "staf").length;
  const aktifCount = initialUsers.filter((u) => u.aktif).length;

  return (
    <div className="space-y-6">
      {/* Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Pengguna
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold text-slate-900">{totalUsers}</span>
            <span className="text-xs text-slate-400">({aktifCount} aktif)</span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-purple-100 bg-purple-50/20 shadow-xs">
          <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider block">
            Direktur
          </span>
          <span className="text-xl font-bold text-purple-900 mt-1 block">{direkturCount}</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-blue-100 bg-blue-50/20 shadow-xs">
          <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider block">
            Akuntan
          </span>
          <span className="text-xl font-bold text-blue-900 mt-1 block">{akuntanCount}</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Staf
          </span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{stafCount}</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">
            Total Log Audit
          </span>
          <span className="text-xl font-bold text-emerald-900 mt-1 block">{initialAuditTotal}</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex gap-2 -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab("pengguna")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "pengguna"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Daftar Pengguna & Peran</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                activeTab === "pengguna" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {totalUsers}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "audit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Audit Log Sistem</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                activeTab === "audit" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              {initialAuditTotal}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "pengguna" ? (
        <DaftarPengguna initialUsers={initialUsers} currentUserId={currentUserId} />
      ) : (
        <DaftarAuditLog
          initialLogs={initialAuditLogs}
          initialTotal={initialAuditTotal}
          allProfiles={initialUsers}
        />
      )}
    </div>
  );
}

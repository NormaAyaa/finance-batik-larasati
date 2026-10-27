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
        <div className="sogan-card bg-[#0e0c0a] border border-amber-900/30 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] font-bold text-[#8a7e72] uppercase tracking-wider block">
            Total Pengguna
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-[#fdfaf6]">{totalUsers}</span>
            <span className="text-xs text-amber-400 font-semibold">({aktifCount} aktif)</span>
          </div>
        </div>

        <div className="sogan-card bg-[#0e0c0a] border border-purple-900/30 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
            Direktur
          </span>
          <span className="text-xl sm:text-2xl font-bold text-purple-300 mt-1 block">{direkturCount}</span>
        </div>

        <div className="sogan-card bg-[#0e0c0a] border border-amber-500/30 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
            Akuntan
          </span>
          <span className="text-xl sm:text-2xl font-bold text-amber-300 mt-1 block">{akuntanCount}</span>
        </div>

        <div className="sogan-card bg-[#0e0c0a] border border-orange-900/30 p-4 rounded-2xl shadow-lg">
          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
            Staf
          </span>
          <span className="text-xl sm:text-2xl font-bold text-orange-300 mt-1 block">{stafCount}</span>
        </div>

        <div className="sogan-card bg-[#0e0c0a] border border-emerald-900/30 p-4 rounded-2xl shadow-lg col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
            Total Log Audit
          </span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-300 mt-1 block">{initialAuditTotal}</span>
        </div>
      </div>

      {/* Tab Switcher: Recessed 3D Trough dengan 3D Pill Buttons */}
      <div className="flex items-center justify-start">
        <div className="trough-3d p-1.5 inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("pengguna")}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeTab === "pengguna"
                ? "btn-3d-gold"
                : "text-[#a89f91] hover:text-[#fdfaf6]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Daftar Pengguna & Peran</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "pengguna" ? "bg-black/20 text-[#070605]" : "bg-[#141210] text-amber-300 border border-amber-900/40"
              }`}
            >
              {totalUsers}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              activeTab === "audit"
                ? "btn-3d-gold"
                : "text-[#a89f91] hover:text-[#fdfaf6]"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Audit Log Sistem</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "audit" ? "bg-black/20 text-[#070605]" : "bg-[#141210] text-amber-300 border border-amber-900/40"
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

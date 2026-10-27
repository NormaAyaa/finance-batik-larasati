"use client";

import React, { useState } from "react";
import { DaftarAkun } from "./daftar-akun";
import { DaftarPeriode, type PeriodeWithProfile } from "./daftar-periode";
import type { Database } from "@/types/database";

type AkunRow = Database["public"]["Tables"]["akun"]["Row"];

interface AkunPeriodeViewProps {
  initialAkun: AkunRow[];
  initialPeriode: PeriodeWithProfile[];
  userRole: "akuntan" | "direktur";
  activeTabDefault?: "akun" | "periode";
}

export function AkunPeriodeView({
  initialAkun,
  initialPeriode,
  userRole,
  activeTabDefault = "akun",
}: AkunPeriodeViewProps) {
  const [activeTab, setActiveTab] = useState<"akun" | "periode">(activeTabDefault);

  const periodeTerbukaCount = initialPeriode.filter((p) => p.status === "terbuka").length;

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              STRUKTUR COA &amp; PENUTUPAN BUKU
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#fdfaf6] tracking-tight">
            Bagan Akun &amp; Periode Akuntansi
          </h1>
          <p className="text-xs sm:text-sm text-[#a89f91] mt-1 max-w-3xl leading-relaxed">
            Kelola Chart of Accounts (COA 4 digit sesuai BR-01) dan kontrol status penutupan buku periode bulanan CV Batik Larasati (BR-06).
          </p>
        </div>

        {/* Indikator Status Singkat */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="sogan-card inline-flex items-center gap-2 rounded-full bg-[#0e0c0a] border border-amber-900/30 px-3.5 py-1.5 text-xs font-medium text-[#d6cfc7]">
            <span>Total Akun:</span>
            <strong className="text-amber-400 font-mono font-bold text-sm">{initialAkun.length}</strong>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Periode Terbuka:</span>
            <strong className="font-mono font-bold text-sm">{periodeTerbukaCount}</strong>
          </span>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="border-b border-amber-900/25">
        <nav
          role="tablist"
          aria-label="Pilihan tampilan akun dan periode"
          className="-mb-px flex space-x-6 sm:space-x-8"
        >
          <button
            type="button"
            role="tab"
            id="tab-akun"
            aria-selected={activeTab === "akun"}
            aria-controls="panel-akun"
            onClick={() => setActiveTab("akun")}
            className={`flex items-center gap-2.5 border-b-2 py-3.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "akun"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-[#a89f91] hover:border-amber-500/30 hover:text-[#fdfaf6]"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              📁
            </span>
            <span>Bagan Akun (COA)</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeTab === "akun"
                  ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                  : "bg-[#141210] text-[#a89f91] border border-amber-900/30"
              }`}
            >
              {initialAkun.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-periode"
            aria-selected={activeTab === "periode"}
            aria-controls="panel-periode"
            onClick={() => setActiveTab("periode")}
            className={`flex items-center gap-2.5 border-b-2 py-3.5 text-xs sm:text-sm font-bold transition ${
              activeTab === "periode"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-[#a89f91] hover:border-amber-500/30 hover:text-[#fdfaf6]"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              📅
            </span>
            <span>Periode Akuntansi</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeTab === "periode"
                  ? "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                  : "bg-[#141210] text-[#a89f91] border border-amber-900/30"
              }`}
            >
              {initialPeriode.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Konten Panel Tab */}
      <div className="pt-2">
        {activeTab === "akun" && (
          <div
            role="tabpanel"
            id="panel-akun"
            aria-labelledby="tab-akun"
            className="focus:outline-none"
          >
            <DaftarAkun initialAkun={initialAkun} userRole={userRole} />
          </div>
        )}

        {activeTab === "periode" && (
          <div
            role="tabpanel"
            id="panel-periode"
            aria-labelledby="tab-periode"
            className="focus:outline-none"
          >
            <DaftarPeriode initialPeriode={initialPeriode} userRole={userRole} />
          </div>
        )}
      </div>
    </div>
  );
}

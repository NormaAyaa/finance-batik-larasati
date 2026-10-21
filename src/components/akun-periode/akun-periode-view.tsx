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
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bagan Akun & Periode Akuntansi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola Chart of Accounts (COA 4 digit) dan kontrol status tutup/buka periode bulanan
          </p>
        </div>

        {/* Indikator Status Singkat */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
            <span>Total Akun:</span>
            <strong className="text-slate-900">{initialAkun.length}</strong>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-800">
            <span>Periode Terbuka:</span>
            <strong>{periodeTerbukaCount}</strong>
          </span>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="border-b border-slate-200">
        <nav
          role="tablist"
          aria-label="Pilihan tampilan akun dan periode"
          className="-mb-px flex space-x-6"
        >
          <button
            type="button"
            role="tab"
            id="tab-akun"
            aria-selected={activeTab === "akun"}
            aria-controls="panel-akun"
            onClick={() => setActiveTab("akun")}
            className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition ${
              activeTab === "akun"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <span aria-hidden="true" className="text-sm">
              📁
            </span>
            <span>Bagan Akun (COA)</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "akun"
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-100 text-slate-600"
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
            className={`flex items-center gap-2 border-b-2 py-3 text-xs font-semibold transition ${
              activeTab === "periode"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <span aria-hidden="true" className="text-sm">
              📅
            </span>
            <span>Periode Akuntansi</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "periode"
                  ? "bg-indigo-50 text-indigo-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {initialPeriode.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Konten Panel Tab */}
      <div className="pt-1">
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

"use client";

import React, { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SUBMISSION_STATUS_LABELS } from "@/lib/constants/rules";
import type { StatusPengajuan } from "@/types/database";

interface FilterToolbarProps {
  currentStatus?: string;
  currentBulan?: string;
  currentSearch?: string;
}

export function FilterToolbar({
  currentStatus = "",
  currentBulan = "",
  currentSearch = "",
}: FilterToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [prevSearch, setPrevSearch] = React.useState(currentSearch);
  const [search, setSearch] = React.useState(currentSearch);

  if (prevSearch !== currentSearch) {
    setPrevSearch(currentSearch);
    setSearch(currentSearch);
  }

  const applyFilters = (newParams: {
    status?: string;
    bulan?: string;
    q?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newParams.status !== undefined) {
      if (newParams.status) params.set("status", newParams.status);
      else params.delete("status");
    }
    if (newParams.bulan !== undefined) {
      if (newParams.bulan) params.set("bulan", newParams.bulan);
      else params.delete("bulan");
    }
    if (newParams.q !== undefined) {
      if (newParams.q.trim()) params.set("q", newParams.q.trim());
      else params.delete("q");
    }

    startTransition(() => {
      router.push(`/pengajuan?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: search });
  };

  const handleReset = () => {
    setSearch("");
    startTransition(() => {
      router.push("/pengajuan");
    });
  };

  const hasActiveFilters = Boolean(currentStatus || currentBulan || currentSearch);

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Input Pencarian */}
        <div className="md:col-span-5 space-y-1">
          <label htmlFor="search-input" className="block text-xs font-semibold text-slate-700">
            Pencarian
          </label>
          <div className="relative">
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor (PG-...), pengaju, atau keperluan..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <span
              aria-hidden="true"
              className="absolute left-3 top-2.5 text-slate-400 text-xs"
            >
              🔍
            </span>
          </div>
        </div>

        {/* Filter Status */}
        <div className="md:col-span-3 space-y-1">
          <label htmlFor="status-select" className="block text-xs font-semibold text-slate-700">
            Filter Status
          </label>
          <select
            id="status-select"
            value={currentStatus}
            onChange={(e) => {
              applyFilters({ status: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">Semua Status</option>
            {(Object.keys(SUBMISSION_STATUS_LABELS) as StatusPengajuan[]).map((st) => (
              <option key={st} value={st}>
                {SUBMISSION_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Bulan Transaksi */}
        <div className="md:col-span-2 space-y-1">
          <label htmlFor="bulan-input" className="block text-xs font-semibold text-slate-700">
            Bulan Transaksi
          </label>
          <input
            id="bulan-input"
            type="month"
            value={currentBulan}
            onChange={(e) => {
              applyFilters({ bulan: e.target.value });
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Tombol Terapkan & Reset */}
        <div className="md:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 text-xs font-medium transition disabled:opacity-50"
          >
            {isPending ? "Memuat..." : "Terapkan"}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              title="Reset seluruh filter"
              className="rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 px-2.5 py-2 text-xs font-medium transition"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Filter aktif:</span>
          {currentSearch && (
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
              Pencarian: &quot;{currentSearch}&quot;
            </span>
          )}
          {currentStatus && (
            <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full">
              Status: {SUBMISSION_STATUS_LABELS[currentStatus as StatusPengajuan] || currentStatus}
            </span>
          )}
          {currentBulan && (
            <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full">
              Bulan: {currentBulan}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

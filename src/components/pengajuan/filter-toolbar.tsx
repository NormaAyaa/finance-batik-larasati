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
    <div className="sogan-card p-5 sm:p-6 space-y-4">
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Input Pencarian */}
        <div className="md:col-span-5 space-y-2">
          <label htmlFor="search-input" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
            Pencarian
          </label>
          <div className="relative">
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor (PG-...), pengaju, atau keperluan..."
              className="w-full pl-11 pr-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] placeholder-[#78716c] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
            <span
              aria-hidden="true"
              className="absolute left-3.5 top-3.5 text-amber-400/80 text-base"
            >
              🔍
            </span>
          </div>
        </div>

        {/* Filter Status */}
        <div className="md:col-span-3 space-y-2">
          <label htmlFor="status-select" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
            Filter Status
          </label>
          <select
            id="status-select"
            value={currentStatus}
            onChange={(e) => {
              applyFilters({ status: e.target.value });
            }}
            className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            <option value="" className="bg-[#141210] text-[#fdfaf6]">Semua Status</option>
            {(Object.keys(SUBMISSION_STATUS_LABELS) as StatusPengajuan[]).map((st) => (
              <option key={st} value={st} className="bg-[#141210] text-[#fdfaf6]">
                {SUBMISSION_STATUS_LABELS[st]}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Bulan Transaksi */}
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="bulan-input" className="block text-sm sm:text-base font-bold text-[#fdfaf6]">
            Bulan Transaksi
          </label>
          <input
            id="bulan-input"
            type="month"
            value={currentBulan}
            onChange={(e) => {
              applyFilters({ bulan: e.target.value });
            }}
            className="w-full px-4 py-3 text-sm sm:text-base rounded-xl border border-amber-900/40 bg-[#141210] text-[#fdfaf6] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 [color-scheme:dark]"
          />
        </div>

        {/* Tombol Terapkan & Reset */}
        <div className="md:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="btn-3d-gold flex-1 px-4 py-3 text-sm sm:text-base font-bold disabled:opacity-50"
          >
            {isPending ? "Memuat..." : "Terapkan"}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              title="Reset seluruh filter"
              className="btn-3d-dark px-4 py-3 text-sm sm:text-base font-semibold"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-amber-900/20 text-sm text-[#a89f91]">
          <span className="font-bold text-amber-400 text-sm sm:text-base">Filter aktif:</span>
          {currentSearch && (
            <span className="bg-amber-950/70 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
              Pencarian: &quot;{currentSearch}&quot;
            </span>
          )}
          {currentStatus && (
            <span className="bg-amber-950/70 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
              Status: {SUBMISSION_STATUS_LABELS[currentStatus as StatusPengajuan] || currentStatus}
            </span>
          )}
          {currentBulan && (
            <span className="bg-amber-950/70 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
              Bulan: {currentBulan}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AkunOption } from "@/lib/buku-besar";

interface FilterBukuBesarProps {
  daftarAkun: AkunOption[];
  selectedAkunId: number;
  tanggalDari: string;
  tanggalSampai: string;
}

export function FilterBukuBesar({
  daftarAkun,
  selectedAkunId,
  tanggalDari,
  tanggalSampai,
}: FilterBukuBesarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [akunId, setAkunId] = useState<string>(String(selectedAkunId));
  const [dari, setDari] = useState<string>(tanggalDari);
  const [sampai, setSampai] = useState<string>(tanggalSampai);

  // Sinkronkan state lokal jika props berubah (misal dari navigasi luar)
  const [prevProps, setPrevProps] = useState({
    akunId: selectedAkunId,
    dari: tanggalDari,
    sampai: tanggalSampai,
  });

  if (
    prevProps.akunId !== selectedAkunId ||
    prevProps.dari !== tanggalDari ||
    prevProps.sampai !== tanggalSampai
  ) {
    setPrevProps({ akunId: selectedAkunId, dari: tanggalDari, sampai: tanggalSampai });
    setAkunId(String(selectedAkunId));
    setDari(tanggalDari);
    setSampai(tanggalSampai);
  }

  // Validasi: tanggal dari tidak boleh lebih besar dari tanggal sampai
  const isDateInvalid = Boolean(dari && sampai && dari > sampai);

  const applyFilters = (newAkun: string, newDari: string, newSampai: string) => {
    if (newDari && newSampai && newDari > newSampai) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("akun", newAkun);
    params.set("dari", newDari);
    params.set("sampai", newSampai);
    params.delete("page"); // Reset ke halaman 1 setiap filter berganti

    startTransition(() => {
      router.push(`/buku-besar?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDateInvalid) {
      applyFilters(akunId, dari, sampai);
    }
  };

  // Preset Cepat Tanggal
  const handlePreset = (preset: "bulan_ini" | "bulan_lalu" | "tahun_ini") => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-indexed

    let newDari = "";
    let newSampai = "";

    if (preset === "bulan_ini") {
      const monthStr = String(m + 1).padStart(2, "0");
      const dayStr = String(now.getDate()).padStart(2, "0");
      newDari = `${y}-${monthStr}-01`;
      newSampai = `${y}-${monthStr}-${dayStr}`;
    } else if (preset === "bulan_lalu") {
      const prevMonth = m === 0 ? 11 : m - 1;
      const prevYear = m === 0 ? y - 1 : y;
      const prevMonthStr = String(prevMonth + 1).padStart(2, "0");
      // Tanggal terakhir bulan lalu
      const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      newDari = `${prevYear}-${prevMonthStr}-01`;
      newSampai = `${prevYear}-${prevMonthStr}-${String(lastDayPrevMonth).padStart(2, "0")}`;
    } else if (preset === "tahun_ini") {
      const monthStr = String(m + 1).padStart(2, "0");
      const dayStr = String(now.getDate()).padStart(2, "0");
      newDari = `${y}-01-01`;
      newSampai = `${y}-${monthStr}-${dayStr}`;
    }

    setDari(newDari);
    setSampai(newSampai);
    applyFilters(akunId, newDari, newSampai);
  };

  const selectedAkunObj = daftarAkun.find((a) => a.id === Number(akunId));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
          {/* 1. Dropdown Pilihan Akun (md: col 6) */}
          <div className="md:col-span-6">
            <label
              htmlFor="filter-akun"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Akun Buku Besar <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="filter-akun"
                name="filter-akun"
                value={akunId}
                onChange={(e) => {
                  const newAkun = e.target.value;
                  setAkunId(newAkun);
                  if (!isDateInvalid) {
                    applyFilters(newAkun, dari, sampai);
                  }
                }}
                disabled={isPending}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-700 disabled:bg-slate-100 disabled:cursor-not-allowed"
                aria-describedby="akun-desc"
              >
                {daftarAkun.map((akun) => (
                  <option key={akun.id} value={akun.id}>
                    {akun.kode} - {akun.nama}
                    {!akun.aktif ? " (Nonaktif)" : ""}
                  </option>
                ))}
              </select>
            </div>
            {selectedAkunObj && !selectedAkunObj.aktif && (
              <p id="akun-desc" className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                <span aria-hidden="true">⚠️</span>
                <span>Akun ini sudah dinonaktifkan tetapi memiliki riwayat transaksi lampau.</span>
              </p>
            )}
          </div>

          {/* 2. Tanggal Dari (md: col 3) */}
          <div className="md:col-span-3">
            <label
              htmlFor="tanggal-dari"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Dari Tanggal <span className="text-rose-500">*</span>
            </label>
            <input
              id="tanggal-dari"
              name="tanggal-dari"
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              disabled={isPending}
              className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:bg-slate-100 ${
                isDateInvalid
                  ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 bg-white text-slate-800 focus:border-amber-700 focus:ring-amber-700"
              }`}
            />
          </div>

          {/* 3. Tanggal Sampai (md: col 3) */}
          <div className="md:col-span-3">
            <label
              htmlFor="tanggal-sampai"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Sampai Tanggal <span className="text-rose-500">*</span>
            </label>
            <input
              id="tanggal-sampai"
              name="tanggal-sampai"
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              disabled={isPending}
              className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 disabled:bg-slate-100 ${
                isDateInvalid
                  ? "border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 bg-white text-slate-800 focus:border-amber-700 focus:ring-amber-700"
              }`}
            />
          </div>
        </div>

        {/* Pesan Kesalahan Validasi Tanggal "Dari" > "Sampai" */}
        {isDateInvalid && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700"
          >
            <span aria-hidden="true" className="font-bold text-sm">⛔</span>
            <span>
              <strong>Rentang tanggal tidak valid:</strong> Tanggal &quot;Dari&quot; tidak boleh lebih besar dari tanggal &quot;Sampai&quot;.
            </span>
          </div>
        )}

        {/* Baris Tombol Aksi & Preset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          {/* Preset Tanggal Cepat */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-medium mr-1 text-slate-500 hidden sm:inline">Pilihan Cepat:</span>
            <button
              type="button"
              onClick={() => handlePreset("bulan_ini")}
              disabled={isPending}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              Bulan Berjalan
            </button>
            <button
              type="button"
              onClick={() => handlePreset("bulan_lalu")}
              disabled={isPending}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              Bulan Lalu
            </button>
            <button
              type="button"
              onClick={() => handlePreset("tahun_ini")}
              disabled={isPending}
              className="rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              Tahun Ini
            </button>
          </div>

          {/* Tombol Terapkan */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="submit"
              disabled={isPending || isDateInvalid}
              id="btn-terapkan-filter-buku-besar"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-900 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isPending ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memuat Data...</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">🔍</span>
                  <span>Tampilkan Buku Besar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

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
    <div className="sogan-card rounded-2xl border border-amber-500/20 bg-[#0e0c0a] p-5 sm:p-6 shadow-xl text-[#fdfaf6]">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:items-end">
          {/* 1. Dropdown Pilihan Akun (md: col 6) */}
          <div className="md:col-span-6">
            <label
              htmlFor="filter-akun"
              className="block text-sm sm:text-base font-semibold text-[#d6cfc7] mb-2"
            >
              Akun Buku Besar <span className="text-amber-400">*</span>
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
                className="w-full rounded-xl border border-amber-900/30 bg-[#141210] px-4 py-3 text-sm sm:text-base text-[#fdfaf6] shadow-sm focus:border-amber-500/80 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:bg-[#100e0c] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby="akun-desc"
              >
                {daftarAkun.map((akun) => (
                  <option key={akun.id} value={akun.id} className="bg-[#141210] text-[#fdfaf6]">
                    {akun.kode} - {akun.nama}
                    {!akun.aktif ? " (Nonaktif)" : ""}
                  </option>
                ))}
              </select>
            </div>
            {selectedAkunObj && !selectedAkunObj.aktif && (
              <p id="akun-desc" className="text-xs sm:text-sm text-amber-400 mt-2 flex items-center gap-1.5">
                <span aria-hidden="true">⚠️</span>
                <span>Akun ini sudah dinonaktifkan tetapi memiliki riwayat transaksi lampau.</span>
              </p>
            )}
          </div>

          {/* 2. Tanggal Dari (md: col 3) */}
          <div className="md:col-span-3">
            <label
              htmlFor="tanggal-dari"
              className="block text-sm sm:text-base font-semibold text-[#d6cfc7] mb-2"
            >
              Dari Tanggal <span className="text-amber-400">*</span>
            </label>
            <input
              id="tanggal-dari"
              name="tanggal-dari"
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              disabled={isPending}
              className={`w-full rounded-xl border px-4 py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-1 disabled:bg-[#100e0c] disabled:opacity-50 ${
                isDateInvalid
                  ? "border-rose-500/50 bg-rose-950/40 text-rose-200 focus:border-rose-500 focus:ring-rose-500"
                  : "border-amber-900/30 bg-[#141210] text-[#fdfaf6] focus:border-amber-500/80 focus:ring-amber-500/50"
              }`}
            />
          </div>

          {/* 3. Tanggal Sampai (md: col 3) */}
          <div className="md:col-span-3">
            <label
              htmlFor="tanggal-sampai"
              className="block text-sm sm:text-base font-semibold text-[#d6cfc7] mb-2"
            >
              Sampai Tanggal <span className="text-amber-400">*</span>
            </label>
            <input
              id="tanggal-sampai"
              name="tanggal-sampai"
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              disabled={isPending}
              className={`w-full rounded-xl border px-4 py-3 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-1 disabled:bg-[#100e0c] disabled:opacity-50 ${
                isDateInvalid
                  ? "border-rose-500/50 bg-rose-950/40 text-rose-200 focus:border-rose-500 focus:ring-rose-500"
                  : "border-amber-900/30 bg-[#141210] text-[#fdfaf6] focus:border-amber-500/80 focus:ring-amber-500/50"
              }`}
            />
          </div>
        </div>

        {/* Pesan Kesalahan Validasi Tanggal "Dari" > "Sampai" */}
        {isDateInvalid && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 p-4 text-xs sm:text-sm text-rose-200"
          >
            <span aria-hidden="true" className="font-bold text-base">⛔</span>
            <span>
              <strong>Rentang tanggal tidak valid:</strong> Tanggal &quot;Dari&quot; tidak boleh lebih besar dari tanggal &quot;Sampai&quot;.
            </span>
          </div>
        )}

        {/* Baris Tombol Aksi & Preset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-900/20">
          {/* Preset Tanggal Cepat */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-[#8a7e72] hidden sm:inline">Pilihan Cepat:</span>
            <button
              type="button"
              onClick={() => handlePreset("bulan_ini")}
              disabled={isPending}
              className="btn-3d-dark px-3.5 py-1.5 text-xs sm:text-sm font-semibold disabled:opacity-40"
            >
              Bulan Berjalan
            </button>
            <button
              type="button"
              onClick={() => handlePreset("bulan_lalu")}
              disabled={isPending}
              className="btn-3d-dark px-3.5 py-1.5 text-xs sm:text-sm font-semibold disabled:opacity-40"
            >
              Bulan Lalu
            </button>
            <button
              type="button"
              onClick={() => handlePreset("tahun_ini")}
              disabled={isPending}
              className="btn-3d-dark px-3.5 py-1.5 text-xs sm:text-sm font-semibold disabled:opacity-40"
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
              className="btn-3d-gold inline-flex items-center gap-2 px-6 py-2.5 text-sm sm:text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#070605] border-t-transparent" />
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

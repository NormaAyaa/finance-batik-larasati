"use client";

import React from "react";
import type { AkunOption, BukuBesarData } from "@/lib/buku-besar";
import { FilterBukuBesar } from "./filter-buku-besar";
import { RingkasanBukuBesar } from "./ringkasan-buku-besar";
import { TabelBukuBesar } from "./tabel-buku-besar";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";

interface BukuBesarViewProps {
  daftarAkun: AkunOption[];
  selectedAkunId: number;
  tanggalDari: string;
  tanggalSampai: string;
  data: BukuBesarData | null;
  errorMessage?: string | null;
}

export function BukuBesarView({
  daftarAkun,
  selectedAkunId,
  tanggalDari,
  tanggalSampai,
  data,
  errorMessage,
}: BukuBesarViewProps) {
  const friendlyError = errorMessage ? getFriendlyErrorMessage(errorMessage) : null;

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Halaman (Hanya Baca, Sesuai PRD Bagian 7 & BR-11) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Buku Besar & Mutasi Rekening
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/40 shadow-sm">
              <span aria-hidden="true">🔒</span>
              <span>Hanya Baca</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdfaf6] tracking-tight">
            Buku Besar
          </h1>
          <p className="text-sm sm:text-base text-[#a89f91]">
            Mutasi debit/kredit dan pergerakan saldo berjalan per akun buku besar (BR-11)
          </p>
        </div>
      </div>

      {/* 2. Pesan Error Jika Ada Kegagalan Pengambilan Data */}
      {friendlyError && (
        <div
          role="alert"
          className="sogan-card rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 sm:p-5 text-sm sm:text-base text-rose-200 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="text-lg font-bold text-rose-400">⚠️</span>
            <div className="space-y-1">
              <h2 className="font-semibold text-rose-200">Gagal Memuat Data Buku Besar</h2>
              <p className="text-xs sm:text-sm text-rose-300/90">{friendlyError}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bar Filter Pilihan Akun & Rentang Tanggal */}
      <FilterBukuBesar
        daftarAkun={daftarAkun}
        selectedAkunId={selectedAkunId}
        tanggalDari={tanggalDari}
        tanggalSampai={tanggalSampai}
      />

      {/* 4. Ringkasan & Tabel Mutasi (Jika Data Tersedia) */}
      {data && data.akun && (
        <div className="space-y-6">
          {/* Ringkasan Saldo Awal, Total Debit, Total Kredit, dan Saldo Akhir */}
          <RingkasanBukuBesar
            akun={data.akun}
            tanggalDari={data.tanggal_dari}
            tanggalSampai={data.tanggal_sampai}
            saldoAwal={data.saldo_awal}
            totalDebit={data.total_debit}
            totalKredit={data.total_kredit}
            saldoAkhir={data.saldo_akhir}
            totalBaris={data.total_baris}
          />

          {/* Tabel Mutasi dengan Saldo Berjalan Akurat & Paginasi */}
          <TabelBukuBesar
            akun={data.akun}
            tanggalDari={data.tanggal_dari}
            tanggalSampai={data.tanggal_sampai}
            saldoAwal={data.saldo_awal}
            mutasi={data.mutasi}
            totalDebit={data.total_debit}
            totalKredit={data.total_kredit}
            saldoAkhir={data.saldo_akhir}
          />
        </div>
      )}

      {/* Keadaan jika tidak ada akun sama sekali di sistem */}
      {daftarAkun.length === 0 && !friendlyError && (
        <div className="sogan-card rounded-2xl border border-dashed border-amber-500/30 bg-[#0e0c0a] p-10 text-center shadow-xl">
          <span aria-hidden="true" className="text-4xl block mb-2">📂</span>
          <h2 className="text-lg font-bold text-[#fdfaf6]">Belum Ada Akun Terdaftar</h2>
          <p className="text-sm text-[#a89f91] mt-1 max-w-md mx-auto">
            Bagan akun belum diatur. Akuntan dapat menambahkan akun pada menu Akun dan Periode.
          </p>
        </div>
      )}
    </div>
  );
}

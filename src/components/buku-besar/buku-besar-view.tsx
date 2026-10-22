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
    <div className="space-y-6">
      {/* 1. Header Halaman (Hanya Baca, Sesuai PRD Bagian 7 & BR-11) */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Buku Besar</h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
              <span aria-hidden="true">🔒</span>
              <span>Hanya Baca</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mutasi debit/kredit dan pergerakan saldo berjalan per akun buku besar (BR-11)
          </p>
        </div>
      </div>

      {/* 2. Pesan Error Jika Ada Kegagalan Pengambilan Data */}
      {friendlyError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-sm"
        >
          <div className="flex items-start gap-2.5">
            <span aria-hidden="true" className="text-base font-bold">⚠️</span>
            <div>
              <h2 className="font-semibold text-rose-900">Gagal Memuat Data Buku Besar</h2>
              <p className="mt-0.5 text-rose-700">{friendlyError}</p>
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
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
          <span aria-hidden="true" className="text-3xl">📂</span>
          <h2 className="text-sm font-semibold text-slate-800 mt-2">Belum Ada Akun Terdaftar</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Bagan akun belum diatur. Akuntan dapat menambahkan akun pada menu Akun dan Periode.
          </p>
        </div>
      )}
    </div>
  );
}

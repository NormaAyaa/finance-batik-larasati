import React from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import { StatusBadge } from "@/components/pengajuan/status-badge";
import type { StatusPengajuan } from "@/types/database";

export interface StafRecentSubmission {
  id: number;
  nomor: string;
  tanggal_transaksi: string;
  jenis: string;
  jumlah: number;
  status: StatusPengajuan;
  keterangan: string;
}

interface DashboardStafProps {
  namaLengkap: string;
  jabatan: string;
  statusCounts: Record<StatusPengajuan, number>;
  recentItems: StafRecentSubmission[];
  totalSubmissions: number;
}

interface StatusConfigItem {
  key: StatusPengajuan;
  label: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  description: string;
}

const STATUS_ITEMS: StatusConfigItem[] = [
  {
    key: "draf",
    label: "Draf",
    icon: "✎",
    bgColor: "bg-slate-50",
    textColor: "text-slate-700",
    borderColor: "border-slate-200",
    description: "Belum diajukan",
  },
  {
    key: "diajukan",
    label: "Diajukan",
    icon: "↑",
    bgColor: "bg-sky-50",
    textColor: "text-sky-800",
    borderColor: "border-sky-200",
    description: "Menunggu verifikasi Akuntan",
  },
  {
    key: "perlu_revisi",
    label: "Perlu Revisi",
    icon: "↩",
    bgColor: "bg-amber-50",
    textColor: "text-amber-800",
    borderColor: "border-amber-200",
    description: "Harus direvisi oleh pengaju",
  },
  {
    key: "menunggu_direktur",
    label: "Menunggu Direktur",
    icon: "⏳",
    bgColor: "bg-purple-50",
    textColor: "text-purple-800",
    borderColor: "border-purple-200",
    description: "Menunggu persetujuan Direktur",
  },
  {
    key: "disetujui",
    label: "Disetujui",
    icon: "✓",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-800",
    borderColor: "border-emerald-200",
    description: "Disetujui, siap dibayar",
  },
  {
    key: "ditolak",
    label: "Ditolak",
    icon: "✕",
    bgColor: "bg-rose-50",
    textColor: "text-rose-800",
    borderColor: "border-rose-200",
    description: "Ditolak peninjau",
  },
  {
    key: "dibayar",
    label: "Dibayar",
    icon: "💳",
    bgColor: "bg-teal-50",
    textColor: "text-teal-800",
    borderColor: "border-teal-200",
    description: "Telah dibayar & terjurnal",
  },
  {
    key: "dibatalkan",
    label: "Dibatalkan",
    icon: "⊘",
    bgColor: "bg-gray-100",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    description: "Dibatalkan pengaju",
  },
];

export function DashboardStaf({
  namaLengkap,
  jabatan,
  statusCounts,
  recentItems,
  totalSubmissions,
}: DashboardStafProps) {
  return (
    <div className="space-y-6">
      {/* 1. Header Sambutan & Tombol Buat Pengajuan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard Staf</h1>
          <p className="text-xs text-slate-500 mt-1">
            Selamat datang, <span className="font-semibold text-slate-700">{namaLengkap}</span> ({jabatan}).
            Pantau status proses pengajuan biaya operasional dan reimburse Anda.
          </p>
        </div>

        <div>
          <Link
            href="/pengajuan/baru"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-xs transition focus:ring-2 focus:ring-sky-500 focus:outline-none"
          >
            <span aria-hidden="true">+</span>
            <span>Buat Pengajuan Baru</span>
          </Link>
        </div>
      </div>

      {/* 2. Ringkasan 8 Status Pengajuan Milik Sendiri */}
      <section aria-labelledby="status-pengajuan-title">
        <div className="flex items-center justify-between mb-3">
          <h2 id="status-pengajuan-title" className="text-sm font-bold text-slate-900">
            Ringkasan Status Pengajuan Saya
          </h2>
          <span className="text-xs text-slate-400">Total {totalSubmissions} pengajuan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {STATUS_ITEMS.map((cfg) => {
            const count = statusCounts[cfg.key] || 0;
            return (
              <Link
                key={cfg.key}
                href={`/pengajuan?status=${cfg.key}`}
                className={`p-3.5 rounded-xl border transition flex flex-col justify-between hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${cfg.bgColor} ${cfg.borderColor}`}
                title={`Lihat pengajuan status ${cfg.label}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px]"
                  >
                    {cfg.icon}
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900">{count}</span>
                </div>
                <div className="mt-2">
                  <div className={`text-xs font-bold ${cfg.textColor}`}>{cfg.label}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5" title={cfg.description}>
                    {cfg.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Daftar Pengajuan Terbaru Milik Sendiri */}
      <section
        className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        aria-labelledby="riwayat-terbaru-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 id="riwayat-terbaru-title" className="text-base font-bold text-slate-900">
              Pengajuan Terbaru Saya
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              10 pengajuan terakhir yang Anda ajukan di sistem
            </p>
          </div>

          <Link
            href="/pengajuan"
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition inline-flex items-center gap-1"
          >
            <span>Lihat Semua Pengajuan Saya</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="py-12 text-center">
            <div
              aria-hidden="true"
              className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl font-bold mb-3"
            >
              ✎
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Belum Ada Pengajuan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Anda belum pernah membuat pengajuan biaya operasional atau reimburse karyawan.
            </p>
            <div className="mt-4">
              <Link
                href="/pengajuan/baru"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-700 text-white text-xs font-semibold hover:bg-sky-800 transition"
              >
                <span>+ Buat Pengajuan Pertama</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <caption className="sr-only">Daftar pengajuan operasional terbaru milik Anda</caption>
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Nomor & Tanggal</th>
                  <th scope="col" className="px-4 py-3">Keperluan</th>
                  <th scope="col" className="px-4 py-3">Jenis</th>
                  <th scope="col" className="px-4 py-3 text-right">Jumlah</th>
                  <th scope="col" className="px-4 py-3 text-center">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    {/* Nomor & Tanggal */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 font-mono text-xs">
                        <Link
                          href={`/pengajuan/${item.id}`}
                          className="hover:text-sky-700 underline focus:outline-none"
                        >
                          {item.nomor}
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(item.tanggal_transaksi)}
                      </div>
                    </td>

                    {/* Keperluan */}
                    <td className="px-4 py-3">
                      <p className="line-clamp-1 max-w-xs text-slate-800 font-medium">
                        {item.keterangan || "-"}
                      </p>
                    </td>

                    {/* Jenis */}
                    <td className="px-4 py-3 whitespace-nowrap capitalize text-slate-600">
                      {item.jenis}
                    </td>

                    {/* Jumlah */}
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-semibold text-slate-900">
                      {formatRupiah(item.jumlah)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/pengajuan/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition"
                      >
                        <span>Lihat</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

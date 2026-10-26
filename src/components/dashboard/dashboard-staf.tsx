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
  borderColor: string;
  glowColor: string;
  description: string;
}

const STATUS_ITEMS: StatusConfigItem[] = [
  {
    key: "draf",
    label: "Draf",
    icon: "✎",
    borderColor: "border-stone-800",
    glowColor: "text-stone-400",
    description: "Belum diajukan",
  },
  {
    key: "diajukan",
    label: "Diajukan",
    icon: "↑",
    borderColor: "border-amber-500/30",
    glowColor: "text-amber-300",
    description: "Menunggu verifikasi Akuntan",
  },
  {
    key: "perlu_revisi",
    label: "Perlu Revisi",
    icon: "↩",
    borderColor: "border-orange-500/40",
    glowColor: "text-orange-400",
    description: "Perlu revisi nota",
  },
  {
    key: "menunggu_direktur",
    label: "Menunggu Direktur",
    icon: "⏳",
    borderColor: "border-purple-500/40",
    glowColor: "text-purple-300",
    description: "Menunggu Direktur",
  },
  {
    key: "disetujui",
    label: "Disetujui",
    icon: "✓",
    borderColor: "border-emerald-500/40",
    glowColor: "text-emerald-300",
    description: "Siap dibayar",
  },
  {
    key: "ditolak",
    label: "Ditolak",
    icon: "✕",
    borderColor: "border-rose-500/40",
    glowColor: "text-rose-400",
    description: "Ditolak peninjau",
  },
  {
    key: "dibayar",
    label: "Dibayar",
    icon: "💳",
    borderColor: "border-teal-500/40",
    glowColor: "text-teal-300",
    description: "Telah dicairkan",
  },
  {
    key: "dibatalkan",
    label: "Dibatalkan",
    icon: "⊘",
    borderColor: "border-stone-800",
    glowColor: "text-stone-500",
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
    <div className="space-y-6 select-none">
      {/* 1. Header Sambutan & Tombol Buat Pengajuan */}
      <div className="sogan-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-amber-900/30 bg-gradient-to-r from-amber-950/20 via-[#0f0d0b] to-[#0f0d0b]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400/80">
              Portal Staf • CV Batik Larasati
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#fdfaf6] tracking-tight">
            Sugeng Rawuh, <span className="text-amber-300">{namaLengkap}</span>
          </h2>
          <p className="text-xs text-[#a89f91] mt-1">
            {jabatan} • Pantau status pengajuan biaya operasional & penggantian (reimburse) Anda secara real-time.
          </p>
        </div>

        <div>
          <Link
            href="/pengajuan/baru"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition"
          >
            <span aria-hidden="true" className="text-sm font-black">+</span>
            <span>Ajukan Biaya / Reimburse</span>
          </Link>
        </div>
      </div>

      {/* 2. Ringkasan 8 Status Pengajuan Milik Sendiri (Funnel Bento) */}
      <section aria-labelledby="status-pengajuan-title">
        <div className="flex items-center justify-between mb-3">
          <h3 id="status-pengajuan-title" className="text-sm font-bold text-[#fdfaf6] tracking-tight">
            Status Pengajuan Saya
          </h3>
          <span className="text-xs text-[#a89f91] bg-[#141210] border border-amber-900/30 px-2.5 py-0.5 rounded-full">
            Total {totalSubmissions} pengajuan
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {STATUS_ITEMS.map((cfg) => {
            const count = statusCounts[cfg.key] || 0;
            return (
              <Link
                key={cfg.key}
                href={`/pengajuan?status=${cfg.key}`}
                className={`sogan-card sogan-card-hover p-3.5 flex flex-col justify-between ${cfg.borderColor}`}
                title={`Lihat pengajuan status ${cfg.label}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    aria-hidden="true"
                    className={`font-bold text-xs ${cfg.glowColor}`}
                  >
                    {cfg.icon}
                  </span>
                  <span className="text-lg font-extrabold font-mono text-[#fdfaf6]">{count}</span>
                </div>
                <div className="mt-2.5">
                  <div className="text-xs font-bold text-[#fdfaf6] truncate">{cfg.label}</div>
                  <div className="text-[10px] text-[#78716c] line-clamp-1 mt-0.5" title={cfg.description}>
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
        className="sogan-card p-5 sm:p-6"
        aria-labelledby="riwayat-terbaru-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/20">
          <div>
            <h3 id="riwayat-terbaru-title" className="text-base font-bold text-[#fdfaf6] tracking-tight">
              Pengajuan Terbaru Saya
            </h3>
            <p className="text-xs text-[#a89f91] mt-0.5">
              10 berkas pengajuan terakhir yang Anda ajukan di sistem
            </p>
          </div>

          <Link
            href="/pengajuan"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition inline-flex items-center gap-1"
          >
            <span>Semua Pengajuan</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {recentItems.length === 0 ? (
          <div className="py-12 text-center">
            <div
              aria-hidden="true"
              className="w-12 h-12 mx-auto rounded-full bg-amber-950/40 text-amber-400 flex items-center justify-center text-xl font-bold mb-3 border border-amber-500/30"
            >
              ✎
            </div>
            <h4 className="text-sm font-semibold text-[#fdfaf6]">Belum Ada Pengajuan</h4>
            <p className="text-xs text-[#a89f91] mt-1 max-w-sm mx-auto">
              Anda belum pernah membuat pengajuan biaya operasional atau reimburse karyawan.
            </p>
            <div className="mt-4">
              <Link
                href="/pengajuan/baru"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)] transition"
              >
                <span>+ Buat Pengajuan Pertama</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-[#fdfaf6]">
              <caption className="sr-only">Daftar pengajuan operasional terbaru milik Anda</caption>
              <thead className="bg-[#141210] text-[#a89f91] font-semibold border-b border-amber-900/30 uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Nomor & Tanggal</th>
                  <th scope="col" className="px-4 py-3">Keperluan</th>
                  <th scope="col" className="px-4 py-3">Jenis</th>
                  <th scope="col" className="px-4 py-3 text-right">Jumlah</th>
                  <th scope="col" className="px-4 py-3 text-center">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/15">
                {recentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1a1613] transition">
                    {/* Nomor & Tanggal */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-amber-300 font-mono text-xs">
                        <Link
                          href={`/pengajuan/${item.id}`}
                          className="hover:underline focus:outline-none"
                        >
                          {item.nomor}
                        </Link>
                      </div>
                      <div className="text-[11px] text-[#78716c] mt-0.5">
                        {formatDate(item.tanggal_transaksi)}
                      </div>
                    </td>

                    {/* Keperluan */}
                    <td className="px-4 py-3">
                      <p className="line-clamp-1 max-w-xs text-[#fdfaf6] font-medium">
                        {item.keterangan || "-"}
                      </p>
                    </td>

                    {/* Jenis */}
                    <td className="px-4 py-3 whitespace-nowrap capitalize text-[#a89f91]">
                      {item.jenis}
                    </td>

                    {/* Jumlah */}
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-amber-300">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-500/30 transition"
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

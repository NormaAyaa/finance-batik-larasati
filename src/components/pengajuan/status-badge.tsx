import React from "react";
import type { StatusPengajuan } from "@/types/database";

interface StatusBadgeProps {
  status: StatusPengajuan;
  className?: string;
}

interface StatusConfig {
  label: string;
  icon: string;
  className: string;
  description: string;
}

const STATUS_CONFIGS: Record<StatusPengajuan, StatusConfig> = {
  draf: {
    label: "Draf",
    icon: "✎",
    className: "bg-slate-100 text-slate-700 border-slate-300",
    description: "Status: Draf (belum diajukan)",
  },
  diajukan: {
    label: "Diajukan",
    icon: "↑",
    className: "bg-sky-50 text-sky-800 border-sky-300",
    description: "Status: Diajukan, menunggu verifikasi Akuntan",
  },
  perlu_revisi: {
    label: "Perlu Revisi",
    icon: "↩",
    className: "bg-amber-50 text-amber-800 border-amber-300",
    description: "Status: Perlu Revisi dari pengaju",
  },
  menunggu_direktur: {
    label: "Menunggu Direktur",
    icon: "⏳",
    className: "bg-purple-50 text-purple-800 border-purple-300",
    description: "Status: Menunggu persetujuan Direktur",
  },
  disetujui: {
    label: "Disetujui",
    icon: "✓",
    className: "bg-emerald-50 text-emerald-800 border-emerald-300",
    description: "Status: Disetujui, siap dibayar",
  },
  ditolak: {
    label: "Ditolak",
    icon: "✕",
    className: "bg-rose-50 text-rose-800 border-rose-300",
    description: "Status: Ditolak oleh peninjau",
  },
  dibayar: {
    label: "Dibayar",
    icon: "💳",
    className: "bg-teal-50 text-teal-800 border-teal-300",
    description: "Status: Telah dibayar dan jurnal terposting",
  },
  dibatalkan: {
    label: "Dibatalkan",
    icon: "⊘",
    className: "bg-gray-100 text-gray-600 border-gray-300",
    description: "Status: Dibatalkan oleh pengaju",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] ?? {
    label: status,
    icon: "•",
    className: "bg-slate-100 text-slate-700 border-slate-300",
    description: `Status: ${status}`,
  };

  return (
    <span
      role="status"
      aria-label={config.description}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className} ${className}`}
    >
      <span aria-hidden="true" className="font-bold text-[11px]">
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
}

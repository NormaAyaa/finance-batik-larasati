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
    className: "bg-stone-900/60 text-stone-300 border-stone-700",
    description: "Status: Draf (belum diajukan)",
  },
  diajukan: {
    label: "Diajukan",
    icon: "↑",
    className: "bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    description: "Status: Diajukan, menunggu verifikasi Akuntan",
  },
  perlu_revisi: {
    label: "Perlu Revisi",
    icon: "↩",
    className: "bg-orange-950/70 text-orange-300 border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.15)]",
    description: "Status: Perlu Revisi dari pengaju",
  },
  menunggu_direktur: {
    label: "Menunggu Direktur",
    icon: "⏳",
    className: "bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.15)]",
    description: "Status: Menunggu persetujuan Direktur",
  },
  disetujui: {
    label: "Disetujui",
    icon: "✓",
    className: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    description: "Status: Disetujui, siap dibayar",
  },
  ditolak: {
    label: "Ditolak",
    icon: "✕",
    className: "bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.15)]",
    description: "Status: Ditolak oleh peninjau",
  },
  dibayar: {
    label: "Dibayar",
    icon: "💳",
    className: "bg-teal-950/70 text-teal-300 border-teal-500/40 shadow-[0_0_8px_rgba(20,184,166,0.15)]",
    description: "Status: Telah dibayar dan jurnal terposting",
  },
  dibatalkan: {
    label: "Dibatalkan",
    icon: "⊘",
    className: "bg-stone-900/60 text-stone-400 border-stone-800",
    description: "Status: Dibatalkan oleh pengaju",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] ?? {
    label: status,
    icon: "•",
    className: "bg-stone-900 text-stone-300 border-stone-700",
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

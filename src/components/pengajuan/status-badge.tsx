import React from "react";
import type { StatusPengajuan } from "@/types/database";

interface StatusBadgeProps {
  status: StatusPengajuan;
  size?: "sm" | "md" | "lg";
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
    className: "bg-stone-900/80 text-stone-300 border-stone-700/60",
    description: "Status: Draf (belum diajukan)",
  },
  diajukan: {
    label: "Diajukan",
    icon: "↑",
    className: "bg-amber-950/60 text-amber-300 border-amber-500/30",
    description: "Status: Diajukan, menunggu verifikasi Akuntan",
  },
  perlu_revisi: {
    label: "Perlu Revisi",
    icon: "↩",
    className: "bg-orange-950/60 text-orange-300 border-orange-500/30",
    description: "Status: Perlu Revisi dari pengaju",
  },
  menunggu_direktur: {
    label: "Menunggu Direktur",
    icon: "⏳",
    className: "bg-purple-950/60 text-purple-300 border-purple-500/30",
    description: "Status: Menunggu persetujuan Direktur",
  },
  disetujui: {
    label: "Disetujui",
    icon: "✓",
    className: "bg-emerald-950/60 text-emerald-300 border-emerald-500/30",
    description: "Status: Disetujui, siap dibayar",
  },
  ditolak: {
    label: "Ditolak",
    icon: "✕",
    className: "bg-rose-950/60 text-rose-300 border-rose-500/30",
    description: "Status: Ditolak oleh peninjau",
  },
  dibayar: {
    label: "Dibayar",
    icon: "💳",
    className: "bg-teal-950/60 text-teal-300 border-teal-500/30",
    description: "Status: Telah dibayar dan jurnal terposting",
  },
  dibatalkan: {
    label: "Dibatalkan",
    icon: "⊘",
    className: "bg-stone-900/60 text-stone-400 border-stone-800",
    description: "Status: Dibatalkan oleh pengaju",
  },
};

const SIZE_STYLES = {
  sm: {
    wrapper: "px-2 py-0.5 text-[11px] font-semibold gap-1",
    icon: "text-[10px] font-bold",
  },
  md: {
    wrapper: "px-2.5 py-0.5 text-xs font-semibold gap-1.5",
    icon: "text-xs font-bold",
  },
  lg: {
    wrapper: "px-3.5 py-1 text-xs sm:text-sm font-bold gap-2",
    icon: "text-sm font-bold",
  },
};

export function StatusBadge({ status, size = "md", className = "" }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] ?? {
    label: status,
    icon: "•",
    className: "bg-stone-900 text-stone-300 border-stone-700",
    description: `Status: ${status}`,
  };

  const sizeStyle = SIZE_STYLES[size] ?? SIZE_STYLES.md;

  return (
    <span
      role="status"
      aria-label={config.description}
      className={`inline-flex items-center rounded-full border tracking-wide whitespace-nowrap transition-all ${sizeStyle.wrapper} ${config.className} ${className}`}
    >
      <span aria-hidden="true" className={sizeStyle.icon}>
        {config.icon}
      </span>
      <span>{config.label}</span>
    </span>
  );
}


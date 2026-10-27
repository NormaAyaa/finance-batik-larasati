import React from "react";
import { formatDateTime } from "@/lib/utils/formatters";
import type { StatusPengajuan } from "@/types/database";

interface ProfileSummary {
  nama_lengkap: string;
  peran: string;
}

interface AkunSummary {
  kode: string;
  nama: string;
}

interface StatusTimelineProps {
  status: StatusPengajuan;
  dibuatPada: string;
  diajukanPada: string | null;
  diverifikasiPada: string | null;
  disetujuiPada: string | null;
  dibayarPada: string | null;
  catatanPeninjau: string | null;
  pengaju: ProfileSummary | null;
  pemverifikasi: ProfileSummary | null;
  penyetuju: ProfileSummary | null;
  pembayar: ProfileSummary | null;
  akunKas: AkunSummary | null;
}

interface TimelineItem {
  id: string;
  title: string;
  timestamp: string | null;
  actor: string;
  description: string;
  statusType: "success" | "warning" | "danger" | "info" | "neutral";
  icon: string;
}

export function StatusTimeline({
  status,
  dibuatPada,
  diajukanPada,
  diverifikasiPada,
  disetujuiPada,
  dibayarPada,
  catatanPeninjau,
  pengaju,
  pemverifikasi,
  penyetuju,
  pembayar,
  akunKas,
}: StatusTimelineProps) {
  const items: TimelineItem[] = [];

  // 1. Dibuat
  items.push({
    id: "dibuat",
    title: "Pengajuan Dibuat (Draf)",
    timestamp: dibuatPada,
    actor: pengaju?.nama_lengkap ? `${pengaju.nama_lengkap} (${pengaju.peran})` : "Pengaju",
    description: "Draf pengajuan biaya/reimburse berhasil dibuat di sistem.",
    statusType: "neutral",
    icon: "✎",
  });

  // 2. Diajukan
  if (diajukanPada) {
    const isAkuntanPengaju = pengaju?.peran === "akuntan";
    items.push({
      id: "diajukan",
      title: "Pengajuan Dikirim",
      timestamp: diajukanPada,
      actor: pengaju?.nama_lengkap ? `${pengaju.nama_lengkap} (${pengaju.peran})` : "Pengaju",
      description: isAkuntanPengaju
        ? "Pengajuan dikirim langsung menuju persetujuan Direktur (BR-09)."
        : "Pengajuan dikirim untuk verifikasi Akuntan (BR-08).",
      statusType: "info",
      icon: "↑",
    });
  }

  // 3. Verifikasi Akuntan
  if (diverifikasiPada) {
    const isRevisi = status === "perlu_revisi" && !disetujuiPada;
    const isDitolak = status === "ditolak" && !disetujuiPada;
    const isMenungguDirektur = status === "menunggu_direktur";

    let desc = "Pengajuan diverifikasi dan disetujui langsung oleh Akuntan (BR-08).";
    let statusType: TimelineItem["statusType"] = "success";
    let icon = "✓";

    if (isRevisi) {
      desc = catatanPeninjau
        ? `Akuntan meminta revisi: "${catatanPeninjau}"`
        : "Akuntan meminta revisi pengajuan.";
      statusType = "warning";
      icon = "↩";
    } else if (isDitolak) {
      desc = catatanPeninjau
        ? `Pengajuan ditolak oleh Akuntan: "${catatanPeninjau}"`
        : "Pengajuan ditolak oleh Akuntan.";
      statusType = "danger";
      icon = "✕";
    } else if (isMenungguDirektur) {
      desc = "Pengajuan telah diverifikasi Akuntan dan diteruskan ke Direktur untuk disetujui (nilai > Rp 1.000.000).";
      statusType = "info";
      icon = "⏳";
    }

    items.push({
      id: "diverifikasi",
      title: isRevisi
        ? "Permintaan Revisi (Akuntan)"
        : isDitolak
        ? "Pengajuan Ditolak (Akuntan)"
        : isMenungguDirektur
        ? "Diteruskan ke Direktur"
        : "Diverifikasi & Disetujui Akuntan",
      timestamp: diverifikasiPada,
      actor: pemverifikasi?.nama_lengkap
        ? `${pemverifikasi.nama_lengkap} (Akuntan)`
        : "Akuntan",
      description: desc,
      statusType,
      icon,
    });
  }

  // 4. Persetujuan / Tindakan Direktur
  if (disetujuiPada) {
    const isRevisi = status === "perlu_revisi";
    const isDitolak = status === "ditolak";

    let desc = "Pengajuan disetujui oleh Direktur. Menunggu pembayaran oleh Akuntan.";
    let statusType: TimelineItem["statusType"] = "success";
    let icon = "✓";

    if (isRevisi) {
      desc = catatanPeninjau
        ? `Direktur meminta revisi: "${catatanPeninjau}"`
        : "Direktur meminta revisi pengajuan.";
      statusType = "warning";
      icon = "↩";
    } else if (isDitolak) {
      desc = catatanPeninjau
        ? `Pengajuan ditolak oleh Direktur: "${catatanPeninjau}"`
        : "Pengajuan ditolak oleh Direktur.";
      statusType = "danger";
      icon = "✕";
    }

    items.push({
      id: "disetujui",
      title: isRevisi
        ? "Permintaan Revisi (Direktur)"
        : isDitolak
        ? "Pengajuan Ditolak (Direktur)"
        : "Disetujui Direktur",
      timestamp: disetujuiPada,
      actor: penyetuju?.nama_lengkap
        ? `${penyetuju.nama_lengkap} (Direktur)`
        : "Direktur",
      description: desc,
      statusType,
      icon,
    });
  }

  // 5. Pembayaran
  if (dibayarPada) {
    items.push({
      id: "dibayar",
      title: "Pengajuan Telah Dibayar",
      timestamp: dibayarPada,
      actor: pembayar?.nama_lengkap
        ? `${pembayar.nama_lengkap} (Akuntan)`
        : "Akuntan",
      description: akunKas
        ? `Pembayaran telah dituntaskan menggunakan akun kas/bank ${akunKas.kode} (${akunKas.nama}). Jurnal pembayaran otomatis terposting (BR-10).`
        : "Pembayaran telah dituntaskan dan jurnal otomatis diposting.",
      statusType: "success",
      icon: "💳",
    });
  }

  // 6. Dibatalkan
  if (status === "dibatalkan") {
    items.push({
      id: "dibatalkan",
      title: "Pengajuan Dibatalkan",
      timestamp: null,
      actor: pengaju?.nama_lengkap
        ? `${pengaju.nama_lengkap} (Pengaju)`
        : "Pengaju",
      description: "Pengajuan dibatalkan secara mandiri oleh pemilik pengajuan (BR-08).",
      statusType: "neutral",
      icon: "⊘",
    });
  }

  return (
    <div className="space-y-5">
      <h3 className="text-base sm:text-lg font-bold text-[#fdfaf6] flex items-center gap-2 border-b border-amber-900/20 pb-3">
        <span aria-hidden="true">⏱️</span> Riwayat Perkembangan Pengajuan
      </h3>

      <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-amber-900/40">
        {items.map((item) => {
          const badgeColors = {
            success: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]",
            warning: "bg-orange-950/80 text-orange-300 border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)]",
            danger: "bg-rose-950/80 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.2)]",
            info: "bg-amber-950/80 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]",
            neutral: "bg-stone-900/80 text-stone-300 border-stone-700",
          }[item.statusType];

          return (
            <div key={item.id} className="relative group">
              {/* Node Icon */}
              <div
                aria-hidden="true"
                className={`absolute -left-8 top-1 flex h-7 w-7 items-center justify-center rounded-full border text-xs sm:text-sm font-bold shadow-md ${badgeColors}`}
              >
                {item.icon}
              </div>

              {/* Detail Riwayat */}
              <div className="bg-[#141210] border border-amber-900/25 rounded-xl p-4 sm:p-5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm sm:text-base font-bold text-[#fdfaf6]">
                    {item.title}
                  </span>
                  {item.timestamp && (
                    <span className="text-xs sm:text-sm text-amber-400 font-mono font-medium">
                      {formatDateTime(item.timestamp)}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#a89f91] font-medium">
                  Pelaku: <span className="text-[#fdfaf6] font-semibold">{item.actor}</span>
                </p>

                <p className="text-sm sm:text-base text-[#d6cfc7] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <span aria-hidden="true">⏱️</span> Riwayat Perkembangan Pengajuan
      </h3>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {items.map((item) => {
          const badgeColors = {
            success: "bg-emerald-100 text-emerald-800 border-emerald-300",
            warning: "bg-amber-100 text-amber-800 border-amber-300",
            danger: "bg-rose-100 text-rose-800 border-rose-300",
            info: "bg-sky-100 text-sky-800 border-sky-300",
            neutral: "bg-slate-100 text-slate-700 border-slate-300",
          }[item.statusType];

          return (
            <div key={item.id} className="relative group">
              {/* Node Icon */}
              <div
                aria-hidden="true"
                className={`absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm ${badgeColors}`}
              >
                {item.icon}
              </div>

              {/* Detail Riwayat */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900">
                    {item.title}
                  </span>
                  {item.timestamp && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {formatDateTime(item.timestamp)}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 font-medium">
                  Pelaku: <span className="text-slate-900">{item.actor}</span>
                </p>

                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
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

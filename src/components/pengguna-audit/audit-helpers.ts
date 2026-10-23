/**
 * Helper formatting dan terjemahan untuk modul Pengguna dan Audit Log
 */

/**
 * Format tanggal ISO ke format WIB (Waktu Indonesia Barat / UTC+7)
 * Contoh: 20 Okt 2026, 14:30:15 WIB
 */
export function formatWIB(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    const day = parts.find((p) => p.type === "day")?.value || "";
    const month = parts.find((p) => p.type === "month")?.value || "";
    const year = parts.find((p) => p.type === "year")?.value || "";
    const hour = parts.find((p) => p.type === "hour")?.value || "";
    const minute = parts.find((p) => p.type === "minute")?.value || "";
    const second = parts.find((p) => p.type === "second")?.value || "";

    return `${day} ${month} ${year}, ${hour}:${minute}:${second} WIB`;
  } catch {
    return dateStr;
  }
}

/**
 * Format tanggal ringkas (WIB)
 * Contoh: 20 Okt 2026
 */
export function formatTanggalWIB(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export interface ActionInfo {
  label: string;
  raw: string;
  badgeClass: string;
}

/**
 * Terjemahkan kode aksi audit_log ke teks bahasa Indonesia yang ramah pengguna.
 * Kode mentah tetap disimpan dalam field `raw`.
 */
export function translateAuditAction(aksi: string): ActionInfo {
  const raw = aksi || "";
  const upper = raw.toUpperCase().trim();

  // Pola transisi status: status:draf->diposting, dsb.
  if (raw.toLowerCase().startsWith("status:")) {
    const statusPart = raw.slice(7); // "draf->diposting"
    const [from, to] = statusPart.split("->");
    if (from === "draf" && to === "diposting") {
      return {
        label: "Jurnal diposting",
        raw,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    }
    if (from === "diposting" && to === "dibalik") {
      return {
        label: "Jurnal dibalik (pembalik dibuat)",
        raw,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      };
    }
    return {
      label: `Perubahan status (${from || "?"} → ${to || "?"})`,
      raw,
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    };
  }

  switch (upper) {
    case "TUTUP_PERIODE":
      return {
        label: "Tutup periode",
        raw,
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "BUKA_KEMBALI_PERIODE":
      return {
        label: "Buka kembali periode",
        raw,
        badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
      };
    case "PERUBAHAN_PENGGUNA":
      return {
        label: "Ubah peran atau status pengguna",
        raw,
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
      };
    case "POSTING_JURNAL":
      return {
        label: "Jurnal diposting",
        raw,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "JURNAL_PEMBALIK":
    case "BALIK_JURNAL":
      return {
        label: "Jurnal dibalik",
        raw,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "BUAT_JURNAL":
    case "SIMPAN_DRAF":
      return {
        label: "Simpan draf jurnal",
        raw,
        badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
      };
    case "BUAT_PENGAJUAN":
      return {
        label: "Buat pengajuan belanja",
        raw,
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    case "VERIFIKASI_PENGAJUAN":
      return {
        label: "Verifikasi pengajuan",
        raw,
        badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
      };
    case "SETUJUI_PENGAJUAN":
      return {
        label: "Setujui pengajuan",
        raw,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "TOLAK_PENGAJUAN":
      return {
        label: "Tolak pengajuan",
        raw,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "MINTA_REVISI_PENGAJUAN":
      return {
        label: "Minta revisi pengajuan",
        raw,
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "BAYAR_PENGAJUAN":
      return {
        label: "Bayar pengajuan belanja",
        raw,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "TAMBAH_AKUN":
      return {
        label: "Tambah akun baru",
        raw,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "UBAH_AKUN":
      return {
        label: "Ubah data akun",
        raw,
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
      };
    case "INSERT":
      return {
        label: "Penambahan data (Insert)",
        raw,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "UPDATE":
      return {
        label: "Perubahan data (Update)",
        raw,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "DELETE":
      return {
        label: "Penghapusan data (Delete)",
        raw,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return {
        label: raw.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        raw,
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

/**
 * Terjemahkan nama tabel sistem ke label tampilan
 */
export function translateTableName(namaTabel: string): { label: string; badgeClass: string } {
  switch (namaTabel.toLowerCase()) {
    case "profiles":
      return { label: "Pengguna (profiles)", badgeClass: "bg-purple-50 text-purple-700 border-purple-200" };
    case "periode":
      return { label: "Periode Akuntansi", badgeClass: "bg-amber-50 text-amber-800 border-amber-200" };
    case "jurnal":
      return { label: "Jurnal Umum", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" };
    case "jurnal_baris":
      return { label: "Baris Jurnal", badgeClass: "bg-sky-50 text-sky-700 border-sky-200" };
    case "pengajuan":
      return { label: "Pengajuan Belanja", badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "akun":
      return { label: "Bagan Akun (akun)", badgeClass: "bg-teal-50 text-teal-700 border-teal-200" };
    default:
      return { label: namaTabel, badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}

/**
 * Terjemahan dan styling peran pengguna
 */
export const PERAN_STYLES: Record<string, { label: string; badgeClass: string; desc: string }> = {
  direktur: {
    label: "Direktur",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    desc: "Hak akses penuh: persetujuan pengajuan belanja, buka kembali periode, manajemen pengguna dan log audit.",
  },
  akuntan: {
    label: "Akuntan",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "Akses operasional keuangan: posting jurnal, tutup periode, kelola akun, verifikasi & bayar pengajuan.",
  },
  staf: {
    label: "Staf",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    desc: "Akses dasar: membuat pengajuan belanja kas kecil dan melihat dashboard.",
  },
};

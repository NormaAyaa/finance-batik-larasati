import { TipeAkun, SaldoNormalAkun, SubmissionStatus } from "@/types/database";

/**
 * Batasan dan Aturan Bisnis CV Batik Larasati (berdasarkan PRD Finance)
 */
export const BUSINESS_RULES = {
  // BR-01: Bagan Akun (Digit awal ke Tipe Akun)
  ACCOUNT_PREFIX_MAP: {
    "1": { tipe: "aset" as TipeAkun, name: "Aset", normalBalance: "debit" as SaldoNormalAkun },
    "2": { tipe: "kewajiban" as TipeAkun, name: "Kewajiban", normalBalance: "kredit" as SaldoNormalAkun },
    "3": { tipe: "ekuitas" as TipeAkun, name: "Ekuitas", normalBalance: "kredit" as SaldoNormalAkun },
    "4": { tipe: "pendapatan" as TipeAkun, name: "Pendapatan", normalBalance: "kredit" as SaldoNormalAkun },
    "5": { tipe: "beban" as TipeAkun, name: "Beban", normalBalance: "debit" as SaldoNormalAkun },
  },

  // BR-01: Detail per Tipe Akun
  ACCOUNT_TYPES: {
    aset: { prefix: "1", name: "Aset", normalBalance: "debit" as SaldoNormalAkun },
    kewajiban: { prefix: "2", name: "Kewajiban", normalBalance: "kredit" as SaldoNormalAkun },
    ekuitas: { prefix: "3", name: "Ekuitas", normalBalance: "kredit" as SaldoNormalAkun },
    pendapatan: { prefix: "4", name: "Pendapatan", normalBalance: "kredit" as SaldoNormalAkun },
    beban: { prefix: "5", name: "Beban", normalBalance: "debit" as SaldoNormalAkun },
  } as Record<TipeAkun, { prefix: string; name: string; normalBalance: SaldoNormalAkun }>,

  // BR-07: Batasan Pengajuan
  SUBMISSION: {
    MIN_AMOUNT: 10_000, // Rp 10.000
    MAX_AMOUNT: 25_000_000, // Rp 25.000.000
    DIRECTOR_APPROVAL_THRESHOLD: 1_000_000, // Di atas Rp 1.000.000 butuh persetujuan Direktur
    MIN_PURPOSE_LENGTH: 10, // Keperluan minimal 10 karakter
    MAX_TRANSACTION_DAYS_AGO: 30, // Maksimal 30 hari sebelum tanggal kirim
    MAX_ATTACHMENT_SIZE_MB: 5, // Maksimal 5 MB
    ALLOWED_ATTACHMENT_TYPES: ["image/jpeg", "image/png", "application/pdf"],
  },

  // BR-06: Pembukaan Kembali Periode
  PERIOD: {
    MIN_REOPEN_REASON_LENGTH: 20, // Wajib alasan minimal 20 karakter
  },

  // BR-08: Catatan Revisi / Penolakan
  REVISION: {
    MIN_NOTE_LENGTH: 10, // Catatan penolakan/revisi minimal 10 karakter
  },
} as const;

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  draf: "Draf",
  diajukan: "Diajukan",
  perlu_revisi: "Perlu Revisi",
  menunggu_direktur: "Menunggu Direktur",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dibayar: "Dibayar",
  dibatalkan: "Dibatalkan",
};

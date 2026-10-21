/**
 * Format integer rupiah ke format IDR standar.
 * Sesuai PRD Seksi 9: Angka negatif ditampilkan dalam tanda kurung, misal (Rp 4.625.000).
 */
export function formatRupiah(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `(${formatted})` : formatted;
}

/**
 * Format tanggal ISO ke format Indonesia (contoh: 15 Oktober 2026).
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

/**
 * Format tanggal dan waktu ISO ke format Indonesia.
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

/**
 * Format nomor dokumen (JU-YYYYMM-XXXX atau PG-YYYYMM-XXXX)
 */
export function formatDocNumber(
  prefix: "JU" | "PG",
  yearMonth: string,
  seq: number
): string {
  const paddedSeq = String(seq).padStart(4, "0");
  return `${prefix}-${yearMonth}-${paddedSeq}`;
}

export const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/**
 * Format kombinasi tahun dan nomor bulan (1-12) ke teks Indonesia (misal: "Oktober 2026").
 */
export function formatBulanTahun(tahun: number, bulan: number): string {
  const nama = NAMA_BULAN[bulan - 1] || `Bulan ${bulan}`;
  return `${nama} ${tahun}`;
}


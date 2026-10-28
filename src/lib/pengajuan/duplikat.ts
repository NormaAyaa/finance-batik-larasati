import type { StatusPengajuan } from "@/types/database";

export type JenisKecocokanDuplikat = "pasti" | "kemungkinan";

export interface CekDuplikatPengajuanParams {
  buktiHash?: string | null;
  pengajuId: string;
  tanggalTransaksi?: string | null;
  jumlah?: number | null;
  excludeId?: number | null;
}

export interface PengajuanDuplikatItem {
  id: number;
  nomor: string | null;
  status: StatusPengajuan;
  tanggal_transaksi: string;
  jumlah: number;
  keterangan: string;
  bukti_hash?: string | null;
  pengaju_id?: string;
}

export interface HasilCekDuplikatPengajuan {
  isDuplikat: boolean;
  jenisKecocokan?: JenisKecocokanDuplikat;
  pengajuan?: {
    id: number;
    nomor: string | null;
    status: StatusPengajuan;
    tanggal_transaksi: string;
    jumlah: number;
    keterangan: string;
  };
  pesanPeringatan?: string;
}

const STATUS_LABELS: Record<StatusPengajuan, string> = {
  draf: "Draf",
  diajukan: "Diajukan",
  perlu_revisi: "Perlu Revisi",
  menunggu_direktur: "Menunggu Direktur",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dibayar: "Dibayar",
  dibatalkan: "Dibatalkan",
};

export function formatLabelStatus(status: StatusPengajuan): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Format teks pesan peringatan untuk UI berdasarkan jenis kecocokan
 */
export function formatPeringatanDuplikat(
  jenis: JenisKecocokanDuplikat,
  item: {
    id: number;
    nomor: string | null;
    status: StatusPengajuan;
    tanggal_transaksi: string;
    jumlah: number;
  }
): string {
  const labelNomor = item.nomor ? item.nomor : `Draf #${item.id}`;
  const labelStatus = formatLabelStatus(item.status);

  if (jenis === "pasti") {
    return `Nota ini sudah dipakai pada ${labelNomor} (${labelStatus}).`;
  }

  const formattedNominal = item.jumlah.toLocaleString("id-ID");
  return `Pengajuan serupa dengan tanggal ${item.tanggal_transaksi} dan nominal Rp ${formattedNominal} sudah pernah dibuat pada ${labelNomor} (${labelStatus}).`;
}

/**
 * Logika murni pencocokan duplikat pengajuan:
 * 1. Hanya mencocokkan pengajuan aktif (status bukan 'ditolak') milik pengaju yang sama
 * 2. Mengabaikan pengajuan dengan id === excludeId (misal saat sedang edit diri sendiri)
 * 3. Prioritas 1: Duplikat PASTI jika bukti_hash sama persis
 * 4. Prioritas 2: Duplikat KEMUNGKINAN jika tanggal_transaksi sama dan jumlah sama
 */
export function evaluasiDuplikatPengajuan(
  candidates: PengajuanDuplikatItem[],
  params: CekDuplikatPengajuanParams
): HasilCekDuplikatPengajuan {
  const { buktiHash, pengajuId, tanggalTransaksi, jumlah, excludeId } = params;

  // Saring calon: status bukan 'ditolak', bukan excludeId, dan milik pengaju yang sama bila ada pengaju_id
  const activeCandidates = candidates.filter((item) => {
    if (item.status === "ditolak") return false;
    if (excludeId !== undefined && excludeId !== null && item.id === excludeId) return false;
    if (item.pengaju_id && item.pengaju_id !== pengajuId) return false;
    return true;
  });

  // 1. Evaluasi Duplikat PASTI (Hash berkas sama)
  if (buktiHash && buktiHash.trim().length > 0) {
    const cleanHash = buktiHash.trim().toLowerCase();
    const hashMatch = activeCandidates.find(
      (item) => item.bukti_hash && item.bukti_hash.trim().toLowerCase() === cleanHash
    );

    if (hashMatch) {
      return {
        isDuplikat: true,
        jenisKecocokan: "pasti",
        pengajuan: {
          id: hashMatch.id,
          nomor: hashMatch.nomor,
          status: hashMatch.status,
          tanggal_transaksi: hashMatch.tanggal_transaksi,
          jumlah: hashMatch.jumlah,
          keterangan: hashMatch.keterangan,
        },
        pesanPeringatan: formatPeringatanDuplikat("pasti", hashMatch),
      };
    }
  }

  // 2. Evaluasi Duplikat KEMUNGKINAN (Tanggal sama + Jumlah sama)
  if (tanggalTransaksi && typeof jumlah === "number" && jumlah > 0) {
    const simMatch = activeCandidates.find(
      (item) => item.tanggal_transaksi === tanggalTransaksi && item.jumlah === jumlah
    );

    if (simMatch) {
      return {
        isDuplikat: true,
        jenisKecocokan: "kemungkinan",
        pengajuan: {
          id: simMatch.id,
          nomor: simMatch.nomor,
          status: simMatch.status,
          tanggal_transaksi: simMatch.tanggal_transaksi,
          jumlah: simMatch.jumlah,
          keterangan: simMatch.keterangan,
        },
        pesanPeringatan: formatPeringatanDuplikat("kemungkinan", simMatch),
      };
    }
  }

  return {
    isDuplikat: false,
  };
}

/**
 * Menghitung hash SHA-256 dari buffer (kompatibel Browser Web Crypto API & Node.js Crypto)
 */
export async function hitungSha256Buffer(buffer: ArrayBuffer): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Node.js fallback untuk lingkungan unit test
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(Buffer.from(new Uint8Array(buffer))).digest("hex");
}

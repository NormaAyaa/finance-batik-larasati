import type { Database } from "@/types/database";

export type MutasiBankRow = Database["public"]["Tables"]["mutasi_bank"]["Row"];
export type MutasiBankInsert = Database["public"]["Tables"]["mutasi_bank"]["Insert"];

export interface AkunKasBankOption {
  id: number;
  kode: string;
  nama: string;
  is_kas_bank: boolean;
  aktif: boolean;
}

export interface AkunOption {
  id: number;
  kode: string;
  nama: string;
  tipe: string;
  saldo_normal: string;
  aktif: boolean;
}

export interface MutasiBankWithRelations extends MutasiBankRow {
  akun_bank?: {
    id: number;
    kode: string;
    nama: string;
  } | null;
  jurnal?: {
    id: number;
    nomor: string | null;
    status: string;
    tanggal: string;
    keterangan: string;
  } | null;
}

export interface ParsedCsvRow {
  barisKe: number;
  rawTanggal: string;
  rawDeskripsi: string;
  rawJumlah: string;
  rawSaldo: string;
  tanggal?: string;
  deskripsi?: string;
  jumlah?: number;
  saldo?: number | null;
  isValid: boolean;
  errors: string[];
  isDuplikatDb?: boolean;
  isKembarBerkas?: boolean;
  kembarDenganBaris?: number;
}

export interface CsvParseResult {
  totalBaris: number;
  barisValid: number;
  barisInvalid: number;
  barisKembarBerkas: number;
  barisDuplikatDb?: number;
  barisBaruSiapImpor?: number;
  baris: ParsedCsvRow[];
  globalError?: string;
}

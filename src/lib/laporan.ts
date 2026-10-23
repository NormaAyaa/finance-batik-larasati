import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TipeAkun, SaldoNormalAkun } from "@/types/database";

export interface LabaRugiAkun {
  akun_id: number;
  kode: string;
  nama: string;
  jumlah: number;
}

export interface LabaRugiData {
  dari: string;
  sampai: string;
  pendapatan: LabaRugiAkun[];
  total_pendapatan: number;
  beban: LabaRugiAkun[];
  total_beban: number;
  laba_rugi_bersih: number;
  is_rugi: boolean;
}

export interface NeracaAkun {
  akun_id: number;
  kode: string;
  nama: string;
  jumlah: number;
}

export interface NeracaData {
  tanggal: string;
  aset: NeracaAkun[];
  total_aset: number;
  kewajiban: NeracaAkun[];
  total_kewajiban: number;
  ekuitas: NeracaAkun[];
  total_ekuitas: number;
  laba_berjalan: number;
  total_pasiva: number;
  is_seimbang: boolean;
  selisih: number;
}

export interface NeracaSaldoAkun {
  akun_id: number;
  kode: string;
  nama: string;
  tipe: TipeAkun;
  saldo_normal: SaldoNormalAkun;
  saldo_debit: number;
  saldo_kredit: number;
}

export interface NeracaSaldoData {
  tanggal: string;
  baris: NeracaSaldoAkun[];
  total_debit: number;
  total_kredit: number;
  is_seimbang: boolean;
  selisih: number;
}

/**
 * Mendapatkan rentang tanggal default untuk Laba Rugi (awal bulan s.d. hari ini).
 */
export function getDefaultLabaRugiDates(): { dari: string; sampai: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return {
    dari: `${year}-${month}-01`,
    sampai: `${year}-${month}-${day}`,
  };
}

/**
 * Mendapatkan tanggal default untuk Neraca & Neraca Saldo (hari ini).
 */
export function getDefaultTanggal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Validasi rentang tanggal.
 * Aturan PRD: Tanggal "dari" tidak boleh lebih besar dari "sampai".
 */
export function validateDateRange(dari: string, sampai: string): { valid: boolean; error?: string } {
  if (!dari || !sampai) {
    return { valid: false, error: "Tanggal awal dan tanggal akhir wajib diisi." };
  }
  if (dari > sampai) {
    return { valid: false, error: "Tanggal 'Dari' tidak boleh lebih besar dari tanggal 'Sampai'." };
  }
  return { valid: true };
}

/**
 * Mengambil data Laporan Laba Rugi untuk rentang tanggal tertentu.
 * Menggunakan RPC mutasi_akun_rentang di Supabase.
 */
export async function getLabaRugiData(
  supabase: SupabaseClient<Database>,
  dari: string,
  sampai: string
): Promise<LabaRugiData> {
  const validation = validateDateRange(dari, sampai);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { data, error } = await supabase.rpc("mutasi_akun_rentang", {
    p_dari: dari,
    p_sampai: sampai,
  });

  if (error) {
    console.error("Gagal mengambil mutasi akun rentang:", error);
    throw new Error("Terjadi kendala saat memuat data laba rugi. Silakan coba kembali.");
  }

  const pendapatan: LabaRugiAkun[] = [];
  const beban: LabaRugiAkun[] = [];
  let total_pendapatan = 0;
  let total_beban = 0;

  for (const row of data || []) {
    const debit = Number(row.total_debit) || 0;
    const kredit = Number(row.total_kredit) || 0;

    if (row.tipe === "pendapatan") {
      // Saldo normal kredit: kredit - debit
      const jumlah = kredit - debit;
      if (jumlah !== 0) {
        pendapatan.push({
          akun_id: Number(row.akun_id),
          kode: row.kode,
          nama: row.nama,
          jumlah,
        });
      }
      total_pendapatan += jumlah;
    } else if (row.tipe === "beban") {
      // Saldo normal debit: debit - kredit
      const jumlah = debit - kredit;
      if (jumlah !== 0) {
        beban.push({
          akun_id: Number(row.akun_id),
          kode: row.kode,
          nama: row.nama,
          jumlah,
        });
      }
      total_beban += jumlah;
    }
  }

  // Urutkan akun berdasarkan kode menaik
  pendapatan.sort((a, b) => a.kode.localeCompare(b.kode));
  beban.sort((a, b) => a.kode.localeCompare(b.kode));

  const laba_rugi_bersih = total_pendapatan - total_beban;
  const is_rugi = laba_rugi_bersih < 0;

  return {
    dari,
    sampai,
    pendapatan,
    total_pendapatan,
    beban,
    total_beban,
    laba_rugi_bersih,
    is_rugi,
  };
}

/**
 * Mengambil data Laporan Neraca per tanggal tertentu.
 * Menggunakan RPC saldo_akun_per_tanggal di Supabase.
 */
export async function getNeracaData(
  supabase: SupabaseClient<Database>,
  tanggal: string
): Promise<NeracaData> {
  if (!tanggal) {
    throw new Error("Tanggal neraca wajib dipilih.");
  }

  const { data, error } = await supabase.rpc("saldo_akun_per_tanggal", {
    p_sampai: tanggal,
  });

  if (error) {
    console.error("Gagal mengambil saldo akun per tanggal:", error);
    throw new Error("Terjadi kendala saat memuat data neraca. Silakan coba kembali.");
  }

  const aset: NeracaAkun[] = [];
  const kewajiban: NeracaAkun[] = [];
  const ekuitas: NeracaAkun[] = [];

  let total_aset = 0;
  let total_kewajiban = 0;
  let total_ekuitas = 0;
  let kumulatif_pendapatan = 0;
  let kumulatif_beban = 0;

  for (const row of data || []) {
    const debit = Number(row.total_debit) || 0;
    const kredit = Number(row.total_kredit) || 0;

    if (row.tipe === "aset") {
      // Saldo normal debit: debit - kredit
      const jumlah = debit - kredit;
      if (jumlah !== 0) {
        aset.push({
          akun_id: Number(row.akun_id),
          kode: row.kode,
          nama: row.nama,
          jumlah,
        });
      }
      total_aset += jumlah;
    } else if (row.tipe === "kewajiban") {
      // Saldo normal kredit: kredit - debit
      const jumlah = kredit - debit;
      if (jumlah !== 0) {
        kewajiban.push({
          akun_id: Number(row.akun_id),
          kode: row.kode,
          nama: row.nama,
          jumlah,
        });
      }
      total_kewajiban += jumlah;
    } else if (row.tipe === "ekuitas") {
      // Saldo normal kredit: kredit - debit
      const jumlah = kredit - debit;
      if (jumlah !== 0) {
        ekuitas.push({
          akun_id: Number(row.akun_id),
          kode: row.kode,
          nama: row.nama,
          jumlah,
        });
      }
      total_ekuitas += jumlah;
    } else if (row.tipe === "pendapatan") {
      kumulatif_pendapatan += (kredit - debit);
    } else if (row.tipe === "beban") {
      kumulatif_beban += (debit - kredit);
    }
  }

  // Urutkan akun berdasarkan kode menaik
  aset.sort((a, b) => a.kode.localeCompare(b.kode));
  kewajiban.sort((a, b) => a.kode.localeCompare(b.kode));
  ekuitas.sort((a, b) => a.kode.localeCompare(b.kode));

  // Laba (rugi) berjalan = total pendapatan - total beban sejak awal data sampai tanggal itu
  const laba_berjalan = kumulatif_pendapatan - kumulatif_beban;
  const total_pasiva = total_kewajiban + total_ekuitas + laba_berjalan;
  const selisih = total_aset - total_pasiva;
  const is_seimbang = selisih === 0;

  return {
    tanggal,
    aset,
    total_aset,
    kewajiban,
    total_kewajiban,
    ekuitas,
    total_ekuitas,
    laba_berjalan,
    total_pasiva,
    is_seimbang,
    selisih,
  };
}

/**
 * Mengambil data Neraca Saldo per tanggal tertentu.
 * Menggunakan RPC saldo_akun_per_tanggal di Supabase.
 * Menampilkan SELURUH akun (termasuk yang bersaldo 0 sesuai aturan PRD).
 */
export async function getNeracaSaldoData(
  supabase: SupabaseClient<Database>,
  tanggal: string
): Promise<NeracaSaldoData> {
  if (!tanggal) {
    throw new Error("Tanggal neraca saldo wajib dipilih.");
  }

  const { data, error } = await supabase.rpc("saldo_akun_per_tanggal", {
    p_sampai: tanggal,
  });

  if (error) {
    console.error("Gagal mengambil saldo akun untuk neraca saldo:", error);
    throw new Error("Terjadi kendala saat memuat data neraca saldo. Silakan coba kembali.");
  }

  const baris: NeracaSaldoAkun[] = [];
  let total_debit = 0;
  let total_kredit = 0;

  for (const row of data || []) {
    const debit = Number(row.total_debit) || 0;
    const kredit = Number(row.total_kredit) || 0;

    // Posisi saldo akun: satu sisi saja sesuai posisi saldo neto
    const net = debit - kredit;
    let saldo_debit = 0;
    let saldo_kredit = 0;

    if (net > 0) {
      saldo_debit = net;
    } else if (net < 0) {
      saldo_kredit = Math.abs(net);
    }

    baris.push({
      akun_id: Number(row.akun_id),
      kode: row.kode,
      nama: row.nama,
      tipe: row.tipe,
      saldo_normal: row.saldo_normal,
      saldo_debit,
      saldo_kredit,
    });

    total_debit += saldo_debit;
    total_kredit += saldo_kredit;
  }

  baris.sort((a, b) => a.kode.localeCompare(b.kode));

  const selisih = Math.abs(total_debit - total_kredit);
  const is_seimbang = selisih === 0;

  return {
    tanggal,
    baris,
    total_debit,
    total_kredit,
    is_seimbang,
    selisih,
  };
}

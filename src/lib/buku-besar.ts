import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TipeAkun, SaldoNormalAkun, StatusJurnal } from "@/types/database";

export const CHUNK_SIZE = 1000;

export interface AkunOption {
  id: number;
  kode: string;
  nama: string;
  tipe: TipeAkun;
  saldo_normal: SaldoNormalAkun;
  is_kas_bank: boolean;
  aktif: boolean;
  has_history: boolean;
}

export interface MutasiBukuBesarItem {
  id: number;
  urutan: number;
  tanggal: string;
  jurnal_id: number;
  jurnal_nomor: string | null;
  jurnal_status: StatusJurnal;
  keterangan: string;
  debit: number;
  kredit: number;
  saldo_berjalan: number;
}

export interface BukuBesarData {
  akun: AkunOption | null;
  tanggal_dari: string;
  tanggal_sampai: string;
  saldo_awal: number;
  mutasi: MutasiBukuBesarItem[];
  total_debit: number;
  total_kredit: number;
  saldo_akhir: number;
  total_baris: number;
}

interface RawLineItem {
  id: number;
  urutan: number;
  debit: number;
  kredit: number;
  keterangan: string | null;
  jurnal: {
    id: number;
    nomor: string | null;
    tanggal: string;
    keterangan: string;
    status: StatusJurnal;
  };
}

/**
 * Mendapatkan rentang tanggal default (awal bulan berjalan hingga hari ini dalam format YYYY-MM-DD).
 */
export function getDefaultDateRange(): { dari: string; sampai: string } {
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
 * Mengambil daftar seluruh akun yang memenuhi syarat Buku Besar:
 * - Semua akun aktif (aktif = true)
 * - Akun nonaktif (aktif = false) HANYA jika memiliki riwayat mutasi di jurnal_baris
 * - Diurutkan berdasarkan kode akun menaik
 * - Melakukan paginasi berulang dengan .range() jika jurnal_baris melebihi batas 1.000 baris
 */
export async function getDaftarAkunBukuBesar(
  supabase: SupabaseClient<Database>
): Promise<AkunOption[]> {
  // 1. Ambil semua akun
  const { data: allAccounts, error: accError } = await supabase
    .from("akun")
    .select("id, kode, nama, tipe, saldo_normal, is_kas_bank, aktif")
    .order("kode", { ascending: true });

  if (accError || !allAccounts) {
    console.error("Gagal mengambil daftar akun:", accError);
    return [];
  }

  // 2. Ambil id akun yang pernah tercatat di jurnal_baris untuk menyaring akun nonaktif.
  // Dilakukan berulang dengan .range() sampai habis agar tidak terpotong batas 1.000 baris.
  const usedAccountIds = new Set<number>();
  let pageUsed = 0;
  while (true) {
    const from = pageUsed * CHUNK_SIZE;
    const to = from + CHUNK_SIZE - 1;

    const { data: usedLines, error: usedError } = await supabase
      .from("jurnal_baris")
      .select("akun_id")
      .order("id", { ascending: true })
      .range(from, to);

    if (usedError) {
      console.error("Gagal memeriksa riwayat pemakaian akun:", usedError);
      break;
    }

    if (!usedLines || usedLines.length === 0) break;

    for (const l of usedLines) {
      usedAccountIds.add(l.akun_id);
    }

    if (usedLines.length < CHUNK_SIZE) break;
    pageUsed++;
  }

  // 3. Saring: akun aktif ATAU akun yang punya riwayat
  return allAccounts
    .filter((a) => a.aktif || usedAccountIds.has(a.id))
    .map((a) => ({
      id: a.id,
      kode: a.kode,
      nama: a.nama,
      tipe: a.tipe,
      saldo_normal: a.saldo_normal,
      is_kas_bank: a.is_kas_bank,
      aktif: a.aktif,
      has_history: usedAccountIds.has(a.id),
    }));
}

/**
 * Mengambil data Buku Besar lengkap untuk satu akun dalam rentang tanggal:
 * - Menghitung saldo awal (total mutasi sebelum tanggal 'dari')
 * - Mengambil mutasi dalam rentang tanggal [dari, sampai] dengan status diposting & dibalik
 * - Menangani batas bawaan Supabase/PostgREST 1.000 baris per permintaan secara aman menggunakan .range()
 *   dengan urutan stabil (tanggal, nomor jurnal, urutan baris, id) sehingga tidak ada data terlewat/ganda.
 * - Menghitung saldo berjalan per baris secara berurutan sesuai saldo normal akun:
 *     * Aset & Beban (saldo normal debit): Saldo = Saldo + (Debit - Kredit)
 *     * Kewajiban, Ekuitas & Pendapatan (saldo normal kredit): Saldo = Saldo + (Kredit - Debit)
 * - Menghitung total debit, total kredit, dan saldo akhir
 */
export async function getBukuBesarData(
  supabase: SupabaseClient<Database>,
  params: {
    akunId: number;
    dari: string;
    sampai: string;
  }
): Promise<BukuBesarData> {
  const { akunId, dari, sampai } = params;

  // 1. Ambil informasi akun
  const { data: rawAkun, error: akunError } = await supabase
    .from("akun")
    .select("id, kode, nama, tipe, saldo_normal, is_kas_bank, aktif")
    .eq("id", akunId)
    .single();

  if (akunError || !rawAkun) {
    throw new Error(akunError ? akunError.message : "Akun tidak ditemukan");
  }

  const akun: AkunOption = {
    id: rawAkun.id,
    kode: rawAkun.kode,
    nama: rawAkun.nama,
    tipe: rawAkun.tipe,
    saldo_normal: rawAkun.saldo_normal,
    is_kas_bank: rawAkun.is_kas_bank,
    aktif: rawAkun.aktif,
    has_history: true,
  };

  const isDebitNormal = akun.saldo_normal === "debit";

  // 2. Hitung Saldo Awal (mutasi sebelum tanggal 'dari')
  // Hanya jurnal berstatus 'diposting' dan 'dibalik' (jurnal draf tidak diikutsertakan).
  // Diambil berulang dengan .range() sampai habis dengan urutan stabil (tanggal, nomor, urutan, id).
  let saldoAwal = 0;
  let pagePrior = 0;
  while (true) {
    const from = pagePrior * CHUNK_SIZE;
    const to = from + CHUNK_SIZE - 1;

    const { data: priorLines, error: priorError } = await supabase
      .from("jurnal_baris")
      .select(`
        id,
        urutan,
        debit,
        kredit,
        jurnal!inner (
          id,
          nomor,
          tanggal,
          status
        )
      `)
      .eq("akun_id", akunId)
      .lt("jurnal.tanggal", dari)
      .in("jurnal.status", ["diposting", "dibalik"])
      .order("tanggal", { referencedTable: "jurnal", ascending: true })
      .order("nomor", { referencedTable: "jurnal", ascending: true })
      .order("urutan", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (priorError) {
      console.error("Gagal menghitung saldo awal:", priorError);
      throw new Error(`Gagal mengambil saldo awal: ${priorError.message}`);
    }

    if (!priorLines || priorLines.length === 0) break;

    for (const row of priorLines) {
      const d = Number(row.debit) || 0;
      const k = Number(row.kredit) || 0;
      if (isDebitNormal) {
        saldoAwal += d - k;
      } else {
        saldoAwal += k - d;
      }
    }

    if (priorLines.length < CHUNK_SIZE) break;
    pagePrior++;
  }

  // 3. Ambil seluruh mutasi dalam rentang [dari, sampai] berulang dengan .range() sampai habis
  // Urutan stabil pada kueri: tanggal, nomor jurnal, urutan baris, id
  const allRangeLines: RawLineItem[] = [];
  let pageRange = 0;
  while (true) {
    const from = pageRange * CHUNK_SIZE;
    const to = from + CHUNK_SIZE - 1;

    const { data: rangeLines, error: rangeError } = await supabase
      .from("jurnal_baris")
      .select(`
        id,
        urutan,
        debit,
        kredit,
        keterangan,
        jurnal!inner (
          id,
          nomor,
          tanggal,
          keterangan,
          status
        )
      `)
      .eq("akun_id", akunId)
      .gte("jurnal.tanggal", dari)
      .lte("jurnal.tanggal", sampai)
      .in("jurnal.status", ["diposting", "dibalik"])
      .order("tanggal", { referencedTable: "jurnal", ascending: true })
      .order("nomor", { referencedTable: "jurnal", ascending: true })
      .order("urutan", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (rangeError) {
      console.error("Gagal mengambil mutasi buku besar:", rangeError);
      throw new Error(`Gagal mengambil mutasi buku besar: ${rangeError.message}`);
    }

    if (!rangeLines || rangeLines.length === 0) break;

    allRangeLines.push(...(rangeLines as unknown as RawLineItem[]));

    if (rangeLines.length < CHUNK_SIZE) break;
    pageRange++;
  }

  // 4. Urutkan mutasi secara stabil: tanggal ASC, nomor jurnal ASC, urutan baris ASC, id ASC
  const sortedLines = allRangeLines.sort((a, b) => {
    // 1) Urut tanggal transaksi
    if (a.jurnal.tanggal !== b.jurnal.tanggal) {
      return a.jurnal.tanggal.localeCompare(b.jurnal.tanggal);
    }
    // 2) Urut nomor dokumen jurnal
    const noA = a.jurnal.nomor || "";
    const noB = b.jurnal.nomor || "";
    if (noA !== noB) {
      return noA.localeCompare(noB);
    }
    // 3) Urut nomor baris jurnal
    if (a.urutan !== b.urutan) {
      return a.urutan - b.urutan;
    }
    // 4) Urut ID baris sebagai tie-breaker penentu
    return a.id - b.id;
  });

  // 5. Hitung saldo berjalan secara kumulatif dan kumpulkan total
  let runningBalance = saldoAwal;
  let totalDebit = 0;
  let totalKredit = 0;

  const mutasi: MutasiBukuBesarItem[] = sortedLines.map((row) => {
    const debit = Number(row.debit) || 0;
    const kredit = Number(row.kredit) || 0;

    totalDebit += debit;
    totalKredit += kredit;

    if (isDebitNormal) {
      runningBalance += debit - kredit;
    } else {
      runningBalance += kredit - debit;
    }

    return {
      id: row.id,
      urutan: row.urutan,
      tanggal: row.jurnal.tanggal,
      jurnal_id: row.jurnal.id,
      jurnal_nomor: row.jurnal.nomor,
      jurnal_status: row.jurnal.status,
      keterangan: row.keterangan?.trim() || row.jurnal.keterangan,
      debit,
      kredit,
      saldo_berjalan: runningBalance,
    };
  });

  return {
    akun,
    tanggal_dari: dari,
    tanggal_sampai: sampai,
    saldo_awal: saldoAwal,
    mutasi,
    total_debit: totalDebit,
    total_kredit: totalKredit,
    saldo_akhir: runningBalance,
    total_baris: mutasi.length,
  };
}

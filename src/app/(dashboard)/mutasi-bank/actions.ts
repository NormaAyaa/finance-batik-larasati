"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseMutasiBankCsv, MAX_FILE_SIZE_BYTES } from "@/lib/mutasi-bank/csv-parser";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";

export interface ImporMutasiActionResult {
  success: boolean;
  message: string;
  baru?: number;
  duplikat?: number;
  errors?: string[];
}

/**
 * Server Action: Parsing berkas CSV mutasi bank di sisi server dan menyimpannya secara atomik.
 * Aturan:
 * 1. Memeriksa sesi dan hak peran Akuntan aktif.
 * 2. Validasi berkas CSV (maksimal 1 MB dan 1.000 baris data).
 * 3. Prinsip SEMUA ATAU TIDAK SAMA SEKALI: bila ada satu baris cacat, batalkan seluruh impor.
 * 4. Memanggil RPC impor_mutasi_bank dengan ON CONFLICT DO NOTHING.
 * 5. Mengembalikan pesan sukses format: "N baris baru, M duplikat dilewati".
 */
export async function imporMutasiBankAction(
  formData: FormData
): Promise<ImporMutasiActionResult> {
  // 1. Verifikasi Sesi dan Peran Pengguna di Sisi Server
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      message: "Akses ditolak: Pengguna belum terautentikasi. Silakan login kembali.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("peran, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.aktif) {
    return {
      success: false,
      message: "Akun pengguna tidak aktif atau tidak ditemukan.",
    };
  }

  if (profile.peran !== "akuntan") {
    return {
      success: false,
      message: "Akses ditolak: Hanya pengguna dengan peran Akuntan yang berwenang mengimpor mutasi bank.",
    };
  }

  // 2. Ambil dan Validasi Input Parameter
  const akunBankIdRaw = formData.get("akun_bank_id");
  const file = formData.get("file") as File | null;

  if (!akunBankIdRaw) {
    return {
      success: false,
      message: "Akun kas/bank wajib dipilih.",
    };
  }

  const akunBankId = parseInt(String(akunBankIdRaw), 10);
  if (isNaN(akunBankId) || akunBankId <= 0) {
    return {
      success: false,
      message: "Akun kas/bank yang dipilih tidak valid.",
    };
  }

  // Verifikasi akun adalah kas/bank aktif
  const { data: akunData, error: akunErr } = await supabase
    .from("akun")
    .select("id, kode, nama, is_kas_bank, aktif")
    .eq("id", akunBankId)
    .maybeSingle();

  if (akunErr || !akunData) {
    return {
      success: false,
      message: "Akun kas/bank yang dipilih tidak ditemukan di sistem.",
    };
  }

  if (!akunData.is_kas_bank || !akunData.aktif) {
    return {
      success: false,
      message: `Akun "${akunData.nama}" bukan akun kas/bank aktif.`,
    };
  }

  if (!file || typeof file.text !== "function") {
    return {
      success: false,
      message: "Berkas CSV wajib diunggah.",
    };
  }

  // Validasi ekstensi .csv
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return {
      success: false,
      message: "Format berkas tidak valid. Hanya berkas berekstensi .csv yang diperbolehkan.",
    };
  }

  // Validasi batas ukuran berkas 1 MB
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      message: `Ukuran berkas (${(file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas maksimal 1 MB.`,
    };
  }

  // 3. Baca dan Parsing Konten CSV di Sisi Server
  let csvText: string;
  try {
    csvText = await file.text();
  } catch (readErr) {
    console.error("Gagal membaca berkas CSV di server:", readErr);
    return {
      success: false,
      message: "Gagal membaca isi berkas CSV. Pastikan berkas berformat teks UTF-8.",
    };
  }

  const parseResult = parseMutasiBankCsv(csvText);

  // 4. Semua atau Tidak Sama Sekali: Cek Error Global atau Baris Cacat
  if (parseResult.globalError || parseResult.barisInvalid > 0) {
    const errorList = parseResult.baris
      .filter((r) => !r.isValid)
      .map((r) => `Baris ${r.barisKe}: ${r.errors.join("; ")}`);

    return {
      success: false,
      message:
        parseResult.globalError ||
        `Terdapat ${parseResult.barisInvalid} baris data cacat. Seluruh proses impor dibatalkan (Semua atau Tidak Sama Sekali).`,
      errors: errorList,
    };
  }

  if (parseResult.baris.length === 0) {
    return {
      success: false,
      message: "Berkas CSV tidak memuat baris transaksi untuk diimpor.",
    };
  }

  // 5. Siapkan Baris Valid untuk Disimpan via RPC
  const payload = parseResult.baris.map((r) => ({
    tanggal: r.tanggal!,
    deskripsi: r.deskripsi!,
    jumlah: r.jumlah!,
    saldo: r.saldo ?? null,
  }));

  try {
    const { data, error: rpcError } = await supabase.rpc("impor_mutasi_bank", {
      p_akun_bank_id: akunBankId,
      p_nama_file: file.name,
      p_baris: payload,
    });

    if (rpcError) {
      console.error("RPC impor_mutasi_bank gagal:", rpcError);
      return {
        success: false,
        message: getFriendlyErrorMessage(rpcError),
      };
    }

    const baru = data?.baru ?? 0;
    const duplikat = data?.duplikat ?? 0;

    // Refresh halaman agar data mutasi terbaru langsung muncul
    revalidatePath("/mutasi-bank");

    return {
      success: true,
      baru,
      duplikat,
      message: `${baru} baris baru, ${duplikat} duplikat dilewati`,
    };
  } catch (err) {
    console.error("Kesalahan tak terduga saat impor mutasi bank:", err);
    return {
      success: false,
      message: getFriendlyErrorMessage(err),
    };
  }
}

export interface CekDuplikatItem {
  barisKe: number;
  tanggal: string;
  deskripsi: string;
  jumlah: number;
  saldo: number | null;
}

export interface CekDuplikatResult {
  success: boolean;
  duplikatBarisKe: number[];
  error?: string;
}

/**
 * Server Action: Memeriksa apakah baris-baris transaksi CSV sudah ada di database mutasi_bank untuk akun kas/bank terpilih.
 * Menggunakan konteks otentikasi sesi Akuntan yang sedang login.
 */
export async function cekDuplikatMutasiDbAction(
  akunBankId: number,
  items: CekDuplikatItem[]
): Promise<CekDuplikatResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, duplikatBarisKe: [], error: "Belum login." };
  }

  if (!items || items.length === 0 || !akunBankId) {
    return { success: true, duplikatBarisKe: [] };
  }

  const dates = Array.from(new Set(items.map((it) => it.tanggal)));

  const { data: existing, error: dbError } = await supabase
    .from("mutasi_bank")
    .select("tanggal, deskripsi, jumlah, saldo")
    .eq("akun_bank_id", akunBankId)
    .in("tanggal", dates);

  if (dbError) {
    console.error("Gagal memeriksa duplikat database:", dbError);
    return { success: false, duplikatBarisKe: [], error: dbError.message };
  }

  if (!existing || existing.length === 0) {
    return { success: true, duplikatBarisKe: [] };
  }

  // Buat lookup set dari baris database
  const existingSet = new Set(
    existing.map((e) => {
      const s = e.saldo === null || e.saldo === undefined ? "NULL" : String(e.saldo);
      return `${e.tanggal}|${e.deskripsi.trim().toLowerCase()}|${e.jumlah}|${s}`;
    })
  );

  const duplikatBarisKe: number[] = [];
  for (const item of items) {
    const s = item.saldo === null || item.saldo === undefined ? "NULL" : String(item.saldo);
    const key = `${item.tanggal}|${item.deskripsi.trim().toLowerCase()}|${item.jumlah}|${s}`;
    if (existingSet.has(key)) {
      duplikatBarisKe.push(item.barisKe);
    }
  }

  return { success: true, duplikatBarisKe };
}

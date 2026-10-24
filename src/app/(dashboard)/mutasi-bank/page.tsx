import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MutasiBankView } from "@/components/mutasi-bank/mutasi-bank-view";
import type {
  MutasiBankWithRelations,
  AkunKasBankOption,
  AkunOption,
} from "@/lib/mutasi-bank/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mutasi Bank",
  description:
    "Impor CSV mutasi rekening bank dan pembuatan draf jurnal umum CV Batik Larasati (PRD Bagian 11 & BR-11)",
};

export default async function MutasiBankPage() {
  // 1. Guard autentikasi dan peran:
  // - Pengunjung diarahkan ke /login
  // - Staf diarahkan ke /dashboard
  // - Akuntan & Direktur diizinkan (Direktur hanya membaca)
  const { profile } = await requireAuth(["akuntan", "direktur"]);

  // 2. Client Supabase pengguna login (anon key + sesi cookie, bukan service role)
  // Menjamin aturan RLS berlaku di level database
  const supabase = await createClient();

  // 3. Ambil daftar akun kas atau bank yang aktif (is_kas_bank = true)
  const { data: rawKasBank, error: kasBankErr } = await supabase
    .from("akun")
    .select("id, kode, nama, is_kas_bank, aktif")
    .eq("is_kas_bank", true)
    .eq("aktif", true)
    .order("kode", { ascending: true });

  if (kasBankErr) {
    console.error("Gagal mengambil akun kas/bank:", kasBankErr);
  }

  // 4. Ambil seluruh akun aktif untuk opsi akun lawan jurnal
  const { data: rawAllAkun, error: allAkunErr } = await supabase
    .from("akun")
    .select("id, kode, nama, tipe, saldo_normal, aktif")
    .eq("aktif", true)
    .order("kode", { ascending: true });

  if (allAkunErr) {
    console.error("Gagal mengambil daftar seluruh akun:", allAkunErr);
  }

  // 5. Ambil data rekaman mutasi bank beserta relasi akun dan jurnal
  // Menggunakan safe handling jika tabel mutasi_bank belum dibuat di remote database
  let initialMutasi: MutasiBankWithRelations[] = [];
  try {
    const { data: rawMutasi, error: mutasiErr } = await supabase
      .from("mutasi_bank")
      .select(
        `
        *,
        akun_bank:akun!mutasi_bank_akun_bank_id_fkey(id, kode, nama),
        jurnal:jurnal!mutasi_bank_jurnal_id_fkey(id, nomor, status, tanggal, keterangan)
      `
      )
      .order("tanggal", { ascending: false })
      .order("id", { ascending: false });

    if (mutasiErr) {
      console.warn("Tabel mutasi_bank belum terbaca atau belum ada data:", mutasiErr.message);
    } else if (rawMutasi) {
      initialMutasi = rawMutasi as unknown as MutasiBankWithRelations[];
    }
  } catch (err) {
    console.warn("Query mutasi_bank gagal:", err);
  }

  const akunKasBankList: AkunKasBankOption[] = (rawKasBank || []).map((a) => ({
    id: a.id,
    kode: a.kode,
    nama: a.nama,
    is_kas_bank: a.is_kas_bank,
    aktif: a.aktif,
  }));

  const allAkunList: AkunOption[] = (rawAllAkun || []).map((a) => ({
    id: a.id,
    kode: a.kode,
    nama: a.nama,
    tipe: a.tipe,
    saldo_normal: a.saldo_normal,
    aktif: a.aktif,
  }));

  return (
    <MutasiBankView
      initialMutasi={initialMutasi}
      akunKasBankList={akunKasBankList}
      allAkunList={allAkunList}
      currentRole={profile.peran}
    />
  );
}

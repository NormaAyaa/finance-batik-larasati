import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getDaftarAkunBukuBesar,
  getBukuBesarData,
  getDefaultDateRange,
  type BukuBesarData,
} from "@/lib/buku-besar";
import { BukuBesarView } from "@/components/buku-besar/buku-besar-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buku Besar",
  description:
    "Mutasi debit/kredit dan pergerakan saldo berjalan per akun buku besar CV Batik Larasati (PRD Bagian 7 & BR-11)",
};

interface PageProps {
  searchParams: Promise<{
    akun?: string;
    dari?: string;
    sampai?: string;
  }>;
}

export default async function BukuBesarPage({ searchParams }: PageProps) {
  // 1. Guard autentikasi: Hanya Akuntan dan Direktur (PRD Bagian 7 & BR-11).
  // Staf & pengunjung tanpa hak akses otomatis diarahkan ke /dashboard oleh requireAuth.
  await requireAuth(["akuntan", "direktur"]);

  // 2. Client Supabase pengguna login (anon key + sesi cookie) -> RLS wajib berlaku
  const supabase = await createClient();

  // 3. Baca parameter URL
  const params = await searchParams;
  const defaultDates = getDefaultDateRange();
  const tanggalDari = params.dari || defaultDates.dari;
  const tanggalSampai = params.sampai || defaultDates.sampai;

  // 4. Ambil daftar seluruh akun (termasuk nonaktif bila memiliki riwayat)
  const daftarAkun = await getDaftarAkunBukuBesar(supabase);

  // Tentukan akun terpilih (default: akun pertama dalam daftar jika tidak ada di query)
  let selectedAkunId = params.akun ? Number(params.akun) : 0;
  if (!selectedAkunId || !daftarAkun.some((a) => a.id === selectedAkunId)) {
    selectedAkunId = daftarAkun.length > 0 ? daftarAkun[0].id : 0;
  }

  // 5. Ambil data mutasi dan hitung saldo jika ada akun terpilih
  let bukuBesarData: BukuBesarData | null = null;
  let errorMessage: string | null = null;

  if (selectedAkunId > 0) {
    try {
      bukuBesarData = await getBukuBesarData(supabase, {
        akunId: selectedAkunId,
        dari: tanggalDari,
        sampai: tanggalSampai,
      });
    } catch (err) {
      console.error("Gagal mengambil data buku besar:", err);
      errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan saat memuat data.";
    }
  }

  return (
    <BukuBesarView
      daftarAkun={daftarAkun}
      selectedAkunId={selectedAkunId}
      tanggalDari={tanggalDari}
      tanggalSampai={tanggalSampai}
      data={bukuBesarData}
      errorMessage={errorMessage}
    />
  );
}

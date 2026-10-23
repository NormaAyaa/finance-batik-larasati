import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getNeracaSaldoData,
  getDefaultTanggal,
  type NeracaSaldoData,
} from "@/lib/laporan";
import { NeracaSaldoView } from "@/components/laporan/neraca-saldo-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Neraca Saldo",
  description:
    "Daftar saldo debit dan kredit seluruh akun CV Batik Larasati (PRD Bagian 7 & BR-11)",
};

interface PageProps {
  searchParams: Promise<{
    tanggal?: string;
  }>;
}

export default async function NeracaSaldoPage({ searchParams }: PageProps) {
  // 1. Guard autentikasi: Hanya Akuntan dan Direktur (PRD Bagian 7 & BR-11).
  // Staf & pengunjung tanpa hak akses otomatis diarahkan ke /dashboard oleh requireAuth.
  await requireAuth(["akuntan", "direktur"]);

  // 2. Client Supabase pengguna login (anon key + sesi cookie) -> RLS wajib berlaku
  const supabase = await createClient();

  // 3. Baca parameter URL
  const params = await searchParams;
  const tanggal = params.tanggal || getDefaultTanggal();

  let data: NeracaSaldoData | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getNeracaSaldoData(supabase, tanggal);
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = "Terjadi kendala saat memuat neraca saldo.";
    }
  }

  return (
    <NeracaSaldoView
      data={data}
      errorMessage={errorMessage}
      initialTanggal={tanggal}
    />
  );
}

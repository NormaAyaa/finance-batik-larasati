import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getNeracaData,
  getDefaultTanggal,
  type NeracaData,
} from "@/lib/laporan";
import { NeracaView } from "@/components/laporan/neraca-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Laporan Neraca",
  description:
    "Laporan posisi keuangan aset, kewajiban, dan ekuitas CV Batik Larasati (PRD Bagian 7 & BR-11)",
};

interface PageProps {
  searchParams: Promise<{
    tanggal?: string;
  }>;
}

export default async function NeracaPage({ searchParams }: PageProps) {
  // 1. Guard autentikasi: Hanya Akuntan dan Direktur (PRD Bagian 7 & BR-11).
  // Staf & pengunjung tanpa hak akses otomatis diarahkan ke /dashboard oleh requireAuth.
  await requireAuth(["akuntan", "direktur"]);

  // 2. Client Supabase pengguna login (anon key + sesi cookie) -> RLS wajib berlaku
  const supabase = await createClient();

  // 3. Baca parameter URL
  const params = await searchParams;
  const tanggal = params.tanggal || getDefaultTanggal();

  let data: NeracaData | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getNeracaData(supabase, tanggal);
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = "Terjadi kendala saat memuat laporan neraca.";
    }
  }

  return (
    <NeracaView
      data={data}
      errorMessage={errorMessage}
      initialTanggal={tanggal}
    />
  );
}

import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  getLabaRugiData,
  getDefaultLabaRugiDates,
  type LabaRugiData,
} from "@/lib/laporan";
import { LabaRugiView } from "@/components/laporan/laba-rugi-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Laporan Laba Rugi",
  description:
    "Laporan pendapatan, beban, dan laba (rugi) bersih CV Batik Larasati (PRD Bagian 7 & BR-11)",
};

interface PageProps {
  searchParams: Promise<{
    dari?: string;
    sampai?: string;
  }>;
}

export default async function LabaRugiPage({ searchParams }: PageProps) {
  // 1. Guard autentikasi: Hanya Akuntan dan Direktur (PRD Bagian 7 & BR-11).
  // Staf & pengunjung tanpa hak akses otomatis diarahkan ke /dashboard oleh requireAuth.
  await requireAuth(["akuntan", "direktur"]);

  // 2. Client Supabase pengguna login (anon key + sesi cookie) -> RLS wajib berlaku
  const supabase = await createClient();

  // 3. Baca parameter URL
  const params = await searchParams;
  const defaultDates = getDefaultLabaRugiDates();
  const dari = params.dari || defaultDates.dari;
  const sampai = params.sampai || defaultDates.sampai;

  let data: LabaRugiData | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getLabaRugiData(supabase, dari, sampai);
  } catch (err: unknown) {
    if (err instanceof Error) {
      errorMessage = err.message;
    } else {
      errorMessage = "Terjadi kendala saat memuat laporan laba rugi.";
    }
  }

  return (
    <LabaRugiView
      data={data}
      errorMessage={errorMessage}
      initialDari={dari}
      initialSampai={sampai}
    />
  );
}

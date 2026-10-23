import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AkunPeriodeView } from "@/components/akun-periode/akun-periode-view";
import type { PeriodeWithProfile } from "@/components/akun-periode/daftar-periode";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bagan Akun & Periode Akuntansi",
  description:
    "Kelola Chart of Accounts (COA 4 digit) dan kontrol status tutup/buka periode bulanan CV Batik Larasati",
};

interface PageProps {
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function AkunPeriodePage({ searchParams }: PageProps) {
  // 1. Guard autentikasi: Hanya Akuntan dan Direktur yang memiliki akses (PRD Bagian 7)
  // Staf yang mencoba mengakses akan dialihkan ke /dashboard oleh requireAuth
  const { profile } = await requireAuth(["akuntan", "direktur"]);
  const params = await searchParams;

  const defaultTab = params.tab === "periode" ? "periode" : "akun";

  // 2. Client Supabase pengguna yang login (anon key + sesi cookie)
  // Memastikan aturan RLS berlaku
  const supabase = await createClient();

  // Ambil daftar akun diurutkan berdasarkan kode 4 digit (BR-01)
  const { data: rawAkun, error: akunError } = await supabase
    .from("akun")
    .select("*")
    .order("kode", { ascending: true });

  if (akunError) {
    console.error("Gagal mengambil data akun:", akunError);
  }

  // Ambil daftar periode bulanan beserta data operator yang menutup
  const { data: rawPeriode, error: periodeError } = await supabase
    .from("periode")
    .select(`
      id,
      tahun,
      bulan,
      tanggal_mulai,
      status,
      ditutup_oleh,
      ditutup_pada,
      alasan_buka_ulang,
      penutup:profiles!ditutup_oleh (
        id,
        nama_lengkap,
        email,
        peran
      )
    `)
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false });

  if (periodeError) {
    console.error("Gagal mengambil data periode:", periodeError);
  }

  const akunList = rawAkun || [];

  // Hitung jumlah jurnal draf per periode dengan head: true (tidak terpotong batas 1.000 baris Supabase)
  const periodeList: PeriodeWithProfile[] = await Promise.all(
    (rawPeriode || []).map(async (p) => {
      const { count } = await supabase
        .from("jurnal")
        .select("id", { count: "exact", head: true })
        .eq("periode_id", p.id)
        .eq("status", "draf");

      return {
        ...p,
        jumlah_draf: count ?? 0,
      } as unknown as PeriodeWithProfile;
    })
  );

  return (
    <AkunPeriodeView
      initialAkun={akunList}
      initialPeriode={periodeList}
      userRole={profile.peran as "akuntan" | "direktur"}
      activeTabDefault={defaultTab}
    />
  );
}

import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DaftarJurnal } from "@/components/jurnal/daftar-jurnal";
import type { JurnalListItem, PeriodeOption } from "@/components/jurnal/daftar-jurnal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jurnal Umum",
  description: "Daftar jurnal transaksi keuangan CV Batik Larasati per periode dengan kontrol posting & pembalik (BR-02 s.d. BR-05)",
};

export default async function JurnalPage() {
  // 1. Guard autentikasi: Hanya Akuntan dan Direktur yang berhak melihat daftar jurnal (PRD Bagian 7)
  const { profile } = await requireAuth(["akuntan", "direktur"]);

  // 2. Client Supabase pengguna login (anon key + sesi cookie) -> RLS aktif
  const supabase = await createClient();

  // 3. Ambil daftar jurnal diurutkan dari terbaru (tanggal DESC, id DESC)
  const { data: rawJurnal, error: jurnalError } = await supabase
    .from("jurnal")
    .select(`
      id,
      nomor,
      tanggal,
      keterangan,
      sumber,
      status,
      periode_id,
      periode:periode!periode_id (
        id,
        tahun,
        bulan,
        status
      ),
      jurnal_baris (
        debit,
        kredit
      )
    `)
    .order("tanggal", { ascending: false })
    .order("id", { ascending: false });

  if (jurnalError) {
    console.error("Gagal mengambil data jurnal:", jurnalError);
  }

  // 4. Ambil daftar periode untuk filter
  const { data: rawPeriode, error: periodeError } = await supabase
    .from("periode")
    .select("id, tahun, bulan, status")
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false });

  if (periodeError) {
    console.error("Gagal mengambil data periode:", periodeError);
  }

  // 5. Transformasi data dan hitung total nilai per jurnal (jumlah total debit)
  const daftarJurnal: JurnalListItem[] = (rawJurnal || []).map((j) => {
    const barisList = (j.jurnal_baris as unknown as { debit: number; kredit: number }[]) || [];
    const totalNilai = barisList.reduce((sum, b) => sum + (Number(b.debit) || 0), 0);

    return {
      id: j.id,
      nomor: j.nomor,
      tanggal: j.tanggal,
      keterangan: j.keterangan,
      sumber: j.sumber,
      status: j.status,
      periode_id: j.periode_id,
      periode: (j.periode as unknown as PeriodeOption) || null,
      total_nilai: totalNilai,
    };
  });

  const daftarPeriode: PeriodeOption[] = (rawPeriode || []).map((p) => ({
    id: p.id,
    tahun: p.tahun,
    bulan: p.bulan,
    status: p.status,
  }));

  return (
    <DaftarJurnal
      initialJurnal={daftarJurnal}
      daftarPeriode={daftarPeriode}
      peran={profile.peran}
    />
  );
}

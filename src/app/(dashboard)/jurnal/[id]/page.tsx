import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JurnalDetail } from "@/components/jurnal/jurnal-detail";
import type { JurnalDetailData, JurnalBarisItem } from "@/components/jurnal/jurnal-detail";
import type { AkunOption, PeriodeData } from "@/components/jurnal/jurnal-form";
import type { StatusPeriode, TipeAkun } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Jurnal Umum",
  description: "Rincian debit-kredit transaksi jurnal umum CV Batik Larasati",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailJurnalPage({ params }: PageProps) {
  // 1. Guard autentikasi: Akuntan dan Direktur berhak melihat detail jurnal (PRD Bagian 7)
  const { profile } = await requireAuth(["akuntan", "direktur"]);
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    notFound();
  }

  // 2. Client Supabase pengguna login (anon key + sesi cookie) -> RLS aktif
  const supabase = await createClient();

  // 3. Ambil data jurnal, baris akun, relasi pembuat, pemosting, periode, dan pengajuan
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
      pengajuan_id,
      pengajuan:pengajuan!pengajuan_id (
        id,
        nomor
      ),
      jurnal_dibalik_id,
      jurnal_dibalik:jurnal!jurnal_dibalik_id (
        id,
        nomor,
        tanggal
      ),
      dibuat_oleh,
      pembuat:profiles!dibuat_oleh (
        id,
        nama_lengkap,
        email,
        peran
      ),
      diposting_oleh,
      pemosting:profiles!diposting_oleh (
        id,
        nama_lengkap,
        email,
        peran
      ),
      diposting_pada,
      periode:periode!periode_id (
        id,
        tahun,
        bulan,
        status
      ),
      baris:jurnal_baris (
        id,
        urutan,
        akun_id,
        debit,
        kredit,
        keterangan,
        akun:akun!akun_id (
          id,
          kode,
          nama,
          tipe
        )
      )
    `)
    .eq("id", numericId)
    .maybeSingle();

  if (jurnalError || !rawJurnal) {
    console.error("Jurnal tidak ditemukan atau gagal diambil:", jurnalError);
    notFound();
  }

  // 4. Periksa apakah jurnal ini pernah dibalik oleh jurnal lain
  const { data: rawReversingJournal } = await supabase
    .from("jurnal")
    .select("id, nomor, tanggal")
    .eq("jurnal_dibalik_id", numericId)
    .maybeSingle();

  // 5. Ambil data akun aktif & periode untuk keperluan form ubah atau modal pembalik
  const { data: rawAkun } = await supabase
    .from("akun")
    .select("id, kode, nama, tipe, saldo_normal, aktif")
    .eq("aktif", true)
    .order("kode", { ascending: true });

  const { data: rawPeriode } = await supabase
    .from("periode")
    .select("id, tahun, bulan, status")
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false });

  // Urutkan baris berdasarkan kolom urutan ASC
  const rawBarisList = (rawJurnal.baris || []) as unknown as Array<{
    id: number;
    urutan: number;
    akun_id: number;
    debit: number;
    kredit: number;
    keterangan: string | null;
    akun: {
      id: number;
      kode: string;
      nama: string;
      tipe: TipeAkun;
    };
  }>;

  const sortedBaris: JurnalBarisItem[] = [...rawBarisList].sort(
    (a, b) => (a.urutan || 0) - (b.urutan || 0)
  );

  const jurnalDetailData: JurnalDetailData = {
    id: rawJurnal.id,
    nomor: rawJurnal.nomor,
    tanggal: rawJurnal.tanggal,
    keterangan: rawJurnal.keterangan,
    sumber: rawJurnal.sumber,
    status: rawJurnal.status,
    periode_id: rawJurnal.periode_id,
    pengajuan_id: rawJurnal.pengajuan_id,
    pengajuan: (rawJurnal.pengajuan as unknown as { id: number; nomor: string | null }) || null,
    jurnal_dibalik_id: rawJurnal.jurnal_dibalik_id,
    jurnal_dibalik: (rawJurnal.jurnal_dibalik as unknown as { id: number; nomor: string | null; tanggal: string }) || null,
    jurnal_pembalik: rawReversingJournal || null,
    dibuat_oleh: rawJurnal.dibuat_oleh,
    pembuat: (rawJurnal.pembuat as unknown as { id: string; nama_lengkap: string; email: string; peran: string }) || null,
    diposting_oleh: rawJurnal.diposting_oleh,
    pemosting: (rawJurnal.pemosting as unknown as { id: string; nama_lengkap: string; email: string; peran: string }) || null,
    diposting_pada: rawJurnal.diposting_pada,
    periode: (rawJurnal.periode as unknown as { id: number; tahun: number; bulan: number; status: StatusPeriode }) || null,
    baris: sortedBaris,
  };

  const daftarAkun: AkunOption[] = (rawAkun || []).map((a) => ({
    id: a.id,
    kode: a.kode,
    nama: a.nama,
    tipe: a.tipe,
    saldo_normal: a.saldo_normal as "debit" | "kredit",
    aktif: a.aktif,
  }));

  const daftarPeriode: PeriodeData[] = (rawPeriode || []).map((p) => ({
    id: p.id,
    tahun: p.tahun,
    bulan: p.bulan,
    status: p.status,
  }));

  return (
    <JurnalDetail
      jurnal={jurnalDetailData}
      daftarAkun={daftarAkun}
      daftarPeriode={daftarPeriode}
      peran={profile.peran}
      userId={profile.id}
    />
  );
}

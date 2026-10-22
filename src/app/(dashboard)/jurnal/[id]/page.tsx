import type { Metadata } from "next";
import Link from "next/link";
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

  // Next.js 16: params harus di-await sebelum dibaca
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId)) {
    notFound();
  }

  // 2. Client Supabase pengguna login (anon key + sesi cookie) -> RLS aktif
  const supabase = await createClient();

  // 3. Ambil data jurnal, baris akun, relasi pembuat, pemosting, periode, dan pengajuan
  // Catatan: Relasi self-referensial (jurnal_dibalik_id) tidak di-embed langsung pada select utama
  // untuk mencegah error schema cache PostgREST (PGRST200), melainkan diambil terpisah secara aman.
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

  // Pembedaan error: Jika query gagal (syntax/network/relasi), catat di server log dan tampilkan pesan ramah (bukan 404)
  if (jurnalError) {
    console.error("Gagal memuat data jurnal detail id", numericId, ":", jurnalError);
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-3 shadow-sm">
          <span className="text-3xl block">⚠️</span>
          <h1 className="text-base font-bold text-red-900">Kendala Memuat Data Jurnal</h1>
          <p className="text-xs text-red-700 max-w-md mx-auto">
            Terjadi kendala teknis saat memuat data jurnal #{numericId}. Silakan muat ulang halaman atau hubungi administrator.
          </p>
          <div className="pt-2">
            <Link
              href="/jurnal"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-red-800 text-white text-xs font-semibold hover:bg-red-900 transition"
            >
              ← Kembali ke Daftar Jurnal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Jika jurnal memang tidak ada atau tidak diizinkan oleh RLS, tampilkan 404 sesungguhnya
  if (!rawJurnal) {
    notFound();
  }

  // 4. Jika jurnal ini merupakan jurnal pembalik, ambil data jurnal asli yang dibalik secara terpisah
  let rawOriginalJournal: { id: number; nomor: string | null; tanggal: string } | null = null;
  if (rawJurnal.jurnal_dibalik_id) {
    const { data: orig, error: origError } = await supabase
      .from("jurnal")
      .select("id, nomor, tanggal")
      .eq("id", rawJurnal.jurnal_dibalik_id)
      .maybeSingle();

    if (origError) {
      console.error("Gagal mengambil data jurnal asal yang dibalik:", origError);
    } else {
      rawOriginalJournal = orig;
    }
  }

  // 5. Periksa apakah jurnal ini pernah dibalik oleh jurnal lain
  let rawReversingJournal: { id: number; nomor: string | null; tanggal: string } | null = null;
  const { data: rev, error: revError } = await supabase
    .from("jurnal")
    .select("id, nomor, tanggal")
    .eq("jurnal_dibalik_id", numericId)
    .maybeSingle();

  if (revError) {
    console.error("Gagal memeriksa jurnal pembalik:", revError);
  } else {
    rawReversingJournal = rev;
  }

  // 6. Ambil data akun aktif & periode untuk keperluan form ubah atau modal pembalik
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
    jurnal_dibalik: rawOriginalJournal,
    jurnal_pembalik: rawReversingJournal,
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

import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JurnalForm } from "@/components/jurnal/jurnal-form";
import type { AkunOption, PeriodeData } from "@/components/jurnal/jurnal-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Input Jurnal Baru",
  description: "Formulir input draf jurnal umum dengan validasi debit-kredit seimbang (BR-02)",
};

export default async function BaruJurnalPage() {
  // 1. Guard autentikasi: Hanya Akuntan yang berwenang menulis jurnal baru (PRD Bagian 7)
  const { profile } = await requireAuth(["akuntan"]);

  // 2. Client Supabase pengguna login (anon key + sesi cookie) -> RLS aktif
  const supabase = await createClient();

  // 3. Ambil daftar akun aktif saja untuk dipilih pada baris jurnal (BR-01)
  const { data: rawAkun, error: akunError } = await supabase
    .from("akun")
    .select("id, kode, nama, tipe, saldo_normal, aktif")
    .eq("aktif", true)
    .order("kode", { ascending: true });

  if (akunError) {
    console.error("Gagal mengambil data akun aktif:", akunError);
  }

  // 4. Ambil daftar periode untuk validasi dan penentuan otomatis periode aktif (BR-05)
  const { data: rawPeriode, error: periodeError } = await supabase
    .from("periode")
    .select("id, tahun, bulan, status")
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false });

  if (periodeError) {
    console.error("Gagal mengambil data periode:", periodeError);
  }

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Navigasi breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/jurnal" className="hover:text-slate-900 transition font-medium">
          ← Kembali ke Jurnal Umum
        </Link>
      </div>

      {/* Header Halaman */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Input Draf Jurnal Umum</h1>
        <p className="text-xs text-slate-500 mt-1">
          Catat transaksi minimal 2 baris akun dengan nominal debit dan kredit yang seimbang (BR-02).
        </p>
      </div>

      {/* Formulir Jurnal */}
      <JurnalForm
        mode="baru"
        daftarAkun={daftarAkun}
        daftarPeriode={daftarPeriode}
        userId={profile.id}
      />
    </div>
  );
}

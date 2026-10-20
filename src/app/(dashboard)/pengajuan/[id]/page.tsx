import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Pengajuan",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailPengajuanPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/pengajuan" className="hover:text-slate-900">
          ← Kembali ke Daftar Pengajuan
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Detail Pengajuan #{id}</h1>
        <p className="text-xs text-slate-500 mt-1">
          Rincian status pengajuan, bukti transaksi, dan aksi persetujuan sesuai peran
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Detail Pengajuan</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Belum ada fitur. Alur verifikasi akuntan (≤ Rp 1.000.000), persetujuan direktur (&gt; Rp 1.000.000), penolakan/revisi dengan catatan minimal 10 karakter, dan pembayaran akun kas/bank akan diimplementasikan di sini.
        </p>
      </div>
    </div>
  );
}

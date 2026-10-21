import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Daftar Pengajuan",
};

export default async function PengajuanPage() {
  await requireAuth(["staf", "akuntan", "direktur"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pengajuan Biaya & Reimburse</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pengajuan biaya operasional dan reimburse karyawan CV Batik Larasati
          </p>
        </div>
        <Link
          href="/pengajuan/baru"
          className="inline-flex items-center rounded-lg bg-amber-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-900 transition"
        >
          + Buat Pengajuan Baru
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Halaman Pengajuan</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Daftar pengajuan, filter status (draf, diajukan, menunggu direktur, disetujui, dibayar), dan tombol aksi transisi status sesuai peran.
        </p>
      </div>
    </div>
  );
}

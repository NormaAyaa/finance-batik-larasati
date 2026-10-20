import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Daftar Pengajuan",
};

export default function PengajuanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pengajuan Biaya & Reimburse</h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pengajuan biaya operasional dan reimburse karyawan
          </p>
        </div>
        <Link
          href="/pengajuan/baru"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
        >
          + Buat Pengajuan Baru
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Halaman Pengajuan</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Belum ada fitur. Filter status (draf, diajukan, menunggu direktur, disetujui, dibayar) dan tabel pengajuan akan ditampilkan di sini.
        </p>
      </div>
    </div>
  );
}

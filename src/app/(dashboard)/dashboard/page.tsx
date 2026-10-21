import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { profile } = await requireAuth(["staf", "akuntan", "direktur"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard Keuangan</h1>
        <p className="text-xs text-slate-500 mt-1">
          Selamat datang, <span className="font-semibold text-slate-700">{profile.nama_lengkap}</span> ({profile.jabatan}). Ringkasan posisi keuangan, mutasi kas/bank, dan pengajuan tertunda.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Halaman Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Komponen ringkasan saldo kas/bank, laba berjalan, grafik pendapatan vs beban, serta tabel pengajuan sesuai peran akan diimplementasikan pada tahap berikutnya.
        </p>
      </div>
    </div>
  );
}

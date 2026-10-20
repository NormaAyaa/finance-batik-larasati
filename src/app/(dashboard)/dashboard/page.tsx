import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard Keuangan</h1>
        <p className="text-xs text-slate-500 mt-1">
          Ringkasan posisi keuangan, mutasi kas/bank, dan pengajuan tertunda
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Halaman Dashboard</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Belum ada fitur. Komponen kartu ringkasan saldo kas/bank, laba berjalan, grafik pendapatan vs beban, serta tabel pengajuan menunggu persetujuan akan diimplementasikan di sini.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Laporan Laba Rugi",
};

export default async function LabaRugiPage() {
  await requireAuth(["akuntan", "direktur"]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/laporan" className="hover:text-slate-900">
          ← Kembali ke Laporan Keuangan
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Laporan Laba Rugi</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kalkulasi pendapatan per akun, beban per akun, dan laba (rugi) bersih
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Laporan Laba Rugi</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Filter periode/rentang tanggal, kalkulasi dari jurnal terposting, tampilan negatif berkurung, dan ekspor cetak/PDF akan berada di sini.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Buku Besar",
};

export default async function BukuBesarPage() {
  await requireAuth(["akuntan", "direktur"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Buku Besar</h1>
        <p className="text-xs text-slate-500 mt-1">
          Mutasi debit/kredit dan pergerakan saldo berjalan per akun buku besar
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Halaman Buku Besar</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Filter dropdown akun, filter rentang tanggal, saldo awal akun, riwayat mutasi debit/kredit dari baris jurnal yang diposting, serta kalkulasi saldo akhir berjalan akan berada di sini.
        </p>
      </div>
    </div>
  );
}

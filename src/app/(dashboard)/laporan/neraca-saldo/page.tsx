import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Neraca Saldo",
};

export default async function NeracaSaldoPage() {
  await requireAuth(["akuntan", "direktur"]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/laporan" className="hover:text-slate-900">
          ← Kembali ke Laporan Keuangan
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Neraca Saldo</h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar seluruh akun beserta total saldo debit dan kredit
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Neraca Saldo</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Tabel neraca saldo terakumulasi untuk memastikan jumlah debit sama dengan kredit per periode akan dibangun di sini.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Akun dan Periode",
};

export default async function AkunPeriodePage() {
  await requireAuth(["akuntan", "direktur"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Bagan Akun & Periode Akuntansi</h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola Chart of Accounts (COA 4 digit) dan kontrol status tutup/buka periode bulanan
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <h2 className="text-sm font-semibold text-slate-700">Kerangka Bagan Akun (COA)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tabel akun (1 Aset, 2 Kewajiban, 3 Ekuitas, 4 Pendapatan, 5 Beban), form tambah/edit, dan penonaktifan akun (BR-01) akan diimplementasikan di sini.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <h2 className="text-sm font-semibold text-slate-700">Kerangka Periode Akuntansi</h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar periode bulanan, tombol Tutup Periode (Akuntan), dan tombol Buka Kembali Periode (Direktur dengan alasan min 20 karakter, BR-06) akan berada di sini.
          </p>
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Input Jurnal Baru",
};

export default function BaruJurnalPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/jurnal" className="hover:text-slate-900">
          ← Kembali ke Jurnal Umum
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Input Draf Jurnal Umum</h1>
        <p className="text-xs text-slate-500 mt-1">
          Pencatatan minimal 2 baris dengan validasi debit sama dengan kredit (BR-02)
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Input Jurnal</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Belum ada fitur. Form input baris jurnal dinamis, kalkulator total debit, kredit, selisih seimbang, simpan draf, dan tombol posting akan dibangun di sini.
        </p>
      </div>
    </div>
  );
}

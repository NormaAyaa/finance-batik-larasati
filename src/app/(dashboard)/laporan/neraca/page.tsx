import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Laporan Neraca",
};

export default function NeracaPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/laporan" className="hover:text-slate-900">
          ← Kembali ke Laporan Keuangan
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Laporan Neraca</h1>
        <p className="text-xs text-slate-500 mt-1">
          Posisi keuangan: Aset = Kewajiban + Ekuitas (+ Laba/Rugi Berjalan)
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Laporan Neraca</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Belum ada fitur. Posisi aset lancar/tetap, kewajiban, ekuitas, validasi keseimbangan debit-kredit neraca, dan peringatan ketidakseimbangan akan dibangun di sini.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jurnal Umum",
};

export default function JurnalPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Jurnal Umum</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar jurnal transaksi keuangan CV Batik Larasati per periode
          </p>
        </div>
        <Link
          href="/jurnal/baru"
          className="inline-flex items-center rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
        >
          + Input Draf Jurnal
        </Link>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Halaman Jurnal Umum</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Belum ada fitur. Filter periode aktif, tabel jurnal draf & diposting, serta informasi nomor otomatis JU-YYYYMM-XXXX akan berada di sini.
        </p>
      </div>
    </div>
  );
}

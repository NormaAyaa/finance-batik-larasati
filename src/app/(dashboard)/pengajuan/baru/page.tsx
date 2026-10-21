import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Buat Pengajuan Baru",
};

export default async function BaruPengajuanPage() {
  await requireAuth(["staf", "akuntan", "direktur"]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/pengajuan" className="hover:text-slate-900">
          ← Kembali ke Pengajuan
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Formulir Pengajuan Baru</h1>
        <p className="text-xs text-slate-500 mt-1">
          Isi rincian pengeluaran/reimburse sesuai aturan bisnis BR-07
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Formulir Pengajuan</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Input nominal (Rp 10.000 - Rp 25.000.000), tanggal transaksi, pilihan akun beban aktif, keperluan minimal 10 karakter, serta upload bukti nota ke private storage bucket akan berada di sini.
        </p>
      </div>
    </div>
  );
}

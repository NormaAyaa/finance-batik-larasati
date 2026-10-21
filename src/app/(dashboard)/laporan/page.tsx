import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Laporan Keuangan",
};

export default async function LaporanPage() {
  await requireAuth(["akuntan", "direktur"]);

  const reports = [
    {
      title: "Laporan Laba Rugi",
      href: "/laporan/laba-rugi",
      desc: "Pendapatan per akun, beban per akun, total pendapatan, beban, dan laba (rugi) bersih.",
    },
    {
      title: "Neraca",
      href: "/laporan/neraca",
      desc: "Posisi aset, kewajiban, ekuitas, dan laba/rugi berjalan per tanggal penutupan.",
    },
    {
      title: "Neraca Saldo",
      href: "/laporan/neraca-saldo",
      desc: "Daftar saldo debit dan kredit semua akun untuk memastikan keseimbangan pembukuan.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Laporan Keuangan</h1>
        <p className="text-xs text-slate-500 mt-1">
          Laporan keuangan otomatis dihitung dari jurnal terposting CV Batik Larasati
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="rounded-xl border border-slate-200 bg-white p-5 hover:border-amber-700 hover:shadow-sm transition"
          >
            <h2 className="text-sm font-bold text-slate-900">{report.title}</h2>
            <p className="text-xs text-slate-500 mt-2">{report.desc}</p>
            <span className="inline-block mt-4 text-xs font-semibold text-amber-800">
              Buka Laporan →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

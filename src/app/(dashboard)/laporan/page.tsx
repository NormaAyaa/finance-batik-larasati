import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Laporan Keuangan",
  description: "Pusat Laporan Keuangan CV Batik Larasati (Laba Rugi, Neraca, Neraca Saldo)",
};

export default async function LaporanPage() {
  await requireAuth(["akuntan", "direktur"]);

  const reports = [
    {
      title: "Laporan Laba Rugi",
      href: "/laporan/laba-rugi",
      desc: "Rincian pendapatan per akun, beban operasional, total pendapatan, total beban, dan kalkulasi laba atau rugi bersih.",
      icon: "📊",
      tag: "Kinerja Usaha",
    },
    {
      title: "Laporan Neraca",
      href: "/laporan/neraca",
      desc: "Posisi keuangan: Aset (Aktiva) berbanding Kewajiban dan Ekuitas (Pasiva) ditambah Laba/Rugi berjalan per tanggal penutupan.",
      icon: "⚖️",
      tag: "Posisi Keuangan",
    },
    {
      title: "Neraca Saldo",
      href: "/laporan/neraca-saldo",
      desc: "Daftar saldo debit dan kredit seluruh bagan akun untuk memastikan validitas dan keseimbangan pembukuan berpasangan.",
      icon: "📑",
      tag: "Trial Balance",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Laporan Keuangan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Laporan keuangan otomatis dikalkulasi langsung di database dari jurnal terposting & dibalik CV Batik Larasati (PRD Bagian 7 & 9, BR-11)
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-amber-700 hover:shadow-md transition"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{report.icon}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  {report.tag}
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition">
                {report.title}
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {report.desc}
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-800 group-hover:text-amber-900">
              <span>Buka Laporan</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

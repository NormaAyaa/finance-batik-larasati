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
      accent: "from-amber-500/10 to-amber-900/10",
      borderAccent: "group-hover:border-amber-500/50",
    },
    {
      title: "Laporan Neraca",
      href: "/laporan/neraca",
      desc: "Posisi keuangan: Aset (Aktiva) berbanding Kewajiban dan Ekuitas (Pasiva) ditambah Laba/Rugi berjalan per tanggal penutupan.",
      icon: "⚖️",
      tag: "Posisi Keuangan",
      accent: "from-amber-600/10 to-amber-950/10",
      borderAccent: "group-hover:border-amber-500/50",
    },
    {
      title: "Neraca Saldo",
      href: "/laporan/neraca-saldo",
      desc: "Daftar saldo debit dan kredit seluruh bagan akun untuk memastikan validitas dan keseimbangan pembukuan berpasangan.",
      icon: "📑",
      tag: "Trial Balance",
      accent: "from-amber-700/10 to-amber-950/10",
      borderAccent: "group-hover:border-amber-500/50",
    },
  ];

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
              PUSAT LAPORAN & KINERJA FINANSIAL
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#fdfaf6] tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="text-sm sm:text-base text-[#a89f91] mt-1 max-w-3xl leading-relaxed">
            Laporan keuangan otomatis dikalkulasi langsung di database dari jurnal terposting &amp; dibalik CV Batik Larasati (PRD Bagian 7 &amp; 9, BR-11).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/25 text-xs font-semibold text-amber-300">
            <span>🏛️</span> Standar SAK EMKM
          </span>
        </div>
      </div>

      {/* Grid Bento Cards Laporan */}
      <div className="grid gap-6 md:grid-cols-3">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className={`sogan-card group relative flex flex-col justify-between rounded-2xl border border-amber-900/25 bg-[#0e0c0a] p-6 sm:p-7 shadow-xl hover:shadow-2xl hover:shadow-amber-950/30 ${report.borderAccent} transition-all duration-300`}
          >
            {/* Subtle Gradient Glow in Corner */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${report.accent} opacity-40 group-hover:opacity-75 transition-opacity pointer-events-none`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#141210] border border-amber-900/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  {report.icon}
                </div>
                <span className="rounded-full bg-amber-950/40 border border-amber-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  {report.tag}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#fdfaf6] group-hover:text-amber-300 transition-colors">
                {report.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#a89f91] mt-2.5 leading-relaxed">
                {report.desc}
              </p>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-amber-900/20 flex items-center justify-between text-xs sm:text-sm font-bold text-amber-400 group-hover:text-amber-300">
              <span className="flex items-center gap-1.5">
                Buka Laporan
              </span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

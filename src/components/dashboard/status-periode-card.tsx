import React from "react";
import Link from "next/link";
import { formatBulanTahun } from "@/lib/utils/formatters";

export interface PeriodeStatusItem {
  id: number;
  tahun: number;
  bulan: number;
  status: "terbuka" | "ditutup";
  jumlahDraf: number;
  tanggal_mulai: string;
}

interface StatusPeriodeCardProps {
  periodes: PeriodeStatusItem[];
}

export function StatusPeriodeCard({ periodes }: StatusPeriodeCardProps) {
  return (
    <section
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
      aria-labelledby="status-periode-title"
    >
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 id="status-periode-title" className="text-base font-bold text-slate-900">
            Status Periode Akuntansi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar periode pembukuan dan pemantauan jurnal draf aktif
          </p>
        </div>

        <Link
          href="/akun-periode"
          className="text-xs font-semibold text-sky-700 hover:text-sky-900 transition inline-flex items-center gap-1"
        >
          <span>Kelola Periode</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {periodes.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Belum ada periode akuntansi yang dibuat.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <caption className="sr-only">
              Daftar status periode pembukuan dan jumlah jurnal draf per periode
            </caption>
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-2.5">Periode</th>
                <th scope="col" className="px-4 py-2.5 text-center">Status Buku</th>
                <th scope="col" className="px-4 py-2.5 text-center">Jurnal Draf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periodes.map((p) => {
                const label = formatBulanTahun(p.tahun, p.bulan);
                const isTerbuka = p.status === "terbuka";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    {/* Nama Periode */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{label}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Mulai: {p.tanggal_mulai}
                      </div>
                    </td>

                    {/* Status Buku dengan Ikon dan Teks (Aksesibel) */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {isTerbuka ? (
                        <span
                          role="status"
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                        >
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                          />
                          <span>● Terbuka</span>
                        </span>
                      ) : (
                        <span
                          role="status"
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
                        >
                          <span aria-hidden="true">🔒</span>
                          <span>Ditutup</span>
                        </span>
                      )}
                    </td>

                    {/* Jumlah Jurnal Draf */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {p.jumlahDraf > 0 ? (
                        <span
                          role="status"
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800"
                        >
                          <span aria-hidden="true">⚠️</span>
                          <span>{p.jumlahDraf} draf</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                          <span aria-hidden="true">✓</span>
                          <span>0 draf</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

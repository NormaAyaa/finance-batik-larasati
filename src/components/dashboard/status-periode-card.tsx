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
      className="sogan-card p-5 sm:p-6 select-none"
      aria-labelledby="status-periode-title"
    >
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-amber-900/20">
        <div>
          <h3 id="status-periode-title" className="text-base font-bold text-[#fdfaf6] tracking-tight">
            Status Periode Akuntansi
          </h3>
          <p className="text-xs text-[#a89f91] mt-0.5">
            Daftar periode buku & pemantauan draf jurnal (kepatuhan BR-06)
          </p>
        </div>

        <Link
          href="/akun-periode"
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition inline-flex items-center gap-1"
        >
          <span>Kelola Periode</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {periodes.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#78716c]">
          Belum ada periode akuntansi yang dibuat.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-[#fdfaf6]">
            <caption className="sr-only">
              Daftar status periode pembukuan dan jumlah jurnal draf per periode
            </caption>
            <thead className="bg-[#141210] text-[#a89f91] font-semibold border-b border-amber-900/30 uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-2.5">Periode</th>
                <th scope="col" className="px-4 py-2.5 text-center">Status Buku</th>
                <th scope="col" className="px-4 py-2.5 text-center">Jurnal Draf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/15">
              {periodes.map((p) => {
                const label = formatBulanTahun(p.tahun, p.bulan);
                const isTerbuka = p.status === "terbuka";

                return (
                  <tr key={p.id} className="hover:bg-[#1a1613] transition">
                    {/* Nama Periode */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-[#fdfaf6]">{label}</div>
                      <div className="text-[11px] text-[#78716c] font-mono">
                        Mulai: {p.tanggal_mulai}
                      </div>
                    </td>

                    {/* Status Buku dengan Ikon dan Teks (Aksesibel) */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {isTerbuka ? (
                        <span
                          role="status"
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        >
                          <span
                            aria-hidden="true"
                            className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
                          />
                          <span>Terbuka</span>
                        </span>
                      ) : (
                        <span
                          role="status"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#181512] border border-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-[#a89f91]"
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
                          className="inline-flex items-center gap-1 rounded-full bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        >
                          <span aria-hidden="true">⚠</span>
                          <span>{p.jumlahDraf} draf</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#181512] px-2 py-0.5 text-xs font-medium text-[#78716c]">
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

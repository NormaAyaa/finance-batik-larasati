import React from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import { StatusBadge } from "@/components/pengajuan/status-badge";
import type { StatusPengajuan } from "@/types/database";

export interface PengajuanMenungguItem {
  id: number;
  nomor: string;
  pengaju: {
    id?: string;
    nama_lengkap: string;
    email?: string;
    peran: string;
  } | null;
  tanggal_transaksi: string;
  jumlah: number;
  status: StatusPengajuan;
  jenis?: string;
}

interface TabelPengajuanMenungguProps {
  items: PengajuanMenungguItem[];
  totalMenunggu: number;
  peran: "akuntan" | "direktur";
}

export function TabelPengajuanMenunggu({
  items,
  totalMenunggu,
  peran,
}: TabelPengajuanMenungguProps) {
  const judul =
    peran === "akuntan"
      ? "Pengajuan Menunggu Tindakan Akuntan"
      : "Pengajuan Menunggu Persetujuan Direktur";

  const keterangan =
    peran === "akuntan"
      ? "Daftar pengajuan berstatus 'Diajukan' (verifikasi) dan 'Disetujui' (pembayaran kas/bank)"
      : "Daftar pengajuan berstatus 'Menunggu Direktur' (nilai > Rp 1 jt atau milik Akuntan)";

  return (
    <section
      id="tabel-pengajuan-menunggu"
      className="sogan-card p-5 sm:p-6 select-none"
      aria-labelledby="tabel-pengajuan-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/20">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 id="tabel-pengajuan-title" className="text-base font-bold text-[#fdfaf6] tracking-tight">
              {judul}
            </h3>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
              aria-label={`${totalMenunggu} berkas menunggu`}
            >
              {totalMenunggu} antrean
            </span>
          </div>
          <p className="text-xs text-[#a89f91] mt-0.5">{keterangan}</p>
        </div>

        <Link
          href="/pengajuan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition self-start sm:self-auto"
        >
          <span>Lihat Semua Pengajuan</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <div
            aria-hidden="true"
            className="w-12 h-12 mx-auto rounded-full bg-emerald-950/60 text-emerald-400 flex items-center justify-center text-xl font-bold mb-3 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            ✓
          </div>
          <h4 className="text-sm font-semibold text-[#fdfaf6]">
            Tidak Ada Pengajuan Menunggu
          </h4>
          <p className="text-xs text-[#a89f91] mt-1 max-w-sm mx-auto">
            Semua pengajuan telah diproses sesuai alur kerja. Berkas baru yang membutuhkan
            tindakan Anda akan otomatis tampil di sini.
          </p>
          <div className="mt-4">
            <Link
              href="/pengajuan"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-amber-900/40 bg-[#161310] text-xs font-medium text-amber-300 hover:bg-[#1e1a16] transition"
            >
              Buka Riwayat Pengajuan
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Tampilan Desktop & Tablet: Tabel Dark Semantik */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-[#fdfaf6]">
              <caption className="sr-only">
                Daftar pengajuan biaya yang menunggu verifikasi atau persetujuan Anda
              </caption>
              <thead className="bg-[#141210] text-[#a89f91] font-bold border-b border-amber-900/30 uppercase tracking-wider text-xs">
                <tr>
                  <th scope="col" className="px-4 py-3.5">Nomor & Tanggal</th>
                  <th scope="col" className="px-4 py-3.5">Pengaju</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Jumlah</th>
                  <th scope="col" className="px-4 py-3.5 text-center">Status</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-900/15">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1a1613] transition">
                    {/* Nomor & Tanggal */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-amber-300 font-mono text-sm sm:text-base">
                        {item.nomor}
                      </div>
                      <div className="text-xs text-[#a89f91] mt-0.5">
                        {formatDate(item.tanggal_transaksi)}
                      </div>
                    </td>

                    {/* Pengaju */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#fdfaf6] text-sm sm:text-base">
                        {item.pengaju?.nama_lengkap || "-"}
                      </div>
                      <div className="text-xs text-[#a89f91] capitalize mt-0.5">
                        {item.pengaju?.peran || "Staf"}
                      </div>
                    </td>

                    {/* Jumlah */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right font-mono font-bold text-sm sm:text-base text-amber-300 tabular-nums">
                      {formatRupiah(item.jumlah)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <StatusBadge status={item.status} size="md" />
                    </td>

                    {/* Aksi: Tombol Tinjau Emas Chamfer */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <Link
                        href={`/pengajuan/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        aria-label={`Tinjau pengajuan nomor ${item.nomor} sebesar ${formatRupiah(item.jumlah)}`}
                      >
                        <span>Tinjau</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Info & Tautan Selengkapnya */}
          <div className="mt-4 pt-3 border-t border-amber-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#a89f91]">
            <span>
              Menampilkan {items.length} dari {totalMenunggu} antrean pengajuan
            </span>
            <Link
              href="/pengajuan"
              className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 transition"
            >
              <span>Lihat semua {totalMenunggu} pengajuan</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

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
      ? "Daftar pengajuan berstatus 'Diajukan' (menunggu verifikasi) dan 'Disetujui' (menunggu pembayaran)"
      : "Daftar pengajuan berstatus 'Menunggu Direktur' (membutuhkan persetujuan)";

  return (
    <section
      id="tabel-pengajuan-menunggu"
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
      aria-labelledby="tabel-pengajuan-title"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="tabel-pengajuan-title" className="text-base font-bold text-slate-900">
              {judul}
            </h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"
              aria-label={`${totalMenunggu} berkas menunggu`}
            >
              {totalMenunggu} antrean
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{keterangan}</p>
        </div>

        <Link
          href="/pengajuan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 transition self-start sm:self-auto"
        >
          <span>Lihat Semua Pengajuan</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <div
            aria-hidden="true"
            className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-3 border border-emerald-100"
          >
            ✓
          </div>
          <h3 className="text-sm font-semibold text-slate-700">
            Tidak Ada Pengajuan Menunggu
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Semua pengajuan telah diproses sesuai alur kerja. Pengajuan baru yang membutuhkan
            tindakan Anda akan otomatis tampil di sini.
          </p>
          <div className="mt-4">
            <Link
              href="/pengajuan"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Buka Riwayat Pengajuan
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Tampilan Desktop & Tablet: Tabel HTML Semantik */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <caption className="sr-only">
                Daftar pengajuan biaya yang menunggu verifikasi atau persetujuan Anda
              </caption>
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="px-4 py-3">Nomor & Tanggal</th>
                  <th scope="col" className="px-4 py-3">Pengaju</th>
                  <th scope="col" className="px-4 py-3 text-right">Jumlah</th>
                  <th scope="col" className="px-4 py-3 text-center">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    {/* Nomor & Tanggal */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 font-mono text-xs">
                        {item.nomor}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDate(item.tanggal_transaksi)}
                      </div>
                    </td>

                    {/* Pengaju */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-900">
                        {item.pengaju?.nama_lengkap || "-"}
                      </div>
                      <div className="text-[11px] text-slate-400 capitalize">
                        {item.pengaju?.peran || "Staf"}
                      </div>
                    </td>

                    {/* Jumlah */}
                    <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-semibold text-slate-900">
                      {formatRupiah(item.jumlah)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Aksi: Tombol Tinjau */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/pengajuan/${item.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 transition shadow-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Menampilkan {items.length} dari {totalMenunggu} antrean pengajuan
            </span>
            <Link
              href="/pengajuan"
              className="text-sky-700 hover:text-sky-900 font-semibold inline-flex items-center gap-1"
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

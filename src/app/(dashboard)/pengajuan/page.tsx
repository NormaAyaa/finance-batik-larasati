import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import { StatusBadge } from "@/components/pengajuan/status-badge";
import { FilterToolbar } from "@/components/pengajuan/filter-toolbar";
import type { StatusPengajuan } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daftar Pengajuan",
  description: "Kelola pengajuan biaya operasional dan reimburse karyawan CV Batik Larasati",
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    bulan?: string;
    q?: string;
  }>;
}

export default async function PengajuanPage({ searchParams }: PageProps) {
  // 1. Guard autentikasi: Staf, Akuntan, dan Direktur
  const { profile } = await requireAuth(["staf", "akuntan", "direktur"]);
  const params = await searchParams;

  const currentStatus = params.status || "";
  const currentBulan = params.bulan || "";
  const currentSearch = params.q || "";

  // 2. Client Supabase pengguna yang login (RLS membatasi baris secara otomatis)
  // Staf hanya melihat miliknya sendiri (pengajuan_select_staf)
  // Akuntan & Direktur melihat semua (pengajuan_select_akuntan_direktur)
  const supabase = await createClient();

  let query = supabase
    .from("pengajuan")
    .select(`
      id,
      nomor,
      pengaju_id,
      jenis,
      tanggal_transaksi,
      akun_beban_id,
      jumlah,
      keterangan,
      bukti_path,
      status,
      catatan_peninjau,
      dibuat_pada,
      diajukan_pada,
      pengaju:profiles!pengaju_id (
        id,
        nama_lengkap,
        email,
        peran
      ),
      akun_beban:akun!akun_beban_id (
        id,
        kode,
        nama
      )
    `)
    .order("id", { ascending: false });

  // Terapkan filter status bila dipilih
  if (currentStatus) {
    query = query.eq("status", currentStatus as StatusPengajuan);
  }

  // Terapkan filter bulan transaksi (format YYYY-MM)
  if (currentBulan) {
    const [year, month] = currentBulan.split("-");
    if (year && month) {
      const startDate = `${currentBulan}-01`;
      // Hitung akhir bulan
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      const endDate = `${currentBulan}-${String(lastDay).padStart(2, "0")}`;
      query = query.gte("tanggal_transaksi", startDate).lte("tanggal_transaksi", endDate);
    }
  }

  const { data: rawPengajuan, error } = await query;

  // Saring pencarian (nomor, pengaju, keperluan)
  let items = rawPengajuan || [];
  if (currentSearch.trim()) {
    const q = currentSearch.toLowerCase().trim();
    items = items.filter((item) => {
      const matchNomor = item.nomor?.toLowerCase().includes(q);
      const matchKet = item.keterangan?.toLowerCase().includes(q);
      const matchPengaju = item.pengaju?.nama_lengkap?.toLowerCase().includes(q);
      return Boolean(matchNomor || matchKet || matchPengaju);
    });
  }

  // Direktur dilarang membuat pengajuan (BR-09)
  const canCreate = profile.peran !== "direktur";

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Pengajuan Biaya & Reimburse
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {profile.peran === "staf"
              ? "Pantau dan kelola riwayat pengajuan biaya operasional dan reimburse Anda"
              : "Daftar seluruh pengajuan biaya operasional dan reimburse karyawan CV Batik Larasati"}
          </p>
        </div>

        {canCreate && (
          <Link
            href="/pengajuan/baru"
            className="inline-flex items-center justify-center rounded-lg bg-amber-800 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition shrink-0"
          >
            <span aria-hidden="true" className="mr-1.5 font-bold">
              +
            </span>
            Buat Pengajuan Baru
          </Link>
        )}
      </div>

      {/* Toolbar Filter & Pencarian */}
      <FilterToolbar
        currentStatus={currentStatus}
        currentBulan={currentBulan}
        currentSearch={currentSearch}
      />

      {/* Pesan Error Query Jika Ada */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800"
        >
          <p className="font-semibold">Gagal memuat data pengajuan</p>
          <p className="mt-0.5">
            Terjadi kendala saat mengambil data dari database. Silakan muat ulang halaman.
          </p>
        </div>
      )}

      {/* Tampilan Desktop: Tabel */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Tabel Daftar Pengajuan">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th scope="col" className="px-4 py-3">
                  Nomor
                </th>
                <th scope="col" className="px-4 py-3">
                  Tanggal
                </th>
                <th scope="col" className="px-4 py-3">
                  Pengaju
                </th>
                <th scope="col" className="px-4 py-3">
                  Keperluan
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Jumlah
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium text-slate-600">
                      Tidak ada pengajuan ditemukan
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {currentStatus || currentBulan || currentSearch
                        ? "Coba ubah atau reset kata kunci pencarian dan filter Anda."
                        : canCreate
                        ? "Mulai dengan membuat pengajuan biaya atau reimburse baru."
                        : "Belum ada data pengajuan yang tersimpan."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nomor Pengajuan */}
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {item.nomor ? (
                        <span className="font-mono text-slate-800">{item.nomor}</span>
                      ) : (
                        <span className="text-slate-400 italic">Draf (belum ada nomor)</span>
                      )}
                      <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wide">
                        {item.jenis}
                      </div>
                    </td>

                    {/* Tanggal Transaksi */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDate(item.tanggal_transaksi)}
                    </td>

                    {/* Pengaju */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {item.pengaju?.nama_lengkap || "-"}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {item.pengaju?.email}
                      </div>
                    </td>

                    {/* Keperluan */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="line-clamp-2 text-slate-700" title={item.keterangan}>
                        {item.keterangan}
                      </p>
                      {item.akun_beban && (
                        <span className="inline-block mt-0.5 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.akun_beban.kode} - {item.akun_beban.nama}
                        </span>
                      )}
                    </td>

                    {/* Jumlah (Rata Kanan) */}
                    <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      {formatRupiah(item.jumlah)}
                    </td>

                    {/* Status (Badge Aksesibel) */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <Link
                        href={`/pengajuan/${item.id}`}
                        className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tampilan Ponsel: Daftar Kartu (Card View) */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            <p className="text-sm font-medium text-slate-600">
              Tidak ada pengajuan ditemukan
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {currentStatus || currentBulan || currentSearch
                ? "Coba ubah atau reset filter Anda."
                : canCreate
                ? "Tekan tombol Buat Pengajuan Baru di atas."
                : "Belum ada data pengajuan."}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3"
            >
              {/* Header Kartu: Nomor & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {item.nomor || "Draf (Belum bernomor)"}
                  </span>
                  <span className="ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    {item.jenis}
                  </span>
                </div>
                <StatusBadge status={item.status} />
              </div>

              {/* Isi: Keperluan & Akun Beban */}
              <div>
                <p className="text-xs font-medium text-slate-800 line-clamp-2">
                  {item.keterangan}
                </p>
                {item.akun_beban && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Akun: {item.akun_beban.kode} - {item.akun_beban.nama}
                  </p>
                )}
              </div>

              {/* Pengaju & Tanggal */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span>Pengaju: {item.pengaju?.nama_lengkap || "-"}</span>
                <span>{formatDate(item.tanggal_transaksi)}</span>
              </div>

              {/* Footer Kartu: Nominal & Tombol Detail */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total Jumlah</span>
                  <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatRupiah(item.jumlah)}
                  </span>
                </div>
                <Link
                  href={`/pengajuan/${item.id}`}
                  className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Lihat Detail →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-amber-900/20">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400/90">
              Pengajuan Biaya & Reimburse • CV Batik Larasati
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdfaf6] tracking-tight">
            Daftar Pengajuan
          </h1>
          <p className="text-sm sm:text-base text-[#a89f91] mt-1">
            {profile.peran === "staf"
              ? "Pantau dan kelola riwayat pengajuan biaya operasional dan reimburse Anda secara real-time."
              : "Daftar seluruh pengajuan biaya operasional dan reimburse karyawan CV Batik Larasati."}
          </p>
        </div>

        {canCreate && (
          <Link
            href="/pengajuan/baru"
            className="btn-3d-gold px-5 py-2.5 text-sm sm:text-base font-bold gap-2 shrink-0"
          >
            <span aria-hidden="true" className="font-black text-base">
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
          className="sogan-card border-rose-900/40 bg-gradient-to-r from-rose-950/30 to-[#0f0d0b] p-5 text-sm text-rose-300"
        >
          <p className="font-bold flex items-center gap-2">
            <span aria-hidden="true">⚠️</span> Gagal Memuat Data Pengajuan
          </p>
          <p className="mt-1 text-rose-400/90">
            Terjadi kendala saat mengambil data dari database. Silakan muat ulang halaman.
          </p>
        </div>
      )}

      {/* Tampilan Desktop: Tabel Sogan Obsidian */}
      <div className="hidden md:block sogan-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-base text-[#fdfaf6]" aria-label="Tabel Daftar Pengajuan">
            <thead>
              <tr className="border-b border-amber-900/30 bg-[#141210] text-sm sm:text-base font-bold uppercase tracking-wider text-[#d6cfc7]">
                <th scope="col" className="px-5 py-4">
                  Nomor & Jenis
                </th>
                <th scope="col" className="px-5 py-4">
                  Tanggal
                </th>
                <th scope="col" className="px-5 py-4">
                  Pengaju
                </th>
                <th scope="col" className="px-5 py-4">
                  Keperluan & Akun
                </th>
                <th scope="col" className="px-5 py-4 text-right">
                  Jumlah
                </th>
                <th scope="col" className="px-5 py-4 text-center">
                  Status
                </th>
                <th scope="col" className="px-5 py-4 text-center">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900/15">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div
                      aria-hidden="true"
                      className="w-16 h-16 mx-auto rounded-full bg-amber-950/40 text-amber-400 flex items-center justify-center text-3xl font-bold mb-4 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    >
                      📄
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-[#fdfaf6]">
                      Tidak Ada Pengajuan Ditemukan
                    </h4>
                    <p className="text-sm sm:text-base text-[#a89f91] mt-1.5 max-w-md mx-auto">
                      {currentStatus || currentBulan || currentSearch
                        ? "Coba sesuaikan kata kunci pencarian atau reset filter aktif Anda."
                        : canCreate
                        ? "Mulai dengan membuat pengajuan biaya operasional atau reimburse baru."
                        : "Belum ada data pengajuan yang tersimpan."}
                    </p>
                    {canCreate && !currentStatus && !currentBulan && !currentSearch && (
                      <div className="mt-5">
                        <Link
                          href="/pengajuan/baru"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-900/40 bg-[#161310] text-sm sm:text-base font-bold text-amber-300 hover:bg-[#1e1a16] transition shadow-sm"
                        >
                          + Buat Pengajuan Pertama
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-[#1a1613] transition-colors">
                    {/* Nomor Pengajuan */}
                    <td className="px-5 py-4.5 whitespace-nowrap">
                      {item.nomor ? (
                        <span className="font-mono font-bold text-[#fdfaf6] text-base sm:text-lg">{item.nomor}</span>
                      ) : (
                        <span className="text-[#a89f91] italic text-base">Draf #{item.id}</span>
                      )}
                      <div>
                        <span className="inline-block mt-1 text-xs sm:text-sm uppercase font-bold text-amber-400 tracking-wider bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                          {item.jenis}
                        </span>
                      </div>
                    </td>

                    {/* Tanggal Transaksi */}
                    <td className="px-5 py-4.5 whitespace-nowrap text-sm sm:text-base text-[#d6cfc7] font-medium">
                      {formatDate(item.tanggal_transaksi)}
                    </td>

                    {/* Pengaju */}
                    <td className="px-5 py-4.5">
                      <div className="font-bold text-base sm:text-lg text-[#fdfaf6]">
                        {item.pengaju?.nama_lengkap || "-"}
                      </div>
                      <div className="text-sm text-[#a89f91] truncate max-w-[200px] mt-0.5">
                        {item.pengaju?.email}
                      </div>
                    </td>

                    {/* Keperluan */}
                    <td className="px-5 py-4.5 max-w-sm">
                      <p className="line-clamp-2 text-sm sm:text-base text-[#fdfaf6] leading-relaxed" title={item.keterangan}>
                        {item.keterangan}
                      </p>
                      {item.akun_beban && (
                        <span className="inline-block mt-1.5 text-xs sm:text-sm text-amber-300 font-semibold bg-amber-950/50 border border-amber-900/40 px-2.5 py-1 rounded">
                          {item.akun_beban.kode} - {item.akun_beban.nama}
                        </span>
                      )}
                    </td>

                    {/* Jumlah (Rata Kanan) */}
                    <td className="px-5 py-4.5 text-right font-mono font-black text-lg sm:text-xl text-amber-300 tabular-nums whitespace-nowrap">
                      {formatRupiah(item.jumlah)}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4.5 text-center whitespace-nowrap">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4.5 text-center whitespace-nowrap">
                      <Link
                        href={`/pengajuan/${item.id}`}
                        className="btn-3d-gold px-4.5 py-2 text-sm sm:text-base font-bold gap-1.5"
                      >
                        <span>Detail</span>
                        <span aria-hidden="true">→</span>
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
      <div className="md:hidden space-y-4">
        {items.length === 0 ? (
          <div className="sogan-card p-8 text-center text-[#a89f91]">
            <p className="text-lg font-bold text-[#fdfaf6]">
              Tidak ada pengajuan ditemukan
            </p>
            <p className="text-sm sm:text-base text-[#a89f91] mt-1.5">
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
              className="sogan-card sogan-card-hover p-5 space-y-4"
            >
              {/* Header Kartu: Nomor & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-base sm:text-lg font-bold text-[#fdfaf6]">
                    {item.nomor || `Draf #${item.id}`}
                  </span>
                  <span className="ml-2 text-xs sm:text-sm font-bold uppercase px-2.5 py-1 rounded bg-amber-950/70 text-amber-300 border border-amber-500/40 inline-block">
                    {item.jenis}
                  </span>
                </div>
                <StatusBadge status={item.status} />
              </div>

              {/* Isi: Keperluan & Akun Beban */}
              <div>
                <p className="text-sm sm:text-base font-medium text-[#fdfaf6] line-clamp-2 leading-relaxed">
                  {item.keterangan}
                </p>
                {item.akun_beban && (
                  <p className="text-xs sm:text-sm text-amber-300 font-semibold mt-1.5">
                    Akun: {item.akun_beban.kode} - {item.akun_beban.nama}
                  </p>
                )}
              </div>

              {/* Pengaju & Tanggal */}
              <div className="flex items-center justify-between text-sm sm:text-base text-[#a89f91] pt-3 border-t border-amber-900/20">
                <span>Pengaju: <strong className="text-[#fdfaf6] font-semibold">{item.pengaju?.nama_lengkap || "-"}</strong></span>
                <span className="font-mono text-xs sm:text-sm">{formatDate(item.tanggal_transaksi)}</span>
              </div>

              {/* Footer Kartu: Nominal & Tombol Detail */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs sm:text-sm text-[#a89f91] block">Total Jumlah</span>
                  <span className="text-lg sm:text-xl font-black text-amber-300 font-mono tabular-nums">
                    {formatRupiah(item.jumlah)}
                  </span>
                </div>
                <Link
                  href={`/pengajuan/${item.id}`}
                  className="btn-3d-gold px-4 py-2 text-sm font-bold gap-1.5"
                >
                  <span>Detail</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



import Link from "next/link";
import { MAIN_NAVIGATION } from "@/lib/constants/navigation";
import { requireAuth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sisi server: verifikasi sesi dan dapatkan profil pengguna aktif
  const { profile } = await requireAuth();

  // Filter menu navigasi sesuai peran pengguna (PRD Bagian 7)
  // Staf: Dashboard, Pengajuan (2 menu)
  // Akuntan: Dashboard, Pengajuan, Jurnal, Buku Besar, Laporan, Akun & Periode (6 menu)
  // Direktur: Semua 7 menu
  const visibleNav = MAIN_NAVIGATION.filter((item) =>
    item.allowedRoles.includes(profile.peran)
  );

  const roleBadgeColor = {
    direktur: "bg-purple-100 text-purple-800 border-purple-200",
    akuntan: "bg-blue-100 text-blue-800 border-blue-200",
    staf: "bg-emerald-100 text-emerald-800 border-emerald-200",
  }[profile.peran];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigasi Sesuai Peran */}
      <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="mb-6 px-3 py-2 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              CV Batik Larasati
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Internal Finance & Accounting
            </p>
          </div>

          <nav className="space-y-1">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Profil Pengguna & Tombol Keluar (Sisi Bawah Sidebar) */}
        <div className="border-t border-slate-200 pt-4 px-2 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-bold text-slate-900 truncate">
                {profile.nama_lengkap}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${roleBadgeColor}`}
              >
                {profile.peran}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {profile.jabatan}
            </p>
          </div>

          {/* Form POST ke Route Handler /auth/keluar (Sesuai Revisi 2) */}
          <form action="/auth/keluar" method="POST">
            <button
              type="submit"
              className="w-full text-left rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition"
            >
              🚪 Keluar dari Sistem
            </button>
          </form>
        </div>
      </aside>

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Atas */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-900 md:hidden">
              CV Batik Larasati
            </span>
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded font-medium">
              Sistem Keuangan Internal
            </span>
          </div>

          {/* Identitas Pengguna & Tombol Keluar di Header */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">
                {profile.nama_lengkap}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {profile.peran} • {profile.jabatan}
              </p>
            </div>
            <form action="/auth/keluar" method="POST">
              <button
                type="submit"
                className="text-xs font-medium text-slate-600 hover:text-red-600 px-2.5 py-1.5 rounded hover:bg-slate-50 border border-slate-200 transition"
              >
                Keluar
              </button>
            </form>
          </div>
        </header>

        {/* Navigasi Mobile Responsif (PRD Bagian 7 & 10) */}
        <nav
          aria-label="Navigasi Menu Mobile"
          className="md:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto flex items-center gap-1.5"
        >
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Konten Halaman */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

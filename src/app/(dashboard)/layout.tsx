import Image from "next/image";
import Link from "next/link";
import { MAIN_NAVIGATION } from "@/lib/constants/navigation";
import { requireAuth } from "@/lib/auth";
import { SidebarSlim } from "@/components/layout/sidebar-slim";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sisi server: verifikasi sesi dan dapatkan profil pengguna aktif
  const { profile } = await requireAuth();

  // Filter menu navigasi sesuai peran pengguna (PRD Bagian 7)
  // Staf: Dashboard, Pengajuan (2 menu)
  // Akuntan: Dashboard, Pengajuan, Jurnal, Buku Besar, Mutasi Bank, Laporan, Akun & Periode (7 menu)
  // Direktur: Semua 8 menu
  const visibleNav = MAIN_NAVIGATION.filter((item) =>
    item.allowedRoles.includes(profile.peran)
  );

  const roleBadgeStyle = {
    direktur: "bg-purple-950/70 text-purple-300 border-purple-500/40",
    akuntan: "bg-blue-950/70 text-blue-300 border-blue-500/40",
    staf: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40",
  }[profile.peran];

  return (
    <div className="flex min-h-screen bg-[#070605] text-[#fbf7f0] selection:bg-amber-500 selection:text-black">
      {/* Sidebar Ramping Vertikal Ikonik (Sesuai Referensi 2) */}
      <SidebarSlim items={visibleNav} profile={profile} />

      {/* Konten Utama (Offset kiri w-20 pada desktop untuk mengakomodasi sidebar tetap) */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-20 pb-20 md:pb-8">
        {/* Header Kontekstual Sogan Obsidian */}
        <header className="h-16 border-b border-amber-900/20 bg-[#090807]/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
          {/* Sisi Kiri: Identitas Brand & Sistem */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group transition-opacity hover:opacity-95"
            >
              {/* Logo Resmi CV Batik Larasati */}
              <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)] shrink-0 bg-[#120b07]">
                <Image
                  src="/images/logo-batik-larasati.png"
                  alt="Logo CV Batik Larasati"
                  fill
                  sizes="32px"
                  priority
                  className="object-cover transform group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-[#fdfaf6] group-hover:text-amber-300 transition-colors">
                  CV Batik Larasati
                </h1>
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
              </div>
            </Link>
            <span className="hidden sm:inline-block text-[11px] text-amber-200/60 bg-amber-950/40 border border-amber-800/30 px-2.5 py-0.5 rounded-full font-medium">
              Sistem Keuangan Internal
            </span>
          </div>

          {/* Sisi Kanan: Informasi Pengguna & Badge Peran */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[#fdfaf6]">
                {profile.nama_lengkap}
              </p>
              <p className="text-[10px] text-[#a89f91]">
                {profile.jabatan}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${roleBadgeStyle}`}
            >
              {profile.peran}
            </span>
          </div>
        </header>

        {/* Konten Halaman (Full-width fluid tanpa batasan max-w-7xl) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

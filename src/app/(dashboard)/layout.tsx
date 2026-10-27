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
        <header className="h-18 md:h-20 border-b border-amber-900/20 bg-[#090807]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 select-none">
          {/* Sisi Kiri: Identitas Brand & Sistem */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3.5 group transition-opacity hover:opacity-95"
            >
              {/* Logo Resmi CV Batik Larasati (Ukuran Diperbesar & Jelas) */}
              <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.35)] shrink-0 bg-[#120b07] ring-1 ring-amber-400/25 p-0.5">
                <Image
                  src="/images/logo-batik-larasati.png"
                  alt="Logo CV Batik Larasati"
                  fill
                  sizes="(max-width: 768px) 48px, 56px"
                  priority
                  className="object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-base md:text-lg lg:text-xl font-bold tracking-tight text-[#fdfaf6] group-hover:text-amber-300 transition-colors">
                    CV Batik Larasati
                  </h1>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse" />
                </div>
                <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] md:text-xs text-amber-300/80 tracking-wider uppercase font-medium">
                  <span>Surakarta</span>
                  <span className="text-amber-500/40">•</span>
                  <span>Sistem Keuangan Internal</span>
                </div>
              </div>
            </Link>
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

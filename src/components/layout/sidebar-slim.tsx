"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/constants/navigation";
import type { UserRole } from "@/types/database";
import { LogoBatikLarasati } from "@/components/ui/logo-batik-larasati";

interface SidebarSlimProps {
  items: NavItem[];
  profile: {
    id: string;
    nama_lengkap: string;
    peran: UserRole;
    jabatan: string;
  };
}

function getNavIcon(href: string) {
  switch (href) {
    case "/dashboard":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "/pengajuan":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case "/jurnal":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      );
    case "/buku-besar":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      );
    case "/mutasi-bank":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case "/laporan":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "/akun-periode":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "/pengguna-audit":
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export function SidebarSlim({ items, profile }: SidebarSlimProps) {
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const roleBadgeStyles = {
    direktur: "bg-purple-950/70 text-purple-300 border-purple-500/40",
    akuntan: "bg-blue-950/70 text-blue-300 border-blue-500/40",
    staf: "bg-emerald-950/70 text-emerald-300 border-emerald-500/40",
  }[profile.peran];

  return (
    <>
      {/* ============================================================ */}
      {/* DESKTOP SLIM ICON SIDEBAR (REFERENSI 2)                      */}
      {/* ============================================================ */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-20 bg-[#090807] border-r border-amber-900/20 flex-col justify-between items-center py-5 z-40 select-none">
        {/* Atas: Logo Monogram Canting Batik Larasati */}
        <div className="flex flex-col items-center">
          <Link
            href="/dashboard"
            aria-label="Kembali ke Dashboard"
            className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/35 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all duration-300 p-1"
          >
            {/* Logo Canting Resmi CV Batik Larasati */}
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#120b07]">
              <Image
                src="/images/logo-batik-larasati.png"
                alt="Logo CV Batik Larasati"
                fill
                sizes="48px"
                priority
                className="object-cover transform group-hover:scale-110 transition duration-300"
              />
            </div>
            <span className="sr-only">CV Batik Larasati</span>

            {/* Hover Tooltip untuk Logo */}
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#141210] text-[#fbf7f0] text-xs font-semibold rounded-md border border-amber-900/40 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
              CV Batik Larasati
            </div>
          </Link>
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mt-4" />
        </div>

        {/* Tengah: Tumpukan Navigasi Ikonik */}
        <nav className="flex flex-col items-center gap-2.5 w-full px-2" aria-label="Menu Utama">
          {items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <div key={item.href} className="relative group flex items-center justify-center w-full">
                <Link
                  href={item.href}
                  aria-label={item.title}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-br from-amber-500/25 to-amber-700/15 text-amber-300 border border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.25)]"
                      : "text-[#a89f91] hover:text-[#fdfaf6] hover:bg-[#1a1613] hover:border-amber-900/30 border border-transparent"
                  }`}
                >
                  {getNavIcon(item.href)}

                  {/* Indikator Garis Aktif di Sisi Kiri (Referensi 2) */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -left-2 top-2.5 bottom-2.5 w-1 bg-amber-400 rounded-r shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                    />
                  )}
                </Link>

                {/* Floating Tooltip Nama Menu */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#141210]/95 backdrop-blur-md text-[#fdfaf6] text-xs font-medium rounded-lg border border-amber-900/40 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 flex items-center gap-2">
                  <span>{item.title}</span>
                  {item.description && (
                    <span className="text-[10px] text-[#78716c] font-normal hidden lg:inline">
                      • {item.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bawah: Profil Pengguna & Form Keluar POST */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          <div className="w-8 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          {/* Avatar Inisial Pengguna */}
          <div className="relative group flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-950/60 to-[#120f0d] border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs shadow-inner cursor-default">
              {getInitials(profile.nama_lengkap)}
            </div>

            {/* Tooltip Detail Profil */}
            <div className="absolute left-full ml-3 bottom-0 px-3 py-2 bg-[#141210]/95 backdrop-blur-md rounded-lg border border-amber-900/40 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
              <p className="text-xs font-bold text-[#fdfaf6]">{profile.nama_lengkap}</p>
              <p className="text-[10px] text-[#a89f91]">{profile.jabatan}</p>
              <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${roleBadgeStyles}`}>
                {profile.peran}
              </span>
            </div>
          </div>

          {/* Form POST Tombol Keluar */}
          <form action="/auth/keluar" method="POST" className="w-full flex justify-center">
            <div className="relative group flex items-center justify-center">
              <button
                type="submit"
                aria-label="Keluar dari Sistem"
                className="w-10 h-10 rounded-xl text-[#78716c] hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40 border border-transparent flex items-center justify-center transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>

              {/* Tooltip Logout */}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#141210] text-rose-300 text-xs font-semibold rounded-md border border-rose-900/40 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50">
                Keluar
              </div>
            </div>
          </form>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM NAVIGATION BAR                                */}
      {/* ============================================================ */}
      <nav
        aria-label="Navigasi Menu Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090807]/95 backdrop-blur-lg border-t border-amber-900/25 px-2 flex items-center justify-around z-40"
      >
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition ${
                isActive
                  ? "text-amber-400"
                  : "text-[#a89f91] hover:text-[#fdfaf6]"
              }`}
            >
              <div className="w-5 h-5">{getNavIcon(item.href)}</div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5 max-w-[64px] truncate">
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* Tombol Logout Mobile */}
        <form action="/auth/keluar" method="POST" className="flex items-center">
          <button
            type="submit"
            aria-label="Keluar"
            className="flex flex-col items-center justify-center py-1 px-2 text-[#78716c] hover:text-rose-400 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="text-[10px] font-medium">Keluar</span>
          </button>
        </form>
      </nav>
    </>
  );
}

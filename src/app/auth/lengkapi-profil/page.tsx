import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LengkapiProfilForm } from "./lengkapi-profil-form";

export const metadata: Metadata = {
  title: "Lengkapi Profil Pengguna | CV BATIK LARASATI",
  description: "Lengkapi data jabatan dan peran akses untuk pengguna baru CV Batik Larasati.",
  robots: {
    index: false,
    follow: false,
  },
};

function sanitizeRedirectUrl(url: string | null): string {
  if (!url) return "/dashboard";
  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.startsWith("/\\") &&
    !url.includes("://")
  ) {
    return url;
  }
  return "/dashboard";
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LengkapiProfilPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const rawNext = typeof resolvedSearchParams.next === "string" ? resolvedSearchParams.next : null;
  const safeTarget = sanitizeRedirectUrl(rawNext);

  // 1. Verifikasi apakah ada sesi Supabase aktif
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Periksa apakah user SUDAH memiliki profil di tabel profiles
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, aktif")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    if (!profile.aktif) {
      redirect("/auth/keluar?error=inactive");
    }
    // Jika sudah punya profil aktif, langsung ke dashboard
    redirect(safeTarget);
  }

  const initialEmail = user.email || "";
  const initialName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined) ||
    null;

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-[#070605] text-[#fbf7f0] font-sans flex items-center justify-center p-4 md:p-8 select-none selection:bg-amber-500 selection:text-black">
      {/* 1. LATAR BELAKANG HERO BATIK + SINAR MATAHARI */}
      <div
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-0 pointer-events-none select-none"
      >
        <Image
          src="/images/hero-batik.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-right md:object-center scale-105 opacity-60"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#070605] via-[#070605]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-transparent to-[#070605]/60" />

        <div
          className="absolute -top-20 right-1/4 md:right-1/3 w-[55vw] max-w-[750px] h-[55vw] max-h-[750px] rounded-full animate-sun-pulse pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.4) 0%, rgba(217, 119, 6, 0.2) 40%, rgba(180, 83, 9, 0.05) 70%, transparent 85%)",
            filter: "blur(60px)",
            mixBlendMode: "screen",
          }}
        />

        <div
          className="absolute -top-10 right-10 w-[50vw] h-[90vh] opacity-25 transform -rotate-12 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(254, 243, 199, 0.4) 0%, rgba(245, 158, 11, 0.15) 30%, transparent 65%)",
            clipPath:
              "polygon(30% 0%, 70% 0%, 95% 100%, 75% 100%, 50% 0%, 15% 0%, 0% 100%, 10% 100%)",
            filter: "blur(25px)",
            mixBlendMode: "screen",
          }}
        />

        <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" />
      </div>

      {/* 2. GOLDEN BLUEPRINT GRID */}
      <div
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-[1] pointer-events-none select-none"
      >
        <div className="w-full h-full max-w-[1600px] mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 border-x border-amber-500/10">
          <div className="border-r border-amber-500/10 h-full relative">
            <span className="absolute top-20 -left-1.5 text-amber-400/40 font-mono text-[9px]">+</span>
          </div>
          <div className="border-r border-amber-500/10 h-full relative">
            <span className="absolute top-20 -left-1.5 text-amber-400/40 font-mono text-[9px]">+</span>
          </div>
          <div className="hidden md:block border-r border-amber-500/10 h-full relative">
            <span className="absolute bottom-24 -left-1.5 text-amber-400/40 font-mono text-[9px]">+</span>
          </div>
          <div className="hidden md:block border-r border-amber-500/10 h-full relative">
            <span className="absolute top-1/2 -left-1.5 text-amber-400/40 font-mono text-[9px]">+</span>
          </div>
          <div className="hidden lg:block border-r border-amber-500/10 h-full relative">
            <span className="absolute top-20 -left-1.5 text-amber-400/40 font-mono text-[9px]">+</span>
          </div>
          <div className="hidden lg:block h-full relative">
            <span className="absolute top-2/3 -right-1.5 text-amber-400/40 font-mono text-[9px]">+</span>
          </div>
        </div>
        <div className="absolute top-16 left-0 right-0 border-b border-amber-500/10" />
      </div>

      {/* 3. FLOATING CARD: TATA LETAK FORM LENGKAPI PROFIL */}
      <div className="relative z-10 w-full max-w-[560px] rounded-3xl border border-amber-500/35 shadow-[0_0_80px_rgba(245,158,11,0.18),0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden login-glass-card p-6 md:p-8">
        <div
          aria-hidden="true"
          className="absolute -top-28 left-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/15 blur-3xl pointer-events-none"
        />

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="inline-block px-3 py-1 mb-2.5 rounded text-[11px] font-mono font-bold tracking-widest uppercase bg-amber-500/15 text-amber-300 border border-amber-500/40">
              CV BATIK LARASATI · FINANCE
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-tight">
              Lengkapi Profil Karyawan
            </h1>
            <p className="text-xs md:text-sm text-amber-200/80 mt-1">
              Satu langkah lagi untuk menyelesaikan pendaftaran akun Anda
            </p>
          </div>

          <Link
            href="/auth/keluar"
            aria-label="Batalkan dan keluar"
            title="Batalkan dan keluar"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 border border-amber-500/30 text-amber-300 hover:text-white hover:bg-amber-500/20 hover:border-amber-400 active:scale-95 transition-all shrink-0 ml-3 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Link>
        </div>

        <div className="py-2">
          <Suspense
            fallback={
              <div className="py-6 text-center text-sm text-amber-200/50">
                Memuat formulir profil...
              </div>
            }
          >
            <LengkapiProfilForm
              initialEmail={initialEmail}
              initialName={initialName}
              avatarUrl={avatarUrl}
              nextTarget={safeTarget}
            />
          </Suspense>
        </div>

        <div className="border-t border-amber-500/20 pt-4 mt-2 text-center">
          <p className="text-[11px] text-amber-200/60 font-mono">
            CV Batik Larasati Surakarta · Sistem Tata Kelola Keuangan
          </p>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk Sistem",
  description: "Masuk ke Sistem Keuangan CV Batik Larasati",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-[#070605] text-[#fbf7f0] font-sans flex items-center justify-center p-8 select-none">
      {/* ============================================================ */}
      {/* 1. LATAR BELAKANG LANDING PAGE (HERO BATIK + SINAR MATAHARI) */}
      {/* ============================================================ */}
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

        {/* Gradasi Chiaroscuro Mewah */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070605] via-[#070605]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-transparent to-[#070605]/60" />

        {/* Pendaran Cahaya Emas Lembut Menyorot dari Atas */}
        <div
          className="absolute -top-20 right-1/4 md:right-1/3 w-[55vw] max-w-[750px] h-[55vw] max-h-[750px] rounded-full animate-sun-pulse pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.4) 0%, rgba(217, 119, 6, 0.2) 40%, rgba(180, 83, 9, 0.05) 70%, transparent 85%)",
            filter: "blur(60px)",
            mixBlendMode: "screen",
          }}
        />

        {/* Berkas Cahaya Matahari Miring (Angled Sunbeams) */}
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

        {/* Tekstur Garis Halus TV/Monitor Film (Subtle Scanline) */}
        <div className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]" />
      </div>

      {/* ============================================================ */}
      {/* 2. GOLDEN BLUEPRINT GRID (ESTETIKA TEKNIS LANDING PAGE)      */}
      {/* ============================================================ */}
      <div
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 z-[1] pointer-events-none select-none"
      >
        <div className="w-full h-full max-w-[1600px] mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 border-x border-amber-500/10">
          <div className="border-r border-amber-500/10 h-full relative">
            <span className="absolute top-20 -left-1.5 text-amber-400/40 font-mono text-[9px]">+</span>
            <span className="absolute top-2/3 -left-1.5 text-amber-400/40 font-mono text-[9px]">+</span>
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

        {/* Garis Horizontal Hairline Emas */}
        <div className="absolute top-16 left-0 right-0 border-b border-amber-500/10" />
      </div>

      {/* ============================================================ */}
      {/* 3. FLOATING CARD: TATA LETAK DESKTOP (LEBAR >= 1024 PX)      */}
      {/* Kartu Hitam Transparan dengan Mix Emas / Kuning Landing Page */}
      {/* ============================================================ */}
      <div className="relative z-10 w-full max-w-[960px] rounded-3xl border border-amber-500/35 shadow-[0_0_80px_rgba(245,158,11,0.18),0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden login-glass-card grid grid-cols-12 min-h-[540px]">
        {/* Pendaran Cahaya Emas Lembut di Bagian Atas Kartu */}
        <div
          aria-hidden="true"
          className="absolute -top-28 left-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/15 blur-3xl pointer-events-none"
        />

        {/* Kolom Kiri: Formulir Masuk */}
        <div className="col-span-6 p-8 lg:p-10 flex flex-col justify-between z-10 relative">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-block px-3 py-1 mb-3 rounded text-[11px] font-mono font-bold tracking-widest uppercase bg-amber-500/15 text-amber-300 border border-amber-500/40">
                CV BATIK LARASATI · FINANCE
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Masuk Sistem
              </h1>
              <p className="text-sm text-amber-200/80 mt-1">
                Lanjutkan untuk mengakses panel keuangan
              </p>
            </div>

            {/* Tombol X Kembali ke Halaman Utama */}
            <Link
              href="/"
              aria-label="Kembali ke halaman utama"
              title="Kembali ke halaman utama"
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

          <div className="my-auto py-4">
            <Suspense
              fallback={
                <div className="py-6 text-center text-sm text-amber-200/50">
                  Memuat formulir masuk...
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          <div className="border-t border-amber-500/20 pt-4 text-center">
            <p className="text-xs text-amber-200/70 font-mono">
              Portal internal CV Batik Larasati. Akses hanya untuk karyawan.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Grafis Halftone Batik Golden Hour (Dot-Matrix) */}
        <div
          aria-hidden="true"
          tabIndex={-1}
          className="col-span-6 relative overflow-hidden bg-black/60 flex items-center justify-center select-none pointer-events-none"
        >
          {/* Pendaran Cahaya Sinar Matahari Golden Hour di Belakang Motif Batik */}
          <div
            className="absolute -right-12 top-1/3 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(249, 115, 22, 0.4) 0%, rgba(245, 158, 11, 0.28) 40%, rgba(217, 119, 6, 0.12) 70%, transparent 85%)",
              filter: "blur(40px)",
              mixBlendMode: "screen",
            }}
          />

          {/* Gambar Halftone Batik Golden Hour dengan mask-image memudar di sisi kiri */}
          <Image
            src="/images/batik-golden-hour.webp"
            alt=""
            width={480}
            height={560}
            priority
            className="object-cover object-center h-full w-full mask-fade-left"
          />
        </div>
      </div>
    </div>
  );
}

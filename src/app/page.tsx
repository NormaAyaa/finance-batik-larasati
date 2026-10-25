import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "CV\\BATIK LARASATI | Sogan Heritage & Financial Governance",
  description:
    "Portal Resmi CV Batik Larasati Surakarta. Perpaduan mahakarya batik sogan klasik dengan tata kelola keuangan yang transparan dan akurat.",
};

export default function LandingPage() {
  const ctaLink = "/login";
  const ctaText = "Masuk Sistem Keuangan";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#070605] text-[#fbf7f0] font-sans select-none selection:bg-amber-500 selection:text-black">
      {/* ============================================================ */}
      {/* 1. FULL-SCREEN BACKGROUND: KAIN BATIK DENGAN SINAR MATAHARI */}
      {/* ============================================================ */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/images/hero-batik.jpg"
          alt="Batik Sogan Larasati Wayang & Parang"
          fill
          priority
          sizes="100vw"
          className="object-cover object-right md:object-center scale-105 opacity-60"
        />

        {/* Gradasi Chiaroscuro Mewah: Gelap di kiri (area teks), Terang di kanan (sorotan matahari & wayang) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070605] via-[#070605]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070605] via-transparent to-[#070605]/60" />

        {/* ============================================================ */}
        {/* 2. EFEK SINAR MATAHARI ESTETIK (DYNAMIC VOLUMETRIC SUNBEAM)  */}
        {/* ============================================================ */}
        {/* Pendaran Cahaya Emas Lembut Menyorot dari Atas */}
        <div
          aria-hidden="true"
          className="absolute -top-20 right-1/4 md:right-1/3 w-[55vw] max-w-[750px] h-[55vw] max-h-[750px] rounded-full animate-sun-pulse"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(251, 191, 36, 0.4) 0%, rgba(217, 119, 6, 0.2) 40%, rgba(180, 83, 9, 0.05) 70%, transparent 85%)",
            filter: "blur(60px)",
            mixBlendMode: "screen",
          }}
        />

        {/* Berkas Cahaya Matahari Miring (Angled Sunbeams) */}
        <div
          aria-hidden="true"
          className="absolute -top-10 right-10 w-[50vw] h-[90vh] opacity-25 transform -rotate-12"
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
      {/* 3. GOLDEN BLUEPRINT GRID (ESTETIKA TEKNIS ELEGAN & LEGA)    */}
      {/* ============================================================ */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
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
        <div className="absolute bottom-16 left-0 right-0 border-b border-amber-500/10" />
      </div>

      {/* ============================================================ */}
      {/* 4. KONTEN FULL-SCREEN UTAMA (IMMERSIVE SINGLE-VIEWPORT)       */}
      {/* ============================================================ */}
      <div className="relative z-10 h-full w-full max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col justify-between py-5">
        
        {/* --- HEADER ATAS: MINIMALIS & KREDIBEL (UKURAN FONT JELAS) --- */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="font-mono text-xs md:text-sm tracking-wider uppercase text-amber-400 font-semibold">
                [ SURAKARTA · EST. 2024 ]
              </span>
              <h1 className="text-xl md:text-2xl font-black tracking-widest text-white uppercase font-sans">
                CV\BATIK LARASATI
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-2.5 pl-4 border-l border-amber-500/30 font-mono text-xs md:text-sm text-amber-200 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>PORTAL KEUANGAN AKTIF</span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs md:text-sm text-amber-200">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-amber-500/30 bg-black/40 backdrop-blur-sm rounded font-medium">
              <span className="text-amber-400 font-bold">MOTIF:</span>
              <span className="text-white">WAYANG PURWA &amp; PARANG</span>
            </div>
            <span className="hidden lg:inline text-amber-300 font-semibold">07°33&apos;22.0&quot;S 110°49&apos;54.1&quot;E</span>
          </div>
        </header>

        {/* --- HERO AREA: TIPOGRAFI KINETIK ELEGAN & TATA LETAK LEGA --- */}
        <main className="my-auto py-4 relative flex flex-col justify-center">
          
          {/* Metadata Ticker Bar */}
          <div className="flex items-center gap-3.5 font-mono text-xs md:text-sm text-amber-300 mb-3.5">
            <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
              DOC.REF: BLS-FIN-2026
            </span>
            <span className="text-amber-400 font-bold">{"///"}</span>
            <span className="uppercase tracking-wider text-amber-100 font-medium">
              100% HAND-DRAWN SOGAN CRAFTSMANSHIP
            </span>
          </div>

          {/* Container Tipografi */}
          <div className="relative">
            {/* Layer Teks Stroke Transparan di Belakang (Ghost Lettering) */}
            <div
              aria-hidden="true"
              className="absolute -top-12 sm:-top-16 md:-top-24 left-0 text-stroke-white text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] font-black tracking-tighter opacity-10 select-none pointer-events-none uppercase"
            >
              LARASATI
            </div>

            {/* Headline Utama: Broken Kinetic Style (LA- RA- SATI) */}
            <div className="relative space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-4 sm:gap-x-6 md:gap-x-8">
                <span className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
                  LA-
                </span>
                <span className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-amber-400 uppercase drop-shadow-[0_4px_30px_rgba(245,158,11,0.35)]">
                  RA-
                </span>
                <span className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white uppercase drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
                  SATI
                </span>
                
                {/* Badge Disiplin Finansial */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs md:text-sm font-mono uppercase tracking-wider backdrop-blur-sm font-semibold">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  FINANCIAL DISCIPLINE
                </div>
              </div>

              {/* Sub-Headline: Kontras Bold & Italic Serif */}
              <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 md:gap-6 pt-1">
                <span className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#fbf7f0] uppercase">
                  ADIKARYA SOGAN.
                </span>
                <span className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-light italic text-amber-300 font-serif">
                  Akurasi Tata Kelola.
                </span>
              </div>
            </div>

            {/* Kalimat Pengantar Singkat & Tajam (Ukuran Lebih Besar & Jelas) */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-amber-50/95 leading-relaxed font-normal drop-shadow">
              Pelestarian seni batik klasik Surakarta yang berpadu dengan tata kelola keuangan modern — transparan, akuntabel, dan berintegritas tinggi.
            </p>

            {/* Tombol Utama (Primary CTA) */}
            <div className="mt-8 flex items-center gap-6">
              <Link
                href={ctaLink}
                className="group relative inline-flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black text-base md:text-lg font-black tracking-wider uppercase rounded-sm shadow-[0_0_35px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all"
              >
                <span>{ctaText}</span>
                <span className="text-xl transition-transform duration-300 group-hover:translate-x-1.5">
                  →
                </span>
              </Link>

              <div className="hidden sm:flex flex-col font-mono text-xs md:text-sm text-amber-200/80 border-l-2 border-amber-500/30 pl-4 font-medium leading-snug">
                <span>PORTAL RESMI OPERASIONAL</span>
                <span>INTERNAL CV BATIK LARASATI</span>
              </div>
            </div>

          </div>
        </main>

        {/* --- FOOTER BAWAH: JELAS & MUDAH DIBACA --- */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs md:text-sm text-amber-200/80 border-t border-amber-500/20 pt-3.5 font-medium">
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">© 2024–2026 CV BATIK LARASATI</span>
            <span>·</span>
            <span>SURAKARTA, JAWA TENGAH</span>
          </div>

          <div className="flex items-center gap-4 text-amber-300 font-semibold">
            <span>MULTI-TIER APPROVAL</span>
            <span>·</span>
            <span>AUTO BANK RECON</span>
            <span>·</span>
            <span>AI VISION EXTRACTION</span>
          </div>
        </footer>

      </div>
    </div>
  );
}

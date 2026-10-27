import React from "react";

export interface LogoBatikLarasatiProps {
  /**
   * Mode tampilan:
   * - "icon-only": Hanya simbol canting batik (cocok untuk slim sidebar, favicon, tombol ikon)
   * - "horizontal": Simbol di sisi kiri dan tipografi nama di sisi kanan (navbar, header, kuitansi)
   * - "vertical": Simbol di atas dan tipografi nama di bawah (hero banner, cover, splash)
   */
  variant?: "icon-only" | "horizontal" | "vertical";
  /**
   * Skema pewarnaan:
   * - "gold": Emas gradien mewah (optimal di background gelap/hitam/sogan)
   * - "dark": Cokelat sogan tua / monokrom gelap (optimal di dokumen cetak putih/faktur/PDF)
   * - "white": Putih perak bersih (kontras tinggi di background pekat)
   */
  colorScheme?: "gold" | "dark" | "white";
  /**
   * Ukuran preset atau gunakan className kustom
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Tampilkan subteks kota & tahun berdiri (Surakarta · Est. 2024)
   */
  showSubtitle?: boolean;
  className?: string;
  iconClassName?: string;
}

export function LogoBatikLarasati({
  variant = "horizontal",
  colorScheme = "gold",
  size = "md",
  showSubtitle = true,
  className = "",
  iconClassName = "",
}: LogoBatikLarasatiProps) {
  // Dimensi ikon berdasarkan size preset
  const sizeMap = {
    sm: { icon: "w-7 h-7", textTitle: "text-sm", textSub: "text-[9px]" },
    md: { icon: "w-10 h-10", textTitle: "text-base", textSub: "text-[10px]" },
    lg: { icon: "w-14 h-14", textTitle: "text-xl", textSub: "text-xs" },
    xl: { icon: "w-20 h-20", textTitle: "text-2xl", textSub: "text-sm" },
  };

  const currentSize = sizeMap[size];

  // ID unik untuk gradien SVG agar tidak konflik saat dirender beberapa kali
  const idSuffix = React.useId().replace(/:/g, "_");
  const goldGradId = `gold-grad-${idSuffix}`;
  const goldShineId = `gold-shine-${idSuffix}`;
  const woodGradId = `wood-grad-${idSuffix}`;
  const glowGradId = `glow-grad-${idSuffix}`;

  // Warna berdasarkan colorScheme
  const isDark = colorScheme === "dark";
  const isWhite = colorScheme === "white";

  const textColorClass = isDark
    ? "text-stone-900"
    : isWhite
    ? "text-white"
    : "text-amber-400";

  const subtitleColorClass = isDark
    ? "text-stone-600"
    : isWhite
    ? "text-stone-300"
    : "text-amber-200/80";

  const borderColorClass = isDark
    ? "border-stone-400"
    : isWhite
    ? "border-white/30"
    : "border-amber-500/30";

  // Elemen Simbol Canting + Ornamen Batik Sogan (Pure SVG)
  const renderIcon = (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${currentSize.icon} shrink-0 ${iconClassName}`}
      aria-hidden="true"
    >
      <defs>
        {/* Gradien Emas Mewah (Royal Sogan Gold) */}
        <linearGradient id={goldGradId} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#382314" : isWhite ? "#ffffff" : "#FDE68A"} />
          <stop offset="35%" stopColor={isDark ? "#24160C" : isWhite ? "#e2e8f0" : "#F59E0B"} />
          <stop offset="70%" stopColor={isDark ? "#452B19" : isWhite ? "#cbd5e1" : "#D97706"} />
          <stop offset="100%" stopColor={isDark ? "#1A0F07" : isWhite ? "#94a3b8" : "#B45309"} />
        </linearGradient>

        {/* Gradien Kilau Canting (Metallic Highlight) */}
        <linearGradient id={goldShineId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={isDark ? "#5C3A21" : isWhite ? "#ffffff" : "#FEF3C7"} />
          <stop offset="50%" stopColor={isDark ? "#24160C" : isWhite ? "#cbd5e1" : "#F59E0B"} />
          <stop offset="100%" stopColor={isDark ? "#784B2B" : isWhite ? "#ffffff" : "#FBBF24"} />
        </linearGradient>

        {/* Gradien Gagang Kayu / Bambu Canting */}
        <linearGradient id={woodGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? "#2A180E" : isWhite ? "#cbd5e1" : "#D97706"} />
          <stop offset="50%" stopColor={isDark ? "#170C06" : isWhite ? "#94a3b8" : "#92400E"} />
          <stop offset="100%" stopColor={isDark ? "#382314" : isWhite ? "#64748b" : "#78350F"} />
        </linearGradient>

        {/* Halo Glow Tipis */}
        <radialGradient id={glowGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isDark ? "#382314" : isWhite ? "#ffffff" : "#F59E0B"} stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Latar Belakang Lingkaran Halo Bersinar Lembut */}
      <circle cx="60" cy="60" r="54" fill={`url(#${glowGradId})`} />

      {/* 2. Cincin Luar Bermahkota Motif Tradisional (Cecek Batik & Bingkai Royal) */}
      <circle
        cx="60"
        cy="60"
        r="54"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.75"
        strokeDasharray="2 3.5"
        opacity="0.85"
      />
      <circle
        cx="60"
        cy="60"
        r="49"
        stroke={`url(#${goldGradId})`}
        strokeWidth="0.75"
        opacity="0.6"
      />

      {/* Ornamen Puncak & Aksen Arah Mata Angin / Candi */}
      <path
        d="M60 4 L63 9 L60 12 L57 9 Z"
        fill={`url(#${goldGradId})`}
      />
      <path
        d="M60 108 L63 111 L60 116 L57 111 Z"
        fill={`url(#${goldGradId})`}
      />
      <path
        d="M4 60 L9 57 L12 60 L9 63 Z"
        fill={`url(#${goldGradId})`}
      />
      <path
        d="M108 60 L111 57 L116 60 L111 63 Z"
        fill={`url(#${goldGradId})`}
      />

      {/* 3. Sulur Ornamen Parang & Lung-Lungan Batik (Lekukan Bawah Anggun) */}
      <path
        d="M32 82 C40 92, 54 94, 66 90 C78 86, 88 74, 88 64 C88 56, 82 50, 74 54 C66 58, 68 70, 60 74 C54 77, 46 72, 44 64 C42 56, 48 48, 56 46"
        stroke={`url(#${goldGradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M26 74 C34 82, 44 86, 54 84"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
      <path
        d="M72 82 C82 82, 92 76, 96 66"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />

      {/* Tetesan Cecek Batik (Titik Malam Tradisional) */}
      <circle cx="36" cy="88" r="1.5" fill={`url(#${goldGradId})`} />
      <circle cx="48" cy="94" r="1.75" fill={`url(#${goldGradId})`} />
      <circle cx="62" cy="96" r="1.75" fill={`url(#${goldGradId})`} />
      <circle cx="76" cy="92" r="1.5" fill={`url(#${goldGradId})`} />
      <circle cx="86" cy="82" r="1.5" fill={`url(#${goldGradId})`} />

      {/* 4. GAGANG CANTING (Kayu Halus / Bambu Tradisional, Menukik Anggun) */}
      <path
        d="M58 53 L92 28 C94 26.5, 96.5 27, 98 29 L100 31.5 C101.5 33, 101 35.5, 99.5 37 L65 62 Z"
        fill={`url(#${woodGradId})`}
        stroke={`url(#${goldGradId})`}
        strokeWidth="0.8"
      />
      {/* Cincin Tembaga Pengikat Gagang */}
      <path
        d="M66 47 L61 51 L64 55 L69 51 Z"
        fill={`url(#${goldShineId})`}
        stroke={`url(#${goldGradId})`}
        strokeWidth="0.5"
      />
      <line
        x1="78"
        y1="38"
        x2="82"
        y2="43"
        stroke={`url(#${goldGradId})`}
        strokeWidth="0.75"
        opacity="0.6"
      />
      <line
        x1="86"
        y1="32"
        x2="90"
        y2="37"
        stroke={`url(#${goldGradId})`}
        strokeWidth="0.75"
        opacity="0.6"
      />

      {/* 5. NYAMPLUNG CANTING (Wadah Tembaga Penampung Cairan Malam) */}
      {/* Wadah Mangkok Berisi Malam */}
      <path
        d="M45 52 C45 44, 58 40, 62 48 C65 54, 60 64, 52 66 C45 68, 45 58, 45 52 Z"
        fill={`url(#${goldShineId})`}
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.5"
      />
      {/* Bibir Lubang Nyamplung Canting */}
      <ellipse
        cx="54"
        cy="47"
        rx="6.5"
        ry="3.5"
        transform="rotate(-20 54 47)"
        fill={isDark ? "#170C06" : isWhite ? "#475569" : "#78350F"}
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.2"
      />
      {/* Pantulan Kilau Cahaya pada Wadah Canting */}
      <path
        d="M48 55 C48 51, 52 48, 56 49"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* 6. CUCUK CANTING (Corong Melengkung Presisi Pembentuk Motif) */}
      <path
        d="M46 62 C40 65, 34 68, 30 75 C29.5 76, 29 78, 26 78 C24.5 78, 25 76.5, 26.5 74.5 C29.5 70, 36 63, 44 59"
        fill={`url(#${goldGradId})`}
        stroke={`url(#${goldGradId})`}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 7. TETESAN MALAM KEEMASAN (Golden Wax Droplet - Jiwa dari Batik Tulis) */}
      <path
        d="M26 80 C26 80, 24 83, 24 84.5 C24 85.8, 25 87, 26.5 87 C28 87, 29 85.8, 29 84.5 C29 83, 26 80, 26 80 Z"
        fill={`url(#${goldGradId})`}
      />
      <circle cx="26.3" cy="84" r="0.8" fill="#FFFFFF" opacity="0.9" />

      {/* Jejak Aliran Lilin / Garis Canting Baru */}
      <path
        d="M27 89 C28 92, 30 94, 34 94"
        stroke={`url(#${goldGradId})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  // Jika hanya ikon, kembalikan langsung
  if (variant === "icon-only") {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        aria-label="Logo CV Batik Larasati"
      >
        {renderIcon}
      </div>
    );
  }

  // Tampilan Vertikal (Emblem di atas, Tipografi di bawah)
  if (variant === "vertical") {
    return (
      <div
        className={`flex flex-col items-center text-center gap-2.5 ${className}`}
        aria-label="Logo CV Batik Larasati"
      >
        <div className="relative group p-1 transition-transform duration-300 hover:scale-105">
          {renderIcon}
        </div>
        <div className="flex flex-col items-center">
          <span
            className={`font-serif tracking-[0.22em] uppercase font-bold ${currentSize.textTitle} ${textColorClass}`}
          >
            CV BATIK LARASATI
          </span>
          {showSubtitle && (
            <div
              className={`flex items-center gap-2 mt-1 border-t ${borderColorClass} pt-1 font-mono tracking-widest uppercase ${currentSize.textSub} ${subtitleColorClass}`}
            >
              <span>SURAKARTA</span>
              <span>•</span>
              <span>EST. 2024</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tampilan Horizontal (Default: Emblem di kiri, Tipografi di kanan)
  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${className}`}
      aria-label="Logo CV Batik Larasati"
    >
      <div className="relative shrink-0 transition-transform duration-300 hover:scale-105">
        {renderIcon}
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-serif tracking-[0.16em] uppercase font-bold ${currentSize.textTitle} ${textColorClass}`}
          >
            CV BATIK LARASATI
          </span>
        </div>
        {showSubtitle && (
          <div
            className={`flex items-center gap-1.5 mt-1 font-mono tracking-wider uppercase font-medium ${currentSize.textSub} ${subtitleColorClass}`}
          >
            <span>SURAKARTA</span>
            <span className="opacity-50">/</span>
            <span>HERITAGE SOGAN</span>
          </div>
        )}
      </div>
    </div>
  );
}

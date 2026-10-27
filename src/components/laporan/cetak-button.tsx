"use client";

interface CetakButtonProps {
  label?: string;
  className?: string;
}

export function CetakButton({
  label = "Cetak / Unduh PDF",
  className = "",
}: CetakButtonProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`btn-3d-dark no-print inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold ${className}`}
      title="Cetak laporan langsung atau simpan sebagai PDF lewat browser"
    >
      <svg
        className="w-4 h-4 text-amber-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}

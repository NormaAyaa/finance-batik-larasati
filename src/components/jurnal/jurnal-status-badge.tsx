import type { StatusJurnal, SumberJurnal } from "@/types/database";

interface JurnalStatusBadgeProps {
  status: StatusJurnal;
  className?: string;
}

export function JurnalStatusBadge({ status, className = "" }: JurnalStatusBadgeProps) {
  if (status === "diposting") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border tracking-wide bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)] ${className}`}
        title="Jurnal sudah diposting dan mengunci saldo buku besar"
        aria-label="Status: Diposting"
      >
        <span aria-hidden="true" className="font-extrabold text-sm sm:text-base">✓</span>
        <span>Diposting</span>
      </span>
    );
  }

  if (status === "dibalik") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border tracking-wide bg-purple-950/70 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.15)] ${className}`}
        title="Jurnal telah dibalik oleh jurnal pembalik koreksi"
        aria-label="Status: Dibalik"
      >
        <span aria-hidden="true" className="font-extrabold text-sm sm:text-base">↩</span>
        <span>Dibalik</span>
      </span>
    );
  }

  // Draf
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border tracking-wide bg-amber-950/70 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)] ${className}`}
      title="Draf jurnal belum diposting ke buku besar"
      aria-label="Status: Draf"
    >
      <span aria-hidden="true" className="font-extrabold text-sm sm:text-base">✎</span>
      <span>Draf</span>
    </span>
  );
}

interface JurnalSumberBadgeProps {
  sumber: SumberJurnal;
  className?: string;
}

export function JurnalSumberBadge({ sumber, className = "" }: JurnalSumberBadgeProps) {
  switch (sumber) {
    case "pembalik":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border tracking-wide bg-purple-950/60 text-purple-300 border-purple-500/30 ${className}`}
          title="Dihasilkan dari aksi pembalik jurnal"
        >
          <span aria-hidden="true">🔄</span>
          <span>Pembalik</span>
        </span>
      );
    case "pengajuan":
    case "pembayaran_pengajuan":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border tracking-wide bg-sky-950/60 text-sky-300 border-sky-500/30 ${className}`}
          title="Dihasilkan otomatis saat pembayaran pengajuan biaya disetujui"
        >
          <span aria-hidden="true">📄</span>
          <span>Pengajuan</span>
        </span>
      );
    case "manual":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border tracking-wide bg-stone-900/80 text-stone-300 border-stone-700/60 ${className}`}
          title="Pencatatan manual oleh Akuntan"
        >
          <span aria-hidden="true">✍</span>
          <span>Manual</span>
        </span>
      );
  }
}


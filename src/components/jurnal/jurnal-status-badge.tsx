import type { StatusJurnal, SumberJurnal } from "@/types/database";

interface JurnalStatusBadgeProps {
  status: StatusJurnal;
  className?: string;
}

export function JurnalStatusBadge({ status, className = "" }: JurnalStatusBadgeProps) {
  if (status === "diposting") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
        title="Jurnal sudah diposting dan mengunci saldo buku besar"
        aria-label="Status: Diposting"
      >
        <span aria-hidden="true" className="font-bold">✓</span>
        <span>Diposting</span>
      </span>
    );
  }

  if (status === "dibalik") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 ${className}`}
        title="Jurnal telah dibalik oleh jurnal pembalik koreksi"
        aria-label="Status: Dibalik"
      >
        <span aria-hidden="true" className="font-bold">↩</span>
        <span>Dibalik</span>
      </span>
    );
  }

  // Draf
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}
      title="Draf jurnal belum diposting ke buku besar"
      aria-label="Status: Draf"
    >
      <span aria-hidden="true" className="font-semibold">✎</span>
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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 ${className}`}
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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 ${className}`}
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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200 ${className}`}
          title="Pencatatan manual oleh Akuntan"
        >
          <span aria-hidden="true">✍</span>
          <span>Manual</span>
        </span>
      );
  }
}

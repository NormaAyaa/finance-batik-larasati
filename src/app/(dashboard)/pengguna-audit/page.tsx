import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Pengguna & Audit Log",
};

export default async function PenggunaAuditPage() {
  await requireAuth(["direktur"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna & Audit Log</h1>
        <p className="text-xs text-slate-500 mt-1">
          Area khusus Direktur: pengaturan peran pengguna dan pemantauan jejak audit (BR-12)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <h2 className="text-sm font-semibold text-slate-700">Kerangka Manajemen Pengguna</h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pengguna, kontrol aktivasi/penonaktifan akun, dan perubahan peran pengguna (Staf, Akuntan, Direktur) akan diimplementasikan di sini.
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <h2 className="text-sm font-semibold text-slate-700">Kerangka Audit Log</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tabel log immutable (pencatatan posting, pembalikan jurnal, verifikasi, pembayaran, tutup/buka periode, data lama vs baru) akan berada di sini.
          </p>
        </div>
      </div>
    </div>
  );
}

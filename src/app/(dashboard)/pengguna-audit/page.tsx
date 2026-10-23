import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PenggunaAuditView } from "@/components/pengguna-audit/pengguna-audit-view";
import type { Database } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengguna & Audit Log",
  description: "Manajemen peran pengguna dan log audit sistem CV Batik Larasati (BR-12)",
};

type AuditLogRow = Database["public"]["Tables"]["audit_log"]["Row"] & {
  pelaku?: {
    id: string;
    nama_lengkap: string;
    email: string;
    peran: string;
  } | null;
};

export default async function PenggunaAuditPage() {
  // Hanya Direktur yang berhak mengakses (BR-12, US-10).
  // Akuntan dan Staf akan dialihkan ke /dashboard oleh requireAuth. Pengunjung belum login ke /login.
  const { user } = await requireAuth(["direktur"]);

  // Menggunakan client Supabase pengguna yang sedang login (anon key + sesi cookie)
  const supabase = await createClient();

  // 1. Ambil data profil pengguna
  const { data: rawProfiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .order("peran", { ascending: true })
    .order("nama_lengkap", { ascending: true });

  if (profilesError) {
    console.error("Gagal mengambil data profiles:", profilesError);
  }

  // 2. Ambil catatan audit_log dengan paginasi awal .range(0, 9)
  const { data: rawAuditLogs, count, error: auditError } = await supabase
    .from("audit_log")
    .select(
      "id, waktu, pelaku_id, aksi, nama_tabel, id_data, data_lama, data_baru, pelaku:profiles!pelaku_id(id, nama_lengkap, email, peran)",
      { count: "exact" }
    )
    .order("waktu", { ascending: false })
    .order("id", { ascending: false })
    .range(0, 9);

  if (auditError) {
    console.error("Gagal mengambil data audit_log:", auditError);
  }

  const formattedAuditLogs: AuditLogRow[] = (rawAuditLogs || []).map((item) => ({
    ...item,
    pelaku: Array.isArray(item.pelaku) ? item.pelaku[0] : item.pelaku,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Manajemen Pengguna & Audit Log</h1>
        <p className="text-xs text-slate-500 mt-1">
          Area khusus Direktur: pengaturan peran pengguna dan pemantauan jejak audit (BR-12)
        </p>
      </div>

      <PenggunaAuditView
        initialUsers={rawProfiles || []}
        initialAuditLogs={formattedAuditLogs}
        initialAuditTotal={count ?? 0}
        currentUserId={user.id}
      />
    </div>
  );
}

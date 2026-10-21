import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PengajuanForm } from "@/components/pengajuan/pengajuan-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buat Pengajuan Baru",
  description: "Formulir pembuatan pengajuan biaya atau reimburse baru CV Batik Larasati",
};

export default async function BaruPengajuanPage() {
  // BR-09: Direktur tidak membuat pengajuan. Hanya Staf dan Akuntan yang diizinkan.
  const { user, profile } = await requireAuth(["staf", "akuntan"]);
  const supabase = await createClient();

  // BR-07: Ambil daftar akun beban yang aktif
  const { data: rawAccounts } = await supabase
    .from("akun")
    .select("id, kode, nama")
    .eq("tipe", "beban")
    .eq("aktif", true)
    .order("kode", { ascending: true });

  const expenseAccounts = rawAccounts || [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigasi */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-xs text-slate-500">
          <li>
            <Link href="/pengajuan" className="hover:text-slate-900 transition font-medium">
              ← Kembali ke Daftar Pengajuan
            </Link>
          </li>
        </ol>
      </nav>

      {/* Header Halaman */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Buat Pengajuan Baru
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Lengkapi rincian biaya atau reimburse sesuai aturan bisnis BR-07 CV Batik Larasati.
        </p>
      </div>

      {/* Formulir Pengajuan */}
      <PengajuanForm
        userRole={profile.peran as "staf" | "akuntan"}
        userId={user.id}
        expenseAccounts={expenseAccounts}
        mode="create"
      />
    </div>
  );
}

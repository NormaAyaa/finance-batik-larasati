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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Navigasi */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm sm:text-base text-[#a89f91]">
          <li>
            <Link href="/pengajuan" className="hover:text-amber-300 transition font-semibold flex items-center gap-1.5">
              <span aria-hidden="true">←</span> Kembali ke Daftar Pengajuan
            </Link>
          </li>
        </ol>
      </nav>

      {/* Header Halaman */}
      <div className="pb-3 border-b border-amber-900/20">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400/90">
            Formulir Pengajuan • CV Batik Larasati
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdfaf6] tracking-tight">
          Buat Pengajuan Baru
        </h1>
        <p className="text-sm sm:text-base text-[#a89f91] mt-1">
          Lengkapi rincian biaya operasional atau reimburse sesuai aturan bisnis BR-07 CV Batik Larasati.
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

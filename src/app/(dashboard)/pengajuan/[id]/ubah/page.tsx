import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PengajuanForm } from "@/components/pengajuan/pengajuan-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ubah Pengajuan",
  description: "Formulir perubahan pengajuan biaya atau reimburse CV Batik Larasati",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UbahPengajuanPage({ params }: PageProps) {
  // Hanya Staf dan Akuntan yang dapat mengubah pengajuan
  const { user, profile } = await requireAuth(["staf", "akuntan"]);
  const { id } = await params;
  const numId = Number(id);

  if (!numId || isNaN(numId)) {
    notFound();
  }

  const supabase = await createClient();

  // Ambil data pengajuan
  const { data: pengajuan, error } = await supabase
    .from("pengajuan")
    .select(`
      id,
      nomor,
      pengaju_id,
      jenis,
      tanggal_transaksi,
      akun_beban_id,
      jumlah,
      keterangan,
      bukti_path,
      bukti_hash,
      status,
      catatan_peninjau
    `)
    .eq("id", numId)
    .maybeSingle();

  if (error || !pengajuan) {
    notFound();
  }

  // BR-08: Hanya pemilik yang dapat mengubah pengajuannya
  if (pengajuan.pengaju_id !== user.id) {
    redirect(`/pengajuan/${id}`);
  }

  // BR-08: Pengaju hanya bisa mengubah pengajuan berstatus draf atau perlu_revisi
  if (pengajuan.status !== "draf" && pengajuan.status !== "perlu_revisi") {
    redirect(`/pengajuan/${id}`);
  }

  // Ambil akun beban yang aktif
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
            <Link href={`/pengajuan/${id}`} className="hover:text-amber-300 transition font-semibold flex items-center gap-1.5">
              <span aria-hidden="true">←</span> Kembali ke Detail Pengajuan
            </Link>
          </li>
        </ol>
      </nav>

      {/* Header Halaman */}
      <div className="pb-3 border-b border-amber-900/20">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-400/90">
            Perubahan Pengajuan • CV Batik Larasati
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#fdfaf6] tracking-tight">
          Ubah Pengajuan <span className="font-mono text-amber-300">{pengajuan.nomor ? `#${pengajuan.nomor}` : `(Draf #${pengajuan.id})`}</span>
        </h1>
        <p className="text-sm sm:text-base text-[#a89f91] mt-1">
          {pengajuan.status === "perlu_revisi"
            ? "Perbaiki data atau unggah nota bukti baru sesuai catatan peninjau."
            : "Perbarui rincian draf pengajuan Anda sebelum dikirimkan untuk verifikasi."}
        </p>
      </div>

      {/* Formulir Pengajuan Mode Edit */}
      <PengajuanForm
        userRole={profile.peran as "staf" | "akuntan"}
        userId={user.id}
        expenseAccounts={expenseAccounts}
        initialData={pengajuan}
        mode="edit"
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Jurnal",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetailJurnalPage({ params }: PageProps) {
  await requireAuth(["akuntan", "direktur"]);
  const { id } = await params;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/jurnal" className="hover:text-slate-900">
          ← Kembali ke Jurnal Umum
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Detail Jurnal #{id}</h1>
        <p className="text-xs text-slate-500 mt-1">
          Rincian baris debit-kredit dan opsi pembuatan jurnal pembalik (BR-04)
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-700">Kerangka Detail Jurnal</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Tampilan rincian baris akun, nominal debit/kredit seimbang, status posting, dan tombol Buat Jurnal Pembalik (koreksi BR-04) akan ada di sini.
        </p>
      </div>
    </div>
  );
}

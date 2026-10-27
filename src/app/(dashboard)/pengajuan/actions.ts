"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { kirimNotifikasiPengajuan } from "@/lib/notifikasi-email";
import type { StatusPengajuan } from "@/types/database";

export interface TransisiActionResult {
  success: boolean;
  error?: string;
  emailNotice?: string | null;
}

const ALLOWED_TARGET_STATUSES: StatusPengajuan[] = [
  "diajukan",
  "menunggu_direktur",
  "disetujui",
  "perlu_revisi",
  "ditolak",
  "dibatalkan",
];

/**
 * Server Action: Transisi status pengajuan melalui RPC resmi transisi_status_pengajuan
 * Aturan & Batasan:
 * 1. Menjaga sesi pengguna via cookies Supabase server sehingga auth.uid() tetap valid.
 * 2. Memvalidasi argumen klien secara ketat (id pengajuan bilangan bulat positif, status target sah).
 * 3. Menghalangi pesan Postgres mentah ke klien menggunakan getFriendlyErrorMessage.
 * 4. Membangun isi email notifikasi HANYA dari baris pengajuan resmi yang dikembalikan RPC (data)
 *    dan data profil yang dibaca di sisi server (tidak mengambil nomor, jumlah, atau catatan dari klien).
 * 5. Mengirimkan notifikasi email secara berurutan dan aman (kegagalan email tidak membatalkan transaksi DB).
 */
export async function transisiStatusPengajuanAction(params: {
  pengajuanId: number;
  targetStatus: StatusPengajuan;
  catatan?: string | null;
}): Promise<TransisiActionResult> {
  const { pengajuanId, targetStatus, catatan } = params;

  // 1. Validasi Argumen Input
  if (!Number.isInteger(pengajuanId) || pengajuanId <= 0) {
    return {
      success: false,
      error: "ID pengajuan tidak valid.",
    };
  }

  if (!ALLOWED_TARGET_STATUSES.includes(targetStatus)) {
    return {
      success: false,
      error: "Status target pengajuan tidak diizinkan.",
    };
  }

  // 2. Client Supabase Server (Sesi Pengguna / Cookie)
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Akses ditolak: Pengguna belum terautentikasi. Silakan login kembali.",
    };
  }

  // 3. Panggil RPC resmi transisi_status_pengajuan
  const { data: pengajuan, error: rpcError } = await supabase.rpc(
    "transisi_status_pengajuan",
    {
      p_pengajuan_id: pengajuanId,
      p_status_baru: targetStatus,
      p_catatan: catatan?.trim() || null,
    }
  );

  if (rpcError) {
    return {
      success: false,
      error: getFriendlyErrorMessage(rpcError),
    };
  }

  if (!pengajuan) {
    return {
      success: false,
      error: "Data pengajuan tidak ditemukan setelah pembaruan status.",
    };
  }

  // 4. Proses Notifikasi Email (HANYA jika status memicu email dan dari data baris resmi)
  let emailNotice: string | null = null;

  try {
    if (
      pengajuan.status === "disetujui" ||
      pengajuan.status === "perlu_revisi" ||
      pengajuan.status === "ditolak"
    ) {
      console.log("[pengajuan:transisi] Memproses notifikasi email status pengajuan:", {
        pengajuanId: pengajuan.id,
        nomor: pengajuan.nomor,
        statusBaru: pengajuan.status,
        pengajuId: pengajuan.pengaju_id,
        penyetujuId: user.id,
      });

      // Baca profil pengaju dari server
      const { data: pengajuProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, email, aktif")
        .eq("id", pengajuan.pengaju_id)
        .maybeSingle();

      if (profileError) {
        console.error("[pengajuan:transisi] Error membaca profil pengaju:", profileError.message);
      }

      console.log("[pengajuan:transisi] Profil pengaju:", {
        ditemukan: !!pengajuProfile,
        aktif: pengajuProfile?.aktif ?? false,
      });

      const notifResult = await kirimNotifikasiPengajuan({
        pengajuan: {
          id: pengajuan.id,
          nomor: pengajuan.nomor,
          jenis: pengajuan.jenis,
          jumlah: pengajuan.jumlah,
          status: pengajuan.status,
          catatan_peninjau: pengajuan.catatan_peninjau,
        },
        actorId: user.id,
        pengajuProfile,
      });

      console.log("[pengajuan:transisi] Hasil pengiriman notifikasi pengaju:", {
        success: notifResult.success,
        count: notifResult.count,
        notice: notifResult.notice ?? "-",
      });

      if (notifResult.notice) {
        emailNotice = `[v2] ${notifResult.notice}`;
      } else {
        emailNotice = notifResult.success
          ? "[v2] Notifikasi email dilewati"
          : "[v2] Notifikasi email tidak terkirim";
      }
    } else if (pengajuan.status === "menunggu_direktur") {
      console.log("[pengajuan:transisi] Memproses notifikasi email eskalasi Direktur:", {
        pengajuanId: pengajuan.id,
        nomor: pengajuan.nomor,
        actorId: user.id,
      });

      // Baca semua profil Direktur aktif dari server
      const { data: direkturProfiles, error: dirError } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, email, aktif")
        .eq("peran", "direktur")
        .eq("aktif", true);

      if (dirError) {
        console.error("[pengajuan:transisi] Error membaca profil Direktur:", dirError.message);
      }

      const notifResult = await kirimNotifikasiPengajuan({
        pengajuan: {
          id: pengajuan.id,
          nomor: pengajuan.nomor,
          jenis: pengajuan.jenis,
          jumlah: pengajuan.jumlah,
          status: pengajuan.status,
          catatan_peninjau: pengajuan.catatan_peninjau,
        },
        actorId: user.id,
        direkturProfiles: direkturProfiles || [],
      });

      console.log("[pengajuan:transisi] Hasil pengiriman notifikasi direktur:", {
        success: notifResult.success,
        count: notifResult.count,
        notice: notifResult.notice ?? "-",
      });

      if (notifResult.notice) {
        emailNotice = `[v2] ${notifResult.notice}`;
      } else {
        emailNotice = notifResult.success
          ? "[v2] Notifikasi email dilewati"
          : "[v2] Notifikasi email tidak terkirim";
      }
    }
  } catch (emailErr) {
    // Non-blocking: kegagalan email tidak boleh membatalkan perpindahan status
    console.error("[pengajuan:transisi] Pengecualian pada proses notifikasi email:", emailErr);
    emailNotice = "[v2] Notifikasi email tidak terkirim";
  }

  // 5. Revalidasi cache halaman terkait
  revalidatePath(`/pengajuan/${pengajuanId}`);
  revalidatePath("/pengajuan");
  revalidatePath("/dashboard");

  return {
    success: true,
    emailNotice,
  };
}

/**
 * Server Action: Pembayaran pengajuan melalui RPC resmi bayar_pengajuan
 * Aturan & Batasan:
 * 1. Menjaga sesi pengguna via cookies Supabase server sehingga auth.uid() tetap valid.
 * 2. Memvalidasi argumen klien secara ketat (id pengajuan dan akun kas bilangan bulat positif, tanggal valid).
 * 3. Menghalangi pesan Postgres mentah ke klien menggunakan getFriendlyErrorMessage.
 * 4. Membangun isi email notifikasi HANYA dari baris pengajuan resmi yang dikembalikan RPC (data)
 *    dan data profil yang dibaca di sisi server.
 * 5. Mengirimkan notifikasi email ke Pengaju secara berurutan dan aman.
 */
export async function bayarPengajuanAction(params: {
  pengajuanId: number;
  akunKasId: number;
  tanggalBayar: string;
}): Promise<TransisiActionResult> {
  const { pengajuanId, akunKasId, tanggalBayar } = params;

  // 1. Validasi Argumen Input
  if (!Number.isInteger(pengajuanId) || pengajuanId <= 0) {
    return {
      success: false,
      error: "ID pengajuan tidak valid.",
    };
  }

  if (!Number.isInteger(akunKasId) || akunKasId <= 0) {
    return {
      success: false,
      error: "Silakan pilih akun kas atau bank pembayar yang valid.",
    };
  }

  if (!tanggalBayar || !/^\d{4}-\d{2}-\d{2}$/.test(tanggalBayar)) {
    return {
      success: false,
      error: "Format tanggal bayar tidak valid (gunakan format YYYY-MM-DD).",
    };
  }

  // 2. Client Supabase Server (Sesi Pengguna / Cookie)
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Akses ditolak: Pengguna belum terautentikasi. Silakan login kembali.",
    };
  }

  // 3. Panggil RPC resmi bayar_pengajuan
  const { data: pengajuan, error: rpcError } = await supabase.rpc(
    "bayar_pengajuan",
    {
      p_pengajuan_id: pengajuanId,
      p_akun_kas_id: akunKasId,
      p_tanggal_bayar: tanggalBayar,
    }
  );

  if (rpcError) {
    return {
      success: false,
      error: getFriendlyErrorMessage(rpcError),
    };
  }

  if (!pengajuan) {
    return {
      success: false,
      error: "Data pengajuan tidak ditemukan setelah pembayaran.",
    };
  }

  // 4. Notifikasi Email ke Pengaju bahwa pengajuan sudah dibayar
  let emailNotice: string | null = null;

  try {
    console.log("[pengajuan:bayar] Memproses notifikasi email pembayaran:", {
      pengajuanId: pengajuan.id,
      nomor: pengajuan.nomor,
      pengajuId: pengajuan.pengaju_id,
      actorId: user.id,
    });

    const { data: pengajuProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, email, aktif")
      .eq("id", pengajuan.pengaju_id)
      .maybeSingle();

    if (profileError) {
      console.error("[pengajuan:bayar] Error membaca profil pengaju:", profileError.message);
    }

    const notifResult = await kirimNotifikasiPengajuan({
      pengajuan: {
        id: pengajuan.id,
        nomor: pengajuan.nomor,
        jenis: pengajuan.jenis,
        jumlah: pengajuan.jumlah,
        status: pengajuan.status,
        catatan_peninjau: pengajuan.catatan_peninjau,
      },
      actorId: user.id,
      pengajuProfile,
    });

    console.log("[pengajuan:bayar] Hasil pengiriman notifikasi pembayaran:", {
      success: notifResult.success,
      count: notifResult.count,
      notice: notifResult.notice ?? "-",
    });

    if (notifResult.notice) {
      emailNotice = `[v2] ${notifResult.notice}`;
    } else {
      emailNotice = notifResult.success
        ? "[v2] Notifikasi email dilewati"
        : "[v2] Notifikasi email tidak terkirim";
    }
  } catch (emailErr) {
    console.error("[pengajuan:bayar] Pengecualian pada proses notifikasi email:", emailErr);
    emailNotice = "[v2] Notifikasi email tidak terkirim";
  }

  // 5. Revalidasi cache
  revalidatePath(`/pengajuan/${pengajuanId}`);
  revalidatePath("/pengajuan");
  revalidatePath("/dashboard");
  revalidatePath("/jurnal");

  return {
    success: true,
    emailNotice,
  };
}

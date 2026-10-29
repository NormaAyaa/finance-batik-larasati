"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getFriendlyErrorMessage } from "@/lib/utils/errors";
import { kirimNotifikasiPengajuan, type ProfileRecipient } from "@/lib/notifikasi-email";
import { getActiveProfilesByRoles, getProfileById } from "@/lib/notifikasi-server";
import { BUSINESS_RULES } from "@/lib/constants/rules";
import {
  formatPeringatanDuplikat,
  type CekDuplikatPengajuanParams,
  type HasilCekDuplikatPengajuan,
} from "@/lib/pengajuan/duplikat";
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
    // Ambil peran pelaku aksi saat ini
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("id, peran")
      .eq("id", user.id)
      .maybeSingle();
    const actorRole = actorProfile?.peran;

    // Helper untuk mengambil profil pengaju dengan fallback admin client jika terhalang RLS
    const fetchPengajuProfile = async () => {
      const { data: pProfile, error: pErr } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, email, aktif")
        .eq("id", pengajuan.pengaju_id)
        .maybeSingle();

      if (pErr || !pProfile) {
        return await getProfileById(pengajuan.pengaju_id);
      }
      return pProfile;
    };

    if (pengajuan.status === "diajukan") {
      console.log("[pengajuan:transisi] Memproses notifikasi email pengajuan baru (diajukan):", {
        pengajuanId: pengajuan.id,
        nomor: pengajuan.nomor,
        actorId: user.id,
        jumlah: pengajuan.jumlah,
      });

      // Ambil profil Akuntan dan Direktur via Admin Client (bypass RLS)
      const { profiles: recipientProfiles, errorNotice: rolesErrorNotice } =
        await getActiveProfilesByRoles(["akuntan", "direktur"]);

      if (rolesErrorNotice && recipientProfiles.length === 0) {
        emailNotice = rolesErrorNotice;
      } else {
        const akuntanProfiles = recipientProfiles.filter((p) => p.peran === "akuntan");
        const direkturProfiles = recipientProfiles.filter((p) => p.peran === "direktur");

        const notifResult = await kirimNotifikasiPengajuan({
          pengajuan: {
            id: pengajuan.id,
            nomor: pengajuan.nomor,
            jenis: pengajuan.jenis,
            jumlah: pengajuan.jumlah,
            status: pengajuan.status,
            catatan_peninjau: pengajuan.catatan_peninjau,
            updated_at: pengajuan.diajukan_pada || pengajuan.dibuat_pada || new Date().toISOString(),
          },
          actorId: user.id,
          akuntanProfiles,
          direkturProfiles,
          actorRole,
        });

        console.log("[pengajuan:transisi] Hasil pengiriman notifikasi diajukan:", {
          success: notifResult.success,
          count: notifResult.count,
          notice: notifResult.notice ?? "-",
        });

        if (notifResult.notice) {
          emailNotice = notifResult.notice;
        } else {
          emailNotice = notifResult.success
            ? "Notifikasi email dilewati"
            : "Notifikasi email tidak terkirim";
        }
      }
    } else if (pengajuan.status === "disetujui") {
      console.log("[pengajuan:transisi] Memproses notifikasi email status disetujui:", {
        pengajuanId: pengajuan.id,
        nomor: pengajuan.nomor,
        pengajuId: pengajuan.pengaju_id,
        penyetujuId: user.id,
        actorRole,
      });

      const pengajuProfile = await fetchPengajuProfile();
      const threshold = BUSINESS_RULES.SUBMISSION.DIRECTOR_APPROVAL_THRESHOLD;
      const isApprovedByDirector =
        actorRole === "direktur" || pengajuan.jumlah > threshold;

      let akuntanProfiles: ProfileRecipient[] = [];
      if (isApprovedByDirector) {
        const { profiles: akuntanList, errorNotice: akuntanErr } =
          await getActiveProfilesByRoles(["akuntan"]);
        if (akuntanErr && akuntanList.length === 0) {
          console.error("[pengajuan:transisi] Peringatan pembacaan profil akuntan:", akuntanErr);
        }
        akuntanProfiles = akuntanList;
      }

      const notifResult = await kirimNotifikasiPengajuan({
        pengajuan: {
          id: pengajuan.id,
          nomor: pengajuan.nomor,
          jenis: pengajuan.jenis,
          jumlah: pengajuan.jumlah,
          status: pengajuan.status,
          catatan_peninjau: pengajuan.catatan_peninjau,
          updated_at: pengajuan.disetujui_pada || pengajuan.dibuat_pada || new Date().toISOString(),
        },
        actorId: user.id,
        pengajuProfile,
        akuntanProfiles,
        actorRole,
      });

      console.log("[pengajuan:transisi] Hasil pengiriman notifikasi disetujui:", {
        success: notifResult.success,
        count: notifResult.count,
        notice: notifResult.notice ?? "-",
      });

      if (notifResult.notice) {
        emailNotice = notifResult.notice;
      } else {
        emailNotice = notifResult.success
          ? "Notifikasi email dilewati"
          : "Notifikasi email tidak terkirim";
      }
    } else if (
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

      const pengajuProfile = await fetchPengajuProfile();

      const notifResult = await kirimNotifikasiPengajuan({
        pengajuan: {
          id: pengajuan.id,
          nomor: pengajuan.nomor,
          jenis: pengajuan.jenis,
          jumlah: pengajuan.jumlah,
          status: pengajuan.status,
          catatan_peninjau: pengajuan.catatan_peninjau,
          updated_at: pengajuan.diverifikasi_pada || pengajuan.dibuat_pada || new Date().toISOString(),
        },
        actorId: user.id,
        pengajuProfile,
        actorRole,
      });

      console.log("[pengajuan:transisi] Hasil pengiriman notifikasi pengaju:", {
        success: notifResult.success,
        count: notifResult.count,
        notice: notifResult.notice ?? "-",
      });

      if (notifResult.notice) {
        emailNotice = notifResult.notice;
      } else {
        emailNotice = notifResult.success
          ? "Notifikasi email dilewati"
          : "Notifikasi email tidak terkirim";
      }
    } else if (pengajuan.status === "menunggu_direktur") {
      console.log("[pengajuan:transisi] Memproses notifikasi email eskalasi Direktur:", {
        pengajuanId: pengajuan.id,
        nomor: pengajuan.nomor,
        actorId: user.id,
      });

      // Baca semua profil Direktur aktif via admin client (bypass RLS)
      const { profiles: direkturProfiles, errorNotice: dirErrorNotice } =
        await getActiveProfilesByRoles(["direktur"]);

      if (dirErrorNotice && direkturProfiles.length === 0) {
        emailNotice = dirErrorNotice;
      } else {
        const notifResult = await kirimNotifikasiPengajuan({
          pengajuan: {
            id: pengajuan.id,
            nomor: pengajuan.nomor,
            jenis: pengajuan.jenis,
            jumlah: pengajuan.jumlah,
            status: pengajuan.status,
            catatan_peninjau: pengajuan.catatan_peninjau,
            updated_at: pengajuan.diverifikasi_pada || pengajuan.diajukan_pada || pengajuan.dibuat_pada || new Date().toISOString(),
          },
          actorId: user.id,
          direkturProfiles,
          actorRole,
        });

        console.log("[pengajuan:transisi] Hasil pengiriman notifikasi direktur:", {
          success: notifResult.success,
          count: notifResult.count,
          notice: notifResult.notice ?? "-",
        });

        if (notifResult.notice) {
          emailNotice = notifResult.notice;
        } else {
          emailNotice = notifResult.success
            ? "Notifikasi email dilewati"
            : "Notifikasi email tidak terkirim";
        }
      }
    }
  } catch (emailErr) {
    // Non-blocking: kegagalan email tidak boleh membatalkan perpindahan status
    console.error("[pengajuan:transisi] Pengecualian pada proses notifikasi email:", emailErr);
    emailNotice = "Notifikasi email tidak terkirim";
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

    let pengajuProfile = null;
    const { data: pProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, email, aktif")
      .eq("id", pengajuan.pengaju_id)
      .maybeSingle();

    if (profileError || !pProfile) {
      pengajuProfile = await getProfileById(pengajuan.pengaju_id);
    } else {
      pengajuProfile = pProfile;
    }

    const notifResult = await kirimNotifikasiPengajuan({
      pengajuan: {
        id: pengajuan.id,
        nomor: pengajuan.nomor,
        jenis: pengajuan.jenis,
        jumlah: pengajuan.jumlah,
        status: pengajuan.status,
        catatan_peninjau: pengajuan.catatan_peninjau,
        updated_at: pengajuan.dibayar_pada || pengajuan.dibuat_pada || new Date().toISOString(),
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
      emailNotice = notifResult.notice;
    } else {
      emailNotice = notifResult.success
        ? "Notifikasi email dilewati"
        : "Notifikasi email tidak terkirim";
    }
  } catch (emailErr) {
    console.error("[pengajuan:bayar] Pengecualian pada proses notifikasi email:", emailErr);
    emailNotice = "Notifikasi email tidak terkirim";
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

export interface CekDuplikatActionResult {
  success: boolean;
  error?: string;
  data?: HasilCekDuplikatPengajuan;
}

/**
 * Server Action: Pengecekan pengajuan duplikat untuk mencegah pengajuan ganda.
 * Aturan & Batasan:
 * 1. Menjaga sesi pengguna via cookies Supabase server sehingga auth.uid() tetap valid.
 * 2. Hanya membaca data milik pengguna sendiri (pengaju_id = auth.uid()) dan mematuhi RLS.
 * 3. Mengabaikan pengajuan yang berstatus 'ditolak' (karena pengajuan ditolak boleh diajukan ulang).
 * 4. Mendukung excludeId saat form dalam mode edit agar tidak mendeteksi diri sendiri.
 * 5. Prioritas pencocokan:
 *    a. bukti_hash sama -> duplikat PASTI
 *    b. tanggal_transaksi sama + jumlah sama -> duplikat KEMUNGKINAN
 */
export async function cekDuplikatPengajuanAction(
  params: CekDuplikatPengajuanParams
): Promise<CekDuplikatActionResult> {
  const { buktiHash, pengajuId, tanggalTransaksi, jumlah, excludeId } = params;

  // 1. Verifikasi Sesi Pengguna
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Akses ditolak: Pengguna belum terautentikasi.",
    };
  }

  // Patuhi keamanan: Cegah membaca data pengguna lain
  if (pengajuId && pengajuId !== user.id) {
    return {
      success: false,
      error: "Akses ditolak: Tidak dapat memeriksa data pengguna lain.",
    };
  }

  const targetPengajuId = user.id;

  try {
    // 2. Prioritas 1: Duplikat PASTI berdasarkan bukti_hash
    if (buktiHash && buktiHash.trim().length > 0) {
      let queryHash = supabase
        .from("pengajuan")
        .select("id, nomor, status, tanggal_transaksi, jumlah, keterangan, bukti_hash, pengaju_id")
        .eq("pengaju_id", targetPengajuId)
        .eq("bukti_hash", buktiHash.trim())
        .neq("status", "ditolak");

      if (excludeId && Number.isInteger(excludeId) && excludeId > 0) {
        queryHash = queryHash.neq("id", excludeId);
      }

      const { data: rowsHash, error: errHash } = await queryHash
        .order("id", { ascending: false })
        .limit(1);

      if (errHash) {
        return {
          success: false,
          error: getFriendlyErrorMessage(errHash),
        };
      }

      if (rowsHash && rowsHash.length > 0) {
        const item = rowsHash[0];
        return {
          success: true,
          data: {
            isDuplikat: true,
            jenisKecocokan: "pasti",
            pengajuan: {
              id: item.id,
              nomor: item.nomor,
              status: item.status,
              tanggal_transaksi: item.tanggal_transaksi,
              jumlah: item.jumlah,
              keterangan: item.keterangan,
            },
            pesanPeringatan: formatPeringatanDuplikat("pasti", item),
          },
        };
      }
    }

    // 3. Prioritas 2: Duplikat KEMUNGKINAN berdasarkan tanggal_transaksi dan jumlah
    if (tanggalTransaksi && typeof jumlah === "number" && jumlah > 0) {
      let querySim = supabase
        .from("pengajuan")
        .select("id, nomor, status, tanggal_transaksi, jumlah, keterangan, bukti_hash, pengaju_id")
        .eq("pengaju_id", targetPengajuId)
        .eq("tanggal_transaksi", tanggalTransaksi)
        .eq("jumlah", jumlah)
        .neq("status", "ditolak");

      if (excludeId && Number.isInteger(excludeId) && excludeId > 0) {
        querySim = querySim.neq("id", excludeId);
      }

      const { data: rowsSim, error: errSim } = await querySim
        .order("id", { ascending: false })
        .limit(1);

      if (errSim) {
        return {
          success: false,
          error: getFriendlyErrorMessage(errSim),
        };
      }

      if (rowsSim && rowsSim.length > 0) {
        const item = rowsSim[0];
        return {
          success: true,
          data: {
            isDuplikat: true,
            jenisKecocokan: "kemungkinan",
            pengajuan: {
              id: item.id,
              nomor: item.nomor,
              status: item.status,
              tanggal_transaksi: item.tanggal_transaksi,
              jumlah: item.jumlah,
              keterangan: item.keterangan,
            },
            pesanPeringatan: formatPeringatanDuplikat("kemungkinan", item),
          },
        };
      }
    }

    return {
      success: true,
      data: {
        isDuplikat: false,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: getFriendlyErrorMessage(err),
    };
  }
}

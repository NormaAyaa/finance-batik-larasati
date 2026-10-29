import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRecipient } from "@/lib/notifikasi-email";
import type { PeranPengguna } from "@/types/database";

export interface ActiveProfilesResult {
  profiles: ProfileRecipient[];
  errorNotice?: string;
}

/**
 * Mengambil daftar profil pengguna aktif berdasarkan peran (misal: 'akuntan', 'direktur')
 * dari tabel profiles menggunakan Supabase Admin Client (Service Role Key) untuk mem-bypass RLS.
 *
 * HANYA membaca kolom: id, nama_lengkap, email, aktif, peran.
 * HANYA digunakan di server (Route Handlers / Server Actions), jangan diekspos ke klien.
 *
 * Jika SUPABASE_SERVICE_ROLE_KEY kosong di environment, catat console.error yang jelas
 * dan kembalikan errorNotice (bukan diam-diam mengembalikan daftar kosong).
 */
export async function getActiveProfilesByRoles(
  roles: PeranPengguna[]
): Promise<ActiveProfilesResult> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    console.error(
      "[notifikasi-server] SUPABASE_SERVICE_ROLE_KEY kosong atau belum dipasang di environment server. " +
        "Pencarian penerima profil Akuntan/Direktur tidak dapat mem-bypass RLS tabel profiles."
    );
    return {
      profiles: [],
      errorNotice:
        "Konfigurasi server belum lengkap (SUPABASE_SERVICE_ROLE_KEY belum disetel), notifikasi email ke Akuntan/Direktur tidak dapat dikirim.",
    };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, nama_lengkap, email, aktif, peran")
      .in("peran", roles)
      .eq("aktif", true);

    if (error) {
      console.error(
        "[notifikasi-server] Gagal membaca profil pengguna berdasarkan peran:",
        error.message
      );
      return {
        profiles: [],
        errorNotice: `Gagal membaca profil penerima notifikasi: ${error.message}`,
      };
    }

    const profiles: ProfileRecipient[] = (data || []).map((p) => ({
      id: p.id,
      nama_lengkap: p.nama_lengkap,
      email: p.email,
      aktif: p.aktif,
      peran: p.peran,
    }));

    return { profiles };
  } catch (err: unknown) {
    console.error("[notifikasi-server] Pengecualian membaca profil via admin client:", err);
    return {
      profiles: [],
      errorNotice: "Terjadi kesalahan internal saat mengambil profil penerima notifikasi.",
    };
  }
}

/**
 * Mengambil profil satu pengguna berdasarkan ID menggunakan Supabase Admin Client.
 * Digunakan sebagai cadangan aman jika pembacaan dengan client sesi dibatasi oleh RLS.
 */
export async function getProfileById(id: string): Promise<ProfileRecipient | null> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    return null;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id, nama_lengkap, email, aktif, peran")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      nama_lengkap: data.nama_lengkap,
      email: data.email,
      aktif: data.aktif,
      peran: data.peran,
    };
  } catch {
    return null;
  }
}

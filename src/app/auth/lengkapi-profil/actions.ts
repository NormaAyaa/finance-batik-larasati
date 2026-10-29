"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PeranPengguna } from "@/types/database";

export interface SimpanProfilInput {
  nama_lengkap: string;
  jabatan: string;
  peran: PeranPengguna;
}

export interface SimpanProfilResult {
  success?: boolean;
  error?: string;
}

export async function simpanProfilAction(
  input: SimpanProfilInput
): Promise<SimpanProfilResult> {
  try {
    const { nama_lengkap, jabatan, peran } = input;

    // 1. Verifikasi sesi aktif pengguna saat ini
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      console.error("[simpanProfilAction] Sesi tidak valid:", userError);
      return {
        error: "Sesi tidak valid atau telah berakhir. Silakan masuk kembali.",
      };
    }

    // 2. Validasi Keberadaan Field
    if (!nama_lengkap?.trim() || !jabatan?.trim() || !peran) {
      return { error: "Semua kolom wajib diisi." };
    }

    // 3. Validasi Panjang Nama Lengkap & Jabatan
    if (nama_lengkap.trim().length < 3) {
      return { error: "Nama lengkap minimal 3 karakter." };
    }

    if (jabatan.trim().length < 2) {
      return { error: "Jabatan minimal 2 karakter." };
    }

    // 4. Validasi Peran Pengguna (Direktur hanya untuk Ibu Laras Prameswari)
    const cleanEmail = user.email.toLowerCase().trim();
    const isLaras =
      cleanEmail === "laras@larasati.test" ||
      cleanEmail === "direktur@mail-contoh.com" ||
      cleanEmail.includes("laras");

    const allowedRoles: PeranPengguna[] = isLaras
      ? ["staf", "akuntan", "direktur"]
      : ["staf", "akuntan"];

    if (!allowedRoles.includes(peran)) {
      if (peran === "direktur") {
        return {
          error: "Peran Direktur hanya diperuntukkan bagi Ibu Laras Prameswari.",
        };
      }
      return {
        error: "Peran pengguna tidak valid. Pilih Staf atau Akuntan.",
      };
    }

    const admin = createAdminClient();

    // 5. Cek apakah profil untuk user ID ini sudah ada
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return {
        error: "Profil untuk akun ini sudah terdaftar sebelumnya.",
      };
    }

    // 6. Cek apakah email sudah terdaftar pada profile lain
    const { data: existingEmailProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingEmailProfile && existingEmailProfile.id !== user.id) {
      return {
        error:
          "Email akun Google Anda sudah terdaftar dengan identitas lain. Hubungi Direktur.",
      };
    }

    // 7. Simpan Profil ke Tabel profiles dengan Admin Client (Bypass RLS Insert)
    let { error: profileError } = await admin.from("profiles").insert({
      id: user.id,
      nama_lengkap: nama_lengkap.trim(),
      email: cleanEmail,
      jabatan: jabatan.trim(),
      peran,
      aktif: true,
    });

    if (profileError) {
      console.warn(
        "[simpanProfilAction] Insert profil via admin client gagal, mencoba via client pengguna:",
        profileError.message
      );
      const userRes = await supabase.from("profiles").insert({
        id: user.id,
        nama_lengkap: nama_lengkap.trim(),
        email: cleanEmail,
        jabatan: jabatan.trim(),
        peran,
        aktif: true,
      });
      profileError = userRes.error;
    }

    if (profileError) {
      console.error("[simpanProfilAction] Gagal menyimpan data profil:", profileError);
      return {
        error: "Gagal menyimpan data profil pengguna. Silakan coba kembali.",
      };
    }

    // 8. Perbarui User Metadata di Supabase Auth
    try {
      await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          nama_lengkap: nama_lengkap.trim(),
          jabatan: jabatan.trim(),
          peran,
        },
      });
    } catch (metaErr) {
      console.warn(
        "[simpanProfilAction] Gagal memperbarui user_metadata auth (non-fatal):",
        metaErr
      );
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("[simpanProfilAction] Error tidak terduga:", err);
    return { error: "Terjadi kesalahan internal pada server." };
  }
}

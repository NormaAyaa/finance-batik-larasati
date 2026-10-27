import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PeranPengguna } from "@/types/database";

// Sesuai aturan: Pendaftaran mandiri (termasuk via Google) HANYA untuk staf dan akuntan
const ALLOWED_ROLES: PeranPengguna[] = ["staf", "akuntan"];

export async function POST(request: Request) {
  try {
    // 1. Verifikasi sesi aktif pengguna saat ini
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: "Sesi tidak valid atau telah berakhir. Silakan masuk kembali." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nama_lengkap, jabatan, peran } = body;

    // 2. Validasi Keberadaan Field
    if (!nama_lengkap?.trim() || !jabatan?.trim() || !peran) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    // 3. Validasi Panjang Nama Lengkap & Jabatan
    if (nama_lengkap.trim().length < 3) {
      return NextResponse.json(
        { error: "Nama lengkap minimal 3 karakter." },
        { status: 400 }
      );
    }

    if (jabatan.trim().length < 2) {
      return NextResponse.json(
        { error: "Jabatan minimal 2 karakter." },
        { status: 400 }
      );
    }

    // 4. Validasi Peran Pengguna (Direktur hanya untuk Ibu Laras Prameswari, selain itu Staf & Akuntan)
    const cleanEmail = user.email.toLowerCase().trim();
    const isLaras =
      cleanEmail === "larasatiyw@gmail.com" ||
      cleanEmail === "laras@larasati.test" ||
      cleanEmail.includes("laras");

    const allowedRoles: PeranPengguna[] = isLaras
      ? ["staf", "akuntan", "direktur"]
      : ["staf", "akuntan"];

    if (!allowedRoles.includes(peran as PeranPengguna)) {
      if (peran === "direktur") {
        return NextResponse.json(
          { error: "Peran Direktur hanya diperuntukkan bagi Ibu Laras Prameswari." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Peran pengguna tidak valid. Pilih Staf atau Akuntan." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 5. Cek apakah profil untuk user ID ini sudah ada
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "Profil untuk akun ini sudah terdaftar sebelumnya." },
        { status: 400 }
      );
    }

    // 6. Cek apakah email sudah terdaftar pada profile lain
    const { data: existingEmailProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingEmailProfile && existingEmailProfile.id !== user.id) {
      return NextResponse.json(
        { error: "Email akun Google Anda sudah terdaftar dengan identitas lain. Hubungi Direktur." },
        { status: 400 }
      );
    }

    // 7. Simpan Profil ke Tabel profiles dengan Admin Client (Bypass RLS Insert)
    const { error: profileError } = await admin.from("profiles").insert({
      id: user.id,
      nama_lengkap: nama_lengkap.trim(),
      email: cleanEmail,
      jabatan: jabatan.trim(),
      peran: peran as PeranPengguna,
      aktif: true,
    });

    if (profileError) {
      console.error("Gagal melengkapi profil pengguna:", profileError);
      return NextResponse.json(
        { error: "Gagal menyimpan data profil pengguna. Silakan coba kembali." },
        { status: 500 }
      );
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
      console.warn("Gagal memperbarui user_metadata auth (non-fatal):", metaErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profil berhasil disimpan! Anda telah resmi terdaftar.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Error pada rute lengkapi profil:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PeranPengguna } from "@/types/database";

const VALID_ROLES: PeranPengguna[] = ["staf", "akuntan", "direktur"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama_lengkap, email, jabatan, peran, password, konfirmasi_password } = body;

    // 1. Validasi Keberadaan Field
    if (
      !nama_lengkap?.trim() ||
      !email?.trim() ||
      !jabatan?.trim() ||
      !peran ||
      !password ||
      !konfirmasi_password
    ) {
      return NextResponse.json(
        { error: "Semua kolom wajib diisi." },
        { status: 400 }
      );
    }

    // 2. Validasi Nama Lengkap & Jabatan
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

    // 3. Validasi Peran Pengguna
    if (!VALID_ROLES.includes(peran as PeranPengguna)) {
      return NextResponse.json(
        { error: "Peran pengguna tidak valid. Pilih Staf, Akuntan, atau Direktur." },
        { status: 400 }
      );
    }

    // 4. Validasi Format Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 }
      );
    }

    // 5. Validasi Kata Sandi & Konfirmasi
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }

    if (password !== konfirmasi_password) {
      return NextResponse.json(
        { error: "Konfirmasi kata sandi tidak cocok dengan kata sandi." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 6. Periksa Apakah Email Sudah Terdaftar di Tabel Profiles
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda." },
        { status: 400 }
      );
    }

    // 7. Buat Pengguna di Supabase Auth (Admin API)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        nama_lengkap: nama_lengkap.trim(),
        jabatan: jabatan.trim(),
        peran,
      },
    });

    if (authError || !authData.user) {
      console.error("Gagal membuat user di Supabase Auth:", authError);
      return NextResponse.json(
        { error: authError?.message || "Gagal membuat akun autentikasi." },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // 8. Simpan Profil ke Tabel Public Profiles
    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      nama_lengkap: nama_lengkap.trim(),
      email: cleanEmail,
      jabatan: jabatan.trim(),
      peran: peran as PeranPengguna,
      aktif: true,
    });

    if (profileError) {
      console.error("Gagal menyimpan profil pengguna:", profileError);
      // Rollback: hapus user auth jika profil gagal dibuat
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Gagal menyimpan data profil pengguna. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Akun berhasil didaftarkan! Anda dapat langsung masuk ke sistem.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Error pada registrasi:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server saat registrasi." },
      { status: 500 }
    );
  }
}

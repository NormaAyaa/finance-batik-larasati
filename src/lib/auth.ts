import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database, UserRole } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthSession {
  user: User;
  profile: Profile;
}

/**
 * Mengambil sesi pengguna dan data profil dari tabel profiles.
 * Catatan RLS: Untuk akun nonaktif (aktif = false), query profiles mengembalikan 0 baris (null).
 */
export async function getCurrentProfile(): Promise<{
  user: User | null;
  profile: Profile | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, email, peran, jabatan, aktif, dibuat_pada")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { user, profile: null };
  }

  return { user, profile };
}

/**
 * Guard sisi server untuk dipanggil di setiap Server Component / Halaman:
 * 1. Belum login -> diarahkan ke /login
 * 2. Akun nonaktif / profile null akibat RLS -> diarahkan ke /auth/keluar?error=inactive
 *    (Route Handler /auth/keluar akan menghapus cookie sesi via signOut dan redirect ke /login)
 * 3. Peran tidak diizinkan -> diarahkan ke /dashboard (PRD Bagian 7)
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthSession> {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/login");
  }

  // Sesuai Revisi 1: Jika profile null (RLS) atau aktif === false, tolak dan bersihkan sesi
  if (!profile || !profile.aktif) {
    redirect("/auth/keluar?error=inactive");
  }

  // Sesuai PRD Bagian 7: Halaman terlarang diarahkan ke /dashboard
  if (allowedRoles && !allowedRoles.includes(profile.peran)) {
    redirect("/dashboard");
  }

  return { user, profile };
}

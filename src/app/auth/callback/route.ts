import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function sanitizeRedirectUrl(url: string | null): string {
  if (!url) return "/dashboard";
  if (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.startsWith("/\\") &&
    !url.includes("://")
  ) {
    return url;
  }
  return "/dashboard";
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const safeTarget = sanitizeRedirectUrl(rawNext);

  // Dapatkan base URL yang akurat (mendukung reverse proxy / custom domain)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : request.nextUrl.origin;

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user) {
        console.error("Gagal pertukaran kode OAuth Supabase:", error);
        return NextResponse.redirect(new URL("/login?error=oauth_error", baseUrl));
      }

      // Periksa apakah user sudah terdaftar di tabel profiles
      const admin = createAdminClient();
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id, peran, aktif")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Gagal memeriksa profil pengguna OAuth:", profileError);
      }

      // 1. Pengguna baru (belum memiliki profil di profiles)
      // Arahkan ke formulir lengkapi-profil untuk memilih peran (staf/akuntan) & jabatan
      if (!profile) {
        const lengkapiUrl = new URL("/auth/lengkapi-profil", baseUrl);
        if (safeTarget !== "/dashboard") {
          lengkapiUrl.searchParams.set("next", safeTarget);
        }
        return NextResponse.redirect(lengkapiUrl);
      }

      // 2. Pengguna terdaftar tetapi status nonaktif
      if (!profile.aktif) {
        return NextResponse.redirect(new URL("/auth/keluar?error=inactive", baseUrl));
      }

      // 3. Pengguna aktif terdaftar -> Lanjutkan ke target redirect yang aman
      return NextResponse.redirect(new URL(safeTarget, baseUrl));
    } catch (err) {
      console.error("Error tidak terduga pada callback OAuth:", err);
      return NextResponse.redirect(new URL("/login?error=oauth_error", baseUrl));
    }
  }

  // Jika tidak ada code parameter
  return NextResponse.redirect(new URL("/login?error=oauth_error", baseUrl));
}

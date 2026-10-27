import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

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
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");
  const safeTarget = sanitizeRedirectUrl(rawNext);

  // Dapatkan base URL yang akurat (mendukung reverse proxy / custom domain)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : request.nextUrl.origin;

  // 1. Tangani jika ada error langsung dari provider OAuth (Google / Supabase)
  if (oauthError || oauthErrorDesc) {
    console.error("OAuth callback error dari provider:", oauthError, oauthErrorDesc);
    const reason = encodeURIComponent(oauthErrorDesc || oauthError || "Otentikasi Google dibatalkan");
    return NextResponse.redirect(new URL(`/login?error=oauth_error&reason=${reason}`, baseUrl));
  }

  // 2. Jika kode autentikasi ada, lakukan pertukaran sesi
  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase environment variables missing");
      }

      // Siapkan redirect response target terlebih dahulu
      const targetUrl = new URL(safeTarget, baseUrl);
      const redirectResponse = NextResponse.redirect(targetUrl);

      // Tangani cookie store sisi server
      const cookieStore = await cookies();

      // Buat SSR client yang langsung menyinkronkan cookie sesi ke redirectResponse dan cookieStore
      const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                // Diabaikan jika konteks tidak mendukung mutasi langsung
              }
              redirectResponse.cookies.set(name, value, options);
            });
          },
        },
      });

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user) {
        console.error("Gagal pertukaran kode OAuth Supabase:", error);
        const reason = encodeURIComponent(error?.message || "Pertukaran sesi gagal");
        return NextResponse.redirect(new URL(`/login?error=oauth_error&reason=${reason}`, baseUrl));
      }

      const userEmail = data.user.email?.toLowerCase().trim();

      // 1. Cari profil menggunakan client sesi terautentikasi pengguna
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, email, peran, jabatan, aktif")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn("Pemeriksaan profil via client pengguna:", profileError.message);
      }

      let admin: ReturnType<typeof createAdminClient> | null = null;
      try {
        admin = createAdminClient();
      } catch (adminErr) {
        console.warn("Admin client fallback warning:", adminErr);
      }

      // 2. Jika profil belum ditemukan via user client, coba via admin
      if (!profile && admin) {
        const { data: adminProfile } = await admin
          .from("profiles")
          .select("id, nama_lengkap, email, peran, jabatan, aktif")
          .eq("id", data.user.id)
          .maybeSingle();
        if (adminProfile) profile = adminProfile;
      }

      // Jika belum ditemukan berdasarkan id, cari berdasarkan email (sinkronisasi akun)
      if (!profile && userEmail) {
        const clientToUse = admin || supabase;
        const { data: profileByEmail } = await clientToUse
          .from("profiles")
          .select("id, nama_lengkap, email, peran, jabatan, aktif")
          .eq("email", userEmail)
          .maybeSingle();

        if (profileByEmail) {
          try {
            await clientToUse
              .from("profiles")
              .update({ id: data.user.id })
              .eq("email", userEmail);
          } catch {
            // Abaikan jika RLS membatasi update
          }
          profile = { ...profileByEmail, id: data.user.id };
        }
      }

      // Auto-inisialisasi / pastikan peran resmi untuk akun inti jika profil belum lengkap:
      // 1. Laras -> Direktur
      // 2. Dimas -> Akuntan
      // 3. Rina -> Staf
      if (!profile && userEmail) {
        const isLaras =
          userEmail === "larasatiyw@gmail.com" ||
          userEmail === "laras@larasati.test" ||
          userEmail.includes("laras");
        const isDimas =
          userEmail === "dimaslrst@gmail.com" ||
          userEmail === "dimas@larasati.test" ||
          userEmail.includes("dimas");
        const isRina =
          userEmail === "rinalrsti@gmail.com" ||
          userEmail === "rina@larasati.test" ||
          userEmail.includes("rina");

        const clientToUse = admin || supabase;

        if (isLaras) {
          const newProfile = {
            id: data.user.id,
            email: userEmail,
            nama_lengkap: (data.user.user_metadata?.full_name as string) || "Laras Prameswari",
            peran: "direktur" as const,
            jabatan: "Direktur dan Pemilik",
            aktif: true,
          };
          try {
            await clientToUse.from("profiles").upsert(newProfile);
          } catch {}
          profile = newProfile;
        } else if (isDimas) {
          const newProfile = {
            id: data.user.id,
            email: userEmail,
            nama_lengkap: (data.user.user_metadata?.full_name as string) || "Dimas Arya Nugroho",
            peran: "akuntan" as const,
            jabatan: "Akuntan",
            aktif: true,
          };
          try {
            await clientToUse.from("profiles").upsert(newProfile);
          } catch {}
          profile = newProfile;
        } else if (isRina) {
          const newProfile = {
            id: data.user.id,
            email: userEmail,
            nama_lengkap: (data.user.user_metadata?.full_name as string) || "Rina Anggraini",
            peran: "staf" as const,
            jabatan: "Kepala Produksi",
            aktif: true,
          };
          try {
            await clientToUse.from("profiles").upsert(newProfile);
          } catch {}
          profile = newProfile;
        }
      }

      // 1. Pengguna baru (belum memiliki profil di profiles)
      // Arahkan ke formulir lengkapi-profil untuk memilih peran & jabatan
      if (!profile) {
        const lengkapiUrl = new URL("/auth/lengkapi-profil", baseUrl);
        if (safeTarget !== "/dashboard") {
          lengkapiUrl.searchParams.set("next", safeTarget);
        }
        const lengkapiResponse = NextResponse.redirect(lengkapiUrl);
        redirectResponse.cookies.getAll().forEach((c) => {
          lengkapiResponse.cookies.set(c.name, c.value, c);
        });
        return lengkapiResponse;
      }

      // 2. Pengguna terdaftar tetapi status nonaktif
      if (!profile.aktif) {
        return NextResponse.redirect(new URL("/auth/keluar?error=inactive", baseUrl));
      }

      // 3. Pengguna aktif terdaftar -> Lanjutkan ke target redirect dengan cookies sesi
      return redirectResponse;
    } catch (err: unknown) {
      console.error("Error tidak terduga pada callback OAuth:", err);
      const reason = encodeURIComponent(
        err instanceof Error ? err.message : "Terjadi kendala saat memproses login Google"
      );
      return NextResponse.redirect(new URL(`/login?error=oauth_error&reason=${reason}`, baseUrl));
    }
  }

  // Jika tidak ada parameter code maupun error
  return NextResponse.redirect(
    new URL("/login?error=oauth_error&reason=Kode+autentikasi+tidak+ditemukan", baseUrl)
  );
}

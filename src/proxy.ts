import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);

  // Helper untuk mempertahankan cookies Supabase SSR saat melakukan redirect
  const createRedirectResponse = (targetUrl: URL) => {
    const redirectResponse = NextResponse.redirect(targetUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // 1. Rute auth internal (/auth/), rute API publik (/api/auth/), dan /api/ekstrak-nota tidak dicegat
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/ekstrak-nota"
  ) {
    return supabaseResponse;
  }

  // 2. Halaman publik /login dan /register: jika sudah terautentikasi, langsung arahkan ke /dashboard
  if (pathname === "/login" || pathname === "/register") {
    if (user) {
      return createRedirectResponse(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // 3. Rute root (/) -> Halaman landing page publik
  // Jika pengguna sudah terautentikasi, langsung bawa ke dashboard agar tidak kembali ke landing page
  if (pathname === "/") {
    if (user) {
      return createRedirectResponse(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // 4. Semua rute lainnya terproteksi: jika belum login, arahkan ke /login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return createRedirectResponse(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (file aturan crawler)
     * - static image/asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

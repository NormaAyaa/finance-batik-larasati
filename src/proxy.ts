import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);

  // Helper untuk mempertahankan cookies Supabase SSR saat melakukan redirect
  const createRedirectResponse = (targetUrl: URL) => {
    const redirectResponse = NextResponse.redirect(targetUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // 1. Rute auth internal (/auth/) dan rute spesifik /api/ekstrak-nota tidak dicegat (proxy meneruskan supabaseResponse tanpa redirect ke /login agar route handler merespons status HTTP sendiri)
  if (pathname.startsWith("/auth/") || pathname === "/api/ekstrak-nota") {
    return supabaseResponse;
  }

  // 2. Halaman /login
  if (pathname === "/login") {
    // Jika ada parameter error (misal ?error=inactive), biarkan user di /login
    if (searchParams.has("error")) {
      return supabaseResponse;
    }
    // Jika user sudah login, arahkan langsung ke /dashboard
    if (user) {
      return createRedirectResponse(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // 3. Rute root (/) -> tidak ada halaman publik selain /login
  if (pathname === "/") {
    if (user) {
      return createRedirectResponse(new URL("/dashboard", request.url));
    }
    return createRedirectResponse(new URL("/login", request.url));
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

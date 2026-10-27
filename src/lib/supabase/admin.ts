import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase admin client dengan Service Role Key.
 * HANYA digunakan di lingkungan sisi server yang aman (Route Handlers / Server Actions).
 * Jika SUPABASE_SERVICE_ROLE_KEY belum dipasang di env hosting, gunakan anon key sebagai fallback aman.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rmwidxzdnrbgxeoxkapx.supabase.co";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

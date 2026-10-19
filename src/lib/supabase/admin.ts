import { createClient } from "@supabase/supabase-js";
import { retryFetch } from "@/lib/supabase/fetch";

/**
 * Service-role Supabase client for admin operations (creating / deleting auth
 * users). Server-only — never import this into client code.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: retryFetch },
  });
}

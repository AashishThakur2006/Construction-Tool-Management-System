import { NextRequest, NextResponse } from "next/server";
import type { Provider } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const ALLOWED: Provider[] = ["google", "github", "azure"];

/**
 * Server-initiated OAuth. The Plinth SPA is dependency-free, so instead of a
 * browser Supabase client it just does `location.href = /api/auth/oauth?...`.
 * We ask Supabase for the provider URL and redirect to it; the provider comes
 * back to /auth/callback which finishes the exchange.
 *
 * Enable the provider in the Supabase dashboard (Auth → Providers) and add
 * <origin>/auth/callback to its redirect allow-list.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const provider = searchParams.get("provider") as Provider | null;
  const next = searchParams.get("next") || "/app";

  if (!provider || !ALLOWED.includes(provider)) {
    return NextResponse.redirect(`${origin}/app?authError=Unsupported+provider`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    const msg = encodeURIComponent(
      error?.message || `${provider} sign-in is not enabled yet`
    );
    return NextResponse.redirect(`${origin}/app?authError=${msg}`);
  }
  return NextResponse.redirect(data.url);
}

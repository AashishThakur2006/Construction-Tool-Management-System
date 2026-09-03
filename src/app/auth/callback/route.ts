import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (and magic-link) callback. Supabase redirects here with a `code`;
 * we exchange it for a session cookie and send the user on to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/app";
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(`${origin}/app?authError=${encodeURIComponent(oauthError)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/app?authError=Missing+authorization+code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/app?authError=${encodeURIComponent(error.message)}`);
  }

  const dest = next.startsWith("/") ? next : "/app";
  return NextResponse.redirect(`${origin}${dest}`);
}

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSSRClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type Role = "OWNER" | "SITE_ENGINEER";

const DEV_USERS: Record<Role, { name: string; email: string }> = {
  OWNER: { name: "Dev Owner", email: "dev.owner@ctms.local" },
  SITE_ENGINEER: { name: "Dev Site Engineer", email: "dev.engineer@ctms.local" },
};

const DEV_PASSWORD = "dev-only-password";

// Development-only login bypass. Disabled in production builds.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const role: Role = body?.role === "OWNER" ? "OWNER" : "SITE_ENGINEER";
  const profile = DEV_USERS[role];

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create the dev user on first use (idempotent — ignore "already exists").
  const { error: createError } = await admin.auth.admin.createUser({
    email: profile.email,
    password: DEV_PASSWORD,
    email_confirm: true,
    user_metadata: { name: profile.name, role },
  });
  if (createError && !/already|exists|registered/i.test(createError.message)) {
    return NextResponse.json({ error: createError.message }, { status: 500 });
  }

  const supabase = await createSSRClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: DEV_PASSWORD,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

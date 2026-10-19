import { NextRequest, NextResponse } from "next/server";
import { createClient as createSSRClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import sql from "@/lib/db";
import { retryFetch } from "@/lib/supabase/fetch";
import { isLocalHost, limited, originGuard } from "@/lib/security";

type Kind = "owner" | "engineer";

const DEV_USERS: Record<
  Kind,
  { name: string; email: string; role: "OWNER" | "SITE_ENGINEER"; employeeId: string }
> = {
  owner: {
    name: "Rajendra Palekar",
    email: "rajendra@plinthops.in",
    role: "OWNER",
    employeeId: "E-001",
  },
  engineer: {
    name: "Priya Nair",
    email: "priya@plinthops.in",
    role: "SITE_ENGINEER",
    employeeId: "E-102",
  },
};

const DEV_PASSWORD = "demo1234";

// Development-only login bypass. Disabled in production builds.
export async function POST(request: NextRequest) {
  const host = request.headers.get("host");
  if (process.env.NODE_ENV === "production" || !isLocalHost(host)) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const blocked = originGuard(request) ?? limited(request, "dev-login", 20, 60_000);
  if (blocked) return blocked;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const kind: Kind = body?.role === "owner" || body?.role === "OWNER" ? "owner" : "engineer";
  const u = DEV_USERS[kind];

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: retryFetch } }
  );

  const supabase = await createSSRClient();
  const signIn = () => supabase.auth.signInWithPassword({ email: u.email, password: DEV_PASSWORD });

  // Fast path: the demo user already exists, so one call signs in.
  let { error } = await signIn();
  if (error) {
    const { error: createError } = await admin.auth.admin.createUser({
      email: u.email,
      password: DEV_PASSWORD,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role, employee_id: u.employeeId },
    });
    if (createError && !/already|exists|registered/i.test(createError.message)) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    ({ error } = await signIn());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Make sure the profile is linked even if it pre-existed.
  await sql`
    UPDATE profiles SET name = ${u.name}, role = ${u.role}, employee_id = ${u.employeeId}
    WHERE id = (SELECT id FROM auth.users WHERE email = ${u.email})
      AND (name IS DISTINCT FROM ${u.name} OR role IS DISTINCT FROM ${u.role} OR employee_id IS DISTINCT FROM ${u.employeeId})`;

  return NextResponse.json({ ok: true });
}

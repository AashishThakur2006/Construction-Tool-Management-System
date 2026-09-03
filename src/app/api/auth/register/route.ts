import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmail, str } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = str(body?.name);
  const email = str(body?.email).toLowerCase();
  const password = body?.password ?? "";
  const role = body?.role === "OWNER" ? "OWNER" : "SITE_ENGINEER";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required" },
      { status: 400 }
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  });

  if (error) {
    const status = /already registered|exists/i.test(error.message) ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  if (!data.session) {
    // Email confirmation is on for this project; the profile trigger has
    // still run, so the user can sign in once confirmed.
    return NextResponse.json(
      { ok: true, message: "Check your email to confirm your account." },
      { status: 201 }
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

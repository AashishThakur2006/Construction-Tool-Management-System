import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isEmail, str } from "@/lib/validation";
import { limited, originGuard, ownerSignupAllowed, passwordProblem } from "@/lib/security";

export async function POST(request: NextRequest) {
  const blocked = originGuard(request) ?? limited(request, "register", 5, 10 * 60_000);
  if (blocked) return blocked;
  const body = await request.json().catch(() => null);
  const name = str(body?.name);
  const email = str(body?.email).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  const wantsOwner = body?.role === "OWNER";
  if (wantsOwner && !ownerSignupAllowed()) {
    return NextResponse.json(
      { error: "Owner accounts are created by an existing Owner (Team page). Register as a Site Engineer." },
      { status: 403 }
    );
  }
  const role = wantsOwner ? "OWNER" : "SITE_ENGINEER";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email and password are required" },
      { status: 400 }
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  const weak = passwordProblem(password, email);
  if (weak) return NextResponse.json({ error: weak }, { status: 400 });
  if (name.length > 100) {
    return NextResponse.json({ error: "Name is too long" }, { status: 400 });
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

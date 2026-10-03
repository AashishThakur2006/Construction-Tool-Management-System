import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { limited, originGuard } from "@/lib/security";

export async function POST(request: NextRequest) {
  const blocked = originGuard(request) ?? limited(request, "login", 10, 60_000);
  if (blocked) return blocked;
  const body = await request.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  if (email.length > 254 || password.length > 128) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // per-account throttle on failures, so one address cannot be brute-forced from many IPs
    const per = limited(request, "login-fail", 8, 15 * 60_000, email);
    if (per) return per;
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }
  return NextResponse.json({ ok: true });
}

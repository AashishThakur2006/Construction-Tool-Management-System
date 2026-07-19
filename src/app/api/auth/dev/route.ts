import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession, Role } from "@/lib/auth";

const DEV_USERS: Record<Role, { name: string; email: string }> = {
  OWNER: { name: "Dev Owner", email: "dev.owner@ctms.local" },
  SITE_ENGINEER: { name: "Dev Site Engineer", email: "dev.engineer@ctms.local" },
};

// Development-only login bypass. Disabled in production builds.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const role: Role = body?.role === "SITE_ENGINEER" ? "SITE_ENGINEER" : "OWNER";
  const profile = DEV_USERS[role];

  let user = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(profile.email) as { id: number } | undefined;

  if (!user) {
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
      )
      .run(profile.name, profile.email, bcrypt.hashSync("dev-only", 10), role);
    user = { id: Number(result.lastInsertRowid) };
  }

  await createSession({
    id: user.id,
    name: profile.name,
    email: profile.email,
    role,
  });
  return NextResponse.json({ ok: true });
}

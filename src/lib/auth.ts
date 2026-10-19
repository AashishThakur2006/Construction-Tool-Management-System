import { createClient } from "@/lib/supabase/server";
import sql from "@/lib/db";

export type Role = "OWNER" | "SITE_ENGINEER";

export type Session = {
  userId: string; // auth.users uuid
  employeeId: string | null; // linked employees.id, e.g. "E-102"
  name: string;
  email: string;
  role: Role;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Current user from the Supabase session cookie, joined to public.profiles. */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  // getClaims verifies the JWT locally (cached JWKS) instead of a network
  // round-trip to Supabase Auth on every API call.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const user = {
    id: claims.sub,
    email: claims.email as string | undefined,
    user_metadata: claims.user_metadata as Record<string, unknown> | undefined,
  };

  const rows = await sql<
    { name: string; role: Role; employee_id: string | null }[]
  >`SELECT name, role, employee_id FROM profiles WHERE id = ${user.id}`;

  const profile = rows[0];
  const meta = (user.user_metadata ?? {}) as {
    name?: string;
    role?: string;
    employee_id?: string;
  };

  return {
    userId: user.id,
    employeeId: profile?.employee_id ?? meta.employee_id ?? null,
    email: user.email ?? "",
    name: profile?.name || meta.name || (user.email ?? "").split("@")[0],
    role: profile?.role ?? (meta.role === "OWNER" ? "OWNER" : "SITE_ENGINEER"),
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated", 401);
  return session;
}

export async function requireOwner(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== "OWNER") {
    throw new AuthError("Only the Owner can perform this action", 403);
  }
  return session;
}

/** Plinth display role. */
export function roleLabel(role: Role): "Owner" | "Site Engineer" {
  return role === "OWNER" ? "Owner" : "Site Engineer";
}

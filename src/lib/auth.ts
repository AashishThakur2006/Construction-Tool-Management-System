import { createClient } from "@/lib/supabase/server";
import sql from "@/lib/db";

export type Role = "OWNER" | "SITE_ENGINEER";

export type Session = {
  id: string; // auth.users uuid
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

/**
 * Resolves the current user from the Supabase session cookie and joins in
 * their app role/name from `public.profiles`. Returns null when signed out.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rows = await sql<
    { name: string; role: Role }[]
  >`SELECT name, role FROM profiles WHERE id = ${user.id}`;

  const profile = rows[0];
  const meta = (user.user_metadata ?? {}) as { name?: string; role?: string };

  return {
    id: user.id,
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

export async function requireRole(role: Role): Promise<Session> {
  const session = await requireSession();
  if (session.role !== role) {
    throw new AuthError(
      `Only ${role === "OWNER" ? "Owner" : "Site Engineer"} can perform this action`,
      403
    );
  }
  return session;
}

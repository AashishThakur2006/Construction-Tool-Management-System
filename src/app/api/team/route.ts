import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { errorResponse, badRequest } from "@/lib/api";
import { isEmail, str } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";

/** List every account, joined to its email and linked employee. Owner only. */
export async function GET() {
  try {
    const owner = await requireOwner();
    const rows = await sql`
      SELECT p.id, p.name, p.role, p.employee_id AS "employeeId",
             u.email, u.created_at AS "createdAt",
             e.name AS "employeeName",
             (p.id = ${owner.userId}) AS "isSelf"
      FROM profiles p
      JOIN auth.users u ON u.id = p.id
      LEFT JOIN employees e ON e.id = p.employee_id
      ORDER BY u.created_at`;
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

/** Create an account. Returns the temporary password to hand to the person. */
export async function POST(request: NextRequest) {
  try {
    await requireOwner();
    const body = await request.json();
    const email = str(body.email).toLowerCase();
    const name = str(body.name);
    const role = body.role === "OWNER" ? "OWNER" : "SITE_ENGINEER";
    const employeeId = str(body.employeeId) || null;

    if (!name || !isEmail(email)) return badRequest("A name and a valid email are required");

    if (employeeId) {
      const [emp] = await sql`SELECT id FROM employees WHERE id = ${employeeId}`;
      if (!emp) return badRequest("That employee id does not exist");
    }

    const tempPassword =
      "plinth-" + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role, employee_id: employeeId },
    });
    if (error) {
      const status = /already|registered|exists/i.test(error.message) ? 409 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }

    // The signup trigger writes the profile; make sure it reflects intent.
    await sql`
      INSERT INTO profiles (id, name, role, employee_id)
      VALUES (${data.user!.id}, ${name}, ${role}, ${employeeId})
      ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name, role = EXCLUDED.role, employee_id = EXCLUDED.employee_id`;

    return NextResponse.json({ id: data.user!.id, email, tempPassword }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

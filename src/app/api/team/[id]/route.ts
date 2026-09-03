import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { str } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";

/** Update a member's name, role or linked employee. Owner only. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id } = await params;
    const body = await request.json();

    const role = body.role === "OWNER" || body.role === "SITE_ENGINEER" ? body.role : undefined;
    const name = body.name != null ? str(body.name) : undefined;
    const employeeId = body.employeeId !== undefined ? (str(body.employeeId) || null) : undefined;

    if (id === owner.userId && role === "SITE_ENGINEER") {
      return badRequest("You can't demote your own account");
    }
    if (employeeId) {
      const [emp] = await sql`SELECT id FROM employees WHERE id = ${employeeId}`;
      if (!emp) return badRequest("That employee id does not exist");
    }

    const patch: Record<string, unknown> = {};
    if (role !== undefined) patch.role = role;
    if (name !== undefined) patch.name = name;
    if (employeeId !== undefined) patch.employee_id = employeeId;
    if (Object.keys(patch).length === 0) return badRequest("Nothing to update");

    const result = await sql`UPDATE profiles SET ${sql(patch)} WHERE id = ${id}`;
    if (result.count === 0) return notFound("Account not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Remove an account. Owner only; can't remove yourself. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id } = await params;
    if (id === owner.userId) return badRequest("You can't remove your own account");

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { oneOf, str, EMPLOYEE_ROLES, EMPLOYEE_STATUSES } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const name = str(body.name);
    if (!name) return badRequest("Employee name is required");

    const result = await sql`
      UPDATE employees SET
        name = ${name},
        role = ${oneOf(body.role, EMPLOYEE_ROLES, "OPERATOR")},
        phone = ${str(body.phone)},
        email = ${str(body.email)},
        status = ${oneOf(body.status, EMPLOYEE_STATUSES, "ACTIVE")}
      WHERE id = ${id}`;
    if (result.count === 0) return notFound("Employee not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("OWNER");
    const { id } = await params;
    const result = await sql`DELETE FROM employees WHERE id = ${id}`;
    if (result.count === 0) return notFound("Employee not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse, badRequest } from "@/lib/api";
import { oneOf, str, EMPLOYEE_ROLES, EMPLOYEE_STATUSES } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const like = `%${request.nextUrl.searchParams.get("q") ?? ""}%`;
    const rows = await sql`
      SELECT * FROM employees
      WHERE name ILIKE ${like} OR role ILIKE ${like}
         OR phone ILIKE ${like} OR email ILIKE ${like}
      ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const name = str(body.name);
    if (!name) return badRequest("Employee name is required");

    const [row] = await sql`
      INSERT INTO employees (name, role, phone, email, status)
      VALUES (
        ${name},
        ${oneOf(body.role, EMPLOYEE_ROLES, "OPERATOR")},
        ${str(body.phone)},
        ${str(body.email)},
        ${oneOf(body.status, EMPLOYEE_STATUSES, "ACTIVE")}
      )
      RETURNING id`;
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

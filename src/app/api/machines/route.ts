import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest } from "@/lib/api";
import { dateOrNull, str } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const like = `%${request.nextUrl.searchParams.get("q") ?? ""}%`;
    const rows = await sql`
      SELECT m.*, p.name AS project_name
      FROM machines m
      LEFT JOIN projects p ON p.id = m.project_id
      WHERE m.name ILIKE ${like} OR m.type ILIKE ${like}
         OR m.model ILIKE ${like} OR m.status ILIKE ${like}
      ORDER BY m.created_at DESC`;
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("OWNER");
    const body = await request.json();
    const name = str(body.name);
    if (!name) return badRequest("Machine name is required");

    const [row] = await sql`
      INSERT INTO machines (name, type, model, status, purchase_date)
      VALUES (${name}, ${str(body.type)}, ${str(body.model)}, 'AVAILABLE', ${dateOrNull(body.purchase_date)})
      RETURNING id`;
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest } from "@/lib/api";
import { clamp, dateOrNull, money, oneOf, str, PROJECT_STATUSES } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const like = `%${request.nextUrl.searchParams.get("q") ?? ""}%`;
    const rows = await sql`
      SELECT id, name, location, status, start_date, end_date,
             budget::float8 AS budget, progress, created_at
      FROM projects
      WHERE name ILIKE ${like} OR location ILIKE ${like} OR status ILIKE ${like}
      ORDER BY created_at DESC`;
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
    if (!name) return badRequest("Project name is required");

    const [row] = await sql`
      INSERT INTO projects (name, location, status, start_date, end_date, budget, progress)
      VALUES (
        ${name},
        ${str(body.location)},
        ${oneOf(body.status, PROJECT_STATUSES, "PLANNED")},
        ${dateOrNull(body.start_date)},
        ${dateOrNull(body.end_date)},
        ${money(body.budget)},
        ${clamp(body.progress, 0, 100)}
      )
      RETURNING id`;
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

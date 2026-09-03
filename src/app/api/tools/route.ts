import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest } from "@/lib/api";
import { clamp, str } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const like = `%${request.nextUrl.searchParams.get("q") ?? ""}%`;
    const rows = await sql`
      SELECT * FROM tools
      WHERE name ILIKE ${like} OR category ILIKE ${like} OR location ILIKE ${like}
      ORDER BY name ASC`;
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
    if (!name) return badRequest("Tool name is required");

    const total = clamp(body.total_quantity, 0, 1_000_000);

    const [row] = await sql`
      INSERT INTO tools (name, category, unit, total_quantity, available_quantity, location)
      VALUES (
        ${name}, ${str(body.category)}, ${str(body.unit) || "unit"},
        ${total}, ${total}, ${str(body.location) || "WAREHOUSE"}
      )
      RETURNING id`;
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

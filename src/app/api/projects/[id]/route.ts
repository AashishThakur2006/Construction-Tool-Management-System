import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { clamp, dateOrNull, money, oneOf, str, PROJECT_STATUSES } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const name = str(body.name);
    if (!name) return badRequest("Project name is required");

    const result = await sql`
      UPDATE projects SET
        name = ${name},
        location = ${str(body.location)},
        status = ${oneOf(body.status, PROJECT_STATUSES, "PLANNED")},
        start_date = ${dateOrNull(body.start_date)},
        end_date = ${dateOrNull(body.end_date)},
        budget = ${money(body.budget)},
        progress = ${clamp(body.progress, 0, 100)}
      WHERE id = ${id}`;
    if (result.count === 0) return notFound("Project not found");
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
    const result = await sql`DELETE FROM projects WHERE id = ${id}`;
    if (result.count === 0) return notFound("Project not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

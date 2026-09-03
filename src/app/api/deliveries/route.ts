import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import {
  dateOrNull,
  oneOf,
  posIntOrNull,
  str,
  DELIVERY_DIRECTIONS,
  DELIVERY_STATUSES,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const like = `%${request.nextUrl.searchParams.get("q") ?? ""}%`;
    const rows = await sql`
      SELECT d.*, p.name AS project_name
      FROM deliveries d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.reference ILIKE ${like} OR d.carrier ILIKE ${like}
         OR d.item_summary ILIKE ${like} OR d.status ILIKE ${like} OR p.name ILIKE ${like}
      ORDER BY COALESCE(d.scheduled_date, d.created_at::date) DESC, d.created_at DESC`;
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const itemSummary = str(body.item_summary);
    if (!itemSummary) return badRequest("Describe what is being delivered");

    const projectId = posIntOrNull(body.project_id);
    if (projectId) {
      const [project] = await sql`SELECT id FROM projects WHERE id = ${projectId}`;
      if (!project) return notFound("Project not found");
    }

    const status = oneOf(body.status, DELIVERY_STATUSES, "SCHEDULED");
    const [row] = await sql`
      INSERT INTO deliveries (reference, direction, project_id, carrier, item_summary, status, scheduled_date, delivered_date)
      VALUES (
        ${str(body.reference)},
        ${oneOf(body.direction, DELIVERY_DIRECTIONS, "INBOUND")},
        ${projectId}, ${str(body.carrier)}, ${itemSummary}, ${status},
        ${dateOrNull(body.scheduled_date)},
        ${status === "DELIVERED" ? dateOrNull(body.delivered_date) : null}
      )
      RETURNING id`;
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

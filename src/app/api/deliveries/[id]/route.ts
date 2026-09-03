import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import {
  dateOrNull,
  oneOf,
  posIntOrNull,
  str,
  DELIVERY_DIRECTIONS,
  DELIVERY_STATUSES,
} from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const itemSummary = str(body.item_summary);
    if (!itemSummary) return badRequest("Describe what is being delivered");

    const status = oneOf(body.status, DELIVERY_STATUSES, "SCHEDULED");
    // Stamp the delivered date automatically when a run is marked delivered.
    const deliveredDate =
      status === "DELIVERED"
        ? dateOrNull(body.delivered_date) ?? new Date().toISOString().slice(0, 10)
        : null;

    const result = await sql`
      UPDATE deliveries SET
        reference = ${str(body.reference)},
        direction = ${oneOf(body.direction, DELIVERY_DIRECTIONS, "INBOUND")},
        project_id = ${posIntOrNull(body.project_id)},
        carrier = ${str(body.carrier)},
        item_summary = ${itemSummary},
        status = ${status},
        scheduled_date = ${dateOrNull(body.scheduled_date)},
        delivered_date = ${deliveredDate}
      WHERE id = ${id}`;
    if (result.count === 0) return notFound("Delivery not found");
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
    const result = await sql`DELETE FROM deliveries WHERE id = ${id}`;
    if (result.count === 0) return notFound("Delivery not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { dateOrNull, oneOf, posIntOrNull, str, PAYMENT_STATUSES } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("OWNER");
    const { id } = await params;
    const body = await request.json();
    const description = str(body.description);
    const amount = Number(body.amount);

    if (!description) return badRequest("Description is required");
    if (!amount || amount <= 0) return badRequest("Amount must be greater than zero");

    const result = await sql`
      UPDATE payments SET
        project_id = ${posIntOrNull(body.project_id)},
        description = ${description},
        amount = ${Math.round(amount * 100) / 100},
        status = ${oneOf(body.status, PAYMENT_STATUSES, "PENDING")},
        payment_date = ${dateOrNull(body.payment_date)}
      WHERE id = ${id}`;
    if (result.count === 0) return notFound("Payment not found");
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
    const result = await sql`DELETE FROM payments WHERE id = ${id}`;
    if (result.count === 0) return notFound("Payment not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

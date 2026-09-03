import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { clamp, str } from "@/lib/validation";

type ToolRow = { total_quantity: number; available_quantity: number };

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const name = str(body.name);
    if (!name) return badRequest("Tool name is required");

    const [current] = (await sql`
      SELECT total_quantity, available_quantity FROM tools WHERE id = ${id}`) as unknown as ToolRow[];
    if (!current) return notFound("Tool not found");

    const newTotal = clamp(body.total_quantity, 0, 1_000_000);
    // Shift availability by the change in total stock, keep it in range.
    const delta = newTotal - current.total_quantity;
    const newAvailable = Math.max(0, Math.min(newTotal, current.available_quantity + delta));

    await sql`
      UPDATE tools SET
        name = ${name}, category = ${str(body.category)},
        unit = ${str(body.unit) || "unit"},
        total_quantity = ${newTotal}, available_quantity = ${newAvailable},
        location = ${str(body.location) || "WAREHOUSE"}
      WHERE id = ${id}`;
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
    const result = await sql`DELETE FROM tools WHERE id = ${id}`;
    if (result.count === 0) return notFound("Tool not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

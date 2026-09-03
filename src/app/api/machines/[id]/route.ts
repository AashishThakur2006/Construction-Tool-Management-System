import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { dateOrNull, str } from "@/lib/validation";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const name = str(body.name);
    if (!name) return badRequest("Machine name is required");

    const result = await sql`
      UPDATE machines SET
        name = ${name}, type = ${str(body.type)}, model = ${str(body.model)},
        purchase_date = ${dateOrNull(body.purchase_date)}
      WHERE id = ${id}`;
    if (result.count === 0) return notFound("Machine not found");
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
    const result = await sql`DELETE FROM machines WHERE id = ${id}`;
    if (result.count === 0) return notFound("Machine not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("OWNER");
    const { id } = await params;
    const body = await request.json();
    const description = (body.description ?? "").trim();
    const amount = Number(body.amount);

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 }
      );
    }

    const projectId = body.project_id ? Number(body.project_id) : null;
    const result = db
      .prepare(
        `UPDATE payments
         SET project_id = ?, description = ?, amount = ?, status = ?, payment_date = ?
         WHERE id = ?`
      )
      .run(
        projectId,
        description,
        amount,
        body.status === "PAID" ? "PAID" : "PENDING",
        body.payment_date || null,
        id
      );
    if (result.changes === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
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
    const result = db.prepare("DELETE FROM payments WHERE id = ?").run(id);
    if (result.changes === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

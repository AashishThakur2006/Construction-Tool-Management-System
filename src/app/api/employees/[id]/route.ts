import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const ROLES = ["OPERATOR", "MAINTENANCE_WORKER", "SUPERVISOR", "LABOURER"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Employee name is required" }, { status: 400 });
    }
    const role = ROLES.includes(body.role) ? body.role : "OPERATOR";
    const result = db
      .prepare(
        `UPDATE employees SET name = ?, role = ?, phone = ?, email = ?, status = ? WHERE id = ?`
      )
      .run(
        name,
        role,
        body.phone ?? "",
        body.email ?? "",
        body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        id
      );
    if (result.changes === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
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
    const result = db.prepare("DELETE FROM employees WHERE id = ?").run(id);
    if (result.changes === 0) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

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
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }
    const result = db
      .prepare(
        `UPDATE projects
         SET name = ?, location = ?, status = ?, start_date = ?, end_date = ?, budget = ?, progress = ?
         WHERE id = ?`
      )
      .run(
        name,
        body.location ?? "",
        body.status ?? "PLANNED",
        body.start_date || null,
        body.end_date || null,
        Number(body.budget) || 0,
        Math.min(100, Math.max(0, Number(body.progress) || 0)),
        id
      );
    if (result.changes === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    if (result.changes === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

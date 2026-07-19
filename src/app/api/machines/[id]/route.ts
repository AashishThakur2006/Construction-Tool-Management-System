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
      return NextResponse.json({ error: "Machine name is required" }, { status: 400 });
    }
    const result = db
      .prepare(
        `UPDATE machines SET name = ?, type = ?, model = ?, purchase_date = ? WHERE id = ?`
      )
      .run(name, body.type ?? "", body.model ?? "", body.purchase_date || null, id);
    if (result.changes === 0) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
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
    const result = db.prepare("DELETE FROM machines WHERE id = ?").run(id);
    if (result.changes === 0) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

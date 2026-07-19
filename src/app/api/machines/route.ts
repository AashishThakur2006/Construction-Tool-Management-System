import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const rows = db
      .prepare(
        `SELECT m.*, p.name AS project_name
         FROM machines m
         LEFT JOIN projects p ON p.id = m.project_id
         WHERE m.name LIKE ? OR m.type LIKE ? OR m.model LIKE ? OR m.status LIKE ?
         ORDER BY m.created_at DESC`
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("OWNER");
    const body = await request.json();
    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Machine name is required" }, { status: 400 });
    }
    const result = db
      .prepare(
        `INSERT INTO machines (name, type, model, status, purchase_date)
         VALUES (?, ?, ?, 'AVAILABLE', ?)`
      )
      .run(name, body.type ?? "", body.model ?? "", body.purchase_date || null);
    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

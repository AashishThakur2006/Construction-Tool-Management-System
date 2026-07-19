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
        `SELECT * FROM projects
         WHERE name LIKE ? OR location LIKE ? OR status LIKE ?
         ORDER BY created_at DESC`
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`);
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
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }
    const result = db
      .prepare(
        `INSERT INTO projects (name, location, status, start_date, end_date, budget, progress)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name,
        body.location ?? "",
        body.status ?? "PLANNED",
        body.start_date || null,
        body.end_date || null,
        Number(body.budget) || 0,
        Math.min(100, Math.max(0, Number(body.progress) || 0))
      );
    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

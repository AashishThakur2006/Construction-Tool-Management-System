import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const ROLES = ["OPERATOR", "MAINTENANCE_WORKER", "SUPERVISOR", "LABOURER"];

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const rows = db
      .prepare(
        `SELECT * FROM employees
         WHERE name LIKE ? OR role LIKE ? OR phone LIKE ? OR email LIKE ?
         ORDER BY created_at DESC`
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();
    const body = await request.json();
    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Employee name is required" }, { status: 400 });
    }
    const role = ROLES.includes(body.role) ? body.role : "OPERATOR";
    const result = db
      .prepare(
        `INSERT INTO employees (name, role, phone, email, status)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        name,
        role,
        body.phone ?? "",
        body.email ?? "",
        body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE"
      );
    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

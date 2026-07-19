import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const rows = db
      .prepare(
        `SELECT mr.*, m.name AS machine_name, e.name AS employee_name, u.name AS raised_by_name
         FROM maintenance_records mr
         JOIN machines m ON m.id = mr.machine_id
         LEFT JOIN employees e ON e.id = mr.assigned_employee_id
         LEFT JOIN users u ON u.id = mr.raised_by
         WHERE mr.description LIKE ? OR mr.status LIKE ? OR m.name LIKE ? OR e.name LIKE ?
         ORDER BY mr.created_at DESC`
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const machineId = Number(body.machine_id);
    const description = (body.description ?? "").trim();

    if (!machineId || !description) {
      return NextResponse.json(
        { error: "Machine and description are required" },
        { status: 400 }
      );
    }
    const machine = db
      .prepare("SELECT id FROM machines WHERE id = ?")
      .get(machineId);
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    const result = db
      .prepare(
        `INSERT INTO maintenance_records (machine_id, description, status, raised_by, cost)
         VALUES (?, ?, 'PENDING', ?, ?)`
      )
      .run(machineId, description, session.id, Number(body.cost) || 0);

    db.prepare("UPDATE machines SET status = 'MAINTENANCE' WHERE id = ?").run(
      machineId
    );

    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];

type RecordRow = { id: number; machine_id: number; project_id: number | null };

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();

    const record = db
      .prepare(
        `SELECT mr.id, mr.machine_id, m.project_id
         FROM maintenance_records mr JOIN machines m ON m.id = mr.machine_id
         WHERE mr.id = ?`
      )
      .get(id) as RecordRow | undefined;
    if (!record) {
      return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });
    }

    const description = (body.description ?? "").trim();
    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    const status = STATUSES.includes(body.status) ? body.status : "PENDING";
    const assignedEmployeeId = body.assigned_employee_id
      ? Number(body.assigned_employee_id)
      : null;

    if (assignedEmployeeId) {
      const employee = db
        .prepare("SELECT id FROM employees WHERE id = ?")
        .get(assignedEmployeeId);
      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }
    }

    db.prepare(
      `UPDATE maintenance_records
       SET description = ?, status = ?, assigned_employee_id = ?, cost = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).run(description, status, assignedEmployeeId, Number(body.cost) || 0, id);

    // Keep the machine's status in sync with its open maintenance work.
    if (status === "COMPLETED") {
      const openCount = db
        .prepare(
          "SELECT COUNT(*) AS c FROM maintenance_records WHERE machine_id = ? AND status != 'COMPLETED'"
        )
        .get(record.machine_id) as { c: number };
      if (openCount.c === 0) {
        db.prepare("UPDATE machines SET status = ? WHERE id = ?").run(
          record.project_id ? "ALLOCATED" : "AVAILABLE",
          record.machine_id
        );
      }
    } else {
      db.prepare("UPDATE machines SET status = 'MAINTENANCE' WHERE id = ?").run(
        record.machine_id
      );
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

    const record = db
      .prepare(
        `SELECT mr.id, mr.machine_id, m.project_id
         FROM maintenance_records mr JOIN machines m ON m.id = mr.machine_id
         WHERE mr.id = ?`
      )
      .get(id) as RecordRow | undefined;
    if (!record) {
      return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM maintenance_records WHERE id = ?").run(id);

    const openCount = db
      .prepare(
        "SELECT COUNT(*) AS c FROM maintenance_records WHERE machine_id = ? AND status != 'COMPLETED'"
      )
      .get(record.machine_id) as { c: number };
    if (openCount.c === 0) {
      db.prepare("UPDATE machines SET status = ? WHERE id = ?").run(
        record.project_id ? "ALLOCATED" : "AVAILABLE",
        record.machine_id
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

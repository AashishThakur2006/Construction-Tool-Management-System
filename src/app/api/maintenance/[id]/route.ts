import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { money, oneOf, posIntOrNull, str, MAINTENANCE_STATUSES } from "@/lib/validation";

type RecordRow = { id: number; machine_id: number; project_id: number | null };

async function loadRecord(id: string) {
  const [record] = (await sql`
    SELECT mr.id, mr.machine_id, m.project_id
    FROM maintenance_records mr JOIN machines m ON m.id = mr.machine_id
    WHERE mr.id = ${id}`) as unknown as RecordRow[];
  return record;
}

/** Re-derive the machine's status from its remaining open maintenance work. */
async function syncMachineStatus(machineId: number, projectId: number | null) {
  const [{ open }] = (await sql`
    SELECT COUNT(*)::int AS open FROM maintenance_records
    WHERE machine_id = ${machineId} AND status != 'COMPLETED'`) as unknown as { open: number }[];
  if (open === 0) {
    await sql`UPDATE machines SET status = ${projectId ? "ALLOCATED" : "AVAILABLE"}
             WHERE id = ${machineId}`;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const record = await loadRecord(id);
    if (!record) return notFound("Maintenance record not found");

    const body = await request.json();
    const description = str(body.description);
    if (!description) return badRequest("Description is required");

    const status = oneOf(body.status, MAINTENANCE_STATUSES, "PENDING");
    const assignedEmployeeId = posIntOrNull(body.assigned_employee_id);

    if (assignedEmployeeId) {
      const [employee] = await sql`SELECT id FROM employees WHERE id = ${assignedEmployeeId}`;
      if (!employee) return notFound("Employee not found");
    }

    await sql`
      UPDATE maintenance_records SET
        description = ${description}, status = ${status},
        assigned_employee_id = ${assignedEmployeeId},
        cost = ${money(body.cost)}, updated_at = now()
      WHERE id = ${id}`;

    if (status === "COMPLETED") {
      await syncMachineStatus(record.machine_id, record.project_id);
    } else {
      await sql`UPDATE machines SET status = 'MAINTENANCE' WHERE id = ${record.machine_id}`;
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
    const record = await loadRecord(id);
    if (!record) return notFound("Maintenance record not found");

    await sql`DELETE FROM maintenance_records WHERE id = ${id}`;
    await syncMachineStatus(record.machine_id, record.project_id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

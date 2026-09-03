import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { money, str } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const like = `%${request.nextUrl.searchParams.get("q") ?? ""}%`;
    const rows = await sql`
      SELECT mr.id, mr.machine_id, mr.description, mr.status,
             mr.assigned_employee_id, mr.cost::float8 AS cost,
             mr.created_at, mr.updated_at,
             m.name AS machine_name, e.name AS employee_name, u.name AS raised_by_name
      FROM maintenance_records mr
      JOIN machines m ON m.id = mr.machine_id
      LEFT JOIN employees e ON e.id = mr.assigned_employee_id
      LEFT JOIN profiles u ON u.id = mr.raised_by
      WHERE mr.description ILIKE ${like} OR mr.status ILIKE ${like}
         OR m.name ILIKE ${like} OR e.name ILIKE ${like}
      ORDER BY mr.created_at DESC`;
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
    const description = str(body.description);

    if (!machineId || !description) {
      return badRequest("Machine and description are required");
    }
    const [machine] = await sql`SELECT id FROM machines WHERE id = ${machineId}`;
    if (!machine) return notFound("Machine not found");

    const [row] = await sql`
      INSERT INTO maintenance_records (machine_id, description, status, raised_by, cost)
      VALUES (${machineId}, ${description}, 'PENDING', ${session.id}, ${money(body.cost)})
      RETURNING id`;
    await sql`UPDATE machines SET status = 'MAINTENANCE' WHERE id = ${machineId}`;

    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

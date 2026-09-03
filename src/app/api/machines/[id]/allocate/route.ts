import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse, notFound } from "@/lib/api";
import { posIntOrNull, str } from "@/lib/validation";

type MachineRow = { id: number; status: string; project_id: number | null };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const projectId = posIntOrNull(body.project_id);
    const note = str(body.note);

    const [machine] = (await sql`
      SELECT id, status, project_id FROM machines WHERE id = ${id}`) as unknown as MachineRow[];
    if (!machine) return notFound("Machine not found");
    if (machine.status === "MAINTENANCE") {
      return NextResponse.json(
        { error: "Machine is under maintenance and cannot be allocated" },
        { status: 409 }
      );
    }

    if (projectId) {
      const [project] = await sql`SELECT id FROM projects WHERE id = ${projectId}`;
      if (!project) return notFound("Project not found");
      await sql`
        UPDATE machines SET project_id = ${projectId}, status = 'ALLOCATED'
        WHERE id = ${id}`;
    } else {
      await sql`
        UPDATE machines SET project_id = NULL, status = 'AVAILABLE' WHERE id = ${id}`;
    }

    // Record the move on the transfer log when the site actually changes.
    if ((machine.project_id ?? null) !== (projectId ?? null)) {
      await sql`
        INSERT INTO machine_transfers (machine_id, from_project_id, to_project_id, transferred_by, note)
        VALUES (${id}, ${machine.project_id}, ${projectId}, ${session.id}, ${note})`;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

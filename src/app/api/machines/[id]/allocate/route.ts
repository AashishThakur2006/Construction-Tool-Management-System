import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

type MachineRow = { id: number; status: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const projectId = body.project_id ? Number(body.project_id) : null;

    const machine = db
      .prepare("SELECT id, status FROM machines WHERE id = ?")
      .get(id) as MachineRow | undefined;
    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }
    if (machine.status === "MAINTENANCE") {
      return NextResponse.json(
        { error: "Machine is under maintenance and cannot be allocated" },
        { status: 409 }
      );
    }

    if (projectId) {
      const project = db
        .prepare("SELECT id FROM projects WHERE id = ?")
        .get(projectId);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      db.prepare(
        "UPDATE machines SET project_id = ?, status = 'ALLOCATED' WHERE id = ?"
      ).run(projectId, id);
    } else {
      db.prepare(
        "UPDATE machines SET project_id = NULL, status = 'AVAILABLE' WHERE id = ?"
      ).run(id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

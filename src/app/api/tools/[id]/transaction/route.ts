import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { oneOf, posIntOrNull, str, TOOL_TX_KINDS } from "@/lib/validation";

type ToolRow = { id: number; total_quantity: number; available_quantity: number };

/** Check a tool out to a site/worker (ISSUE) or bring it back (RETURN). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();

    const kind = oneOf(body.kind, TOOL_TX_KINDS, "ISSUE");
    const quantity = posIntOrNull(body.quantity);
    if (!quantity) return badRequest("Quantity must be a positive whole number");

    const [tool] = (await sql`
      SELECT id, total_quantity, available_quantity FROM tools WHERE id = ${id}`) as unknown as ToolRow[];
    if (!tool) return notFound("Tool not found");

    let nextAvailable: number;
    if (kind === "ISSUE") {
      if (quantity > tool.available_quantity) {
        return NextResponse.json(
          { error: `Only ${tool.available_quantity} available to issue` },
          { status: 409 }
        );
      }
      nextAvailable = tool.available_quantity - quantity;
    } else {
      nextAvailable = Math.min(tool.total_quantity, tool.available_quantity + quantity);
    }

    await sql.begin(async (tx) => {
      await tx`UPDATE tools SET available_quantity = ${nextAvailable} WHERE id = ${id}`;
      await tx`
        INSERT INTO tool_transactions (tool_id, kind, quantity, project_id, employee_id, note, created_by)
        VALUES (
          ${id}, ${kind}, ${quantity},
          ${posIntOrNull(body.project_id)}, ${posIntOrNull(body.employee_id)},
          ${str(body.note)}, ${session.id}
        )`;
    });

    return NextResponse.json({ ok: true, available_quantity: nextAvailable });
  } catch (e) {
    return errorResponse(e);
  }
}

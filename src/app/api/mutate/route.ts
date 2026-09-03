import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { errorResponse, badRequest } from "@/lib/api";
import { denyReason, tableFor, type Op } from "@/lib/plinth";

/**
 * Command bus for Plinth mutations. The client sends the rows it already
 * computed; the server checks each op against the caller's role and applies
 * the batch in one transaction. Undo just posts the inverse ops.
 *
 * Op shapes:
 *   { t, id, set:{...} }               update by id
 *   { t, insert:{...} }                insert
 *   { t, del:"<id>" }                  delete by id
 *   { t:"history", delMatch:{asset_id,kind,note} }   delete newest match (undo)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => null);
    const ops: Op[] = Array.isArray(body?.ops) ? body.ops : [];
    if (ops.length === 0) return badRequest("No ops");
    if (ops.length > 100) return badRequest("Too many ops");

    for (const op of ops) {
      const reason = denyReason(op, session.role);
      if (reason) return NextResponse.json({ error: reason }, { status: 403 });
    }

    await sql.begin(async (tx) => {
      for (const op of ops) {
        const t = tx(tableFor(op.t)!.table);

        if (op.set && op.id != null) {
          await tx`UPDATE ${t} SET ${tx(op.set)} WHERE id = ${op.id}`;
        } else if (op.insert) {
          await tx`INSERT INTO ${t} ${tx(op.insert)}`;
        } else if (op.del != null) {
          await tx`DELETE FROM ${t} WHERE id = ${op.del}`;
        } else if (op.delMatch && op.t === "history") {
          const m = op.delMatch as { asset_id: string; kind: string; note: string };
          await tx`DELETE FROM asset_history WHERE id = (
                     SELECT id FROM asset_history
                     WHERE asset_id = ${m.asset_id} AND kind = ${m.kind} AND note = ${m.note}
                     ORDER BY id DESC LIMIT 1
                   )`;
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}

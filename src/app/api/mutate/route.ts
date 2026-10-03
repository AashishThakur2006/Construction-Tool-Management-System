import { NextRequest, NextResponse } from "next/server";
import type { TransactionSql } from "postgres";
import sql from "@/lib/db";
import { AuthError, requireSession, type Session } from "@/lib/auth";
import { originGuard, rateLimit } from "@/lib/security";
import { errorResponse, badRequest } from "@/lib/api";
import { denyReason, tableFor, valueProblem, type Op } from "@/lib/plinth";

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
type Tx = TransactionSql;

/**
 * Row-level scope for Site Engineers, enforced inside the transaction so a
 * violation rolls the whole batch back. denyReason() only knows tables and
 * columns; this knows *which rows* an engineer's jobs cover.
 */
async function assertEngineerScope(tx: Tx, op: Op, session: Session) {
  const deny = (m: string) => {
    throw new AuthError(m, 403);
  };
  const eid = session.employeeId;
  if (!eid) deny("Your account is not linked to an employee record");
  const mine = (await tx`SELECT id FROM jobs WHERE engineer_id = ${eid}`).map((r) => r.id as string);

  if (op.t === "asset" && op.set && op.id != null) {
    const [a] = await tx`SELECT job_id FROM assets WHERE id = ${op.id}`;
    if (!a) deny("Asset not found");
    if (a.job_id && !mine.includes(a.job_id)) deny("That asset is on a job you do not run");
    const target = op.set.job_id as string | null | undefined;
    if (target && !mine.includes(target)) deny("You can only allocate to jobs you run");
  }
  if (op.t === "mr" && op.insert && op.insert.reporter_id && op.insert.reporter_id !== eid) {
    deny("Requests must be raised under your own employee id");
  }
  if (op.t === "mr" && op.del != null) {
    const [m] = await tx`SELECT status, reporter_id FROM maintenance WHERE id = ${op.del}`;
    if (!m || m.status !== "Reported" || m.reporter_id !== eid) {
      deny("You can only withdraw your own un-actioned requests");
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const blocked = originGuard(request);
    if (blocked) return blocked;
    const session = await requireSession();
    const rl = rateLimit(`mutate:${session.userId}`, 120, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many changes too quickly. Slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }
    const body = await request.json().catch(() => null);
    const ops: Op[] = Array.isArray(body?.ops) ? body.ops : [];
    if (ops.length === 0) return badRequest("No ops");
    if (ops.length > 100) return badRequest("Too many ops");

    for (const op of ops) {
      const reason = denyReason(op, session.role);
      if (reason) return NextResponse.json({ error: reason }, { status: 403 });
      const bad = valueProblem(op);
      if (bad) return badRequest(bad);
    }

    await sql.begin(async (tx) => {
      for (const op of ops) {
        if (session.role !== "OWNER") await assertEngineerScope(tx, op, session);
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

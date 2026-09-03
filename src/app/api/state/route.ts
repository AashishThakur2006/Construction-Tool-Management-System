import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, roleLabel } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { TODAY } from "@/lib/plinth";

export const dynamic = "force-dynamic";

/**
 * The whole register for the signed-in user. Column names are mapped to the
 * camelCase shape Plinth's client already expects, so no view code changes.
 * Row-level read scoping is done client-side (store.visibleX); the API gates
 * writes by role (see /api/mutate).
 */
export async function GET() {
  try {
    const session = await requireSession();

    const [jobs, employees, assets, maintenance, payments, history] =
      await Promise.all([
        sql`SELECT id, name, client, location, status, started, ends,
                   engineer_id AS "engineerId", hold_note AS "holdNote"
            FROM jobs ORDER BY id`,
        sql`SELECT id, name, role, job_id AS "jobId", phone, email,
                   started_on AS "startedOn", status
            FROM employees ORDER BY id`,
        sql`SELECT id, category, model, serial, purchased, value, condition,
                   status, job_id AS "jobId", allocated_on AS "allocatedOn", hours
            FROM assets ORDER BY id`,
        sql`SELECT id, asset_id AS "assetId", status, reported, fault,
                   est_cost AS "estCost", reporter_id AS "reporterId",
                   mechanic_id AS "mechanicId", approved_on AS "approvedOn",
                   workshop_on AS "workshopOn", resolved_on AS "resolvedOn",
                   rejected_on AS "rejectedOn", reject_note AS "rejectNote", overdue
            FROM maintenance ORDER BY reported DESC, id`,
        sql`SELECT id, job_id AS "jobId", payee, description AS "desc", amount,
                   status, issued, due, paid_on AS "paidOn",
                   voided_on AS "voidedOn", dispute_note AS "disputeNote"
            FROM payments ORDER BY issued DESC, id`,
        sql`SELECT asset_id AS "assetId", "on", kind, note
            FROM asset_history ORDER BY "on", id`,
      ]);

    const grouped: Record<string, { on: string; kind: string; note: string }[]> = {};
    for (const row of history as unknown as {
      assetId: string;
      on: string;
      kind: string;
      note: string;
    }[]) {
      (grouped[row.assetId] ||= []).push({ on: row.on, kind: row.kind, note: row.note });
    }

    return NextResponse.json({
      today: TODAY,
      me: {
        id: session.employeeId, // e.g. "E-102" — drives engineer scoping
        name: session.name,
        role: roleLabel(session.role),
      },
      jobs,
      employees,
      assets,
      maintenance,
      payments,
      history: grouped,
    });
  } catch (e) {
    return errorResponse(e);
  }
}

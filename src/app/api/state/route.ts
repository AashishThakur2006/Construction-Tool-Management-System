import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, roleLabel } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { TODAY } from "@/lib/plinth";

export const dynamic = "force-dynamic";

const EMPTY = { jobs: [], employees: [], assets: [], maintenance: [], payments: [], history: {} };

/**
 * The register for the signed-in user, row-scoped by role:
 *  - Owner: everything.
 *  - Site Engineer: only their jobs, the assets on them (plus the yard and
 *    assets they've reported faults on), their fault reports, and the money
 *    and crew on their jobs.
 * Column names are mapped to the camelCase shape the SPA expects.
 */
export async function GET() {
  try {
    const session = await requireSession();
    const isOwner = session.role === "OWNER";
    const me = session.employeeId;

    // A Site Engineer with no linked employee record sees nothing.
    if (!isOwner && !me) {
      return NextResponse.json({
        today: TODAY,
        me: { id: null, name: session.name, role: roleLabel(session.role) },
        ...EMPTY,
      });
    }

    // scope fragments — full table for the Owner, filtered for an Engineer
    const jobsWhere = isOwner ? sql`TRUE` : sql`j.engineer_id = ${me}`;
    const myJobIds = sql`SELECT id FROM jobs j WHERE ${jobsWhere}`;
    const assetsWhere = isOwner
      ? sql`TRUE`
      : sql`(a.job_id IN (${myJobIds})
             OR a.status = 'In yard'
             OR a.id IN (SELECT asset_id FROM maintenance WHERE reporter_id = ${me}))`;
    const visibleAssetIds = sql`SELECT a.id FROM assets a WHERE ${assetsWhere}`;
    const maintWhere = isOwner ? sql`TRUE` : sql`mr.reporter_id = ${me}`;
    const payWhere = isOwner ? sql`TRUE` : sql`pay.job_id IN (${myJobIds})`;
    const empWhere = isOwner
      ? sql`TRUE`
      : sql`(e.id = ${me} OR e.job_id IN (${myJobIds}))`;

    const [jobs, employees, assets, maintenance, payments, history] =
      await Promise.all([
        sql`SELECT j.id, j.name, j.client, j.location, j.status, j.started, j.ends,
                   j.engineer_id AS "engineerId", j.hold_note AS "holdNote"
            FROM jobs j WHERE ${jobsWhere} ORDER BY j.id`,
        sql`SELECT e.id, e.name, e.role, e.job_id AS "jobId", e.phone, e.email,
                   e.started_on AS "startedOn", e.status
            FROM employees e WHERE ${empWhere} ORDER BY e.id`,
        sql`SELECT a.id, a.category, a.model, a.serial, a.purchased, a.value, a.condition,
                   a.status, a.job_id AS "jobId", a.allocated_on AS "allocatedOn", a.hours
            FROM assets a WHERE ${assetsWhere} ORDER BY a.id`,
        sql`SELECT mr.id, mr.asset_id AS "assetId", mr.status, mr.reported, mr.fault,
                   mr.est_cost AS "estCost", mr.reporter_id AS "reporterId",
                   mr.mechanic_id AS "mechanicId", mr.approved_on AS "approvedOn",
                   mr.workshop_on AS "workshopOn", mr.resolved_on AS "resolvedOn",
                   mr.rejected_on AS "rejectedOn", mr.reject_note AS "rejectNote", mr.overdue
            FROM maintenance mr WHERE ${maintWhere} ORDER BY mr.reported DESC, mr.id`,
        sql`SELECT pay.id, pay.job_id AS "jobId", pay.payee, pay.description AS "desc",
                   pay.amount, pay.status, pay.issued, pay.due, pay.paid_on AS "paidOn",
                   pay.voided_on AS "voidedOn", pay.dispute_note AS "disputeNote"
            FROM payments pay WHERE ${payWhere} ORDER BY pay.issued DESC, pay.id`,
        sql`SELECT h.asset_id AS "assetId", h."on", h.kind, h.note
            FROM asset_history h
            WHERE ${isOwner ? sql`TRUE` : sql`h.asset_id IN (${visibleAssetIds})`}
            ORDER BY h."on", h.id`,
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
        id: session.employeeId,
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

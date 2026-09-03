import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse, badRequest, notFound } from "@/lib/api";
import { dateOrNull, oneOf, posIntOrNull, str, PAYMENT_STATUSES } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const like = `%${request.nextUrl.searchParams.get("q") ?? ""}%`;
    const rows = await sql`
      SELECT pay.id, pay.project_id, pay.description, pay.amount::float8 AS amount,
             pay.status, pay.payment_date, pay.created_at, p.name AS project_name
      FROM payments pay
      LEFT JOIN projects p ON p.id = pay.project_id
      WHERE pay.description ILIKE ${like} OR pay.status ILIKE ${like} OR p.name ILIKE ${like}
      ORDER BY pay.created_at DESC`;
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("OWNER");
    const body = await request.json();
    const description = str(body.description);
    const amount = Number(body.amount);

    if (!description) return badRequest("Description is required");
    if (!amount || amount <= 0) return badRequest("Amount must be greater than zero");

    const projectId = posIntOrNull(body.project_id);
    if (projectId) {
      const [project] = await sql`SELECT id FROM projects WHERE id = ${projectId}`;
      if (!project) return notFound("Project not found");
    }

    const [row] = await sql`
      INSERT INTO payments (project_id, description, amount, status, payment_date)
      VALUES (
        ${projectId}, ${description}, ${Math.round(amount * 100) / 100},
        ${oneOf(body.status, PAYMENT_STATUSES, "PENDING")},
        ${dateOrNull(body.payment_date)}
      )
      RETURNING id`;
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

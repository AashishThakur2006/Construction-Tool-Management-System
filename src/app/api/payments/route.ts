import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const rows = db
      .prepare(
        `SELECT pay.*, p.name AS project_name
         FROM payments pay
         LEFT JOIN projects p ON p.id = pay.project_id
         WHERE pay.description LIKE ? OR pay.status LIKE ? OR p.name LIKE ?
         ORDER BY pay.created_at DESC`
      )
      .all(`%${q}%`, `%${q}%`, `%${q}%`);
    return NextResponse.json(rows);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("OWNER");
    const body = await request.json();
    const description = (body.description ?? "").trim();
    const amount = Number(body.amount);

    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero" },
        { status: 400 }
      );
    }

    const projectId = body.project_id ? Number(body.project_id) : null;
    if (projectId) {
      const project = db
        .prepare("SELECT id FROM projects WHERE id = ?")
        .get(projectId);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    const result = db
      .prepare(
        `INSERT INTO payments (project_id, description, amount, status, payment_date)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        projectId,
        description,
        amount,
        body.status === "PAID" ? "PAID" : "PENDING",
        body.payment_date || null
      );
    return NextResponse.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

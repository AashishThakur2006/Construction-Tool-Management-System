import { Suspense } from "react";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import PaymentsClient, { Payment } from "./payments-client";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await getSession();

  const payments = db
    .prepare(
      `SELECT pay.*, p.name AS project_name
       FROM payments pay
       LEFT JOIN projects p ON p.id = pay.project_id
       WHERE pay.description LIKE ? OR pay.status LIKE ? OR p.name LIKE ?
       ORDER BY pay.created_at DESC`
    )
    .all(`%${q}%`, `%${q}%`, `%${q}%`) as Payment[];

  const projects = db
    .prepare("SELECT id, name FROM projects ORDER BY name")
    .all() as { id: number; name: string }[];

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount END), 0) AS paid,
         COALESCE(SUM(CASE WHEN status = 'PENDING' THEN amount END), 0) AS pending
       FROM payments`
    )
    .get() as { paid: number; pending: number };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-sm text-slate-500">
            Record project payments and track their status.
          </p>
        </div>
        <Suspense>
          <SearchBar placeholder="Search payments..." />
        </Suspense>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-l-4 border-emerald-500 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Paid</div>
          <div className="mt-1 text-2xl font-bold">
            ₹{totals.paid.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-xl border-l-4 border-amber-500 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Total Pending</div>
          <div className="mt-1 text-2xl font-bold">
            ₹{totals.pending.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <PaymentsClient
        payments={payments}
        projects={projects}
        role={session?.role ?? "SITE_ENGINEER"}
      />
    </div>
  );
}

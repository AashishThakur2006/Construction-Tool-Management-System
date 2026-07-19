import { Suspense } from "react";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import MaintenanceClient, { MaintenanceRecord } from "./maintenance-client";

export const dynamic = "force-dynamic";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await getSession();

  const records = db
    .prepare(
      `SELECT mr.*, m.name AS machine_name, e.name AS employee_name, u.name AS raised_by_name
       FROM maintenance_records mr
       JOIN machines m ON m.id = mr.machine_id
       LEFT JOIN employees e ON e.id = mr.assigned_employee_id
       LEFT JOIN users u ON u.id = mr.raised_by
       WHERE mr.description LIKE ? OR mr.status LIKE ? OR m.name LIKE ? OR e.name LIKE ?
       ORDER BY mr.created_at DESC`
    )
    .all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`) as MaintenanceRecord[];

  const machines = db
    .prepare("SELECT id, name FROM machines ORDER BY name")
    .all() as { id: number; name: string }[];

  const workers = db
    .prepare(
      "SELECT id, name, role FROM employees WHERE status = 'ACTIVE' ORDER BY name"
    )
    .all() as { id: number; name: string; role: string }[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-sm text-slate-500">
            Raise maintenance requests, assign workers and track repair status.
          </p>
        </div>
        <Suspense>
          <SearchBar placeholder="Search maintenance..." />
        </Suspense>
      </div>
      <MaintenanceClient
        records={records}
        machines={machines}
        workers={workers}
        role={session?.role ?? "SITE_ENGINEER"}
      />
    </div>
  );
}

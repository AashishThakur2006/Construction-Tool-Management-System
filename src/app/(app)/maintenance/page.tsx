import { Suspense } from "react";
import sql from "@/lib/db";
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
  const like = `%${q}%`;

  const records = (await sql`
    SELECT mr.id, mr.machine_id, mr.description, mr.status,
           mr.assigned_employee_id, mr.cost::float8 AS cost, mr.created_at,
           m.name AS machine_name, e.name AS employee_name, u.name AS raised_by_name
    FROM maintenance_records mr
    JOIN machines m ON m.id = mr.machine_id
    LEFT JOIN employees e ON e.id = mr.assigned_employee_id
    LEFT JOIN profiles u ON u.id = mr.raised_by
    WHERE mr.description ILIKE ${like} OR mr.status ILIKE ${like}
       OR m.name ILIKE ${like} OR e.name ILIKE ${like}
    ORDER BY mr.created_at DESC`) as unknown as MaintenanceRecord[];

  const machines = (await sql`
    SELECT id, name FROM machines ORDER BY name`) as unknown as {
    id: number;
    name: string;
  }[];

  const workers = (await sql`
    SELECT id, name, role FROM employees WHERE status = 'ACTIVE' ORDER BY name`) as unknown as {
    id: number;
    name: string;
    role: string;
  }[];

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

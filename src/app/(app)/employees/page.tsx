import { Suspense } from "react";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import EmployeesClient, { Employee } from "./employees-client";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await getSession();

  const employees = db
    .prepare(
      `SELECT * FROM employees
       WHERE name LIKE ? OR role LIKE ? OR phone LIKE ? OR email LIKE ?
       ORDER BY created_at DESC`
    )
    .all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`) as Employee[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-slate-500">
            Manage workforce details and employee roles.
          </p>
        </div>
        <Suspense>
          <SearchBar placeholder="Search employees..." />
        </Suspense>
      </div>
      <EmployeesClient
        employees={employees}
        role={session?.role ?? "SITE_ENGINEER"}
      />
    </div>
  );
}

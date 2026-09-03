import { Suspense } from "react";
import sql from "@/lib/db";
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
  const like = `%${q}%`;

  const employees = (await sql`
    SELECT * FROM employees
    WHERE name ILIKE ${like} OR role ILIKE ${like}
       OR phone ILIKE ${like} OR email ILIKE ${like}
    ORDER BY created_at DESC`) as unknown as Employee[];

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

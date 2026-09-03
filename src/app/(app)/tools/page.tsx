import { Suspense } from "react";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import ToolsClient, { Tool } from "./tools-client";

export const dynamic = "force-dynamic";

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await getSession();
  const like = `%${q}%`;

  const tools = (await sql`
    SELECT * FROM tools
    WHERE name ILIKE ${like} OR category ILIKE ${like} OR location ILIKE ${like}
    ORDER BY name ASC`) as unknown as Tool[];

  const projects = (await sql`
    SELECT id, name FROM projects ORDER BY name`) as unknown as {
    id: number;
    name: string;
  }[];

  const employees = (await sql`
    SELECT id, name FROM employees WHERE status = 'ACTIVE' ORDER BY name`) as unknown as {
    id: number;
    name: string;
  }[];

  const transactions = (await sql`
    SELECT tt.id, tt.tool_id, tt.kind, tt.quantity, tt.note, tt.created_at,
           t.name AS tool_name, p.name AS project_name, e.name AS employee_name
    FROM tool_transactions tt
    JOIN tools t ON t.id = tt.tool_id
    LEFT JOIN projects p ON p.id = tt.project_id
    LEFT JOIN employees e ON e.id = tt.employee_id
    ORDER BY tt.created_at DESC
    LIMIT 30`) as unknown as {
    id: number;
    tool_id: number;
    kind: string;
    quantity: number;
    note: string;
    created_at: string;
    tool_name: string;
    project_name: string | null;
    employee_name: string | null;
  }[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tools &amp; Inventory</h1>
          <p className="text-sm text-slate-500">
            Track small tools and consumables by quantity, and check them out to
            sites or workers.
          </p>
        </div>
        <Suspense>
          <SearchBar placeholder="Search tools..." />
        </Suspense>
      </div>
      <ToolsClient
        tools={tools}
        projects={projects}
        employees={employees}
        transactions={transactions}
        role={session?.role ?? "SITE_ENGINEER"}
      />
    </div>
  );
}

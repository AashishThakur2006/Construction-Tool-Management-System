import { Suspense } from "react";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import MachinesClient, { Machine } from "./machines-client";

export const dynamic = "force-dynamic";

export default async function MachinesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await getSession();
  const like = `%${q}%`;

  const machines = (await sql`
    SELECT m.*, p.name AS project_name
    FROM machines m
    LEFT JOIN projects p ON p.id = m.project_id
    WHERE m.name ILIKE ${like} OR m.type ILIKE ${like}
       OR m.model ILIKE ${like} OR m.status ILIKE ${like}
    ORDER BY m.created_at DESC`) as unknown as Machine[];

  const projects = (await sql`
    SELECT id, name FROM projects ORDER BY name`) as unknown as {
    id: number;
    name: string;
  }[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Machines</h1>
          <p className="text-sm text-slate-500">
            Register equipment, keep details up to date and allocate machines to
            projects.
          </p>
        </div>
        <Suspense>
          <SearchBar placeholder="Search machines..." />
        </Suspense>
      </div>
      <MachinesClient
        machines={machines}
        projects={projects}
        role={session?.role ?? "SITE_ENGINEER"}
      />
    </div>
  );
}

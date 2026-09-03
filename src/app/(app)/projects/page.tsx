import { Suspense } from "react";
import sql from "@/lib/db";
import { getSession } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import ProjectsClient, { Project } from "./projects-client";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const session = await getSession();
  const like = `%${q}%`;

  const projects = (await sql`
    SELECT id, name, location, status, start_date, end_date,
           budget::float8 AS budget, progress, created_at
    FROM projects
    WHERE name ILIKE ${like} OR location ILIKE ${like} OR status ILIKE ${like}
    ORDER BY created_at DESC`) as unknown as Project[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-slate-500">
            Manage construction projects and track progress.
          </p>
        </div>
        <Suspense>
          <SearchBar placeholder="Search projects..." />
        </Suspense>
      </div>
      <ProjectsClient projects={projects} role={session?.role ?? "SITE_ENGINEER"} />
    </div>
  );
}

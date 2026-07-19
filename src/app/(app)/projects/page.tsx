import { Suspense } from "react";
import db from "@/lib/db";
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

  const projects = db
    .prepare(
      `SELECT * FROM projects
       WHERE name LIKE ? OR location LIKE ? OR status LIKE ?
       ORDER BY created_at DESC`
    )
    .all(`%${q}%`, `%${q}%`, `%${q}%`) as Project[];

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
